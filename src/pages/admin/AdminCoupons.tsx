import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Percent, IndianRupee, Truck } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type DiscountType = "percentage" | "flat" | "free_delivery";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order_value: number;
  maximum_discount: number | null;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  usage_limit: number | null;
  times_used: number;
  created_at: string;
}

const AdminCoupons = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as DiscountType,
    discount_value: 0,
    minimum_order_value: 0,
    maximum_discount: "",
    is_active: true,
    start_date: "",
    end_date: "",
    usage_limit: "",
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { code: string } & Partial<Omit<Coupon, 'code'>>) => {
      const { error } = await supabase.from("coupons").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Coupon created successfully" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating coupon", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Coupon> & { id: string }) => {
      const { error } = await supabase.from("coupons").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Coupon updated successfully" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating coupon", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Coupon deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedCoupon(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting coupon", description: error.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (coupon: Coupon) => {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: !coupon.is_active })
        .eq("id", coupon.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 0,
      minimum_order_value: 0,
      maximum_discount: "",
      is_active: true,
      start_date: "",
      end_date: "",
      usage_limit: "",
    });
    setSelectedCoupon(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_order_value: coupon.minimum_order_value,
      maximum_discount: coupon.maximum_discount?.toString() || "",
      is_active: coupon.is_active,
      start_date: coupon.start_date ? format(new Date(coupon.start_date), "yyyy-MM-dd") : "",
      end_date: coupon.end_date ? format(new Date(coupon.end_date), "yyyy-MM-dd") : "",
      usage_limit: coupon.usage_limit?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code.trim()) {
      toast({ title: "Coupon code is required", variant: "destructive" });
      return;
    }

    const payload = {
      code: formData.code.toUpperCase().trim(),
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: formData.discount_type === "free_delivery" ? 0 : Number(formData.discount_value),
      minimum_order_value: Number(formData.minimum_order_value) || 0,
      maximum_discount: formData.maximum_discount ? Number(formData.maximum_discount) : null,
      is_active: formData.is_active,
      start_date: formData.start_date || new Date().toISOString(),
      end_date: formData.end_date || null,
      usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
    };

    if (selectedCoupon) {
      updateMutation.mutate({ id: selectedCoupon.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const {
    paginatedData: paginatedCoupons,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: coupons, initialPageSize: 10 });

  const csvColumns = [
    { key: "code" as const, header: "Code" },
    { key: "discount_type" as const, header: "Type" },
    { key: "discount_value" as const, header: "Value", accessor: (c: Coupon) => String(c.discount_value) },
    { key: "minimum_order_value" as const, header: "Min Order", accessor: (c: Coupon) => `₹${c.minimum_order_value}` },
    { key: "maximum_discount" as const, header: "Max Discount", accessor: (c: Coupon) => c.maximum_discount ? `₹${c.maximum_discount}` : "-" },
    { key: "times_used" as const, header: "Times Used", accessor: (c: Coupon) => String(c.times_used) },
    { key: "is_active" as const, header: "Active", accessor: (c: Coupon) => c.is_active ? "Yes" : "No" },
  ];

  const getDiscountIcon = (type: DiscountType) => {
    switch (type) {
      case "percentage": return <Percent className="h-4 w-4" />;
      case "flat": return <IndianRupee className="h-4 w-4" />;
      case "free_delivery": return <Truck className="h-4 w-4" />;
    }
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    switch (coupon.discount_type) {
      case "percentage": return `${coupon.discount_value}% off`;
      case "flat": return `₹${coupon.discount_value} off`;
      case "free_delivery": return "Free Delivery";
    }
  };

  return (
    <AdminLayout title="Coupons" description="Manage discount coupons">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            {coupons?.length || 0} coupons total
          </p>
          <ExportCSV data={coupons} filename="coupons" columns={csvColumns} />
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      <Card className="shadow-card">
        {/* Desktop Table View */}
        <CardContent className="p-0 overflow-x-auto hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Max Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedCoupons?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No coupons found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCoupons?.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDiscountIcon(coupon.discount_type)}
                        <span className="capitalize">{coupon.discount_type.replace("_", " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getDiscountDisplay(coupon)}</TableCell>
                    <TableCell>₹{coupon.minimum_order_value}</TableCell>
                    <TableCell>{coupon.maximum_discount ? `₹${coupon.maximum_discount}` : "-"}</TableCell>
                    <TableCell>
                      {coupon.times_used}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={() => toggleActive.mutate(coupon)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setSelectedCoupon(coupon); setDeleteDialogOpen(true); }}
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

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-border">
          {isLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : paginatedCoupons?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No coupons found
            </div>
          ) : (
            paginatedCoupons?.map((coupon) => (
              <div key={coupon.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-bold text-primary">{coupon.code}</p>
                    <p className="text-sm text-muted-foreground">{coupon.description || "No description"}</p>
                  </div>
                  <Switch
                    checked={coupon.is_active}
                    onCheckedChange={() => toggleActive.mutate(coupon)}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="gap-1">
                    {getDiscountIcon(coupon.discount_type)}
                    {getDiscountDisplay(coupon)}
                  </Badge>
                  <Badge variant="outline">Min ₹{coupon.minimum_order_value}</Badge>
                  {coupon.maximum_discount && (
                    <Badge variant="secondary">Max ₹{coupon.maximum_discount}</Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Used: {coupon.times_used}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : " (unlimited)"}
                </p>
                
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleEdit(coupon)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive border-destructive/50"
                    onClick={() => { setSelectedCoupon(coupon); setDeleteDialogOpen(true); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coupon Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Type *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(v: DiscountType) => setFormData({ ...formData, discount_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                    <SelectItem value="free_delivery">Free Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Get 20% off on orders above ₹500"
              />
            </div>

            {formData.discount_type !== "free_delivery" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Discount Value {formData.discount_type === "percentage" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    placeholder="20"
                  />
                </div>
                {formData.discount_type === "percentage" && (
                  <div className="space-y-2">
                    <Label>Maximum Discount (₹)</Label>
                    <Input
                      type="number"
                      value={formData.maximum_discount}
                      onChange={(e) => setFormData({ ...formData, maximum_discount: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Order Value (₹)</Label>
                <Input
                  type="number"
                  value={formData.minimum_order_value}
                  onChange={(e) => setFormData({ ...formData, minimum_order_value: Number(e.target.value) })}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
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
              {selectedCoupon ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete coupon "{selectedCoupon?.code}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedCoupon && deleteMutation.mutate(selectedCoupon.id)}
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

export default AdminCoupons;
