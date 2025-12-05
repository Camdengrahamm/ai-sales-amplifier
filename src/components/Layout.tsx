import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Package,
  Upload,
  DollarSign,
  Settings,
  LogOut,
  Zap,
  Users,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";

interface LayoutProps {
  children: ReactNode;
}

const AppSidebar = ({ userRole, onSignOut }: { userRole: string | null; onSignOut: () => void }) => {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const isAdmin = userRole === "admin";
  
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Coaches", href: "/coaches", icon: Users, show: isAdmin },
    { name: "Contacts", href: "/contacts", icon: Users, show: true },
    { name: "Conversations", href: "/conversations", icon: MessageSquare, show: true },
    { name: "Offers", href: "/offers", icon: Package, show: true },
    { name: "Upload Content", href: "/upload", icon: Upload, show: !isAdmin },
    { name: "Sales", href: "/sales", icon: DollarSign, show: true },
    { name: "Settings", href: "/settings", icon: Settings, show: true },
  ].filter((item) => item.show);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-sidebar-foreground truncate">AI DM Sales</h1>
                <p className="text-xs text-sidebar-foreground/60">
                  {isAdmin ? "Admin Panel" : "Coach Dashboard"}
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.href}
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <Icon className="w-5 h-5" />
                        {!collapsed && <span>{item.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user role
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        navigate("/auth");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setUserRole(data?.role || null);
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Zap className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole={userRole} onSignOut={handleSignOut} />
        
        <div className="flex-1 flex flex-col">
          {/* Header with trigger */}
          <header className="h-14 border-b bg-background flex items-center px-4 sticky top-0 z-10">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex-1" />
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
