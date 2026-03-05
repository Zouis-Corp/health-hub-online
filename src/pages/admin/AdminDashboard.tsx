import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, FileText, Pill, Users, DollarSign, Clock, Calendar, Link2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const BookingUrlCard = () => {
  const queryClient = useQueryClient();
  const { data: bookingUrl, isLoading } = useQuery({
    queryKey: ["site-settings", "booking_url"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "booking_url")
        .maybeSingle();
      if (error) throw error;
      return data?.value || "https://book.tabletkart.in";
    },
  });

  const [url, setUrl] = useState("");
  useEffect(() => {
    if (bookingUrl) setUrl(bookingUrl);
  }, [bookingUrl]);

  const updateUrl = useMutation({
    mutationFn: async (newUrl: string) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: newUrl, updated_at: new Date().toISOString() })
        .eq("key", "booking_url");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Booking URL updated");
    },
    onError: () => toast.error("Failed to update booking URL"),
  });

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Booking URL
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label className="text-sm text-muted-foreground">
          "Book Now" button redirect link
        </Label>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            <Button size="sm" onClick={() => updateUrl.mutate(url)} disabled={updateUrl.isPending || url === bookingUrl}>
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const queryClient = useQueryClient();

  const { data: clinicButtonEnabled, isLoading: clinicLoading } = useQuery({
    queryKey: ["site-settings", "clinic_button_enabled"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "clinic_button_enabled")
        .maybeSingle();
      if (error) throw error;
      return data?.value === "true";
    },
  });

  const toggleClinicButton = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value: enabled ? "true" : "false", updated_at: new Date().toISOString() })
        .eq("key", "clinic_button_enabled");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Clinic button setting updated");
    },
    onError: () => toast.error("Failed to update setting"),
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [ordersRes, prescriptionsRes, medicinesRes, usersRes] = await Promise.all([
        supabase.from("orders").select("id, status, total_amount", { count: "exact" }),
        supabase.from("prescriptions").select("id, status", { count: "exact" }),
        supabase.from("medicines").select("id", { count: "exact" }),
        supabase.from("profiles").select("id", { count: "exact" }),
      ]);

      const orders = ordersRes.data || [];
      const prescriptions = prescriptionsRes.data || [];
      const pendingRx = prescriptions.filter(p => p.status === "pending").length;
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      return {
        totalOrders: ordersRes.count || 0,
        pendingPrescriptions: pendingRx,
        totalMedicines: medicinesRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalRevenue,
      };
    },
  });

  const statCards = [
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Pending Prescriptions",
      value: stats?.pendingPrescriptions || 0,
      icon: Clock,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Medicines",
      value: stats?.totalMedicines || 0,
      icon: Pill,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <AdminLayout title="Dashboard" description="Overview of your pharmacy operations">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Clinic Booking Button
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="clinic-toggle" className="text-sm text-muted-foreground">
                Show "Book Nanmai Clinic" button on mobile
              </Label>
              {clinicLoading ? (
                <Skeleton className="h-6 w-11" />
              ) : (
                <Switch
                  id="clinic-toggle"
                  checked={clinicButtonEnabled ?? true}
                  onCheckedChange={(checked) => toggleClinicButton.mutate(checked)}
                  disabled={toggleClinicButton.isPending}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <BookingUrlCard />

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Review pending prescriptions
            </p>
            <p className="text-sm text-muted-foreground">
              • Process new orders
            </p>
            <p className="text-sm text-muted-foreground">
              • Update medicine stock
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
