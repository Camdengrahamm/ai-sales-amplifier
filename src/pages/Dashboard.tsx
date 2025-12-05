import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, MousePointerClick, DollarSign, Users, CheckCircle, Upload, FileText, Loader2, MessageSquare, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DmSession {
  id: string;
  coach_id: string;
  user_handle: string;
  question_count: number;
  created_at: string;
  last_question_at: string;
  messages: any[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalSales: 0,
    totalRevenue: 0,
    dmSessions: 0,
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [coachData, setCoachData] = useState<{
    id: string;
    plan: string;
    onboarding_complete: boolean;
    content_uploaded: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dmSessions, setDmSessions] = useState<DmSession[]>([]);

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
            id: coach.id,
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

      // Fetch sales
      let salesQuery = supabase.from("sales").select("amount");
      if (coachId) {
        salesQuery = salesQuery.eq("coach_id", coachId);
      }
      const { data: salesData } = await salesQuery;

      // Fetch DM sessions
      let sessionsQuery = supabase.from("dm_sessions").select("*").order("last_question_at", { ascending: false }).limit(10);
      if (coachId) {
        sessionsQuery = sessionsQuery.eq("coach_id", coachId);
      }
      const { data: sessionsData, count: sessionsCount } = await sessionsQuery;
      
      setDmSessions((sessionsData as DmSession[]) || []);

      const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.amount), 0) || 0;

      setStats({
        totalClicks: clicksCount || 0,
        totalSales: salesData?.length || 0,
        totalRevenue,
        dmSessions: sessionsData?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !coachData) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Use user.id for folder name to match storage RLS policy
      for (const file of Array.from(files)) {
        // Robust filename sanitization: only allow alphanumeric, dots, dashes, underscores
        const sanitizedName = file.name
          .normalize('NFD') // Normalize unicode characters
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace ALL non-safe chars with underscore
          .replace(/_+/g, '_') // Collapse multiple underscores
          .replace(/^_|_$/g, ''); // Trim leading/trailing underscores
        
        const fileName = `${user.id}/${Date.now()}-${sanitizedName}`;
        console.log("Uploading file:", fileName);
        
        const { error: uploadError } = await supabase.storage
          .from("course-files")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("course-files")
          .getPublicUrl(fileName);

        const { data: fileRecord, error: dbError } = await supabase
          .from("course_files")
          .insert({
            coach_id: coachData.id,
            filename: file.name,
            file_url: publicUrl,
            processed: false,
          })
          .select('id')
          .single();

        if (dbError) throw dbError;

        // Trigger content processing
        supabase.functions.invoke('process-content', {
          body: {
            file_id: fileRecord?.id,
            coach_id: coachData.id,
            file_url: publicUrl,
            filename: file.name,
          }
        }).catch(err => console.error("Processing error:", err));
      }

      await supabase
        .from("coaches")
        .update({ content_uploaded: true })
        .eq("id", coachData.id);

      setCoachData(prev => prev ? { ...prev, content_uploaded: true } : null);
      toast.success(`${files.length} file(s) uploaded and processing started!`);
      
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
                  <div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      multiple
                      accept=".pdf,.txt,.docx,.doc,.png,.jpg,.jpeg"
                      disabled={uploading}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
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

        {/* DM Conversations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              DM Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dmSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No conversations yet</p>
                <p className="text-sm">DM conversations will appear here once your AI starts engaging</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Handle</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Last Activity</TableHead>
                      {userRole === "admin" && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dmSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">@{session.user_handle}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{session.question_count} messages</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(session.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {session.last_question_at 
                            ? format(new Date(session.last_question_at), "MMM d, h:mm a")
                            : "-"
                          }
                        </TableCell>
                        {userRole === "admin" && (
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from("dm_sessions")
                                    .update({ question_count: 0, messages: [] })
                                    .eq("id", session.id);
                                  
                                  if (error) throw error;
                                  
                                  // Update local state
                                  setDmSessions(prev => 
                                    prev.map(s => s.id === session.id 
                                      ? { ...s, question_count: 0, messages: [] } 
                                      : s
                                    )
                                  );
                                  toast.success(`Reset message count for @${session.user_handle}`);
                                } catch (error: any) {
                                  console.error("Error resetting session:", error);
                                  toast.error("Failed to reset session");
                                }
                              }}
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Reset
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

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