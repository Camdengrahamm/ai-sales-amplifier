import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Offer {
  id: string;
  name: string;
  base_price: number;
  commission_rate: number;
  tracking_slug: string;
  target_url: string;
  is_active: boolean;
}

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [newOffer, setNewOffer] = useState({
    name: "",
    base_price: "",
    commission_rate: "",
    tracking_slug: "",
    target_url: "",
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get coach ID
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (coach) {
        setCoachId(coach.id);

        const { data, error } = await supabase
          .from("offers")
          .select("*")
          .eq("coach_id", coach.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOffers(data || []);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async () => {
    if (!coachId || !newOffer.name || !newOffer.base_price || !newOffer.tracking_slug || !newOffer.target_url) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase
        .from("offers")
        .insert({
          coach_id: coachId,
          name: newOffer.name,
          base_price: parseFloat(newOffer.base_price),
          commission_rate: newOffer.commission_rate ? parseFloat(newOffer.commission_rate) : null,
          tracking_slug: newOffer.tracking_slug,
          target_url: newOffer.target_url,
          is_active: true,
        });

      if (error) throw error;

      toast.success("Offer created successfully!");
      setNewOffer({
        name: "",
        base_price: "",
        commission_rate: "",
        tracking_slug: "",
        target_url: "",
      });
      fetchOffers();
    } catch (error: any) {
      console.error("Error creating offer:", error);
      toast.error(error.message || "Failed to create offer");
    }
  };

  const copyTrackingLink = (slug: string) => {
    const link = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Tracking link copied!");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Offers</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your program offers with tracking links
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Offer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Offer Name *</Label>
                  <Input
                    id="name"
                    placeholder="Ultimate Coaching Program"
                    value={newOffer.name}
                    onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Base Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="997"
                    value={newOffer.base_price}
                    onChange={(e) => setNewOffer({ ...newOffer, base_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission Rate (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    placeholder="10"
                    value={newOffer.commission_rate}
                    onChange={(e) => setNewOffer({ ...newOffer, commission_rate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Tracking Slug * (unique identifier)</Label>
                  <Input
                    id="slug"
                    placeholder="ultimate-program"
                    value={newOffer.tracking_slug}
                    onChange={(e) => setNewOffer({ ...newOffer, tracking_slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Target URL * (checkout page)</Label>
                  <Input
                    id="target"
                    placeholder="https://checkout.example.com/program"
                    value={newOffer.target_url}
                    onChange={(e) => setNewOffer({ ...newOffer, target_url: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateOffer} className="w-full">
                  Create Offer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="animate-pulse h-40" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No offers yet. Create your first offer to get started!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{offer.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${offer.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {offer.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold">${offer.base_price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Commission:</span>
                    <span className="font-semibold">{offer.commission_rate}%</span>
                  </div>
                  <div className="pt-3 border-t space-y-2">
                    <Label className="text-xs">Tracking Link:</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 justify-start text-xs truncate"
                        onClick={() => copyTrackingLink(offer.tracking_slug)}
                      >
                        <Copy className="w-3 h-3 mr-2" />
                        /track/{offer.tracking_slug}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(offer.target_url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Offers;
