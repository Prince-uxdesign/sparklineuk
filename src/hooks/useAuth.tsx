import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: {
    full_name: string | null;
    business_name: string | null;
    business_slug: string | null;
    business_email: string | null;
    phone: string | null;
    address: string | null;
    location: string | null;
    website: string | null;
    business_type: string | null;
    avatar_url: string | null;
    current_plan: string;
    notification_new_booking: boolean;
    notification_invoice_paid: boolean;
    notification_client_added: boolean;
    notification_overdue_invoices: boolean;
  } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const fetchProfileWithTimeout = async (userId: string, ms = 5000) => {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
  const query = supabase
    .from("profiles")
    .select("full_name, business_name, business_slug, business_email, phone, address, location, website, business_type, avatar_url, current_plan, notification_new_booking, notification_invoice_paid, notification_client_added, notification_overdue_invoices")
    .eq("id", userId)
    .maybeSingle()
    .then(({ data }) => data);
  return Promise.race([query, timeout]);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const initialised = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    // getSession first, then listen for changes
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const data = await fetchProfileWithTimeout(session.user.id);
        setProfile(data as AuthContextType["profile"]);
      }
      setLoading(false);
      initialised.current = true;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const data = await fetchProfileWithTimeout(session.user.id);
          setProfile(data as AuthContextType["profile"]);
        } else {
          setProfile(null);
        }
        // Only set loading false after initial session check is done
        if (initialised.current) {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
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

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
