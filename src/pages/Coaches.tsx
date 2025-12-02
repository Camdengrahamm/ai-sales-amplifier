import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Coach {
  id: string;
  name: string;
  email: string;
  brand_name: string | null;
  default_commission_rate: number;
  created_at: string;
}

const Coaches = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCoach, setNewCoach] = useState({
    name: "",
    email: "",
    password: "",
    brand_name: "",
    commission_rate: "10",
  });

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from("coaches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoaches(data || []);
    } catch (error) {
      console.error("Error fetching coaches:", error);
      toast.error("Failed to load coaches");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoach = async () => {
    if (!newCoach.name || !newCoach.email || !newCoach.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newCoach.email,
        password: newCoach.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Create coach profile
      const { error: coachError } = await supabase
        .from("coaches")
        .insert({
          user_id: authData.user.id,
          name: newCoach.name,
          email: newCoach.email,
          brand_name: newCoach.brand_name || null,
          default_commission_rate: parseFloat(newCoach.commission_rate),
        });

      if (coachError) throw coachError;

      // Assign coach role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "coach",
        });

      if (roleError) throw roleError;

      toast.success("Coach created successfully!");
      setNewCoach({
        name: "",
        email: "",
        password: "",
        brand_name: "",
        commission_rate: "10",
      });
      fetchCoaches();
    } catch (error: any) {
      console.error("Error creating coach:", error);
      toast.error(error.message || "Failed to create coach");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Coaches</h1>
            <p className="text-muted-foreground mt-1">
              Manage coach accounts and monitor their performance
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Coach
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Coach</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coach-name">Name *</Label>
                  <Input
                    id="coach-name"
                    placeholder="John Doe"
                    value={newCoach.name}
                    onChange={(e) => setNewCoach({ ...newCoach, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coach-email">Email *</Label>
                  <Input
                    id="coach-email"
                    type="email"
                    placeholder="coach@example.com"
                    value={newCoach.email}
                    onChange={(e) => setNewCoach({ ...newCoach, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coach-password">Password *</Label>
                  <Input
                    id="coach-password"
                    type="password"
                    placeholder="••••••••"
                    value={newCoach.password}
                    onChange={(e) => setNewCoach({ ...newCoach, password: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coach-brand">Brand Name</Label>
                  <Input
                    id="coach-brand"
                    placeholder="Coaching Brand"
                    value={newCoach.brand_name}
                    onChange={(e) => setNewCoach({ ...newCoach, brand_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coach-commission">Default Commission Rate (%)</Label>
                  <Input
                    id="coach-commission"
                    type="number"
                    placeholder="10"
                    value={newCoach.commission_rate}
                    onChange={(e) => setNewCoach({ ...newCoach, commission_rate: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateCoach} className="w-full">
                  Create Coach
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Coaches</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading coaches...</p>
              </div>
            ) : coaches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No coaches yet. Create your first coach to get started!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coaches.map((coach) => (
                    <TableRow key={coach.id}>
                      <TableCell className="font-medium">{coach.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {coach.email}
                        </div>
                      </TableCell>
                      <TableCell>{coach.brand_name || "-"}</TableCell>
                      <TableCell>{coach.default_commission_rate}%</TableCell>
                      <TableCell>
                        {format(new Date(coach.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Coaches;
