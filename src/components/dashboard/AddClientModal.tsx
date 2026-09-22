import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const AddClientModal = ({ open, onClose, onAdded }: AddClientModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", address: "", service_preferences: "", notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Client name is required."); return; }
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("clients").insert({
        user_id: user.id,
        name: form.name.trim().slice(0, 100),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        service_preferences: form.service_preferences.trim() || null,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
      toast.success("Client added successfully!");
      setForm({ name: "", email: "", phone: "", address: "", service_preferences: "", notes: "" });
      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-card rounded-2xl border border-border w-full max-w-[520px] max-h-[90vh] overflow-y-auto pointer-events-auto shadow-xl"
            >
              <div className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-xl font-bold text-foreground">Add Client</h2>
                  <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field label="Full Name *" name="name" value={form.name} onChange={handleChange} placeholder="Jane Smith" required maxLength={100} />
                  <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="client@email.com" maxLength={254} />
                  <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+44 7700 000000" maxLength={20} />
                  <Field label="Full Address (with Postcode)" name="address" value={form.address} onChange={handleChange} placeholder="12 High Street, London, SW1A 1AA" maxLength={300} />
                  <Field label="Service Preferences" name="service_preferences" value={form.service_preferences} onChange={handleChange} placeholder="e.g. Deep Clean, eco-friendly products" maxLength={300} />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
                    <textarea
                      name="notes" value={form.notes} onChange={handleChange} rows={3} maxLength={2000}
                      className="w-full px-3.5 py-2.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors resize-none"
                      placeholder="Any notes about this client…"
                    />
                  </div>
                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                    className="w-full h-[44px] rounded-[12px] bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                    {loading ? "Adding…" : "Add Client"}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

const Field = ({ label, name, value, onChange, placeholder, type = "text", required = false, maxLength }: {
  label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; type?: string; required?: boolean; maxLength?: number;
}) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
    <input
      name={name} type={type} value={value} onChange={onChange}
      required={required} maxLength={maxLength}
      className="w-full h-[44px] px-3.5 rounded-[12px] border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-colors"
      placeholder={placeholder}
    />
  </div>
);

export default AddClientModal;
