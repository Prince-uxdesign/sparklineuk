import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AuthLayout from "@/components/auth/AuthLayout";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Detect email verification success from URL
    const hash = window.location.hash;
    if (hash.includes("type=signup") || hash.includes("type=email_confirmation") || location.search.includes("confirmed=true")) {
      setEmailVerified(true);
    }
  }, [location]);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) toast.error("Something went wrong. Please try again.");
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: unverifiedEmail });
    setResending(false);
    if (error) toast.error("Failed to resend. Please try again.");
    else toast.success("Verification email resent. Check your inbox.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    setLoading(true);
    let result: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>> | null = null;
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 12000)
      );
      result = await Promise.race([
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        timeout,
      ]);
    } catch {
      setLoading(false);
      setErrorMsg("Sign in timed out. Please check your connection and try again.");
      return;
    }
    setLoading(false);
    const { error } = result;
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials") || msg.includes("wrong password")) {
        setErrorMsg("Incorrect password. Please try again.");
      } else if (msg.includes("user not found") || msg.includes("no user")) {
        setErrorMsg("No account found with that email.");
      } else if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
        setUnverifiedEmail(email.trim());
        setErrorMsg("Please verify your email first. Check your inbox for the verification link.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } else {
      const from = (location.state as { from?: string } | null)?.from || "/dashboard";
      navigate(from, { replace: true });
    }
  };

  return (
    <AuthLayout
      quote="Our revenue doubled in 6 months. Sparkline gave us the visibility and automation we desperately needed."
      author="Marcus Thompson"
      role="Founder, BrightSide Cleaning Co."
    >
      <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
        Welcome back
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Sign in to your Sparkline account.
      </p>

      {emailVerified && (
        <div className="mb-6 p-3 rounded-xl bg-success/10 border border-success/20 text-sm text-success font-medium">
          ✓ Email verified successfully. You can now sign in.
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {errorMsg}
          {unverifiedEmail && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="block mt-2 text-sm font-medium underline hover:no-underline disabled:opacity-50"
            >
              {resending ? "Resending…" : "Resend verification email"}
            </button>
          )}
        </div>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={handleGoogleLogin}
        className="w-full h-[44px] rounded-[12px] border border-border bg-card text-foreground text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-secondary transition-colors mb-6"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </motion.button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={255}
            className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-foreground">Password</label>
            <Link to="/reset-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-[44px] px-3.5 pr-10 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full h-[44px] rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </motion.button>
      </form>

      <p className="text-sm text-muted-foreground text-center mt-6">
        Don't have an account?{" "}
        <Link to="/signup" className="text-foreground font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
