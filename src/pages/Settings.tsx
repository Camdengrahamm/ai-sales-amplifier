import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    brand_name: "",
    main_checkout_url: "",
    plan: "basic",
    system_prompt: "",
    tone: "friendly",
    response_style: "concise",
    brand_voice: "",
    escalation_email: "",
    max_questions_before_cta: "3",
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
            plan: coachData.plan || "basic",
            system_prompt: coachData.system_prompt || "",
            tone: coachData.tone || "friendly",
            response_style: coachData.response_style || "concise",
            brand_voice: coachData.brand_voice || "",
            escalation_email: coachData.escalation_email || "",
            max_questions_before_cta: coachData.max_questions_before_cta?.toString() || "3",
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
          system_prompt: profile.system_prompt || null,
          tone: profile.tone,
          response_style: profile.response_style,
          brand_voice: profile.brand_voice || null,
          escalation_email: profile.escalation_email || null,
          max_questions_before_cta: parseInt(profile.max_questions_before_cta) || 3,
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

  const isPremiumFeature = profile.plan !== "premium" && profile.plan !== "standard";
  const isBasicPlan = profile.plan === "basic";

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and AI settings
            </p>
          </div>
          {userRole === "coach" && (
            <Badge variant={profile.plan === "premium" ? "default" : profile.plan === "standard" ? "secondary" : "outline"} className="capitalize">
              {profile.plan} Plan
            </Badge>
          )}
        </div>

        {userRole === "coach" ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Your business information
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  AI Personality
                  {isBasicPlan && <Badge variant="outline" className="text-xs"><Lock className="w-3 h-3 mr-1" />Standard+</Badge>}
                </CardTitle>
                <CardDescription>
                  Customize how your AI assistant responds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select 
                    value={profile.tone} 
                    onValueChange={(value) => setProfile({ ...profile, tone: value })}
                    disabled={isBasicPlan}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="motivational">Motivational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response_style">Response Style</Label>
                  <Select 
                    value={profile.response_style} 
                    onValueChange={(value) => setProfile({ ...profile, response_style: value })}
                    disabled={isBasicPlan}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_cta">Questions Before CTA</Label>
                  <Input
                    id="max_cta"
                    type="number"
                    min="1"
                    max="10"
                    value={profile.max_questions_before_cta}
                    onChange={(e) => setProfile({ ...profile, max_questions_before_cta: e.target.value })}
                    disabled={isBasicPlan}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of questions before AI adds a call-to-action
                  </p>
                </div>

                {isBasicPlan && (
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    Upgrade to Standard or Premium to customize your AI's personality.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Advanced AI Settings
                  {isPremiumFeature && <Badge variant="outline" className="text-xs"><Lock className="w-3 h-3 mr-1" />Premium</Badge>}
                </CardTitle>
                <CardDescription>
                  Fine-tune your AI with custom prompts and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system_prompt">Custom System Prompt</Label>
                  <Textarea
                    id="system_prompt"
                    value={profile.system_prompt}
                    onChange={(e) => setProfile({ ...profile, system_prompt: e.target.value })}
                    placeholder="Add custom instructions for your AI..."
                    rows={4}
                    disabled={isPremiumFeature}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand_voice">Brand Voice Description</Label>
                  <Textarea
                    id="brand_voice"
                    value={profile.brand_voice}
                    onChange={(e) => setProfile({ ...profile, brand_voice: e.target.value })}
                    placeholder="Describe your brand's voice and personality..."
                    rows={3}
                    disabled={isPremiumFeature}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escalation_email">Escalation Email</Label>
                  <Input
                    id="escalation_email"
                    type="email"
                    value={profile.escalation_email}
                    onChange={(e) => setProfile({ ...profile, escalation_email: e.target.value })}
                    placeholder="support@yourbrand.com"
                    disabled={isPremiumFeature}
                  />
                  <p className="text-xs text-muted-foreground">
                    Email for when AI can't answer a question
                  </p>
                </div>

                {isPremiumFeature && (
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    Upgrade to Premium for custom prompts and full branding control.
                  </p>
                )}
              </CardContent>
            </Card>

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
          </>
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
                Admin accounts have full access to manage clients, view all sales data, and configure settings.
                Use the navigation menu to access admin features.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
            <CardDescription>
              Integration endpoints for ManyChat and webhooks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Label className="font-medium">AI Assistant Endpoint (ManyChat):</Label>
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