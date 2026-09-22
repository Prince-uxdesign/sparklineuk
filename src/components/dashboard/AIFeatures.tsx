import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, TrendingUp, AlertCircle, Clock, Star, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(n);

const insightIcons: Record<string, any> = {
  overdue: Clock,
  opportunity: TrendingUp,
  warning: AlertCircle,
  positive: Star,
};
const insightColors: Record<string, string> = {
  overdue: "text-warning",
  opportunity: "text-accent",
  warning: "text-destructive",
  positive: "text-success",
};

interface BusinessReport {
  performance_summary: string;
  whats_working: string[];
  opportunities: string[];
  weekly_priority: string;
  revenue_forecast: number;
  revenue_forecast_explanation: string;
  overall_health_score: number;
  health_score_label: string;
}

interface Insight {
  type: string;
  client_id?: string;
  client_name?: string;
  headline: string;
  explanation: string;
  suggested_action: string;
  priority: number;
}

// ── Health Score Ring ────────────────────────────────────────────────
const HealthRing = ({ score, label }: { score: number; label: string }) => {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="44" y="49" textAnchor="middle" className="font-mono font-bold" fontSize="18" fill="currentColor">{score}</text>
      </svg>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Business Health</p>
      <p className="text-xs font-semibold text-foreground">{label}</p>
    </div>
  );
};

// ── Business Health Card (dashboard preview) ─────────────────────────
export const BusinessHealthCard = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<BusinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await supabase.functions.invoke("generate-business-report", {});
      if (res.error || !res.data?.success) throw new Error();
      setReport(res.data.report);
      setLastGenerated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" strokeWidth={1.5} />
          <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">AI Business Insights</span>
        </div>
        <button onClick={generate} disabled={loading}
          className="text-xs font-medium text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-1.5">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {report ? "Regenerate" : "Generate Report"}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-4">
          <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm text-muted-foreground animate-pulse">Analysing your business data…</p>
        </div>
      )}
      {error && !loading && (
        <div className="text-sm text-muted-foreground py-2">
          AI is temporarily unavailable. <button onClick={generate} className="text-accent hover:underline">Try again</button>
        </div>
      )}
      {!report && !loading && !error && (
        <p className="text-sm text-muted-foreground">Click "Generate Report" to get an AI-powered overview of your business performance.</p>
      )}
      {report && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-start gap-4">
            <HealthRing score={report.overall_health_score} label={report.health_score_label} />
            <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-4">{report.performance_summary.split("\n")[0]}</p>
          </div>
          <ul className="space-y-1.5">
            {report.whats_working.slice(0, 3).map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                <span className="text-success mt-0.5">✓</span>{w}
              </li>
            ))}
          </ul>
          {lastGenerated && (
            <p className="text-[10px] text-muted-foreground">Last generated: {lastGenerated.toLocaleTimeString("en-GB")}</p>
          )}
        </motion.div>
      )}
      <p className="text-[10px] text-muted-foreground mt-3">✨ Powered by AI</p>
    </div>
  );
};

// ── Full Business Report (analytics page) ─────────────────────────────
export const FullBusinessReport = () => {
  const [report, setReport] = useState<BusinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState(true);

  const generate = async () => {
    setLoading(true);
    setError(false);
    setReport(null);
    try {
      const res = await supabase.functions.invoke("generate-business-report", { body: { force: true } });
      if (res.error || !res.data?.success) throw new Error();
      setReport(res.data.report);
      setLastGenerated(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" strokeWidth={1.5} />
          <h2 className="font-heading text-base font-semibold text-foreground">AI Business Health Report</h2>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <button onClick={handlePrint} className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors">
              Download
            </button>
          )}
          <button onClick={generate} disabled={loading}
            className="text-xs font-medium border border-border rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-1.5 text-foreground">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Analysing…" : "Generate AI Report"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-10 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground animate-pulse">Analysing your business data…</p>
        </div>
      )}
      {error && !loading && (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">AI is temporarily unavailable.</p>
          <button onClick={generate} className="text-sm text-accent hover:underline">Try Again</button>
        </div>
      )}
      {!report && !loading && !error && (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Click "Generate AI Report" to get a comprehensive business health analysis.</p>
        </div>
      )}
      {report && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-0">
          {/* Score */}
          <div className="flex items-center gap-6 pb-6 border-b border-border">
            <HealthRing score={report.overall_health_score} label={report.health_score_label} />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Overall Health Score: {report.overall_health_score}/100</p>
              <p className="text-xs text-muted-foreground">Based on current revenue, bookings, and client data</p>
              {lastGenerated && <p className="text-[10px] text-muted-foreground mt-1">Generated: {lastGenerated.toLocaleString("en-GB")}</p>}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="py-5 border-b border-border">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Performance Summary</h3>
            <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
              {report.performance_summary.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>

          {/* What's Working */}
          <div className="py-5 border-b border-border">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">What's Working</h3>
            <ul className="space-y-2">
              {report.whats_working.map((w, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                  <span className="text-success font-bold mt-0.5">✓</span>{w}
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="py-5 border-b border-border">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Areas of Opportunity</h3>
            <ul className="space-y-2">
              {report.opportunities.map((o, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                  <span className="text-accent font-bold mt-0.5">→</span>{o}
                </li>
              ))}
            </ul>
          </div>

          {/* Weekly Priority */}
          <div className="py-5 border-b border-border">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">This Week's Priority</h3>
            <div className="rounded-xl bg-accent/5 border border-accent/20 px-4 py-3">
              <p className="text-sm font-medium text-foreground">{report.weekly_priority}</p>
            </div>
          </div>

          {/* Revenue Forecast */}
          <div className="py-5">
            <h3 className="font-heading text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Revenue Forecast</h3>
            <p className="text-sm text-muted-foreground mb-1">
              Based on your current activity, you're on track for approximately{" "}
              <span className="font-semibold text-foreground font-mono">{fmtGBP(report.revenue_forecast)}</span> next month.
            </p>
            <p className="text-xs text-muted-foreground">{report.revenue_forecast_explanation}</p>
          </div>
        </motion.div>
      )}
      <div className="px-6 pb-4">
        <p className="text-[10px] text-muted-foreground">✨ Powered by AI — AI-generated content should be reviewed before acting</p>
      </div>
    </div>
  );
};

// ── Client Insights Widget ─────────────────────────────────────────────
export const ClientInsightsWidget = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [noData, setNoData] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async (force = false) => {
    setLoading(true);
    setError(false);
    setNoData(false);
    try {
      const res = await supabase.functions.invoke("generate-client-insights", { body: { forceRefresh: force } });
      if (res.data?.error === "not_enough_data") { setNoData(true); return; }
      if (res.error || !res.data?.success) throw new Error();
      setInsights(res.data.insights || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-foreground">🔍 Client Insights</p>
          <p className="text-[11px] text-muted-foreground">AI-powered opportunities in your client base</p>
        </div>
        <button onClick={() => load(true)} disabled={loading}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-secondary/60 animate-pulse" />)}
        </div>
      )}
      {error && !loading && (
        <p className="text-xs text-muted-foreground">AI unavailable. <button onClick={() => load(true)} className="text-accent hover:underline">Retry</button></p>
      )}
      {noData && !loading && (
        <p className="text-xs text-muted-foreground">Add at least 3 clients to unlock AI insights.</p>
      )}
      {!loading && !error && !noData && insights.length === 0 && (
        <p className="text-xs text-muted-foreground">No insights available yet.</p>
      )}
      {!loading && insights.map((ins, i) => {
        const Icon = insightIcons[ins.type] || TrendingUp;
        const color = insightColors[ins.type] || "text-accent";
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors mb-2">
            <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color}`} strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground leading-snug">{ins.headline}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{ins.explanation}</p>
              <p className="text-[10px] text-accent mt-1 font-medium">{ins.suggested_action} →</p>
            </div>
          </motion.div>
        );
      })}
      <p className="text-[10px] text-muted-foreground mt-2">✨ Powered by AI</p>
    </div>
  );
};

// ── Per-Client AI Insights Tab ─────────────────────────────────────────
export const ClientAIInsightsTab = ({ clientId, clientName }: { clientId: string; clientName: string }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await supabase.functions.invoke("generate-client-insights", {
        body: { clientId, forceRefresh: true },
      });
      if (res.error || !res.data?.success) throw new Error();
      setInsights(res.data.insights || []);
      setGenerated(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" strokeWidth={1.5} />
            AI Insights for {clientName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Personalised analysis and opportunities for this client</p>
        </div>
        <button onClick={generate} disabled={loading}
          className="h-9 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Generating…" : "Generate Insights"}
        </button>
      </div>

      {!generated && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Sparkles className="w-8 h-8 text-muted-foreground/30 mb-3" strokeWidth={1} />
          <p className="text-sm font-medium text-foreground mb-1">No insights generated yet.</p>
          <p className="text-xs text-muted-foreground">Click "Generate Insights" to get AI analysis for this client.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-6">
          <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin flex-shrink-0" />
          <p className="text-sm text-muted-foreground animate-pulse">Analysing client data…</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">AI is temporarily unavailable.</p>
          <button onClick={generate} className="text-sm text-accent hover:underline">Try Again</button>
        </div>
      )}

      {generated && !loading && insights.map((ins, i) => {
        const Icon = insightIcons[ins.type] || TrendingUp;
        const color = insightColors[ins.type] || "text-accent";
        return (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="flex items-start gap-3 p-4 rounded-xl border border-border mb-3 last:mb-0">
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${color}`} strokeWidth={1.5} />
            <div>
              <p className="text-sm font-semibold text-foreground">{ins.headline}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{ins.explanation}</p>
              <p className="text-xs text-accent font-medium mt-2">{ins.suggested_action} →</p>
            </div>
          </motion.div>
        );
      })}
      <p className="text-[10px] text-muted-foreground mt-3">✨ Powered by AI — review before acting</p>
    </div>
  );
};
