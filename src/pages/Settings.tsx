import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    brand_name: "",
    main_checkout_url: "",
    default_commission_rate: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      setUserRole(roleData?.role || null);

      if (roleData?.role === "coach") {
        // Get coach profile
        const { data: coachData } = await supabase
          .from("coaches")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (coachData) {
          setProfile({
            name: coachData.name || "",
            email: coachData.email || "",
            brand_name: coachData.brand_name || "",
            main_checkout_url: coachData.main_checkout_url || "",
            default_commission_rate: coachData.default_commission_rate?.toString() || "10",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSave = async () => {
    if (userRole !== "coach") {
      toast.error("Only coaches can update their profile");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("coaches")
        .update({
          name: profile.name,
          email: profile.email,
          brand_name: profile.brand_name,
          main_checkout_url: profile.main_checkout_url,
          default_commission_rate: parseFloat(profile.default_commission_rate),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {userRole === "coach" ? (
          <Card>
            <CardHeader>
              <CardTitle>Coach Profile</CardTitle>
              <CardDescription>
                Update your coaching business information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="coach@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand Name</Label>
                <Input
                  id="brand"
                  value={profile.brand_name}
                  onChange={(e) => setProfile({ ...profile, brand_name: e.target.value })}
                  placeholder="Your Coaching Brand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkout">Main Checkout URL</Label>
                <Input
                  id="checkout"
                  value={profile.main_checkout_url}
                  onChange={(e) => setProfile({ ...profile, main_checkout_url: e.target.value })}
                  placeholder="https://checkout.example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission">Default Commission Rate (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  value={profile.default_commission_rate}
                  onChange={(e) => setProfile({ ...profile, default_commission_rate: e.target.value })}
                  placeholder="10"
                />
              </div>

              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Admin Account</CardTitle>
              <CardDescription>
                You're logged in as an administrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Admin accounts have full access to manage coaches, view all sales data, and process payouts.
                Use the navigation menu to access admin features.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>
              Integration endpoints for HighLevel and webhooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Label className="font-medium">AI Assistant Endpoint (HighLevel):</Label>
              <code className="block mt-1 p-2 bg-muted rounded text-xs break-all">
                {import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant
              </code>
            </div>
            <div>
              <Label className="font-medium">Sales Webhook (Stripe/Kajabi/Thrivecart):</Label>
              <code className="block mt-1 p-2 bg-muted rounded text-xs break-all">
                {import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-webhook
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;
