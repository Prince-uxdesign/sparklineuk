import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Home, Building2, Truck, HardHat, Check,
  ChevronLeft, ChevronRight, Clock, DollarSign, CircleCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

/* ── Services ── */
const SERVICES = [
  { id: "regular", name: "Regular Clean", icon: Sparkles, duration: "2–3 hrs", price: 120 },
  { id: "deep", name: "Deep Clean", icon: Home, duration: "4–5 hrs", price: 250 },
  { id: "move", name: "Move-In / Move-Out", icon: Truck, duration: "5–6 hrs", price: 350 },
  { id: "office", name: "Office Clean", icon: Building2, duration: "3–4 hrs", price: 300 },
  { id: "construction", name: "Post-Construction", icon: HardHat, duration: "6–8 hrs", price: 500 },
];

const TIME_SLOTS = ["8:00 AM", "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"];
const STEP_LABELS = ["Service", "Date & Time", "Details", "Confirm"];

/* ── Animations ── */
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const PublicBooking = () => {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<{ id: string; business_name: string | null } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Step 1
  const [selectedService, setSelectedService] = useState<string | null>(null);
  // Step 2
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  // Step 3
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (!slug) { setLoadingBusiness(false); return; }
    const fetchBusiness = async () => {
      try {
        const { data, error } = await supabase
          .from("public_business_profiles")
          .select("id, business_name")
          .eq("business_slug", slug)
          .maybeSingle();

        if (error) {
          console.error("Error fetching business:", error);
          setNotFound(true);
        } else if (data) {
          setBusiness(data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoadingBusiness(false);
      }
    };
    fetchBusiness();
  }, [slug]);

  const service = useMemo(() => SERVICES.find((s) => s.id === selectedService), [selectedService]);

  const canProceed = [
    !!selectedService,
    !!selectedDate && !!selectedTime,
    firstName.trim() && lastName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    true,
  ];

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, 3)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const handleConfirmBooking = async () => {
    if (!business || !service || !selectedDate || !selectedTime || !slug) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setBookingError("Please enter a valid email address.");
      return;
    }
    setIsBooking(true);
    setBookingError(null);

    // Build YYYY-MM-DD from local date parts (avoid toISOString timezone shift)
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
    if (dateStr < todayStr) {
      setBookingError("Please choose a date in the future.");
      setIsBooking(false);
      return;
    }

    // Convert time to 24h for DB
    const [timePart, ampm] = selectedTime.split(" ");
    const [h, m] = timePart.split(":").map(Number);
    const hour24 = ampm === "PM" && h !== 12 ? h + 12 : ampm === "AM" && h === 12 ? 0 : h;
    const time24 = `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;

    try {
      // Step 1: Create booking via secure edge function (service_role, validated + rate-limited)
      // This allows us to DROP the open anon INSERT policy on bookings.
      const { data: createData, error: createError } = await supabase.functions.invoke("create-public-booking", {
        body: {
          business_slug: slug,
          service: service.name,
          scheduled_date: dateStr,
          scheduled_time: time24,
          duration_minutes: 120,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          notes: instructions.trim() || null,
          amount: service.price,
        },
      });

      if (createError) {
        console.error("Booking create error:", createError);
        throw new Error(createError.message);
      }

      const bookingId = (createData as { booking_id?: string } | null)?.booking_id;

      // Step 2: Fire confirmation emails (non-blocking — booking already saved)
      try {
        await supabase.functions.invoke("send-booking-confirmation", {
          body: {
            business_id: business.id,
            business_name: business.business_name,
            client_name: `${firstName.trim()} ${lastName.trim()}`,
            client_email: email.trim(),
            client_phone: phone.trim(),
            service: service.name,
            scheduled_date: dateStr,
            scheduled_time: selectedTime,
            address: address.trim(),
            notes: instructions.trim(),
            booking_id: bookingId,
          },
        });
      } catch (emailError) {
        // Email failure is non-blocking — booking is already saved
        console.error("Email send error (non-blocking):", emailError);
      }

      // Step 3: Show success
      setBookingSuccess(true);
    } catch (error) {
      console.error("Booking failed:", error);
      setBookingError("Something went wrong. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  /* ── Not Found ── */
  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#F5F5F4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <span style={{ fontSize: 24 }}>🔍</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0A0A0A", marginBottom: 8 }}>This booking page doesn't exist.</h1>
          <p style={{ fontSize: 14, color: "#737373" }}>If you're trying to book a service, please check the link you were given.</p>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (loadingBusiness) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 20, height: 20, border: "2px solid #E5E5E5", borderTopColor: "#0A0A0A", borderRadius: "50%" }} className="animate-spin" />
      </div>
    );
  }

  /* ── Success State ── */
  if (bookingSuccess) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: "center", maxWidth: 480 }}
        >
          <CircleCheck
            style={{ width: 64, height: 64, color: "#16A34A", margin: "0 auto 24px" }}
            strokeWidth={1.5}
          />
          <h2 style={{ fontSize: 28, fontWeight: 700, color: "#0A0A0A", marginBottom: 12 }}>You're booked in.</h2>
          <p style={{ fontSize: 15, color: "#737373", lineHeight: 1.6 }}>
            We've sent a confirmation to <strong>{email}</strong>.{" "}
            {business?.business_name || "The business"} will be in touch to confirm your appointment.
          </p>
        </motion.div>
        <p style={{ position: "fixed", bottom: 16, right: 20, fontSize: 11, color: "#C4C4C4" }}>
          Powered by Sparkline
        </p>
      </div>
    );
  }

  /* ── Main Booking Page ── */
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FAFAF9", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px" }}>

      {/* Business name */}
      <h1 style={{ textAlign: "center", fontSize: 20, fontWeight: 600, marginBottom: 32, color: "#0A0A0A", width: "100%", maxWidth: 600 }}>
        {business?.business_name || "Book a Service"}
      </h1>

      {/* Step progress */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 40, width: "100%", maxWidth: 600 }}>
        {STEP_LABELS.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 12, fontWeight: 500, transition: "all 0.2s",
                  backgroundColor: i <= step ? "#0A0A0A" : "transparent",
                  color: i <= step ? "#FFFFFF" : "#A3A3A3",
                  border: i <= step ? "none" : "2px solid #E5E5E5",
                }}
              >
                {i < step ? <Check size={14} strokeWidth={2.5} /> : i + 1}
              </div>
              <span style={{ fontSize: 10, color: "#A3A3A3", display: "none" }} className="sm:block">{label}</span>
            </div>
            {i < 3 && (
              <div style={{ width: 40, height: 1, backgroundColor: i < step ? "#0A0A0A" : "#E5E5E5", marginBottom: 6 }} />
            )}
          </div>
        ))}
      </div>

      {/* Content card */}
      <div style={{ width: "100%", maxWidth: 600, backgroundColor: "#FFFFFF", borderRadius: 16, border: "1px solid #E5E5E5", padding: "clamp(20px, 5vw, 40px)", margin: "0 auto" }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* ── Step 0: Service ── */}
            {step === 0 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0A0A0A", marginBottom: 6 }}>Select a Service</h2>
                <p style={{ fontSize: 14, color: "#737373", marginBottom: 28 }}>Choose the cleaning service that fits your needs.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                  {SERVICES.map((s) => {
                    const Icon = s.icon;
                    const isSelected = selectedService === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedService(s.id)}
                        style={{
                          position: "relative", textAlign: "left", padding: 20, borderRadius: 16,
                          border: isSelected ? "2px solid #0A0A0A" : "2px solid #E5E5E5",
                          backgroundColor: "#FFFFFF", cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {isSelected && (
                          <div style={{ position: "absolute", top: 12, right: 12, width: 22, height: 22, borderRadius: "50%", backgroundColor: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check size={12} color="#FFFFFF" strokeWidth={2.5} />
                          </div>
                        )}
                        <Icon style={{ width: 18, height: 18, color: "#0A0A0A", marginBottom: 10, strokeWidth: 1.5 }} />
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A", marginBottom: 4 }}>{s.name}</p>
                        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#737373" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{s.duration}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><DollarSign size={11} />From £{s.price}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 1: Date & Time ── */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0A0A0A", marginBottom: 6 }}>Pick a Date & Time</h2>
                <p style={{ fontSize: 14, color: "#737373", marginBottom: 28 }}>Select your preferred appointment slot.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                  <div style={{ borderRadius: 16, border: "1px solid #E5E5E5", padding: 4, alignSelf: "flex-start" }}>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="pointer-events-auto"
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A", marginBottom: 12 }}>Available Times</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {TIME_SLOTS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          style={{
                            padding: "10px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500,
                            border: selectedTime === t ? "none" : "1px solid #E5E5E5",
                            backgroundColor: selectedTime === t ? "#0A0A0A" : "#FFFFFF",
                            color: selectedTime === t ? "#FFFFFF" : "#0A0A0A",
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Details ── */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0A0A0A", marginBottom: 6 }}>Your Details</h2>
                <p style={{ fontSize: 14, color: "#737373", marginBottom: 28 }}>Tell us who you are and where to go.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="First Name" value={firstName} onChange={setFirstName} required />
                    <Field label="Last Name" value={lastName} onChange={setLastName} required />
                  </div>
                  <Field label="Email" value={email} onChange={setEmail} type="email" required />
                  <Field label="Phone" value={phone} onChange={setPhone} type="tel" />
                  <Field label="Full Address" value={address} onChange={setAddress} />
                  <div>
                    <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#0A0A0A", marginBottom: 6 }}>Special Instructions</label>
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={3}
                      maxLength={500}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #E5E5E5", fontSize: 14, color: "#0A0A0A", resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                      placeholder="Pets, access codes, areas of focus…"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Confirm ── */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0A0A0A", marginBottom: 6 }}>Confirm Booking</h2>
                <p style={{ fontSize: 14, color: "#737373", marginBottom: 28 }}>Review your details and confirm.</p>
                <div style={{ borderRadius: 16, border: "1px solid #E5E5E5", backgroundColor: "#FAFAF9", padding: 24, marginBottom: 24 }}>
                  <SummaryRow label="Service" value={service?.name || ""} />
                  <SummaryRow
                    label="Date"
                    value={selectedDate ? selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
                  />
                  <SummaryRow label="Time" value={selectedTime || ""} />
                  <SummaryRow label="Name" value={`${firstName} ${lastName}`} />
                  <SummaryRow label="Email" value={email} />
                  {phone && <SummaryRow label="Phone" value={phone} />}
                  {address && <SummaryRow label="Address" value={address} />}
                  <div style={{ paddingTop: 16, borderTop: "1px solid #E5E5E5", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#0A0A0A" }}>Total</span>
                    <span style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: "#0A0A0A" }}>£{service?.price || 0}</span>
                  </div>
                </div>

                {/* Error banner */}
                {bookingError && (
                  <div role="alert" aria-live="assertive" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#DC2626" }}>
                    {bookingError}
                  </div>
                )}

                {/* Confirm button */}
                <button
                  disabled={isBooking}
                  onClick={handleConfirmBooking}
                  style={{
                    width: "100%", height: 52, backgroundColor: isBooking ? "#555" : "#0A0A0A",
                    color: "#FFFFFF", borderRadius: 8, fontSize: 15, fontWeight: 600,
                    border: "none", cursor: isBooking ? "not-allowed" : "pointer",
                    transition: "background-color 0.15s", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: 8,
                  }}
                >
                  {isBooking ? (
                    <>
                      <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#FFFFFF", borderRadius: "50%" }} className="animate-spin" />
                      Booking…
                    </>
                  ) : "Confirm Booking"}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 24, borderTop: "1px solid #F5F5F4" }}>
          <button
            onClick={goBack}
            disabled={step === 0}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
              borderRadius: 10, border: "1px solid #E5E5E5", backgroundColor: "#FFFFFF",
              fontSize: 14, fontWeight: 500, color: step === 0 ? "#C4C4C4" : "#0A0A0A",
              cursor: step === 0 ? "not-allowed" : "pointer",
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>
          {step < 3 && (
            <button
              onClick={goNext}
              disabled={!canProceed[step]}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
                borderRadius: 10, border: "none",
                backgroundColor: canProceed[step] ? "#0A0A0A" : "#E5E5E5",
                fontSize: 14, fontWeight: 500,
                color: canProceed[step] ? "#FFFFFF" : "#A3A3A3",
                cursor: canProceed[step] ? "pointer" : "not-allowed",
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      <p style={{ fontSize: 11, color: "#C4C4C4", marginTop: 32 }}>Powered by Sparkline</p>
    </div>
  );
};

/* ── Field helper ── */
const Field = ({
  label, value, onChange, type = "text", required,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) => (
  <div>
    <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#0A0A0A", marginBottom: 6 }}>
      {label}{required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #E5E5E5", fontSize: 14, color: "#0A0A0A", outline: "none", fontFamily: "inherit", boxSizing: "border-box", backgroundColor: "#FFFFFF" }}
    />
  </div>
);

/* ── SummaryRow helper ── */
const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #F0F0F0" }}>
    <span style={{ fontSize: 14, color: "#737373" }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 600, color: "#0A0A0A", textAlign: "right", maxWidth: "60%" }}>{value}</span>
  </div>
);

export default PublicBooking;
