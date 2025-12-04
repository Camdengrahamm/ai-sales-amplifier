import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Coach {
  id: string;
  name: string;
  email: string;
  brand_name: string | null;
  plan: string;
  onboarding_complete: boolean;
  content_uploaded: boolean;
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
    plan: "basic",
  });

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from("coaches")
        .select("id, name, email, brand_name, plan, onboarding_complete, content_uploaded, created_at")
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
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-coach`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({
            name: newCoach.name,
            email: newCoach.email,
            password: newCoach.password,
            brand_name: newCoach.brand_name,
            plan: newCoach.plan,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create coach");
      }

      toast.success("Client created successfully!");
      setNewCoach({
        name: "",
        email: "",
        password: "",
        brand_name: "",
        plan: "basic",
      });
      fetchCoaches();
    } catch (error: any) {
      console.error("Error creating coach:", error);
      toast.error(error.message || "Failed to create client");
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "premium": return "default";
      case "standard": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-muted-foreground mt-1">
              Manage client accounts and monitor their status
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Client</DialogTitle>
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
                    placeholder="client@example.com"
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
                    placeholder="Business Name"
                    value={newCoach.brand_name}
                    onChange={(e) => setNewCoach({ ...newCoach, brand_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coach-plan">Plan</Label>
                  <Select 
                    value={newCoach.plan} 
                    onValueChange={(value) => setNewCoach({ ...newCoach, plan: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateCoach} className="w-full">
                  Create Client
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading clients...</p>
              </div>
            ) : coaches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No clients yet. Add your first client to get started!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Content</TableHead>
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
                      <TableCell>
                        <Badge variant={getPlanBadgeVariant(coach.plan)} className="capitalize">
                          {coach.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {coach.content_uploaded ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
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