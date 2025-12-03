import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Menu,
  X,
  Sparkles,
  MessageCircle,
  Target,
  Link2,
  ArrowRight,
  Check,
  Zap,
  Brain,
  Bot,
  Calendar,
  Dumbbell,
  Briefcase,
  GraduationCap,
  Palette,
  Shirt,
  Users,
  Home,
  UserCheck,
  Building2,
  DollarSign,
  Youtube,
  Music,
  XCircle,
  CheckCircle,
  Play,
} from "lucide-react";

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container-tight">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">DM Autopilot</span>
              <span className="text-xs text-muted-foreground font-medium">by Curatix AI</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("results")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Results
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </button>
              <Button className="btn-gradient rounded-full px-6 py-2 text-sm">
                Get a Free Strategy Call
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border">
            <div className="container-tight py-4 flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("results")}
                className="text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Results
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                FAQ
              </button>
              <Button className="btn-gradient rounded-full w-full mt-2">
                Get a Free Strategy Call
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Copy */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                  Turn Your DMs Into a{" "}
                  <span className="text-gradient">24/7 Sales Engine</span> — Powered by Agentic AI
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Your AI learns your content, speaks in your voice, answers every question, and books more sales — without rigid workflows or message trees.
                </p>
              </div>

              <ul className="space-y-4">
                {[
                  "Learns your tone & content automatically",
                  "Handles inbound DMs end-to-end",
                  "Books sales calls or closes low-ticket offers",
                  "Not limited to 3–4 reply options",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="btn-gradient rounded-full px-8 py-6 text-base font-semibold">
                  Activate My DM Autopilot
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-8 py-6 text-base font-semibold border-2 hover:bg-muted"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Watch a Demo
                </Button>
              </div>
            </div>

            {/* Right - Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full scale-110" />
                
                {/* Phone frame */}
                <div className="relative bg-secondary rounded-[3rem] p-3 shadow-2xl animate-float">
                  <div className="bg-background rounded-[2.5rem] overflow-hidden w-[280px] md:w-[320px]">
                    {/* Phone notch */}
                    <div className="h-8 bg-background flex items-center justify-center">
                      <div className="w-24 h-5 bg-secondary rounded-full" />
                    </div>
                    
                    {/* Chat interface */}
                    <div className="p-4 space-y-4 h-[480px] md:h-[540px] overflow-hidden">
                      {/* Chat header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-border">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                          <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">DM Autopilot</p>
                          <p className="text-xs text-muted-foreground">Online • Instant replies</p>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="space-y-3">
                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%] text-sm">
                            Hey! I saw your post about mindset. How does your program work?
                          </div>
                        </div>
                        
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2 max-w-[85%] text-sm">
                            Great question! 🙌 The program is a 12-week transformation that covers mindset shifts, daily habits, and accountability coaching. We start with your goals and build from there.
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%] text-sm">
                            That sounds perfect. What's the price?
                          </div>
                        </div>

                        <div className="flex justify-start">
                          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2 max-w-[85%] text-sm">
                            I'd love to chat about pricing on a quick call so I can learn more about your situation. Want me to send you my calendar? 📅
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Mini-Section */}
      <section className="py-8 border-y border-border/50 bg-muted/30">
        <div className="container-tight">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Trusted by creators across multiple niches
          </p>
        </div>
      </section>

      {/* USP Section */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Not Just Automations.{" "}
              <span className="text-gradient">Actual Agentic Intelligence.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Brain,
                title: "Learns From Your Content",
                description: "Captures your tone, hooks, frameworks. Updates automatically as you post.",
              },
              {
                icon: MessageCircle,
                title: "Understands Full Conversations",
                description: "Not limited to If/Then workflows. Handles complex questions naturally.",
              },
              {
                icon: Target,
                title: "Sells Like a Real Human",
                description: "Qualifies leads, gives value, pushes toward your offer logically, not aggressively.",
              },
              {
                icon: Link2,
                title: "Integrates With Your Links",
                description: "Calendars, lead pages, checkout links. Pushes the right CTA based on context.",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="card-premium group hover:scale-[1.02] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{card.title}</h3>
                <p className="text-muted-foreground">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section-padding bg-muted/30">
        <div className="container-tight">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to automate your DM sales
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Connect Your IG + Upload Content",
                description: "Captions, posts, offers, scripts, PDFs, etc.",
                icon: Link2,
              },
              {
                step: "02",
                title: "AI Clones Your Voice & Style",
                description: "Tone modeling + RAG for accurate responses",
                icon: Brain,
              },
              {
                step: "03",
                title: "AI Handles Every DM",
                description: "Inbound questions, clarifications, objections",
                icon: Bot,
              },
              {
                step: "04",
                title: "You Get More Sales",
                description: "More bookings, sales & high-intent leads",
                icon: Zap,
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="card-premium text-center h-full">
                  <div className="text-5xl font-bold text-gradient mb-6">{item.step}</div>
                  <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-6">
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-border">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-12">
            ✨ Your AI continuously improves as you publish new content.
          </p>
        </div>
      </section>

      {/* Niches Section */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Built for Creators —{" "}
              <span className="text-gradient">Effective Across Niches</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Dumbbell, label: "Fitness & Health" },
              { icon: Briefcase, label: "Business Coaches" },
              { icon: GraduationCap, label: "Course Creators" },
              { icon: Palette, label: "Beauty & Aesthetics" },
              { icon: Shirt, label: "Fashion / Lifestyle" },
              { icon: Users, label: "Influencers" },
              { icon: Home, label: "Real Estate" },
              { icon: UserCheck, label: "Consultants" },
              { icon: Building2, label: "Agencies" },
              { icon: DollarSign, label: "High-Ticket DM Sellers" },
              { icon: Youtube, label: "YouTubers / TikTokers" },
              { icon: Music, label: "Musicians / Artists" },
            ].map((niche, i) => (
              <div
                key={i}
                className="card-premium flex flex-col items-center justify-center text-center py-6 hover:scale-[1.02] transition-all"
              >
                <niche.icon className="w-8 h-8 text-primary mb-3" />
                <span className="text-sm font-medium">{niche.label}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-lg font-medium text-muted-foreground mt-12">
            If you sell through DMs, we can automate it.
          </p>
        </div>
      </section>

      {/* Results Section */}
      <section id="results" className="section-padding bg-muted/30">
        <div className="container-tight">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              See the <span className="text-gradient">Difference</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Before */}
            <div className="card-premium border-destructive/20 bg-destructive/5">
              <div className="flex items-center gap-3 mb-6">
                <XCircle className="w-8 h-8 text-destructive" />
                <h3 className="text-xl font-bold">Before DM Autopilot</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Missed DMs pile up",
                  "Slow reply times",
                  "Leads go cold",
                  "Burnout from same questions",
                  "Inconsistent bookings",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="card-premium border-primary/20 bg-primary/5 glow-primary">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-8 h-8 text-primary" />
                <h3 className="text-xl font-bold">After DM Autopilot</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Every DM answered instantly",
                  "Higher conversions",
                  "More calls booked",
                  "AI handles FAQs & objections",
                  "Focus on content, not admin",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section-padding">
        <div className="container-tight">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter */}
            <div className="card-premium">
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$297</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "AI DM responder",
                  "Learns your tone",
                  "Handles all inbound DMs",
                  "Books calls or pushes checkout links",
                  "Monthly optimization",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full rounded-full py-6 text-base font-semibold">
                Get Started
              </Button>
            </div>

            {/* Growth */}
            <div className="card-premium border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-primary text-white text-xs font-semibold px-4 py-1 rounded-bl-xl">
                POPULAR
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">Growth</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$497</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8">
                {[
                  "Everything in Starter",
                  "Weekly optimization",
                  "Content ingestion syncing",
                  "Custom scripting",
                  "Priority support",
                  "Better conversion tuning",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="btn-gradient w-full rounded-full py-6 text-base font-semibold">
                Get Started
              </Button>
            </div>
          </div>

          <div className="text-center mt-12 p-6 bg-muted rounded-2xl max-w-2xl mx-auto">
            <p className="text-lg font-semibold mb-2">One-Time Setup Fee: $875</p>
            <p className="text-sm text-muted-foreground">
              Includes full setup, AI training, workflow creation, and Instagram connection.
            </p>
          </div>

          <div className="text-center mt-8">
            <Button className="btn-gradient rounded-full px-10 py-6 text-lg font-semibold">
              Start With a Free Strategy Call
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section-padding bg-muted/30">
        <div className="container-tight max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                q: "How does the AI learn my voice?",
                a: "We analyze your existing content — captions, posts, scripts, PDFs, and even voice notes. The AI uses RAG (Retrieval-Augmented Generation) to capture your unique tone, phrases, and communication style.",
              },
              {
                q: "Can it answer any question?",
                a: "Yes! Unlike rigid automation tools with limited reply options, our agentic AI understands context and can handle any question naturally. If it encounters something truly unique, it can gracefully defer to you.",
              },
              {
                q: "What platforms does it work with?",
                a: "Currently, we support Instagram DMs with full automation. We're expanding to other platforms based on demand.",
              },
              {
                q: "What if my niche is unique?",
                a: "Our AI is trained on YOUR content specifically. Whether you're in fitness, coaching, art, or any other niche, the AI adapts to your specific terminology and audience.",
              },
              {
                q: "Does this violate Instagram rules?",
                a: "No. We work within Instagram's guidelines using approved API integrations. Your account stays safe while we handle the conversations.",
              },
              {
                q: "How fast can I go live?",
                a: "Most creators are live within 3-5 business days after the setup call. We handle all the technical work — you just provide your content.",
              },
              {
                q: "What if I don't have a course?",
                a: "DM Autopilot works for any offer — coaching calls, consulting, services, digital products, or even just building relationships. If you want more conversations or bookings, we can help.",
              },
              {
                q: "Can the AI really increase sales?",
                a: "Absolutely. By responding instantly 24/7, qualifying leads automatically, and consistently pushing toward your offer, most creators see significant improvements in bookings and conversions.",
              },
            ].map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="card-premium border px-6"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="section-padding bg-gradient-primary relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="container-tight relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Turn Your DMs Into a Sales Machine?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Let your content drive conversations — and let AI convert them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-primary hover:bg-white/90 rounded-full px-10 py-6 text-lg font-semibold shadow-xl">
              Book My Free Strategy Call
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 rounded-full px-10 py-6 text-lg font-semibold"
            >
              <Play className="mr-2 w-5 h-5" />
              Watch How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container-tight">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">DM Autopilot</span>
              <span className="text-xs text-muted-foreground font-medium">by Curatix AI</span>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => scrollToSection("pricing")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </button>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </a>
            </div>

            <p className="text-sm text-muted-foreground">
              © 2025 Curatix AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;