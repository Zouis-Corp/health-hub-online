import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Truck } from "lucide-react";
import ExportCSV from "@/components/admin/ExportCSV";
import Pagination from "@/components/admin/Pagination";
import usePagination from "@/hooks/usePagination";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DeliveryFee {
  id: string;
  state_name: string;
  delivery_fee: number;
  free_delivery_minimum: number;
  is_active: boolean;
  created_at: string;
}

const AdminDeliveryFees = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<DeliveryFee | null>(null);
  const [formData, setFormData] = useState({
    state_name: "",
    delivery_fee: 0,
    free_delivery_minimum: 0,
    is_active: true,
  });

  const { data: deliveryFees, isLoading } = useQuery({
    queryKey: ["admin-delivery-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_fees")
        .select("*")
        .order("state_name");
      if (error) throw error;
      return data as DeliveryFee[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { state_name: string } & Partial<Omit<DeliveryFee, 'state_name'>>) => {
      const { error } = await supabase.from("delivery_fees").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-fees"] });
      toast({ title: "Delivery fee created successfully" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating delivery fee", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<DeliveryFee> & { id: string }) => {
      const { error } = await supabase.from("delivery_fees").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-fees"] });
      toast({ title: "Delivery fee updated successfully" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating delivery fee", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_fees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-fees"] });
      toast({ title: "Delivery fee deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedFee(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting delivery fee", description: error.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (fee: DeliveryFee) => {
      const { error } = await supabase
        .from("delivery_fees")
        .update({ is_active: !fee.is_active })
        .eq("id", fee.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-fees"] });
    },
  });

  const resetForm = () => {
    setFormData({
      state_name: "",
      delivery_fee: 0,
      free_delivery_minimum: 0,
      is_active: true,
    });
    setSelectedFee(null);
  };

  const handleEdit = (fee: DeliveryFee) => {
    setSelectedFee(fee);
    setFormData({
      state_name: fee.state_name,
      delivery_fee: fee.delivery_fee,
      free_delivery_minimum: fee.free_delivery_minimum,
      is_active: fee.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.state_name.trim()) {
      toast({ title: "State name is required", variant: "destructive" });
      return;
    }

    const payload = {
      state_name: formData.state_name.trim(),
      delivery_fee: Number(formData.delivery_fee) || 0,
      free_delivery_minimum: Number(formData.free_delivery_minimum) || 0,
      is_active: formData.is_active,
    };

    if (selectedFee) {
      updateMutation.mutate({ id: selectedFee.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const {
    paginatedData: paginatedFees,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: deliveryFees, initialPageSize: 10 });

  const csvColumns = [
    { key: "state_name" as const, header: "State" },
    { key: "delivery_fee" as const, header: "Delivery Fee", accessor: (f: DeliveryFee) => `₹${f.delivery_fee}` },
    { key: "free_delivery_minimum" as const, header: "Free Delivery Min", accessor: (f: DeliveryFee) => f.free_delivery_minimum > 0 ? `₹${f.free_delivery_minimum}` : "No free delivery" },
    { key: "is_active" as const, header: "Active", accessor: (f: DeliveryFee) => f.is_active ? "Yes" : "No" },
  ];

  return (
    <AdminLayout title="Delivery Fees" description="Manage state-based delivery charges">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            {deliveryFees?.length || 0} states configured
          </p>
          <ExportCSV data={deliveryFees} filename="delivery-fees" columns={csvColumns} />
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add State
        </Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>Delivery Fee</TableHead>
                <TableHead>Free Delivery Minimum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedFees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No delivery fees configured
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFees?.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.state_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Truck className="h-3 w-3" />
                        ₹{fee.delivery_fee}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {fee.free_delivery_minimum > 0 ? (
                        <span className="text-secondary">
                          Free above ₹{fee.free_delivery_minimum}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No free delivery</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={fee.is_active}
                        onCheckedChange={() => toggleActive.mutate(fee)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(fee)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setSelectedFee(fee); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFee ? "Edit Delivery Fee" : "Add State Delivery Fee"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>State Name *</Label>
              <Input
                value={formData.state_name}
                onChange={(e) => setFormData({ ...formData, state_name: e.target.value })}
                placeholder="Maharashtra"
                disabled={!!selectedFee}
              />
            </div>

            <div className="space-y-2">
              <Label>Delivery Fee (₹)</Label>
              <Input
                type="number"
                value={formData.delivery_fee}
                onChange={(e) => setFormData({ ...formData, delivery_fee: Number(e.target.value) })}
                placeholder="50"
              />
            </div>

            <div className="space-y-2">
              <Label>Free Delivery Minimum Order (₹)</Label>
              <Input
                type="number"
                value={formData.free_delivery_minimum}
                onChange={(e) => setFormData({ ...formData, free_delivery_minimum: Number(e.target.value) })}
                placeholder="500"
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 to disable free delivery for this state
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {selectedFee ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Delivery Fee</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete delivery fee for "{selectedFee?.state_name}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedFee && deleteMutation.mutate(selectedFee.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDeliveryFees;
