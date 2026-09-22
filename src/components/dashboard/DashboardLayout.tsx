import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Users,
  UserCog,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Copy,
  CheckCheck,
  Link as LinkIcon,
  Wand2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const { profile, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const firstName = displayName.split(" ")[0];
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const slug = profile?.business_slug || (profile?.business_name
    ? profile.business_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    : "your-slug");
  const bookingUrl = `www.sparkline.co.uk/book/${slug}`;

  // Fetch pending bookings count for badge + keep in sync via realtime
  useEffect(() => {
    if (!user) return;
    const fetchPending = async () => {
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");
      if (count !== null) setPendingBookingsCount(count);
    };
    fetchPending();

    const channel = supabase
      .channel("sidebar-pending-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` },
        () => { fetchPending(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${bookingUrl}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, badge: 0 },
    { title: "Bookings", url: "/dashboard/bookings", icon: CalendarCheck, badge: pendingBookingsCount },
    { title: "Schedule", url: "/dashboard/schedule", icon: CalendarDays, badge: 0 },
    { title: "Clients", url: "/dashboard/clients", icon: Users, badge: 0 },
    { title: "Team", url: "/dashboard/team", icon: UserCog, badge: 0 },
    { title: "Invoices", url: "/dashboard/invoices", icon: FileText, badge: 0 },
    { title: "AI Quote", url: "/dashboard/ai-quote", icon: Wand2, badge: 0 },
    { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, badge: 0 },
    { title: "Settings", url: "/dashboard/settings", icon: Settings, badge: 0 },
  ];

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <p className="font-heading text-base font-bold text-foreground">Sparkline</p>
        {profile?.business_name && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {profile.business_name}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.url === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.url);
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/dashboard"}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              onClick={onNavigate}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.5} />
              <span className="flex-1">{item.title}</span>
              {item.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
                }`}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Booking Link */}
      <div className="px-3 py-3 border-t border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Your Booking Link</p>
        <div className="flex items-center gap-1.5 px-2 mb-1">
          <p className="text-[11px] text-muted-foreground truncate flex-1 font-mono">{bookingUrl}</p>
          <button
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy booking link"}
            className="flex-shrink-0 p-1.5 rounded-md hover:bg-secondary transition-colors"
          >
            {copied
              ? <CheckCheck className="w-3.5 h-3.5 text-success" />
              : <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            }
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground px-2 mb-1">Share this link with your clients</p>
        <button
          onClick={() => { navigate("/dashboard/settings"); onNavigate?.(); }}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-primary hover:underline"
        >
          <LinkIcon className="w-3 h-3" /> Edit link
        </button>
      </div>

      {/* User */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => { navigate("/dashboard/settings"); onNavigate?.(); }}
          className="flex items-center gap-3 px-3 mb-3 w-full rounded-lg hover:bg-secondary transition-colors py-2 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">Account Settings</p>
          </div>
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[240px] flex-shrink-0 border-r border-border bg-card h-screen sticky top-0">
        <div className="w-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Header + Overlay */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center px-4">
        <button onClick={() => setMobileOpen(true)} className="p-1.5">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <p className="font-heading text-base font-bold text-foreground ml-3">Sparkline</p>
        {pendingBookingsCount > 0 && (
          <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
            {pendingBookingsCount}
          </span>
        )}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-50 bg-foreground/20"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-card border-r border-border"
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setMobileOpen(false)} className="p-1">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
