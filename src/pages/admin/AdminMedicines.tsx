import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface Medicine {
  id: string;
  name: string;
  slug: string;
  type: "medicine" | "wellness";
  condition_id: string | null;
  salt_name: string | null;
  brand: string | null;
  dosage: string | null;
  prescription_required: boolean;
  price: number;
  original_price: number | null;
  stock: number;
  is_active: boolean;
  conditions?: { name: string } | null;
}

interface Condition {
  id: string;
  name: string;
}

interface Molecule {
  id: string;
  name: string;
}

interface SuperSpeciality {
  id: string;
  name: string;
}

const AdminMedicines = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  
  // Multi-select states
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedMolecules, setSelectedMolecules] = useState<string[]>([]);
  const [selectedSpecialities, setSelectedSpecialities] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "medicine" as "medicine" | "wellness",
    condition_id: "",
    salt_name: "",
    brand: "",
    dosage: "",
    prescription_required: false,
    price: "",
    original_price: "",
    stock: "0",
    description: "",
    image_url: "",
    is_active: true,
  });

  const { data: medicines, isLoading } = useQuery({
    queryKey: ["admin-medicines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("*, conditions(name)")
        .order("name");
      if (error) throw error;
      return data as Medicine[];
    },
  });

  const { data: conditions } = useQuery({
    queryKey: ["conditions-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conditions")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Condition[];
    },
  });

  const { data: molecules } = useQuery({
    queryKey: ["molecules-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("molecules")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Molecule[];
    },
  });

  const { data: specialities } = useQuery({
    queryKey: ["specialities-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("super_specialities")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as SuperSpeciality[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: newMedicine, error } = await supabase.from("medicines").insert([data]).select().single();
      if (error) throw error;
      return newMedicine;
    },
    onSuccess: async (newMedicine) => {
      await saveRelations(newMedicine.id);
      queryClient.invalidateQueries({ queryKey: ["admin-medicines"] });
      toast({ title: "Medicine created successfully" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error creating medicine", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from("medicines").update(data).eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: async (id) => {
      await saveRelations(id);
      queryClient.invalidateQueries({ queryKey: ["admin-medicines"] });
      toast({ title: "Medicine updated successfully" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating medicine", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medicines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-medicines"] });
      toast({ title: "Medicine deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedMedicine(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting medicine", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "", slug: "", type: "medicine", condition_id: "", salt_name: "", brand: "",
      dosage: "", prescription_required: false, price: "", original_price: "",
      stock: "0", description: "", image_url: "", is_active: true,
    });
    setSelectedConditions([]);
    setSelectedMolecules([]);
    setSelectedSpecialities([]);
    setSelectedMedicine(null);
  };

  const handleEdit = async (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine.name,
      slug: medicine.slug,
      type: medicine.type || "medicine",
      condition_id: medicine.condition_id || "",
      salt_name: medicine.salt_name || "",
      brand: medicine.brand || "",
      dosage: medicine.dosage || "",
      prescription_required: medicine.prescription_required,
      price: medicine.price.toString(),
      original_price: medicine.original_price?.toString() || "",
      stock: medicine.stock.toString(),
      description: "",
      is_active: medicine.is_active,
    });
    
    // Fetch existing relations
    const [conditionsRes, moleculesRes, specialitiesRes] = await Promise.all([
      supabase.from("product_conditions").select("condition_id").eq("product_id", medicine.id),
      supabase.from("product_molecules").select("molecule_id").eq("product_id", medicine.id),
      supabase.from("product_specialities").select("speciality_id").eq("product_id", medicine.id),
    ]);
    
    setSelectedConditions(conditionsRes.data?.map(r => r.condition_id) || []);
    setSelectedMolecules(moleculesRes.data?.map(r => r.molecule_id) || []);
    setSelectedSpecialities(specialitiesRes.data?.map(r => r.speciality_id) || []);
    
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-");
    const data = {
      name: formData.name,
      slug,
      type: formData.type,
      condition_id: formData.condition_id || null,
      salt_name: formData.salt_name || null,
      brand: formData.brand || null,
      dosage: formData.dosage || null,
      prescription_required: formData.prescription_required,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      stock: parseInt(formData.stock),
      is_active: formData.is_active,
    };
    
    if (selectedMedicine) {
      updateMutation.mutate({ id: selectedMedicine.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Save junction table relations after medicine is created/updated
  const saveRelations = async (productId: string) => {
    // Clear existing relations
    await Promise.all([
      supabase.from("product_conditions").delete().eq("product_id", productId),
      supabase.from("product_molecules").delete().eq("product_id", productId),
      supabase.from("product_specialities").delete().eq("product_id", productId),
    ]);
    
    // Insert new relations
    const conditionInserts = selectedConditions.map(id => ({ product_id: productId, condition_id: id }));
    const moleculeInserts = selectedMolecules.map(id => ({ product_id: productId, molecule_id: id }));
    const specialityInserts = selectedSpecialities.map(id => ({ product_id: productId, speciality_id: id }));
    
    await Promise.all([
      conditionInserts.length > 0 && supabase.from("product_conditions").insert(conditionInserts),
      moleculeInserts.length > 0 && supabase.from("product_molecules").insert(moleculeInserts),
      specialityInserts.length > 0 && supabase.from("product_specialities").insert(specialityInserts),
    ]);
  };

  // Pagination
  const {
    paginatedData: paginatedMedicines,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: medicines, initialPageSize: 10 });

  // CSV export columns
  const csvColumns = [
    { key: "name" as const, header: "Name" },
    { key: "brand" as const, header: "Brand", accessor: (m: Medicine) => m.brand || "" },
    { key: "conditions" as const, header: "Condition", accessor: (m: Medicine) => m.conditions?.name || "" },
    { key: "salt_name" as const, header: "Salt Name", accessor: (m: Medicine) => m.salt_name || "" },
    { key: "dosage" as const, header: "Dosage", accessor: (m: Medicine) => m.dosage || "" },
    { key: "price" as const, header: "Price", accessor: (m: Medicine) => `₹${m.price}` },
    { key: "original_price" as const, header: "Original Price", accessor: (m: Medicine) => m.original_price ? `₹${m.original_price}` : "" },
    { key: "stock" as const, header: "Stock", accessor: (m: Medicine) => String(m.stock) },
    { key: "prescription_required" as const, header: "Rx Required", accessor: (m: Medicine) => m.prescription_required ? "Yes" : "No" },
    { key: "is_active" as const, header: "Active", accessor: (m: Medicine) => m.is_active ? "Yes" : "No" },
  ];

  return (
    <AdminLayout title="Medicines" description="Manage medicine catalog">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            {medicines?.length || 0} medicines total
          </p>
          <ExportCSV data={medicines} filename="medicines" columns={csvColumns} />
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedMedicine ? "Edit" : "Add"} Medicine</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "medicine" | "wellness") => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicine">Medicine</SelectItem>
                      <SelectItem value="wellness">Wellness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salt_name">Salt Name (Legacy)</Label>
                  <Input
                    id="salt_name"
                    value={formData.salt_name}
                    onChange={(e) => setFormData({ ...formData, salt_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g., 500mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price (₹)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    placeholder="For discounts"
                  />
                </div>
              </div>

              {/* Multi-select: Conditions */}
              <div className="space-y-2">
                <Label>Conditions (Multi-select)</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedConditions.map(id => {
                    const cond = conditions?.find(c => c.id === id);
                    return cond ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {cond.name}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedConditions(prev => prev.filter(i => i !== id))} />
                      </Badge>
                    ) : null;
                  })}
                </div>
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-2">
                    {conditions?.map(c => (
                      <div key={c.id} className="flex items-center gap-2">
                        <Checkbox 
                          checked={selectedConditions.includes(c.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedConditions(prev => [...prev, c.id]);
                            else setSelectedConditions(prev => prev.filter(i => i !== c.id));
                          }}
                        />
                        <span className="text-sm">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Multi-select: Molecules */}
              <div className="space-y-2">
                <Label>Molecules (Multi-select)</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedMolecules.map(id => {
                    const mol = molecules?.find(m => m.id === id);
                    return mol ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {mol.name}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedMolecules(prev => prev.filter(i => i !== id))} />
                      </Badge>
                    ) : null;
                  })}
                </div>
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-2">
                    {molecules?.map(m => (
                      <div key={m.id} className="flex items-center gap-2">
                        <Checkbox 
                          checked={selectedMolecules.includes(m.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedMolecules(prev => [...prev, m.id]);
                            else setSelectedMolecules(prev => prev.filter(i => i !== m.id));
                          }}
                        />
                        <span className="text-sm">{m.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Multi-select: Super Specialities */}
              <div className="space-y-2">
                <Label>Super Specialities (Multi-select)</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedSpecialities.map(id => {
                    const spec = specialities?.find(s => s.id === id);
                    return spec ? (
                      <Badge key={id} variant="secondary" className="gap-1">
                        {spec.name}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSpecialities(prev => prev.filter(i => i !== id))} />
                      </Badge>
                    ) : null;
                  })}
                </div>
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-2">
                    {specialities?.map(s => (
                      <div key={s.id} className="flex items-center gap-2">
                        <Checkbox 
                          checked={selectedSpecialities.includes(s.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedSpecialities(prev => [...prev, s.id]);
                            else setSelectedSpecialities(prev => prev.filter(i => i !== s.id));
                          }}
                        />
                        <span className="text-sm">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.prescription_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, prescription_required: checked })}
                  />
                  <Label>Prescription Required</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedMedicine ? "Update" : "Create"} Medicine
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        {/* Desktop Table View */}
        <CardContent className="p-0 overflow-x-auto hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Rx</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedMedicines?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No medicines found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMedicines?.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{medicine.name}</p>
                        <p className="text-xs text-muted-foreground">{medicine.brand}</p>
                      </div>
                    </TableCell>
                    <TableCell>{medicine.conditions?.name || "-"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">₹{medicine.price}</p>
                        {medicine.original_price && (
                          <p className="text-xs text-muted-foreground line-through">₹{medicine.original_price}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={medicine.stock > 10 ? "default" : medicine.stock > 0 ? "secondary" : "destructive"}>
                        {medicine.stock}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {medicine.prescription_required && (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">Rx</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={medicine.is_active ? "default" : "secondary"}>
                        {medicine.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(medicine)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => { setSelectedMedicine(medicine); setDeleteDialogOpen(true); }}
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
          ) : paginatedMedicines?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No medicines found
            </div>
          ) : (
            paginatedMedicines?.map((medicine) => (
              <div key={medicine.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{medicine.name}</p>
                    <p className="text-xs text-muted-foreground">{medicine.brand || "No brand"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">₹{medicine.price}</p>
                    {medicine.original_price && (
                      <p className="text-xs text-muted-foreground line-through">₹{medicine.original_price}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={medicine.stock > 10 ? "default" : medicine.stock > 0 ? "secondary" : "destructive"}>
                    Stock: {medicine.stock}
                  </Badge>
                  {medicine.prescription_required && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">Rx Required</Badge>
                  )}
                  <Badge variant={medicine.is_active ? "default" : "secondary"}>
                    {medicine.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                
                {medicine.conditions?.name && (
                  <p className="text-sm text-muted-foreground">Condition: {medicine.conditions.name}</p>
                )}
                
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => handleEdit(medicine)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5 text-destructive border-destructive/50"
                    onClick={() => { setSelectedMedicine(medicine); setDeleteDialogOpen(true); }}
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
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedMedicine?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedMedicine && deleteMutation.mutate(selectedMedicine.id)}
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

export default AdminMedicines;
