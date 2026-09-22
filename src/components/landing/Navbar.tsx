import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name?: string | null; business_name?: string | null } | null>(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("full_name,business_name").eq("id", session.user.id).single();
        setProfile(data);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase.from("profiles").select("full_name,business_name").eq("id", session.user.id).single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // ignore
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.replace("/");
    }
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";
  const firstName = profile?.full_name?.split(" ")[0] || "Account";

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-card border-b border-border" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="content-container flex items-center justify-between h-16 px-6">
        <Link to="/" className="font-heading text-xl font-bold text-foreground">
          Sparkline
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm transition-colors ${
                pathname === link.to
                  ? "text-foreground font-medium border-b-2 border-foreground pb-0.5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-secondary transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center text-[11px] font-semibold text-background flex-shrink-0">
                  {initials}
                </div>
                <span className="text-sm font-medium text-foreground">{firstName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                    >
                      <button onClick={() => { setDropdownOpen(false); navigate("/dashboard"); }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-foreground hover:bg-secondary transition-colors">
                        <LayoutDashboard className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} /> Go to Dashboard
                      </button>
                      <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-destructive hover:bg-secondary transition-colors">
                        <LogOut className="w-4 h-4" strokeWidth={1.5} /> Log Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Log in
              </Link>
              <motion.div whileTap={{ scale: 0.97 }}>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center h-[44px] px-5 bg-primary text-primary-foreground text-sm font-medium rounded-[12px] transition-colors hover:opacity-90"
                >
                  Start Free Trial
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-border bg-card px-6 py-4 space-y-3"
        >
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className={`block text-sm py-2 ${pathname === link.to ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <button onClick={() => { setMobileOpen(false); navigate("/dashboard"); }} className="block text-sm py-2 text-muted-foreground">Go to Dashboard</button>
              <button onClick={handleSignOut} className="block text-sm py-2 text-destructive">Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-sm py-2 text-muted-foreground">Log in</Link>
              <Link to="/signup" className="block w-full text-center h-[44px] leading-[44px] bg-primary text-primary-foreground text-sm font-medium rounded-[12px]">
                Start Free Trial
              </Link>
            </>
          )}
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
