import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, MousePointerClick, DollarSign } from "lucide-react";
import Layout from "@/components/Layout";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalCommission: 0,
  });
  const [userRole, setUserRole] = useState<string | null>(null);
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

      // Get coach ID if user is a coach
      let coachId = null;
      if (roleData?.role === "coach") {
        const { data: coachData } = await supabase
          .from("coaches")
          .select("id")
          .eq("user_id", user.id)
          .single();
        coachId = coachData?.id;
      }

      // Fetch clicks
      let clicksQuery = supabase.from("clicks").select("*", { count: "exact", head: true });
      if (coachId) {
        clicksQuery = clicksQuery.eq("coach_id", coachId);
      }
      const { count: clicksCount } = await clicksQuery;

      // Fetch sales
      let salesQuery = supabase.from("sales").select("amount, commission_due");
      if (coachId) {
        salesQuery = salesQuery.eq("coach_id", coachId);
      }
      const { data: salesData } = await salesQuery;

      const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.amount), 0) || 0;
      const totalCommission = salesData?.reduce((sum, sale) => sum + Number(sale.commission_due), 0) || 0;

      setStats({
        totalClicks: clicksCount || 0,
        totalSales: salesData?.length || 0,
        totalRevenue,
        totalCommission,
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
      title: "Commission Earned",
      value: `$${stats.totalCommission.toFixed(2)}`,
      icon: DollarSign,
      gradient: "from-purple-500 to-pink-500",
    },
  ];

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
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {userRole === "admin" ? "Admin" : "Coach"}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's your performance overview
          </p>
        </div>

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
                ? "Manage coaches, view all sales data, and process payouts from the sidebar."
                : "Create offers, upload your course content, and track your sales performance."}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
