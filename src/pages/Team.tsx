import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Mail, UserPlus, X, Shield, Briefcase, User as UserIcon, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const, delay: i * 0.05 },
});

const roleLabels: Record<string, { label: string; icon: any; desc: string }> = {
  admin: { label: "Admin", icon: Shield, desc: "Full access to all features" },
  manager: { label: "Manager", icon: Briefcase, desc: "All except billing" },
  staff: { label: "Staff", icon: UserIcon, desc: "Jobs and schedule only" },
};

const roleStyles: Record<string, string> = {
  admin: "bg-accent/10 text-accent",
  manager: "bg-warning/10 text-warning",
  staff: "bg-secondary text-muted-foreground",
};

const statusStyles: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  invited: "bg-warning/10 text-warning",
  active: "bg-success/10 text-success",
  inactive: "bg-secondary text-muted-foreground",
};

const Team = () => {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "staff" });
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    if (!user) return;
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 5000);
    const { data } = await supabase.from("team_members").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setMembers(data);
    setLoading(false);
    clearTimeout(timeout);
  };

  useEffect(() => { if (user) fetchMembers(); }, [user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteForm.email.trim()) { toast.error("Email is required."); return; }
    setInviting(true);
    try {
      const { error } = await supabase.from("team_members").insert({
        user_id: user.id,
        email: inviteForm.email.trim().toLowerCase(),
        full_name: inviteForm.full_name.trim() || null,
        role: inviteForm.role,
        status: "invited",
      });
      if (error) throw error;

      // Send invitation emails (non-blocking) — pass JWT so the edge function can verify the caller
      supabase.auth.getSession().then(({ data }) => {
        const token = data.session?.access_token;
        supabase.functions.invoke("send-team-invitation", {
          body: {
            invited_email: inviteForm.email.trim().toLowerCase(),
            invited_name: inviteForm.full_name.trim() || inviteForm.email.split("@")[0],
            role: inviteForm.role,
            business_name: profile?.business_name || "Sparkline Business",
            owner_name: profile?.full_name || "The team",
            owner_email: user.email,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }).catch(console.error);
      });

      toast.success(`Invitation sent to ${inviteForm.email}`);
      setInviteForm({ email: "", full_name: "", role: "staff" });
      setModalOpen(false);
      fetchMembers();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
      toast.success("Member removed.");
      fetchMembers();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="p-6 lg:p-10">
      <motion.div {...fadeUp(0)} className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-[28px] font-bold text-foreground">Team</h1>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 h-[44px] px-5 bg-primary text-primary-foreground text-sm font-medium rounded-[12px] hover:opacity-90 transition-opacity">
          <UserPlus className="w-4 h-4" /> Invite Member
        </motion.button>
      </motion.div>

      <motion.div {...fadeUp(1)} className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-14 text-center">
            <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm font-medium text-foreground mb-1">No team members yet.</p>
            <p className="text-xs text-muted-foreground mb-4">Invite your first team member to get started.</p>
            <button onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-[36px] px-4 bg-primary text-primary-foreground text-xs font-medium rounded-[10px] hover:opacity-90 transition-opacity">
              <UserPlus className="w-3.5 h-3.5" /> Invite Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3.5 hidden md:table-cell">Date Added</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const Role = roleLabels[m.role];
                  return (
                    <tr key={m.id} className="border-b border-border last:border-0 h-14 hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground flex-shrink-0">
                            {(m.full_name || m.email)[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground">{m.full_name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />{m.email}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md capitalize ${roleStyles[m.role]}`}>
                          {Role?.label || m.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md capitalize ${statusStyles[m.status] || "bg-secondary text-muted-foreground"}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{formatDate(m.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Role descriptions */}
      <motion.div {...fadeUp(2)} className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(roleLabels).map(([key, { label, icon: Icon, desc }]) => (
          <div key={key} className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">{label}</p>
            </div>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Invite Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground" onClick={() => setModalOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-card rounded-2xl border border-border w-full max-w-[440px] pointer-events-auto shadow-xl"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-heading text-xl font-bold text-foreground">Invite Team Member</h2>
                    <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                  <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Email Address *</label>
                      <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                        required className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors"
                        placeholder="teammate@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                      <input type="text" value={inviteForm.full_name} onChange={(e) => setInviteForm((f) => ({ ...f, full_name: e.target.value }))}
                        className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors"
                        placeholder="Jane Smith" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                      <select value={inviteForm.role} onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                        className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 transition-colors">
                        <option value="admin">Admin — Full access</option>
                        <option value="manager">Manager — No billing</option>
                        <option value="staff">Staff — Jobs & schedule only</option>
                      </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setModalOpen(false)}
                        className="flex-1 h-[44px] rounded-[12px] border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                        Cancel
                      </button>
                      <motion.button type="submit" disabled={inviting} whileTap={{ scale: 0.97 }}
                        className="flex-1 h-[44px] rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                        {inviting ? "Sending…" : "Send Invitation"}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Team;
