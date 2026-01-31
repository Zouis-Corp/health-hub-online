import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Loader2, FileText, XCircle, Printer, Tag, Calendar, Filter, CheckSquare, Square, X } from "lucide-react";
import PrescriptionViewer from "@/components/admin/PrescriptionViewer";
import ExportCSV from "@/components/admin/ExportCSV";
import Pagination from "@/components/admin/Pagination";
import usePagination from "@/hooks/usePagination";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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
  delivery_fee: number | null;
  discount_amount: number | null;
  payment_status: string;
  rejection_reason: string | null;
  created_at: string;
  profiles?: { name: string | null; phone: string | null } | null;
  addresses?: {
    name: string;
    phone: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    pincode: string;
  } | null;
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

  // Bulk selection state
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Date filter state
  const [filterType, setFilterType] = useState<"none" | "single" | "range">("none");
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*, order_items(id, quantity, price, medicines(name)), prescriptions(id, file_url, status), addresses(name, phone, address_line_1, address_line_2, city, state, pincode)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(ordersData.map(o => o.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, phone")
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

  // Filter orders by tab and date
  const filteredOrders = orders?.filter((o) => {
    // Tab filter
    if (activeTab !== "all" && o.status !== activeTab) return false;
    
    // Date filter
    if (filterType === "single" && singleDate) {
      const orderDate = startOfDay(new Date(o.created_at));
      const filterDate = startOfDay(singleDate);
      if (orderDate.getTime() !== filterDate.getTime()) return false;
    }
    
    if (filterType === "range" && dateFrom && dateTo) {
      const orderDate = new Date(o.created_at);
      if (!isWithinInterval(orderDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) })) return false;
    }
    
    return true;
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
  }, [activeTab, filterType, singleDate, dateFrom, dateTo]);

  // Bulk selection handlers
  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === paginatedOrders?.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(paginatedOrders?.map(o => o.id) || []));
    }
  };

  const clearSelection = () => {
    setSelectedOrders(new Set());
  };

  const clearFilters = () => {
    setFilterType("none");
    setSingleDate(undefined);
    setDateFrom(undefined);
    setDateTo(undefined);
    setShowFilterPopover(false);
  };

  // Print functions
  const formatOrderNumber = (orderNumber: number | null) => {
    return orderNumber ? `#${orderNumber}` : "N/A";
  };

  const generateDeliveryLabel = (order: Order) => {
    const address = order.addresses;
    return `
      <div style="page-break-after: always; padding: 20px; border: 2px solid #000; margin: 10px; font-family: Arial, sans-serif;">
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px;">
          <h1 style="margin: 0; font-size: 24px;">
            <span style="color: #7C3AED;">tablet</span><span style="color: #22C55E;">kart</span>.in
          </h1>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">DELIVERY LABEL</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <p style="margin: 0; font-size: 14px; color: #666;">Order Number</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${formatOrderNumber(order.order_number)}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 14px; color: #666;">Date</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">${format(new Date(order.created_at), "MMM d, yyyy")}</p>
          </div>
        </div>
        
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase;">SHIP TO:</p>
          ${address ? `
            <p style="margin: 0; font-size: 18px; font-weight: bold;">${address.name}</p>
            <p style="margin: 5px 0; font-size: 14px;">${address.address_line_1}</p>
            ${address.address_line_2 ? `<p style="margin: 5px 0; font-size: 14px;">${address.address_line_2}</p>` : ''}
            <p style="margin: 5px 0; font-size: 14px;"><strong>${address.city}, ${address.state} - ${address.pincode}</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>📞 ${address.phone}</strong></p>
          ` : '<p style="color: #999;">No address available</p>'}
        </div>
        
        <div style="border-top: 2px dashed #000; padding-top: 15px;">
          <p style="margin: 0; font-size: 12px; color: #666;">Items: ${order.order_items?.length || 0} | Amount: ₹${order.total_amount.toLocaleString()}</p>
          <p style="margin: 5px 0 0 0; font-size: 11px; color: #999;">Handle with care • Keep away from heat</p>
        </div>
      </div>
    `;
  };

  const generateInvoice = (order: Order) => {
    const orderItems = order.order_items || [];
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = order.delivery_fee || 0;
    const discount = order.discount_amount || 0;
    const address = order.addresses;

    return `
      <div style="page-break-after: always; padding: 20px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7C3AED; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <h1 style="margin: 0; font-size: 28px;">
              <span style="color: #7C3AED;">tablet</span><span style="color: #22C55E;">kart</span>.in
            </h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Your Trusted Online Pharmacy</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; color: #7C3AED; font-size: 24px;">INVOICE</h2>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Order ${formatOrderNumber(order.order_number)}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
          <div>
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase;">Bill To:</p>
            ${address ? `
              <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">${address.name}</p>
              <p style="margin: 3px 0; font-size: 13px;">${address.address_line_1}</p>
              ${address.address_line_2 ? `<p style="margin: 3px 0; font-size: 13px;">${address.address_line_2}</p>` : ''}
              <p style="margin: 3px 0; font-size: 13px;">${address.city}, ${address.state} - ${address.pincode}</p>
              <p style="margin: 3px 0; font-size: 13px;">Phone: ${address.phone}</p>
            ` : '<p style="color: #999; font-size: 13px;">No address available</p>'}
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; color: #666;">Invoice Date</p>
            <p style="margin: 3px 0 0 0; font-size: 14px; font-weight: bold;">${format(new Date(order.created_at), "MMM d, yyyy")}</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Payment Status</p>
            <p style="margin: 3px 0 0 0; font-size: 14px; font-weight: bold; color: ${order.payment_status === 'paid' ? '#22C55E' : '#f59e0b'}; text-transform: uppercase;">${order.payment_status}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #7C3AED; color: white;">
              <th style="padding: 12px; text-align: left; font-size: 13px;">#</th>
              <th style="padding: 12px; text-align: left; font-size: 13px;">Item</th>
              <th style="padding: 12px; text-align: center; font-size: 13px;">Qty</th>
              <th style="padding: 12px; text-align: right; font-size: 13px;">Price</th>
              <th style="padding: 12px; text-align: right; font-size: 13px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems.map((item, index) => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px; font-size: 13px;">${index + 1}</td>
                <td style="padding: 12px; font-size: 13px;">${item.medicines?.name || 'Medicine'}</td>
                <td style="padding: 12px; text-align: center; font-size: 13px;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; font-size: 13px;">₹${item.price.toLocaleString()}</td>
                <td style="padding: 12px; text-align: right; font-size: 13px; font-weight: bold;">₹${(item.price * item.quantity).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 250px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px;">
              <span>Subtotal:</span>
              <span>₹${subtotal.toLocaleString()}</span>
            </div>
            ${deliveryFee > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px;">
                <span>Delivery Fee:</span>
                <span>₹${deliveryFee.toLocaleString()}</span>
              </div>
            ` : `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #22C55E;">
                <span>Delivery:</span>
                <span>FREE</span>
              </div>
            `}
            ${discount > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #22C55E;">
                <span>Discount:</span>
                <span>-₹${discount.toLocaleString()}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 12px 0; font-size: 16px; font-weight: bold; border-top: 2px solid #7C3AED; margin-top: 8px;">
              <span>Total:</span>
              <span style="color: #7C3AED;">₹${order.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px dashed #ccc; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">Thank you for shopping with TabletKart!</p>
          <p style="margin: 5px 0;">For support: +91 98948 18002 | www.tabletkart.in</p>
        </div>
      </div>
    `;
  };

  const printSingleInvoice = (order: Order) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${formatOrderNumber(order.order_number)}</title>
        <style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>
      </head>
      <body style="margin: 0; padding: 0;">
        ${generateInvoice(order)}
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  const printSingleLabel = (order: Order) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Delivery Label - ${formatOrderNumber(order.order_number)}</title>
        <style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>
      </head>
      <body style="margin: 0; padding: 0;">
        ${generateDeliveryLabel(order)}
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=500,height=400');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  const printBulkLabelAndInvoice = () => {
    if (selectedOrders.size === 0) {
      toast({ title: "No orders selected", variant: "destructive" });
      return;
    }

    // Get selected orders in order_number sequence
    const ordersToprint = (filteredOrders || [])
      .filter(o => selectedOrders.has(o.id))
      .sort((a, b) => (a.order_number || 0) - (b.order_number || 0));

    // Generate combined content: Label + Invoice for each order
    let combinedContent = '';
    ordersToprint.forEach(order => {
      combinedContent += generateDeliveryLabel(order);
      combinedContent += generateInvoice(order);
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bulk Print - Labels & Invoices</title>
        <style>
          @media print { 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
            .page-break { page-break-after: always; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0;">
        ${combinedContent}
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  const printBulkInvoices = () => {
    if (selectedOrders.size === 0) {
      toast({ title: "No orders selected", variant: "destructive" });
      return;
    }

    const ordersToprint = (filteredOrders || [])
      .filter(o => selectedOrders.has(o.id))
      .sort((a, b) => (a.order_number || 0) - (b.order_number || 0));

    let combinedContent = ordersToprint.map(order => generateInvoice(order)).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bulk Invoices</title>
        <style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>
      </head>
      <body style="margin: 0; padding: 0;">${combinedContent}</body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  const printBulkLabels = () => {
    if (selectedOrders.size === 0) {
      toast({ title: "No orders selected", variant: "destructive" });
      return;
    }

    const ordersToprint = (filteredOrders || [])
      .filter(o => selectedOrders.has(o.id))
      .sort((a, b) => (a.order_number || 0) - (b.order_number || 0));

    let combinedContent = ordersToprint.map(order => generateDeliveryLabel(order)).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bulk Delivery Labels</title>
        <style>@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>
      </head>
      <body style="margin: 0; padding: 0;">${combinedContent}</body>
      </html>
    `;
    const printWindow = window.open('', '_blank', 'width=500,height=400');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

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

  return (
    <AdminLayout title="Orders" description="Manage customer orders">
      {/* Filters and Actions Bar */}
      <div className="space-y-4 mb-6">
        {/* Top row: Tabs and Export */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
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
          <div className="flex gap-2">
            <ExportCSV data={filteredOrders} filename="orders" columns={csvColumns} />
          </div>
        </div>

        {/* Second row: Date filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Date Filter
                {filterType !== "none" && <Badge variant="secondary" className="ml-1">{filterType === "single" ? format(singleDate!, "MMM d") : `${format(dateFrom!, "MMM d")} - ${format(dateTo!, "MMM d")}`}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={filterType === "single" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("single")}
                  >
                    Single Date
                  </Button>
                  <Button
                    variant={filterType === "range" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("range")}
                  >
                    Date Range
                  </Button>
                </div>
                
                {filterType === "single" && (
                  <CalendarComponent
                    mode="single"
                    selected={singleDate}
                    onSelect={setSingleDate}
                    initialFocus
                  />
                )}
                
                {filterType === "range" && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">From</Label>
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">To</Label>
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                      />
                    </div>
                  </div>
                )}
                
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                  Clear Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {filterType !== "none" && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Bulk Selection Actions */}
        {selectedOrders.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <Badge variant="secondary" className="gap-1">
              <CheckSquare className="h-3 w-3" />
              {selectedOrders.size} selected
            </Badge>
            <div className="flex gap-2 ml-auto flex-wrap">
              <Button size="sm" variant="outline" onClick={printBulkLabels} className="gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Print Labels
              </Button>
              <Button size="sm" variant="outline" onClick={printBulkInvoices} className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Print Invoices
              </Button>
              <Button size="sm" onClick={printBulkLabelAndInvoice} className="gap-1.5">
                <Printer className="h-3.5 w-3.5" />
                Print Both
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={paginatedOrders?.length > 0 && selectedOrders.size === paginatedOrders?.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
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
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders?.map((order) => (
                  <TableRow key={order.id} className={selectedOrders.has(order.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.has(order.id)}
                        onCheckedChange={() => toggleSelectOrder(order.id)}
                      />
                    </TableCell>
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
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedOrder(order);
                            setViewDialogOpen(true);
                          }}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => printSingleLabel(order)}
                          title="Print Label"
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => printSingleInvoice(order)}
                          title="Print Invoice"
                        >
                          <FileText className="h-4 w-4" />
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

              {selectedOrder.addresses && (
                <div>
                  <p className="text-sm font-medium mb-2">Delivery Address</p>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p className="font-medium">{selectedOrder.addresses.name}</p>
                    <p>{selectedOrder.addresses.address_line_1}</p>
                    {selectedOrder.addresses.address_line_2 && <p>{selectedOrder.addresses.address_line_2}</p>}
                    <p>{selectedOrder.addresses.city}, {selectedOrder.addresses.state} - {selectedOrder.addresses.pincode}</p>
                    <p className="mt-1">Phone: {selectedOrder.addresses.phone}</p>
                  </div>
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

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => printSingleLabel(selectedOrder)}
                >
                  <Tag className="h-4 w-4" />
                  Print Label
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => printSingleInvoice(selectedOrder)}
                >
                  <FileText className="h-4 w-4" />
                  Print Invoice
                </Button>
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