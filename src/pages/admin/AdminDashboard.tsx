import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, FileText, Pill, Users, DollarSign, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Recent orders and prescription updates will appear here.
            </p>
          </CardContent>
        </Card>

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
