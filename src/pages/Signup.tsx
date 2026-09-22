import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    businessName: "",
    email: "",
    password: "",
  });

  const validatePassword = (pw: string) => {
    const errors: string[] = [];
    if (pw.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pw)) errors.push("One uppercase letter");
    if (!/[0-9]/.test(pw)) errors.push("One number");
    if (!/[^A-Za-z0-9]/.test(pw)) errors.push("One special character");
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const pwErrors = validatePassword(form.password);
    if (pwErrors.length > 0) {
      setPasswordErrors(pwErrors);
      toast.error("Password doesn't meet requirements.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: form.fullName.trim(),
          business_name: form.businessName.trim(),
        },
      },
    });
    setLoading(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else if (msg.includes("invalid email")) {
        toast.error("Invalid email format.");
      } else if (msg.includes("password")) {
        toast.error("Password does not meet requirements.");
      } else {
        toast.error("Unable to create account. Please try again.");
      }
    } else {
      toast.success("Check your email to confirm your account.");
      navigate("/login");
    }
  };

  return (
    <AuthLayout
      quote="Sparkline replaced 4 different tools for us. We saved 20 hours a week and grew revenue 35% in 3 months."
      author="Rachel Kim"
      role="Owner, PureSpace Cleaning"
    >
      <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
        Create your account
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Start your 14-day free trial. No credit card required.
      </p>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={handleGoogleSignup}
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
          <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
          <input
            name="fullName"
            type="text"
            value={form.fullName}
            onChange={handleChange}
            required
            maxLength={100}
            className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Business Name</label>
          <input
            name="businessName"
            type="text"
            value={form.businessName}
            onChange={handleChange}
            maxLength={100}
            className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
            placeholder="Sparkle Cleaning Co."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            maxLength={255}
            className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
            placeholder="jane@sparkle.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => { handleChange(e); setPasswordErrors(validatePassword(e.target.value)); }}
              required
              minLength={8}
              maxLength={128}
              className="w-full h-[44px] px-3.5 pr-10 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
              placeholder="Min. 8 characters"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {form.password && passwordErrors.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {passwordErrors.map((err) => (
                <li key={err} className="text-xs text-destructive">• {err}</li>
              ))}
            </ul>
          )}
        </div>
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full h-[44px] rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create your account"}
        </motion.button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-4">
        By creating an account you agree to our{" "}
        <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link> and{" "}
        <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
      </p>

      <p className="text-sm text-muted-foreground text-center mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-foreground font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Signup;
