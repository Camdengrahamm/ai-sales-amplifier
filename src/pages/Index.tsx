import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Brain, 
  Target,
  CheckCircle,
  XCircle,
  ArrowRight,
  Star,
  Users,
  DollarSign,
  Sparkles,
  Bot,
  Shield,
  BarChart3,
  Loader2
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [navigate]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    {
      icon: Brain,
      title: "Learns Your Voice",
      description: "Upload your content once. AgentX learns your unique style, tone, and expertise to respond exactly like you would."
    },
    {
      icon: MessageSquare,
      title: "Full Conversations",
      description: "Not just canned replies. AgentX handles complex, multi-turn conversations that feel genuinely human."
    },
    {
      icon: Target,
      title: "Smart Selling",
      description: "Intelligently qualifies leads and naturally introduces your offers at the perfect moment—never pushy."
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Never miss a hot lead again. AgentX responds instantly, any time of day or night."
    },
    {
      icon: BarChart3,
      title: "Full Analytics",
      description: "Track every conversation, click, and conversion. Know exactly what's working."
    },
    {
      icon: Shield,
      title: "Your Data, Protected",
      description: "Enterprise-grade security. Your content and customer data never leaves our secure servers."
    }
  ];

  const competitorComparison = [
    { feature: "Learns your actual content & voice", agentx: true, competitors: false },
    { feature: "Handles complex multi-turn conversations", agentx: true, competitors: false },
    { feature: "Intelligent lead qualification", agentx: true, competitors: false },
    { feature: "Natural CTA integration", agentx: true, competitors: false },
    { feature: "Works beyond 3-4 step workflows", agentx: true, competitors: false },
    { feature: "Custom AI personality per client", agentx: true, competitors: false },
    { feature: "Click & conversion tracking", agentx: true, competitors: true },
    { feature: "Basic auto-replies", agentx: true, competitors: true },
  ];

  const testimonials = [
    {
      name: "Sarah K.",
      role: "Fitness Coach",
      content: "AgentX closed $12K in sales last month while I was sleeping. It actually sounds like me!",
      avatar: "SK"
    },
    {
      name: "Marcus T.",
      role: "Business Coach", 
      content: "I was skeptical, but the AI handles objections better than my old sales team.",
      avatar: "MT"
    },
    {
      name: "Jessica L.",
      role: "Course Creator",
      content: "Finally, automation that doesn't feel like automation. My audience loves the fast responses.",
      avatar: "JL"
    }
  ];

  const niches = [
    "Fitness Coaches", "Business Coaches", "Course Creators", "Consultants",
    "Real Estate", "Beauty & Aesthetics", "Agencies", "High-Ticket Sellers"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold">AgentX</span>
              <span className="text-xs text-muted-foreground block -mt-1">by Curatix AI</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#comparison" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Why AgentX</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <Link to="/auth">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <Badge variant="secondary" className="px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered DM Sales Automation
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Turn Your DMs Into a
              <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                24/7 Sales Machine
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              AgentX learns your voice, handles complex conversations, and converts followers into customers—while you focus on what matters.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#comparison">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full sm:w-auto">
                  See How We Compare
                </Button>
              </a>
            </div>

            {/* Social Proof Bar */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-12 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-semibold">500+ Creators</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="font-semibold">1M+ DMs Handled</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="font-semibold">$2M+ Revenue Generated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            You're Leaving Money on the Table
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Every unanswered DM is a lost sale. Every slow response is a customer going to your competitor. 
            You can't be online 24/7—but your AI can.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-destructive mb-2">67%</div>
                <p className="text-sm text-muted-foreground">of DMs go unanswered within 24 hours</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-destructive mb-2">$1,200</div>
                <p className="text-sm text-muted-foreground">average revenue lost per week from slow responses</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="pt-6 text-center">
                <div className="text-4xl font-bold text-destructive mb-2">5 min</div>
                <p className="text-sm text-muted-foreground">is all it takes for a lead to go cold</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to Scale
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AgentX isn't just another chatbot. It's your AI sales rep that actually understands your business.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">The Difference</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              AgentX vs The Competition
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Other tools give you rigid workflows. AgentX gives you an intelligent AI that actually thinks.
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Feature</th>
                    <th className="p-4 text-center">
                      <div className="flex flex-col items-center">
                        <XCircle className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-sm text-muted-foreground">The Competitors</span>
                      </div>
                    </th>
                    <th className="p-4 text-center bg-primary/5">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-1">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold">AgentX</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {competitorComparison.map((row, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="p-4 text-sm">{row.feature}</td>
                      <td className="p-4 text-center">
                        {row.competitors ? (
                          <CheckCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive/60 mx-auto" />
                        )}
                      </td>
                      <td className="p-4 text-center bg-primary/5">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">
              <strong>The competitors</strong> trap you in 3-4 step decision trees. <strong>AgentX</strong> has real conversations.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Live in 15 Minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              No complex setup. No coding required. Just results.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Upload Content", desc: "Add your courses, scripts, or FAQs" },
              { step: "2", title: "AI Learns", desc: "AgentX studies your voice & style" },
              { step: "3", title: "Connect", desc: "Link your Instagram via ManyChat" },
              { step: "4", title: "Profit", desc: "Watch sales come in 24/7" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Loved by Creators
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-background">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Niches */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perfect For
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            If you sell through DMs, AgentX can automate it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {niches.map((niche, index) => (
              <Badge key={index} variant="secondary" className="text-sm py-2 px-4">
                {niche}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              One-time setup + monthly retainer. No hidden fees. No commissions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative">
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <p className="text-muted-foreground mb-6">Perfect for getting started</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$297</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {["AI trained on your content", "Unlimited DM responses", "Basic analytics", "Email support"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="relative border-primary shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Most Popular</Badge>
              </div>
              <CardContent className="pt-8 pb-8">
                <h3 className="text-2xl font-bold mb-2">Growth</h3>
                <p className="text-muted-foreground mb-6">For serious creators</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$497</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {["Everything in Starter", "Custom AI personality", "Advanced analytics", "Priority support", "Custom brand voice", "Dedicated success manager"].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className="block">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            + $875 one-time setup fee for AI training & onboarding
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border-primary/20">
            <CardContent className="py-16 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to Stop Leaving Money in Your DMs?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join 500+ creators who've automated their DM sales with AgentX. 
                Your competition is already using AI—don't get left behind.
              </p>
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold">AgentX</span>
                <span className="text-xs text-muted-foreground ml-1">by Curatix AI</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Curatix AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;