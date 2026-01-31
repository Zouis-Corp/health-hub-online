import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, FlaskConical } from "lucide-react";
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

interface Molecule {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

const AdminMolecules = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMolecule, setSelectedMolecule] = useState<Molecule | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    is_active: true,
  });

  const { data: molecules, isLoading } = useQuery({
    queryKey: ["admin-molecules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("molecules")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Molecule[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("molecules").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-molecules"] });
      toast({ title: "Molecule created successfully" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error creating molecule", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("molecules").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-molecules"] });
      toast({ title: "Molecule updated successfully" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating molecule", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("molecules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-molecules"] });
      toast({ title: "Molecule deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedMolecule(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting molecule", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", slug: "", description: "", is_active: true });
    setSelectedMolecule(null);
  };

  const handleEdit = (molecule: Molecule) => {
    setSelectedMolecule(molecule);
    setFormData({
      name: molecule.name,
      slug: molecule.slug,
      description: molecule.description || "",
      is_active: molecule.is_active,
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
      is_active: formData.is_active,
    };
    
    if (selectedMolecule) {
      updateMutation.mutate({ id: selectedMolecule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const {
    paginatedData: paginatedMolecules,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: molecules, initialPageSize: 10 });

  const csvColumns = [
    { key: "name" as const, header: "Name" },
    { key: "slug" as const, header: "Slug" },
    { key: "description" as const, header: "Description", accessor: (m: Molecule) => m.description || "" },
    { key: "is_active" as const, header: "Active", accessor: (m: Molecule) => m.is_active ? "Yes" : "No" },
  ];

  return (
    <AdminLayout title="Molecules" description="Manage active pharmaceutical ingredients (salt names)">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">{molecules?.length || 0} molecules total</p>
          <ExportCSV data={molecules} filename="molecules" columns={csvColumns} />
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Molecule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedMolecule ? "Edit" : "Add"} Molecule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cisplatin"
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
                {selectedMolecule ? "Update" : "Create"} Molecule
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedMolecules?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No molecules found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMolecules?.map((molecule) => (
                  <TableRow key={molecule.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-primary" />
                        <span className="font-medium">{molecule.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{molecule.slug}</TableCell>
                    <TableCell>
                      <Badge variant={molecule.is_active ? "default" : "secondary"}>
                        {molecule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(molecule)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setSelectedMolecule(molecule); setDeleteDialogOpen(true); }}
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
          ) : paginatedMolecules?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No molecules found</div>
          ) : (
            paginatedMolecules?.map((molecule) => (
              <div key={molecule.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-primary" />
                    <span className="font-medium">{molecule.name}</span>
                  </div>
                  <Badge variant={molecule.is_active ? "default" : "secondary"}>
                    {molecule.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{molecule.slug}</p>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleEdit(molecule)}>
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5 text-destructive border-destructive/50"
                    onClick={() => { setSelectedMolecule(molecule); setDeleteDialogOpen(true); }}
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
            <AlertDialogTitle>Delete Molecule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMolecule?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedMolecule && deleteMutation.mutate(selectedMolecule.id)}
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

export default AdminMolecules;
