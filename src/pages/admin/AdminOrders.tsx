import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Loader2, FileText, XCircle } from "lucide-react";
import PrescriptionViewer from "@/components/admin/PrescriptionViewer";
import ExportCSV from "@/components/admin/ExportCSV";
import Pagination from "@/components/admin/Pagination";
import usePagination from "@/hooks/usePagination";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Label } from "@/components/ui/label";

type OrderStatus = "pending_rx" | "approved" | "rejected" | "processing" | "shipped" | "delivered";

const REJECTION_REASONS = [
  "Items do not match prescription",
  "Prescription is expired",
  "Prescription is not legible",
  "Invalid prescription format",
  "Controlled substance not allowed",
  "Dosage not specified",
  "Doctor information missing",
  "Patient information mismatch",
  "Other",
];

interface Order {
  id: string;
  user_id: string;
  order_number: number | null;
  status: OrderStatus;
  total_amount: number;
  payment_status: string;
  rejection_reason: string | null;
  created_at: string;
  profiles?: { name: string | null } | null;
  order_items?: Array<{
    id: string;
    quantity: number;
    price: number;
    medicines?: { name: string } | null;
  }>;
  prescriptions?: Array<{
    id: string;
    file_url: string;
    status: string;
  }>;
}

const AdminOrders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [selectedPrescriptionUrl, setSelectedPrescriptionUrl] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>("");
  const [orderToReject, setOrderToReject] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*, order_items(id, quantity, price, medicines(name)), prescriptions(id, file_url, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(ordersData.map(o => o.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return ordersData.map(o => ({
        ...o,
        profiles: profilesMap.get(o.user_id) || null,
      })) as Order[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, userId, orderNumber, rejectionReason }: { id: string; status: OrderStatus; userId: string; orderNumber: number | null; rejectionReason?: string }) => {
      const updateData: any = { status };
      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }
      
      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;

      // Send order confirmed email when status changes to processing
      if (status === "processing") {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'order-confirmed',
              userId: userId,
              orderId: id,
              orderNumber: orderNumber,
            },
          });
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
      }

      // Send status update email for shipped or delivered
      if (status === "shipped" || status === "delivered") {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'status-update',
              userId: userId,
              orderId: id,
              orderNumber: orderNumber,
              newStatus: status,
            },
          });
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
        }
      }

      // Send rejection email when status changes to rejected
      if (status === "rejected" && rejectionReason) {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'rx-rejected',
              userId: userId,
              orderId: id,
              orderNumber: orderNumber,
              notes: rejectionReason,
            },
          });
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Order status updated" });
      setRejectDialogOpen(false);
      setOrderToReject(null);
      setSelectedRejectionReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Error updating order", description: error.message, variant: "destructive" });
    },
  });

  const handleStatusChange = (order: Order, newStatus: OrderStatus) => {
    if (newStatus === "rejected") {
      setOrderToReject(order);
      setRejectDialogOpen(true);
    } else {
      updateStatusMutation.mutate({ id: order.id, status: newStatus, userId: order.user_id, orderNumber: order.order_number });
    }
  };

  const handleConfirmReject = () => {
    if (!orderToReject || !selectedRejectionReason) {
      toast({ title: "Please select a rejection reason", variant: "destructive" });
      return;
    }
    updateStatusMutation.mutate({
      id: orderToReject.id,
      status: "rejected",
      userId: orderToReject.user_id,
      orderNumber: orderToReject.order_number,
      rejectionReason: selectedRejectionReason,
    });
  };

  const viewPrescription = async (fileUrl: string) => {
    try {
      const { data } = await supabase.storage
        .from("prescriptions")
        .createSignedUrl(fileUrl, 3600);
      if (data?.signedUrl) {
        setSelectedPrescriptionUrl(data.signedUrl);
        setPrescriptionDialogOpen(true);
      }
    } catch (error) {
      toast({ title: "Error loading prescription", variant: "destructive" });
    }
  };

  const filteredOrders = orders?.filter((o) => {
    if (activeTab === "all") return true;
    return o.status === activeTab;
  });

  // Pagination
  const {
    paginatedData: paginatedOrders,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: filteredOrders, initialPageSize: 10 });

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // CSV export columns
  const csvColumns = [
    { key: "order_number" as const, header: "Order Number", accessor: (o: Order) => o.order_number ? `#${o.order_number}` : "N/A" },
    { key: "created_at" as const, header: "Date", accessor: (o: Order) => format(new Date(o.created_at), "yyyy-MM-dd HH:mm") },
    { key: "profiles" as const, header: "Customer", accessor: (o: Order) => o.profiles?.name || "Unknown" },
    { key: "total_amount" as const, header: "Amount", accessor: (o: Order) => `₹${o.total_amount}` },
    { key: "status" as const, header: "Status" },
    { key: "payment_status" as const, header: "Payment Status" },
    { key: "rejection_reason" as const, header: "Rejection Reason", accessor: (o: Order) => o.rejection_reason || "" },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      pending_rx: { className: "bg-yellow-100 text-yellow-800", label: "Pending Rx" },
      approved: { className: "bg-blue-100 text-blue-800", label: "Approved" },
      rejected: { className: "bg-red-100 text-red-800", label: "Rejected" },
      processing: { className: "bg-purple-100 text-purple-800", label: "Processing" },
      shipped: { className: "bg-orange-100 text-orange-800", label: "Shipped" },
      delivered: { className: "bg-green-100 text-green-800", label: "Delivered" },
    };
    const config = statusMap[status] || { className: "bg-gray-100 text-gray-800", label: status };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const statusOptions: OrderStatus[] = ["pending_rx", "approved", "rejected", "processing", "shipped", "delivered"];

  const formatOrderNumber = (orderNumber: number | null) => {
    return orderNumber ? `#${orderNumber}` : "N/A";
  };

  return (
    <AdminLayout title="Orders" description="Manage customer orders">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending_rx">Pending Rx</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <ExportCSV data={filteredOrders} filename="orders" columns={csvColumns} />
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prescription</TableHead>
                <TableHead>Update Status</TableHead>
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
              ) : paginatedOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-bold text-primary">
                      {formatOrderNumber(order.order_number)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{order.profiles?.name || "Unknown"}</TableCell>
                    <TableCell className="font-medium">
                      ₹{order.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(order.status)}
                        {order.status === "rejected" && order.rejection_reason && (
                          <p className="text-xs text-destructive truncate max-w-32" title={order.rejection_reason}>
                            {order.rejection_reason}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.prescriptions && order.prescriptions.length > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => viewPrescription(order.prescriptions![0].file_url)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View Rx
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">No Rx</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value: OrderStatus) => handleStatusChange(order, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedOrder(order);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Number</p>
                  <p className="font-mono font-bold text-primary text-lg">
                    {formatOrderNumber(selectedOrder.order_number)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.profiles?.name || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-medium">₹{selectedOrder.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Status</p>
                  <Badge variant="outline">{selectedOrder.payment_status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.created_at), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>

              {selectedOrder.status === "rejected" && selectedOrder.rejection_reason && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Rejection Reason
                  </p>
                  <p className="text-sm mt-1">{selectedOrder.rejection_reason}</p>
                </div>
              )}

              {selectedOrder.prescriptions && selectedOrder.prescriptions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Prescription</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => viewPrescription(selectedOrder.prescriptions![0].file_url)}
                  >
                    <FileText className="h-4 w-4" />
                    View Prescription
                  </Button>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Order Items</p>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.medicines?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  )) || (
                    <p className="p-3 text-muted-foreground text-sm">No items</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Prescription Dialog */}
      <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Prescription Image</DialogTitle>
          </DialogHeader>
          {selectedPrescriptionUrl && (
            <PrescriptionViewer imageUrl={selectedPrescriptionUrl} />
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Reject Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please select a reason for rejecting order {orderToReject ? formatOrderNumber(orderToReject.order_number) : ""}.
              This will be sent to the customer via email.
            </p>
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Select
                value={selectedRejectionReason}
                onValueChange={setSelectedRejectionReason}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setOrderToReject(null);
                setSelectedRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!selectedRejectionReason || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrders;
