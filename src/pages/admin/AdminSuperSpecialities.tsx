import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Heart } from "lucide-react";
import ExportCSV from "@/components/admin/ExportCSV";
import Pagination from "@/components/admin/Pagination";
import usePagination from "@/hooks/usePagination";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface SuperSpeciality {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

const AdminSuperSpecialities = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSpeciality, setSelectedSpeciality] = useState<SuperSpeciality | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    is_active: true,
  });

  const { data: specialities, isLoading } = useQuery({
    queryKey: ["admin-super-specialities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("super_specialities")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as SuperSpeciality[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("super_specialities").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-super-specialities"] });
      toast({ title: "Speciality created successfully" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error creating speciality", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("super_specialities").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-super-specialities"] });
      toast({ title: "Speciality updated successfully" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating speciality", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("super_specialities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-super-specialities"] });
      toast({ title: "Speciality deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedSpeciality(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting speciality", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", slug: "", description: "", icon: "", is_active: true });
    setSelectedSpeciality(null);
  };

  const handleEdit = (speciality: SuperSpeciality) => {
    setSelectedSpeciality(speciality);
    setFormData({
      name: speciality.name,
      slug: speciality.slug,
      description: speciality.description || "",
      icon: speciality.icon || "",
      is_active: speciality.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-");
    const data = {
      name: formData.name,
      slug,
      description: formData.description || null,
      icon: formData.icon || null,
      is_active: formData.is_active,
    };
    
    if (selectedSpeciality) {
      updateMutation.mutate({ id: selectedSpeciality.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const {
    paginatedData: paginatedSpecialities,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: specialities, initialPageSize: 10 });

  const csvColumns = [
    { key: "name" as const, header: "Name" },
    { key: "slug" as const, header: "Slug" },
    { key: "icon" as const, header: "Icon", accessor: (s: SuperSpeciality) => s.icon || "" },
    { key: "description" as const, header: "Description", accessor: (s: SuperSpeciality) => s.description || "" },
    { key: "is_active" as const, header: "Active", accessor: (s: SuperSpeciality) => s.is_active ? "Yes" : "No" },
  ];

  return (
    <AdminLayout title="Super Specialities" description="Manage medical speciality categories">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">{specialities?.length || 0} specialities total</p>
          <ExportCSV data={specialities} filename="super-specialities" columns={csvColumns} />
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Speciality
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedSpeciality ? "Edit" : "Add"} Super Speciality</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Oncology"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Auto-generated from name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Lucide icon name)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g., Heart, Brain, Pill"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedSpeciality ? "Update" : "Create"} Speciality
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0 overflow-x-auto hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Icon</TableHead>
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
              ) : paginatedSpecialities?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No specialities found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSpecialities?.map((speciality) => (
                  <TableRow key={speciality.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary" />
                        <span className="font-medium">{speciality.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{speciality.slug}</TableCell>
                    <TableCell className="text-muted-foreground">{speciality.icon || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={speciality.is_active ? "default" : "secondary"}>
                        {speciality.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(speciality)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setSelectedSpeciality(speciality); setDeleteDialogOpen(true); }}
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
            <div className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : paginatedSpecialities?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No specialities found</div>
          ) : (
            paginatedSpecialities?.map((speciality) => (
              <div key={speciality.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    <span className="font-medium">{speciality.name}</span>
                  </div>
                  <Badge variant={speciality.is_active ? "default" : "secondary"}>
                    {speciality.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{speciality.slug}</p>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleEdit(speciality)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5 text-destructive border-destructive/50"
                    onClick={() => { setSelectedSpeciality(speciality); setDeleteDialogOpen(true); }}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Speciality</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSpeciality?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSpeciality && deleteMutation.mutate(selectedSpeciality.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminSuperSpecialities;
