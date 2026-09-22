import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Building2, Bell, CreditCard, Check, Link as LinkIcon, Copy, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.05 },
});

const TABS = ["Business", "Notifications", "Billing", "Booking Link"] as const;
type Tab = typeof TABS[number];

const PLANS = [
  { key: "starter", label: "Starter", price: "£39/month", features: ["Up to 2 staff", "100 bookings/month", "Invoicing", "Client CRM"] },
  { key: "growth", label: "Growth", price: "£79/month", features: ["Up to 10 staff", "Unlimited bookings", "All Starter features", "Analytics"] },
  { key: "pro", label: "Pro", price: "£159/month", features: ["Unlimited staff", "All Growth features", "Priority support", "Custom branding"] },
];

const DEFAULT_PROFILE = {
  full_name: "",
  business_name: "",
  business_email: "",
  phone: "",
  address: "",
  business_type: "",
  website: "",
  business_slug: "",
  notification_new_booking: true,
  notification_invoice_paid: true,
  notification_client_added: false,
  notification_overdue_invoices: true,
  current_plan: "starter",
};

const generateSlugFromName = (name: string) =>
  name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const DashboardSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Business");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({ ...DEFAULT_PROFILE });
  const [slugInput, setSlugInput] = useState("");
  const [slugSaving, setSlugSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("full_name, business_name, business_email, phone, address, business_type, website, business_slug, current_plan, notification_new_booking, notification_invoice_paid, notification_client_added, notification_overdue_invoices")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({ ...DEFAULT_PROFILE, ...data });
          setSlugInput(data.business_slug || "");
        }
      });
  }, [user]);

  const bookingPath = `/book/${profile.business_slug || slugInput || "your-slug"}`;
  const bookingUrl = `${window.location.origin}${bookingPath}`;

  const withTimeout = (fn: () => PromiseLike<any>, ms = 10000): Promise<any> =>
    Promise.race([
      Promise.resolve().then(() => fn()),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Please try again.")), ms)
      ),
    ]);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      let slugToSet = profile.business_slug;
      if (!slugToSet) {
        const base = profile.business_name
          ? generateSlugFromName(profile.business_name)
          : generateSlugFromName(profile.full_name || user.email?.split("@")[0] || "my-business");
        slugToSet = base;
        setSlugInput(slugToSet);
      }

      const { error } = await withTimeout(() =>
        supabase.from("profiles").upsert({
          id: user.id,
          full_name: profile.full_name,
          business_name: profile.business_name,
          business_email: profile.business_email,
          phone: profile.phone,
          address: profile.address,
          business_type: profile.business_type,
          website: profile.website,
          business_slug: slugToSet,
          updated_at: new Date().toISOString(),
        })
      );
      if (error) throw error;
      setProfile((p: any) => ({ ...p, business_slug: slugToSet }));
      toast.success("Settings saved successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await withTimeout(() =>
        supabase.from("profiles").upsert({
          id: user.id,
          notification_new_booking: profile.notification_new_booking,
          notification_invoice_paid: profile.notification_invoice_paid,
          notification_client_added: profile.notification_client_added,
          notification_overdue_invoices: profile.notification_overdue_invoices,
        })
      );
      if (error) throw error;
      toast.success("Notification preferences saved.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSlug = async () => {
    if (!user || !slugInput.trim()) return;
    const clean = slugInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!clean) { toast.error("Invalid slug."); return; }
    setSlugSaving(true);
    try {
      const { data: existing } = await supabase.from("profiles").select("id").eq("business_slug", clean).neq("id", user.id).maybeSingle();
      if (existing) { toast.error("This slug is already taken. Please choose another."); return; }
      const { error } = await supabase.from("profiles").upsert({ id: user.id, business_slug: clean });
      if (error) throw error;
      setProfile((p: any) => ({ ...p, business_slug: clean }));
      setSlugInput(clean);
      toast.success("Booking link updated.");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSlugSaving(false);
    }
  };

  const handleBillingPortal = async () => {
    toast.info("Billing portal is not connected yet (Stripe required). Please contact support to manage your subscription.");
  };

  const handleUpgrade = async (planKey: string) => {
    toast.info(`Upgrades to ${planKey} are manual while Stripe is not connected. Please contact support.`);
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel your subscription? You will stay on your plan until the end of the billing period. Contact support to confirm.")) return;
    toast.info("Cancellation requested. Please contact support to complete cancellation.");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const set = (key: string, val: any) => setProfile((p: any) => ({ ...p, [key]: val }));

  return (
    <div className="p-6 lg:p-10 max-w-[760px]">
      <motion.div {...fadeUp(0)} className="mb-8">
        <h1 className="font-heading text-[28px] font-bold text-foreground">Settings</h1>
      </motion.div>

      {/* Tabs */}
      <motion.div {...fadeUp(1)} className="flex gap-1 mb-8 border-b border-border overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab === "Business" ? Building2 : tab === "Notifications" ? Bell : tab === "Billing" ? CreditCard : LinkIcon;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="w-4 h-4" strokeWidth={1.5} /> {tab}
            </button>
          );
        })}
      </motion.div>

      {activeTab === "Business" && (
        <motion.form {...fadeUp(2)} onSubmit={handleSaveBusiness} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name" value={profile.full_name || ""} onChange={(v) => set("full_name", v)} placeholder="Jane Smith" />
            <Field label="Business Name" value={profile.business_name || ""} onChange={(v) => set("business_name", v)} placeholder="Gleam Cleaning Services" />
            <Field label="Business Email" value={profile.business_email || ""} onChange={(v) => set("business_email", v)} type="email" placeholder="hello@gleam.co.uk" />
            <Field label="Phone Number" value={profile.phone || ""} onChange={(v) => set("phone", v)} placeholder="+44 7700 000000" />
            <Field label="Business Type" value={profile.business_type || ""} onChange={(v) => set("business_type", v)} placeholder="Domestic / Commercial / Both" />
            <Field label="Website URL" value={profile.website || ""} onChange={(v) => set("website", v)} type="url" placeholder="https://gleam.co.uk" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Business Address</label>
            <textarea value={profile.address || ""} onChange={(e) => set("address", e.target.value)} rows={3}
              className="w-full px-3.5 py-2.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors resize-none"
              placeholder="123 High Street, London, SW1A 1AA" />
          </div>
          <motion.button type="submit" disabled={saving} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 h-[44px] px-6 rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
          </motion.button>
        </motion.form>
      )}

      {activeTab === "Notifications" && (
        <motion.div {...fadeUp(2)} className="space-y-4">
          {[
            { key: "notification_new_booking", label: "New booking received", desc: "Get notified when a client books via your public link" },
            { key: "notification_invoice_paid", label: "Invoice paid", desc: "Get notified when a client pays an invoice" },
            { key: "notification_client_added", label: "New client added", desc: "Get notified when a new client is added to your account" },
            { key: "notification_overdue_invoices", label: "Overdue invoice reminders", desc: "Get reminded about invoices past their due date" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-5 rounded-xl border border-border bg-card">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <button
                onClick={() => set(item.key, !profile[item.key])}
                className={`relative w-11 h-6 rounded-full transition-colors ${profile[item.key] ? "bg-primary" : "bg-border"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${profile[item.key] ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
          <motion.button onClick={handleSaveNotifications} disabled={saving} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 h-[44px] px-6 rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Preferences"}
          </motion.button>
        </motion.div>
      )}

      {activeTab === "Billing" && (
        <motion.div {...fadeUp(2)} className="space-y-6">
          <div>
            <p className="text-sm font-medium text-foreground mb-4">Current Plan</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const isCurrent = (profile.current_plan || "starter") === plan.key;
                return (
                  <div key={plan.key} className={`p-5 rounded-2xl border-2 transition-colors ${isCurrent ? "border-foreground bg-card" : "border-border bg-card"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-foreground">{plan.label}</p>
                      {isCurrent && <span className="text-[10px] font-semibold px-2 py-0.5 bg-foreground text-background rounded-full">Current</span>}
                    </div>
                    <p className="font-mono text-lg font-bold text-foreground mb-3">{plan.price}</p>
                    <ul className="space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Check className="w-3 h-3 text-foreground flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    {!isCurrent && (
                      <button
                        onClick={() => handleUpgrade(plan.label)}
                        className="mt-4 w-full h-[36px] rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary transition-colors">
                        Upgrade
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-medium text-foreground mb-1">Manage Subscription</p>
            <p className="text-xs text-muted-foreground mb-1">Stripe billing is not connected yet — subscription changes are handled via support.</p>
            <p className="text-xs text-muted-foreground mb-4">Update payment method, download invoices, or cancel.</p>
            <button
              onClick={handleBillingPortal}
              className="h-[40px] px-5 rounded-[12px] border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Open Billing Portal
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-medium text-foreground mb-3">Billing History</p>
            <p className="text-sm text-muted-foreground">No billing history yet. You are currently on a free trial.</p>
          </div>

          <div className="pt-4 border-t border-border">
            <button onClick={handleCancel} className="text-sm text-destructive hover:underline">Cancel subscription</button>
          </div>
        </motion.div>
      )}

      {activeTab === "Booking Link" && (
        <motion.div {...fadeUp(2)} className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-foreground mb-1">Your personalised booking page</h2>
            <p className="text-sm text-muted-foreground">Share this link with clients so they can book your services online, 24/7.</p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Your Booking Link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-[44px] px-3.5 rounded-[12px] border border-border bg-background text-sm text-foreground font-mono flex items-center truncate">
                  {bookingUrl}
                </div>
                <button onClick={handleCopy}
                  className="flex-shrink-0 h-[44px] px-4 rounded-[12px] border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-2">
                  {copied ? <CheckCheck className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Customise Your Slug</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center h-[44px] rounded-[12px] border border-border bg-card overflow-hidden">
                  <span className="px-3 text-xs text-muted-foreground bg-secondary h-full flex items-center border-r border-border whitespace-nowrap">/book/</span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    className="flex-1 h-full px-3 text-sm text-foreground bg-transparent focus:outline-none"
                    placeholder="your-business-name"
                  />
                </div>
                <button onClick={handleUpdateSlug} disabled={slugSaving}
                  className="flex-shrink-0 h-[44px] px-4 rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {slugSaving ? "Saving…" : "Update"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Only lowercase letters, numbers and hyphens allowed.</p>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Preview</p>
            <p className="text-sm text-muted-foreground mb-3">What your clients will see when they visit your booking link:</p>
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-[40px] px-4 rounded-[12px] border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              <LinkIcon className="w-4 h-4" /> Open booking page
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors"
      placeholder={placeholder} />
  </div>
);

export default DashboardSettings;
