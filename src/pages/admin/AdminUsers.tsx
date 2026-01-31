import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Loader2, Shield, ShieldOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import ExportCSV from "@/components/admin/ExportCSV";
import Pagination from "@/components/admin/Pagination";
import usePagination from "@/hooks/usePagination";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type AppRole = "admin" | "pharmacist" | "user";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  is_blocked: boolean;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: AppRole;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const { data: userOrders } = useQuery({
    queryKey: ["admin-user-orders", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total_amount, created_at")
        .eq("user_id", selectedUser.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUser,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);
      // Then insert new role
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast({ title: "User role updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating role", description: error.message, variant: "destructive" });
    },
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: isBlocked })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast({ title: "User status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating user", description: error.message, variant: "destructive" });
    },
  });

  const getUserRole = (userId: string): AppRole => {
    const roleEntry = userRoles?.find((r) => r.user_id === userId);
    return roleEntry?.role || "user";
  };

  const getRoleBadge = (role: AppRole) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case "pharmacist":
        return <Badge className="bg-blue-100 text-blue-800">Pharmacist</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  // Pagination
  const {
    paginatedData: paginatedProfiles,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    setCurrentPage,
    setPageSize,
  } = usePagination({ data: profiles, initialPageSize: 10 });

  // CSV export columns
  const csvColumns = [
    { key: "name" as const, header: "Name", accessor: (p: Profile) => p.name || "Unnamed" },
    { key: "email" as const, header: "Email", accessor: (p: Profile) => p.email || "" },
    { key: "phone" as const, header: "Phone", accessor: (p: Profile) => p.phone || "" },
    { key: "role" as const, header: "Role", accessor: (p: Profile) => getUserRole(p.id) },
    { key: "is_blocked" as const, header: "Status", accessor: (p: Profile) => p.is_blocked ? "Blocked" : "Active" },
    { key: "created_at" as const, header: "Joined", accessor: (p: Profile) => format(new Date(p.created_at), "yyyy-MM-dd") },
  ];

  return (
    <AdminLayout title="Users" description="Manage user accounts and roles">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p className="text-muted-foreground">
          {profiles?.length || 0} users total
        </p>
        <ExportCSV data={profiles} filename="users" columns={csvColumns} />
      </div>

      <Card className="shadow-card">
        {/* Desktop Table View */}
        <CardContent className="p-0 overflow-x-auto hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profilesLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedProfiles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProfiles?.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name || "Unnamed"}</TableCell>
                    <TableCell className="text-muted-foreground">{profile.email || "-"}</TableCell>
                    <TableCell>{profile.phone || "-"}</TableCell>
                    <TableCell>
                      <Select
                        value={getUserRole(profile.id)}
                        onValueChange={(value: AppRole) => 
                          updateRoleMutation.mutate({ userId: profile.id, role: value })
                        }
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="pharmacist">Pharmacist</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {profile.is_blocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(profile.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(profile);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={profile.is_blocked ? "text-green-600" : "text-destructive"}
                          onClick={() => toggleBlockMutation.mutate({ 
                            userId: profile.id, 
                            isBlocked: !profile.is_blocked 
                          })}
                        >
                          {profile.is_blocked ? (
                            <Shield className="h-4 w-4" />
                          ) : (
                            <ShieldOff className="h-4 w-4" />
                          )}
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
          {profilesLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : paginatedProfiles?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            paginatedProfiles?.map((profile) => (
              <div key={profile.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{profile.name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.email || "No email"}</p>
                    {profile.phone && <p className="text-xs text-muted-foreground">{profile.phone}</p>}
                  </div>
                  {profile.is_blocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {getRoleBadge(getUserRole(profile.id))}
                  <span className="text-xs text-muted-foreground">
                    Joined {format(new Date(profile.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Change Role</Label>
                  <Select
                    value={getUserRole(profile.id)}
                    onValueChange={(value: AppRole) => 
                      updateRoleMutation.mutate({ userId: profile.id, role: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      setSelectedUser(profile);
                      setViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`gap-1.5 ${profile.is_blocked ? "text-green-600 border-green-300" : "text-destructive border-destructive/50"}`}
                    onClick={() => toggleBlockMutation.mutate({ 
                      userId: profile.id, 
                      isBlocked: !profile.is_blocked 
                    })}
                  >
                    {profile.is_blocked ? (
                      <>
                        <Shield className="h-3.5 w-3.5" />
                        Unblock
                      </>
                    ) : (
                      <>
                        <ShieldOff className="h-3.5 w-3.5" />
                        Block
                      </>
                    )}
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

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedUser.name || "Unnamed"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  {getRoleBadge(getUserRole(selectedUser.id))}
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedUser.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {selectedUser.is_blocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Joined</p>
                  <p className="font-medium">
                    {format(new Date(selectedUser.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Recent Orders</p>
                <div className="border rounded-lg divide-y">
                  {userOrders?.length === 0 ? (
                    <p className="p-3 text-muted-foreground text-sm">No orders yet</p>
                  ) : (
                    userOrders?.map((order) => (
                      <div key={order.id} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{order.total_amount}</p>
                          <Badge variant="outline" className="text-xs">{order.status}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
