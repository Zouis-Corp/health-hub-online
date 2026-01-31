import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Eye, Loader2, Search, Plus, Trash2, Package } from "lucide-react";
import PrescriptionViewer from "@/components/admin/PrescriptionViewer";
import ExportCSV from "@/components/admin/ExportCSV";
import Pagination from "@/components/admin/Pagination";
import usePagination from "@/hooks/usePagination";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Prescription {
  id: string;
  user_id: string;
  order_id: string | null;
  file_url: string;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  created_at: string;
  profiles?: { name: string | null } | null;
  orders?: { id: string; total_amount: number } | null;
}

interface Medicine {
  id: string;
  name: string;
  price: number;
  brand: string | null;
  dosage: string | null;
  prescription_required: boolean;
  stock: number;
}

interface OrderItem {
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  price: number;
}

const AdminPrescriptions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  
  // Medicine search & order items
  const [searchQuery, setSearchQuery] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["admin-prescriptions"],
    queryFn: async () => {
      // First get all prescriptions
      const { data: prescriptionsData, error } = await supabase
        .from("prescriptions")
        .select("*, orders(id, total_amount)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get all order IDs from prescriptions
      const orderIds = prescriptionsData
        .map(p => p.order_id)
        .filter((id): id is string => id !== null);

      // Get order_items count for each order to determine which have cart items
      let ordersWithCartItems: Set<string> = new Set();
      if (orderIds.length > 0) {
        const { data: orderItemsData } = await supabase
          .from("order_items")
          .select("order_id")
          .in("order_id", orderIds);
        
        if (orderItemsData) {
          ordersWithCartItems = new Set(orderItemsData.map(item => item.order_id));
        }
      }

      // Filter prescriptions to only show those WITHOUT cart items (pure prescription uploads)
      const filteredPrescriptions = prescriptionsData.filter(p => {
        // If no order_id, show it (new prescription upload)
        if (!p.order_id) return true;
        // Only show if the order has NO cart items
        return !ordersWithCartItems.has(p.order_id);
      });

      // Get user profiles
      const userIds = [...new Set(filteredPrescriptions.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return filteredPrescriptions.map(p => ({
        ...p,
        profiles: profilesMap.get(p.user_id) || null,
      })) as Prescription[];
    },
  });

  // Medicine search
  const { data: medicines, isLoading: medicinesLoading } = useQuery({
    queryKey: ["admin-medicines-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, price, brand, dosage, prescription_required, stock")
        .ilike("name", `%${searchQuery}%`)
        .eq("is_active", true)
        .limit(10);
      if (error) throw error;
      return data as Medicine[];
    },
    enabled: searchQuery.length >= 2,
  });

  // Fetch existing order items when reviewing a prescription
  const { data: existingOrderItems } = useQuery({
    queryKey: ["prescription-order-items", selectedPrescription?.order_id],
    queryFn: async () => {
      if (!selectedPrescription?.order_id) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("*, medicines(name)")
        .eq("order_id", selectedPrescription.order_id);
      if (error) throw error;
      return data.map(item => ({
        medicine_id: item.medicine_id,
        medicine_name: item.medicines?.name || "Unknown",
        quantity: item.quantity,
        price: item.price,
      })) as OrderItem[];
    },
    enabled: !!selectedPrescription?.order_id && reviewDialogOpen,
  });

  // Create order and add items mutation
  const createOrderMutation = useMutation({
    mutationFn: async ({ prescription, items }: { prescription: Prescription; items: OrderItem[] }) => {
      let orderId = prescription.order_id;
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create order if doesn't exist
      if (!orderId) {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: prescription.user_id,
            status: "pending_rx",
            total_amount: totalAmount,
          })
          .select()
          .single();
        if (orderError) throw orderError;
        orderId = orderData.id;

        // Link prescription to order
        const { error: linkError } = await supabase
          .from("prescriptions")
          .update({ order_id: orderId })
          .eq("id", prescription.id);
        if (linkError) throw linkError;
      } else {
        // Update existing order total
        const { error: updateError } = await supabase
          .from("orders")
          .update({ total_amount: totalAmount })
          .eq("id", orderId);
        if (updateError) throw updateError;

        // Delete existing order items
        await supabase.from("order_items").delete().eq("order_id", orderId);
      }

      // Insert new order items
      if (items.length > 0) {
        const orderItemsData = items.map(item => ({
          order_id: orderId,
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          price: item.price,
        }));
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItemsData);
        if (itemsError) throw itemsError;
      }

      return orderId;
    },
    onSuccess: (orderId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["prescription-order-items"] });
      toast({ title: "Order updated successfully", description: `Order ID: ${orderId?.slice(0, 8)}` });
      // Update the selected prescription with the new order_id
      if (selectedPrescription) {
        setSelectedPrescription({ ...selectedPrescription, order_id: orderId });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error updating order", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes, userId, orderId }: { id: string; status: "pending" | "approved" | "rejected"; notes: string; userId: string; orderId: string | null }) => {
      const { error } = await supabase
        .from("prescriptions")
        .update({ 
          status, 
          notes, 
          approved_by: user?.id 
        })
        .eq("id", id);
      if (error) throw error;

      // Get order number
      let orderNumber: number | null = null;
      if (orderId) {
        const { data: orderData } = await supabase
          .from("orders")
          .select("order_number")
          .eq("id", orderId)
          .single();
        orderNumber = orderData?.order_number || null;
      }

      // If approved, update order status
      if (status === "approved" && orderId) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ status: "approved" })
          .eq("id", orderId);
        if (orderError) throw orderError;
      }

      // If rejected, update order status
      if (status === "rejected" && orderId) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ status: "rejected", rejection_reason: notes })
          .eq("id", orderId);
        if (orderError) throw orderError;
      }

      // Get order items for email
      let productNames: string[] = [];
      if (orderId) {
        const { data: items } = await supabase
          .from("order_items")
          .select("medicines(name)")
          .eq("order_id", orderId);
        productNames = items?.map(i => i.medicines?.name).filter(Boolean) as string[] || [];
      }

      // Send notification email
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: status === "approved" ? 'rx-approved' : 'rx-rejected',
            userId: userId,
            orderId: orderId,
            orderNumber: orderNumber,
            notes: notes,
            productNames: productNames,
          },
        });
      } catch (emailError) {
        console.error('Failed to send notification email:', emailError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-prescriptions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: `Prescription ${actionType === "approve" ? "approved" : "rejected"} successfully` });
      setActionDialogOpen(false);
      setReviewDialogOpen(false);
      setSelectedPrescription(null);
      setNotes("");
      setOrderItems([]);
    },
    onError: (error: Error) => {
      toast({ title: "Error updating prescription", description: error.message, variant: "destructive" });
    },
  });

  const handleReview = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setOrderItems([]);
    setSearchQuery("");
    setNotes("");
    setReviewDialogOpen(true);
  };

  const handleAction = (action: "approve" | "reject") => {
    setActionType(action);
    setActionDialogOpen(true);
  };

  const submitAction = () => {
    if (!selectedPrescription) return;
    updateMutation.mutate({
      id: selectedPrescription.id,
      status: actionType === "approve" ? "approved" : "rejected",
      notes,
      userId: selectedPrescription.user_id,
      orderId: selectedPrescription.order_id,
    });
  };

  const addMedicineToOrder = (medicine: Medicine) => {
    const existing = orderItems.find(item => item.medicine_id === medicine.id);
    if (existing) {
      setOrderItems(orderItems.map(item => 
        item.medicine_id === medicine.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        medicine_id: medicine.id,
        medicine_name: medicine.name,
        quantity: 1,
        price: medicine.price,
      }]);
    }
    setSearchQuery("");
  };

  const updateQuantity = (medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter(item => item.medicine_id !== medicineId));
    } else {
      setOrderItems(orderItems.map(item => 
        item.medicine_id === medicineId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const removeItem = (medicineId: string) => {
    setOrderItems(orderItems.filter(item => item.medicine_id !== medicineId));
  };

  const saveOrderItems = () => {
    if (!selectedPrescription) return;
    createOrderMutation.mutate({ prescription: selectedPrescription, items: orderItems });
  };

  // Load existing items when dialog opens
  const handleDialogOpen = (open: boolean) => {
    setReviewDialogOpen(open);
    if (!open) {
      setOrderItems([]);
      setSearchQuery("");
    }
  };

  // Effect to load existing items
  useState(() => {
    if (existingOrderItems && existingOrderItems.length > 0) {
      setOrderItems(existingOrderItems);
    }
  });

  const filteredPrescriptions = prescriptions?.filter((p) => {
    if (activeTab === "all") return true;
    return p.status === activeTab;
  });

  // Pagination
  const {
    paginatedData: paginatedPrescriptions,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: filteredPrescriptions, initialPageSize: 10 });

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // CSV export columns
  const csvColumns = [
    { key: "created_at" as const, header: "Date", accessor: (p: Prescription) => format(new Date(p.created_at), "yyyy-MM-dd HH:mm") },
    { key: "profiles" as const, header: "User", accessor: (p: Prescription) => p.profiles?.name || "Unknown" },
    { key: "order_id" as const, header: "Order ID", accessor: (p: Prescription) => p.order_id?.slice(0, 8) || "No Order" },
    { key: "status" as const, header: "Status" },
    { key: "notes" as const, header: "Notes", accessor: (p: Prescription) => p.notes || "" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from("prescriptions").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <AdminLayout title="Prescriptions" description="Review and approve prescription uploads">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({prescriptions?.filter(p => p.status === "pending").length || 0})
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <ExportCSV data={filteredPrescriptions} filename="prescriptions" columns={csvColumns} />
      </div>

      <Card className="shadow-card">
        {/* Desktop Table View */}
        <CardContent className="p-0 hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Order ID</TableHead>
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
              ) : paginatedPrescriptions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No prescriptions found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPrescriptions?.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>
                      {format(new Date(prescription.created_at), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>{prescription.profiles?.name || "Unknown"}</TableCell>
                    <TableCell>
                      {prescription.order_id ? (
                        <span className="font-mono text-sm">
                          {prescription.order_id.slice(0, 8)}...
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-xs">No Order</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPrescription(prescription);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {prescription.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleReview(prescription)}
                          >
                            <Package className="h-4 w-4" />
                            Review & Add Items
                          </Button>
                        )}
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
          ) : paginatedPrescriptions?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No prescriptions found
            </div>
          ) : (
            paginatedPrescriptions?.map((prescription) => (
              <div key={prescription.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{prescription.profiles?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(prescription.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  {getStatusBadge(prescription.status)}
                </div>
                
                {prescription.order_id && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Order: {prescription.order_id.slice(0, 8)}...
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      setSelectedPrescription(prescription);
                      setViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                  {prescription.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => handleReview(prescription)}
                    >
                      <Package className="h-3.5 w-3.5" />
                      Review
                    </Button>
                  )}
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

      {/* View Prescription Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>View Prescription</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedPrescription.profiles?.name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedPrescription.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {format(new Date(selectedPrescription.created_at), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
                {selectedPrescription.notes && (
                  <div>
                    <p className="text-muted-foreground">Notes</p>
                    <p className="font-medium">{selectedPrescription.notes}</p>
                  </div>
                )}
              </div>
              <PrescriptionViewer imageUrl={getPublicUrl(selectedPrescription.file_url)} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review & Add Items Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={handleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Review Prescription & Add Items</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="grid md:grid-cols-2 gap-4 flex-1 overflow-hidden">
              {/* Left: Prescription Image */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">Prescription Image</p>
                  <Badge>{selectedPrescription.profiles?.name}</Badge>
                </div>
                <PrescriptionViewer imageUrl={getPublicUrl(selectedPrescription.file_url)} />
              </div>

              {/* Right: Medicine Search & Order Items */}
              <div className="flex flex-col space-y-3 overflow-hidden">
                {/* Medicine Search */}
                <div className="space-y-2">
                  <p className="font-medium text-sm">Search & Add Medicines</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search medicines by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {searchQuery.length >= 2 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {medicinesLoading ? (
                        <div className="p-3 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </div>
                      ) : medicines?.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground text-center">No medicines found</p>
                      ) : (
                        medicines?.map((medicine) => (
                          <div
                            key={medicine.id}
                            className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                            onClick={() => addMedicineToOrder(medicine)}
                          >
                            <div>
                              <p className="font-medium text-sm">{medicine.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {medicine.brand} {medicine.dosage && `• ${medicine.dosage}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">₹{medicine.price}</span>
                              <Button size="icon" variant="ghost" className="h-7 w-7">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Order Items */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">Order Items ({orderItems.length})</p>
                    {orderItems.length > 0 && (
                      <p className="font-bold text-primary">Total: ₹{orderTotal.toLocaleString()}</p>
                    )}
                  </div>
                  <ScrollArea className="flex-1 border rounded-lg">
                    {orderItems.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Search and add medicines from the prescription
                      </div>
                    ) : (
                      <div className="divide-y">
                        {orderItems.map((item) => (
                          <div key={item.medicine_id} className="flex items-center justify-between p-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.medicine_name}</p>
                              <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.medicine_id, item.quantity - 1)}
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => updateQuantity(item.medicine_id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                              <span className="font-semibold text-sm w-16 text-right">
                                ₹{(item.price * item.quantity).toLocaleString()}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                onClick={() => removeItem(item.medicine_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes for customer (optional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about the prescription or order..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => handleDialogOpen(false)}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={saveOrderItems}
                disabled={createOrderMutation.isPending || orderItems.length === 0}
              >
                {createOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Order Items
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleAction("reject")}
                disabled={updateMutation.isPending}
              >
                <X className="mr-1 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => handleAction("approve")}
                disabled={updateMutation.isPending || orderItems.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-1 h-4 w-4" />
                Approve & Notify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Prescription
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {actionType === "approve"
                ? `Are you sure you want to approve this prescription? The customer will receive an email with ${orderItems.length} item(s) and payment instructions.`
                : "Are you sure you want to reject this prescription? The customer will be notified."}
            </p>
            {orderItems.length > 0 && actionType === "approve" && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-2">Items in order:</p>
                <ul className="space-y-1">
                  {orderItems.map(item => (
                    <li key={item.medicine_id} className="flex justify-between">
                      <span>{item.medicine_name} x{item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-bold mt-2 pt-2 border-t">Total: ₹{orderTotal.toLocaleString()}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submitAction}
                disabled={updateMutation.isPending}
                className={actionType === "reject" ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
              >
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {actionType === "approve" ? "Approve & Send Email" : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPrescriptions;