import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, MousePointerClick, DollarSign, Users, CheckCircle, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalSales: 0,
    totalRevenue: 0,
    dmSessions: 0,
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [coachData, setCoachData] = useState<{
    plan: string;
    onboarding_complete: boolean;
    content_uploaded: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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

      // Get coach ID and data if user is a coach
      let coachId = null;
      if (roleData?.role === "coach") {
        const { data: coach } = await supabase
          .from("coaches")
          .select("id, plan, onboarding_complete, content_uploaded")
          .eq("user_id", user.id)
          .single();
        coachId = coach?.id;
        if (coach) {
          setCoachData({
            plan: coach.plan,
            onboarding_complete: coach.onboarding_complete || false,
            content_uploaded: coach.content_uploaded || false,
          });
        }
      }

      // Fetch clicks
      let clicksQuery = supabase.from("clicks").select("*", { count: "exact", head: true });
      if (coachId) {
        clicksQuery = clicksQuery.eq("coach_id", coachId);
      }
      const { count: clicksCount } = await clicksQuery;

      // Fetch sales (without commission columns)
      let salesQuery = supabase.from("sales").select("amount");
      if (coachId) {
        salesQuery = salesQuery.eq("coach_id", coachId);
      }
      const { data: salesData } = await salesQuery;

      // Fetch DM sessions
      let sessionsQuery = supabase.from("dm_sessions").select("*", { count: "exact", head: true });
      if (coachId) {
        sessionsQuery = sessionsQuery.eq("coach_id", coachId);
      }
      const { count: sessionsCount } = await sessionsQuery;

      const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.amount), 0) || 0;

      setStats({
        totalClicks: clicksCount || 0,
        totalSales: salesData?.length || 0,
        totalRevenue,
        dmSessions: sessionsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Clicks",
      value: stats.totalClicks,
      icon: MousePointerClick,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Total Sales",
      value: stats.totalSales,
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      gradient: "from-primary to-accent",
    },
    {
      title: "DM Conversations",
      value: stats.dmSessions,
      icon: Users,
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "premium": return "default";
      case "standard": return "secondary";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-24 bg-muted rounded-t-xl" />
                <CardContent className="h-16 bg-muted/50" />
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome back{userRole === "admin" ? ", Admin" : ""}! 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              Here's your performance overview
            </p>
          </div>
          {coachData && (
            <Badge variant={getPlanBadgeVariant(coachData.plan)} className="capitalize text-sm">
              {coachData.plan} Plan
            </Badge>
          )}
        </div>

        {/* Onboarding Checklist for Coaches */}
        {userRole === "coach" && coachData && !coachData.onboarding_complete && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Get Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${coachData.content_uploaded ? 'bg-green-500' : 'bg-muted'}`}>
                    {coachData.content_uploaded ? <CheckCircle className="w-4 h-4 text-white" /> : <span className="text-xs">1</span>}
                  </div>
                  <span className={coachData.content_uploaded ? 'line-through text-muted-foreground' : ''}>
                    Upload your course content to train your AI
                  </span>
                </div>
                {!coachData.content_uploaded && (
                  <Button size="sm" onClick={() => navigate('/upload')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="stat-card hover:scale-105 cursor-pointer group"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {userRole === "admin"
                ? "Manage clients, view all sales data, and configure AI settings from the sidebar."
                : "Upload your content, create offers, and track your AI's performance."}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;