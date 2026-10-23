import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { differenceInCalendarDays } from "date-fns";
import { ThumbsUp, ThumbsDown, CheckCircle2, Settings, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import L1Nav from "@/components/campaigns/L1Nav";
import TopNav from "@/components/campaigns/TopNav";
import ChatInterface from "@/components/ChatInterface";
import ChatInput from "@/components/ChatInput";
import type { InsightCardContext } from "@/types/insightCard";
import MarketingAgentsOverlay from "@/components/MarketingAgentsOverlay";
import SegmentCreationNavbar from "@/components/campaigns/segment-creation/SegmentCreationNavbar";
import SegmentCanvasColumn from "@/components/campaigns/segment-creation/SegmentCanvasColumn";
import {
  segmentRowPadding,
  useSegmentBuild,
  type ReviewSegmentContext,
} from "@/components/campaigns/segment-creation/useSegmentBuild";
import PersonalizeCoMarketerModal, {
  type PersonalizeCoMarketerData,
} from "@/components/PersonalizeCoMarketerModal";
import DateRangeFilter, {
  buildDateRangePresets,
  type AppliedDateRange,
  type DateRangePresetKey,
} from "@/components/DateRangeFilter";
import CustomizeCardsPanel, { type CardPref } from "@/components/CustomizeCardsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { marketingAgents } from "@/data/agents";
import sparkleAi from "/campaign-assets/ic-sparkle-ai.gif";
import sparkleNav from "/campaign-assets/ic-sparkle.gif";

const suggestionChips = [
  "Which campaigns should I optimize first?",
  "Recommend new campaigns to create",
  "Why did WhatsApp CTR drop this week?",
  "Draft a win-back campaign for lapsed users",
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Metric base values + formatters. "volume" metrics (cumulative counts) scale
 *  with the selected range length; "rate" metrics (percentages) get a small
 *  deterministic jitter from the range length instead, since a CTR doesn't
 *  grow just because the window got longer. */
/** Full catalog of dashboard metric cards. The user picks which (max 5) show
 *  and in what order via the "Customize cards" panel — the first 5 are the
 *  default set. */
const METRICS_BASE = [
  {
    id: "active-campaigns",
    deltaPct: 8,
    label: "Active campaigns",
    kind: "volume" as const,
    rawValue: 12,
    format: (v: number) => `${Math.max(1, Math.round(v))}`,
    sub: "revenue-per-send vs 30-day average - 'Monsoon Flat 40%' email",
  },
  {
    id: "revenue",
    deltaPct: 18,
    label: "Revenue",
    kind: "volume" as const,
    rawValue: 14.2,
    format: (v: number) => `₹${v.toFixed(1)}L`,
    sub: "revenue-per-send vs 30-day average - 'Monsoon Flat 40%' email",
  },
  {
    id: "orders",
    deltaPct: 12,
    label: "Orders",
    kind: "volume" as const,
    rawValue: 2883,
    format: (v: number) => Math.round(v).toLocaleString("en-IN"),
    sub: "Lapsed buyers reactivated at 3×",
  },
  {
    id: "whatsapp-ctr",
    deltaPct: -34,
    label: "WhatsApp CTR",
    kind: "rate" as const,
    rawValue: 4.7,
    format: (v: number) => `${v.toFixed(1)}%`,
    sub: "Template fatigue - sharpen drop this week",
  },
  {
    id: "avg-open-rate",
    deltaPct: 6,
    label: "Avg open rate",
    kind: "rate" as const,
    rawValue: 31.4,
    format: (v: number) => `${v.toFixed(1)}%`,
    sub: "Template fatigue - sharpen drop this week",
  },
  {
    id: "click-rate",
    deltaPct: -4,
    label: "Click rate",
    kind: "rate" as const,
    rawValue: 2.3,
    format: (v: number) => `${v.toFixed(1)}%`,
    sub: "Link clicks per delivered message this period",
  },
  {
    id: "conversions",
    deltaPct: 15,
    label: "Conversions",
    kind: "volume" as const,
    rawValue: 642,
    format: (v: number) => Math.round(v).toLocaleString("en-IN"),
    sub: "Attributed purchases from campaign journeys",
  },
  {
    id: "revenue-per-send",
    deltaPct: 9,
    label: "Revenue per send",
    kind: "rate" as const,
    rawValue: 4.9,
    format: (v: number) => `₹${v.toFixed(1)}`,
    sub: "Blended across email, WhatsApp and SMS sends",
  },
  {
    id: "unsubscribes",
    deltaPct: -11,
    label: "Unsubscribes",
    kind: "volume" as const,
    rawValue: 87,
    format: (v: number) => Math.round(v).toLocaleString("en-IN"),
    sub: "Opt-outs across all channels this period",
  },
];

interface MetricCardData {
  id: string;
  label: string;
  sub: string;
  value: string;
  /** Period-over-period chip shown beside the value. Null for "Today", which
   *  has no complete prior period to compare against. */
  delta: { text: string; tone: "up" | "down" } | null;
}

/** Derives metric card values for the selected range length (days), so
 *  applying a date filter visibly changes the dashboard's data. Keyed by id.
 *  `comparison` picks which prior period the delta chip is measured against —
 *  omitted (null) when the range is a single day. */
function getMetricsForRange(days: number, comparison: "prevWeek" | "prevMonth" | null) {
  const volumeFactor = clamp(days / 7, 0.5, 4);
  const rateJitter = ((days * 7) % 11) / 10 - 0.5; // deterministic, ~-0.5..0.5
  // Month-over-month reads a little flatter than week-over-week — same sign,
  // damped magnitude, so the two presets don't show identical chips.
  const deltaFactor = comparison === "prevMonth" ? 0.6 : 1;

  const out: Record<string, MetricCardData> = {};
  for (const m of METRICS_BASE) {
    const scaledValue = m.kind === "volume" ? m.rawValue * volumeFactor : m.rawValue + rateJitter;
    const pct = Math.round(m.deltaPct * deltaFactor);
    out[m.id] = {
      id: m.id,
      label: m.label,
      sub: m.sub,
      value: m.format(scaledValue),
      delta: comparison
        ? { text: `${pct >= 0 ? "↑ +" : "↓ "}${pct}%`, tone: pct >= 0 ? "up" : "down" }
        : null,
    };
  }
  return out;
}

/** id → label map for the customize panel. */
const METRIC_LABELS: Record<string, string> = Object.fromEntries(
  METRICS_BASE.map((m) => [m.id, m.label])
);

/** Default card selection — the first 5 cards enabled, in catalog order. */
const MAX_CARDS = 5;
const MIN_CARDS = 4;
const DEFAULT_CARD_PREFS = METRICS_BASE.map((m, i) => ({ id: m.id, enabled: i < MAX_CARDS }));

/** Rotates a list based on the selected range length so the wins /
 *  needs-attention order visibly changes across date filters too. */
function rotateForRange<T>(items: T[], days: number): T[] {
  if (items.length === 0) return items;
  const n = days % items.length;
  return [...items.slice(n), ...items.slice(0, n)];
}

const wins = [
  {
    badges: ["Audience", "Journey"],
    title: "Lapsed buyers (60+ days) reactivated at 3.2% — double last month",
    sub: "1,140 dormant customers came back · prior month 1.2%",
  },
  {
    badges: ["Content"],
    title: "Emoji + urgency subject lines beat plain by 18% open rate",
    sub: "1,140 dormant customers came back · prior month 1.2%",
  },
  {
    badges: ["Segment"],
    title: "\"High-intent, no purchase\" segment converts 2.4× on retarget",
    sub: "3,400 users matched · sent via WhatsApp + email combo",
  },
  {
    badges: ["Scheduling"],
    title: "Send-time optimization lifted open rate by 9pts",
    sub: "Rolled out across all lifecycle campaigns last week",
  },
];

const needsAttention = [
  {
    badge: "Revenue",
    title: "Cart-abandonment flow revenue down 22%",
    sub: "Deliverability dipped on our ISP yesterday",
  },
  {
    badge: "WhatsApp",
    title: "WhatsApp CTR dropped 34% week-over-week",
    sub: "Template fatigue — sharpen drop this week",
  },
  {
    badge: "Deliverability",
    title: "Gmail inbox placement dropped 12% since Monday",
    sub: "Sender reputation dip on the bulk IP pool",
  },
  {
    badge: "Journey",
    title: "Onboarding journey drop-off up 15% at step 3",
    sub: "OTP verification screen — likely a friction point",
  },
];

/** Flat category tag — teal/green for wins, red/antique "error state" for
 *  needs-attention (always rendered upper-case via CSS so source casing
 *  never has to match). */
function CategoryBadge({ label, tone = "green" }: { label: string; tone?: "green" | "red" }) {
  return (
    <span
      className={cn(
        "w-fit rounded-[11px] px-2 py-1 font-manrope text-[10px] font-semibold uppercase tracking-wide",
        tone === "red" ? "bg-[#FFE9DA] text-[#F05C5C]" : "bg-[#E8F8F4] text-[#00A68C]"
      )}
    >
      {label}
    </span>
  );
}

/** Icon-only action button for the "Performance overview" strip — a tooltip
 *  carries the label so the action stays legible without adding button text
 *  that would otherwise repeat "Customize"/"Edit" at every glance. */
function HeaderIconButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[6px] border border-[#DDE2EE] bg-white text-[#17173A] shadow-[0px_2px_6px_rgba(23,23,58,0.04)] transition-colors hover:bg-[#F7F9FC]"
        >
          <Icon className="size-[16px]" strokeWidth={1.75} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]"
        style={{ fontFamily: "Manrope, sans-serif", fontWeight: 500 }}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/** "Get insights" trigger — shared by both wins and needs-attention cards. */
function GetInsightsLink({ onClick }: { onClick?: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Ask Zeno"
          onClick={onClick}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[#F0F5FF]"
        >
          <img src={sparkleNav} alt="" className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]"
        style={{ fontFamily: "Manrope, sans-serif", fontWeight: 500 }}
      >
        Ask Zeno
      </TooltipContent>
    </Tooltip>
  );
}

/** Thumbs up/down feedback shown under each wins / needs-attention item.
 *  Once either is tapped, the icons are hidden and the page-level confirmation
 *  pill (onSubmit) is shown. */
function ItemFeedback({ onSubmit }: { onSubmit: () => void }) {
  const [given, setGiven] = useState(false);

  const handleFeedback = () => {
    setGiven(true);
    onSubmit();
  };

  // After feedback, drop the icons for this item.
  if (given) return null;

  return (
    <div className="mt-0.5 flex items-center gap-1">
      <button
        type="button"
        aria-label="Helpful"
        onClick={handleFeedback}
        className="flex h-6 w-6 items-center justify-center rounded-md text-[#9A9AB2] transition-colors hover:bg-[#F0F5FF] hover:text-[#2F68E5]"
      >
        <ThumbsUp className="h-[14px] w-[14px]" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-label="Not helpful"
        onClick={handleFeedback}
        className="flex h-6 w-6 items-center justify-center rounded-md text-[#9A9AB2] transition-colors hover:bg-[#FEEDED] hover:text-[#F05C5C]"
      >
        <ThumbsDown className="h-[14px] w-[14px]" strokeWidth={1.75} />
      </button>
    </div>
  );
}

export default function AiDashboard() {
  // Docked co-marketer chat — same mount/enter/leave choreography as the
  // other campaigns-ecosystem pages (Campaigns, DecisioningEngine). Every
  // entry point (hero composer, suggestion chips, Wins/Needs-attention
  // insight links) opens this same instance so minimizing (expanded ->
  // widget) just docks it to the RHS instead of tearing it down.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const [chatIn, setChatIn] = useState(false);
  const [chatSession, setChatSession] = useState(0);
  const [chatInitialExpanded, setChatInitialExpanded] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState("");
  const [chatInitialInsight, setChatInitialInsight] = useState<InsightCardContext | null>(null);
  const [isAgentsOverlayOpen, setIsAgentsOverlayOpen] = useState(false);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());
  const [isPersonalizeOpen, setIsPersonalizeOpen] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);
  // Edit mode opens the modal straight on the form steps (no intro) and pre-fills
  // the previously saved answers.
  const [isPersonalizeEditing, setIsPersonalizeEditing] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState<PersonalizeCoMarketerData | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // "Review segment" on the Segment agent's artifact card in the docked chat.
  // Rather than a full-screen overlay — which would remount the chat and lose the
  // thread the user got here through — the canvas takes over this page's content
  // column and the chat column stays exactly where it is: same instance, same
  // messages, same scroll position, just narrower company.
  const [reviewSegment, setReviewSegment] = useState<ReviewSegmentContext | null>(null);
  // While the canvas is up this stops being the dashboard: the L1 rail and top
  // bar step aside, and the creation navbar takes the top bar's slot so it spans
  // the full width with the docked chat beneath it — segment creation reading as
  // its own full-screen page, without the chat ever changing parent.
  const onSegmentCanvas = reviewSegment !== null;
  const segmentBuild = useSegmentBuild(reviewSegment, onSegmentCanvas);

  /**
   * Leaving the canvas — by SAVE or by closing it — hands the user over to the
   * Segments list, which is where a segment lives once it exists. A saved
   * segment rides along in route state so it heads that table.
   */
  const leaveSegmentCanvas = (
    saved?: { name: string; count: string; aiGenerated: boolean }
  ) => {
    setReviewSegment(null);
    navigate("/audience/segments", saved ? { state: { createdSegment: saved } } : undefined);
  };

  // Hero composer greets with a cosmetic border shimmer (and the looping left
  // loader) that stays active until the user clicks into the field — a quiet
  // "ready" flourish that settles the moment they start interacting. The field
  // itself stays fully usable throughout (no disabled/generating state).
  const [heroShimmer, setHeroShimmer] = useState(true);

  const openPersonalize = () => {
    setIsPersonalizeEditing(false);
    setIsPersonalizeOpen(true);
  };
  const openPersonalizeEdit = () => {
    setIsPersonalizeEditing(true);
    setIsPersonalizeOpen(true);
  };

  // Date filter — top-right of the page. Picks are staged in the popover and
  // only take effect on "Apply", which shows a brief skeleton before the
  // (deterministically re-derived) data for that range renders.
  const [appliedRange, setAppliedRange] = useState<AppliedDateRange>(
    () => buildDateRangePresets().find((p) => p.key === "prevWeek")!.getRange()
  );
  const [presetKey, setPresetKey] = useState<DateRangePresetKey>("prevWeek");
  const [isDataLoading, setIsDataLoading] = useState(false);
  const dataLoadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleApplyDateFilter = (range: AppliedDateRange, _label: string, key: DateRangePresetKey) => {
    setIsDataLoading(true);
    if (dataLoadTimer.current) clearTimeout(dataLoadTimer.current);
    dataLoadTimer.current = setTimeout(() => {
      setAppliedRange(range);
      setPresetKey(key);
      setIsDataLoading(false);
    }, 700);
  };
  useEffect(() => () => {
    if (dataLoadTimer.current) clearTimeout(dataLoadTimer.current);
  }, []);

  // Which metric cards show (and their order) — edited via the "Customize
  // cards" RHS panel. Enabled cards render left→right, capped at MAX_CARDS.
  const [cardPrefs, setCardPrefs] = useState<CardPref[]>(DEFAULT_CARD_PREFS);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const rangeDays = Math.max(1, differenceInCalendarDays(appliedRange.to, appliedRange.from) + 1);
  // "Today" has no complete prior period behind it, so its cards carry no chip.
  const comparison = presetKey === "today" ? null : presetKey;
  const metricsById = useMemo(() => getMetricsForRange(rangeDays, comparison), [rangeDays, comparison]);
  const visibleMetrics = useMemo(
    () =>
      cardPrefs
        .filter((p) => p.enabled)
        .slice(0, MAX_CARDS)
        .map((p) => metricsById[p.id])
        .filter(Boolean),
    [cardPrefs, metricsById]
  );
  const visibleWins = useMemo(() => rotateForRange(wins, rangeDays), [rangeDays]);
  const visibleNeedsAttention = useMemo(() => rotateForRange(needsAttention, rangeDays), [rangeDays]);

  // Confirmation pill shown after thumbs feedback on a wins / needs-attention
  // item — same DSL pill used for chat feedback (feedback-nudge-in + check).
  const [showFeedbackPill, setShowFeedbackPill] = useState(false);
  const feedbackPillTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleItemFeedback = () => {
    setShowFeedbackPill(true);
    if (feedbackPillTimer.current) clearTimeout(feedbackPillTimer.current);
    feedbackPillTimer.current = setTimeout(() => setShowFeedbackPill(false), 3000);
  };
  useEffect(() => () => {
    if (feedbackPillTimer.current) clearTimeout(feedbackPillTimer.current);
  }, []);

  // Opens the docked chat fresh (new session/key) with the given starting
  // state. If the chat is already open, the mount effect below won't refire
  // (chatOpen wouldn't change), so bump the session here to force a remount
  // against the new context.
  const openDockedChat = (opts: {
    expanded: boolean;
    message?: string;
    insight?: InsightCardContext | null;
  }) => {
    setChatInitialExpanded(opts.expanded);
    setChatInitialMessage(opts.message ?? "");
    setChatInitialInsight(opts.insight ?? null);
    if (chatOpen) setChatSession((n) => n + 1);
    setChatOpen(true);
  };

  const handleHeroSend = (message: string) => openDockedChat({ expanded: false, message });

  const handleOpenInsightChat = (insight: InsightCardContext) =>
    openDockedChat({ expanded: false, insight });

  useEffect(() => {
    if (chatOpen) {
      setChatMounted(true);
      setChatSession((n) => n + 1);
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setChatIn(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    setChatIn(false);
    if (isAgentsOverlayOpen) setIsAgentsOverlayOpen(false);
  }, [chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleAgent = (agentId: string, agentName: string) => {
    const agent = marketingAgents.find((a) => a.id === agentId);
    if (!agent) return;

    setEnabledAgents((prev) => {
      const next = new Set(prev);
      const isJoining = !next.has(agentId);
      if (isJoining) next.add(agentId);
      else next.delete(agentId);

      window.dispatchEvent(
        new CustomEvent("agentStatusChange", {
          detail: {
            name: agentName,
            status: isJoining ? "join" : "leave",
            icon: agent.icon,
            colorClass: agent.colorClass,
          },
        })
      );
      return next;
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F4F8FF]">
      {!onSegmentCanvas && <L1Nav active="ai-dashboard" />}

      <div className={cn("flex min-w-0 flex-1 flex-col", !onSegmentCanvas && "p-2")}>
        {onSegmentCanvas ? (
          <SegmentCreationNavbar
            segmentName={segmentBuild.definition.name}
            showAiIcon={segmentBuild.phase !== "thinking"}
            // Reopen the docked chat *without* bumping the session — the thread
            // that produced these rules is the context for editing them, so it
            // has to survive being closed and reopened here.
            onAskCoMarketer={() => setChatOpen(true)}
            onSave={() => leaveSegmentCanvas(segmentBuild.saved)}
            onClose={() => leaveSegmentCanvas()}
          />
        ) : (
          <TopNav
            showCoMarketerNudge={false}
            onOpenChat={() => openDockedChat({ expanded: false })}
          />
        )}

        <div
          className={cn(
            "flex min-h-0 flex-1",
            onSegmentCanvas
              ? segmentRowPadding(segmentBuild.phase, chatMounted)
              : "mt-2 gap-2"
          )}
        >
          {/* Content column. "Review segment" in the chat swaps the dashboard out
              for the segment creation canvas *here* — the chat column beside it is
              untouched, so the thread that produced the segment stays on screen. */}
          {onSegmentCanvas ? (
            <SegmentCanvasColumn {...segmentBuild} />
          ) : (
          <div className="scroll-slim relative min-w-0 flex-1 overflow-y-auto px-4 pt-6 pb-8">
            {/* Greeting */}
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="font-manrope text-[13px] text-[#837C8E]">Thursday, 4 June (GMT+5:30)</p>
              <p className="font-manrope text-[24px] font-bold leading-[40px] text-[#17173A]">
                Good afternoon, <span className="text-[#2F68E5]">Amit</span>
              </p>
            </div>

            {/* Composer card — suggestion chips + hero input */}
            <div className="mt-4 flex flex-col items-center gap-4 rounded-[8px] p-4 drop-shadow-[0px_-4px_10px_rgba(177,177,177,0.2)]">
              <div className="flex w-full flex-col items-center gap-2">
                <p className="w-full text-center font-manrope text-[12px] font-medium text-[#17173A]">
                  Have something else in mind? Ask Zeno
                </p>
                <div className="chip-marquee w-full">
                  <div className="chip-marquee-track flex w-max gap-4 pb-1">
                    {[...suggestionChips, ...suggestionChips].map((chip, i) => (
                      <button
                        key={`${chip}-${i}`}
                        type="button"
                        // The chip *is* the ask — send it, same as typing it into
                        // the hero composer, rather than opening an empty thread.
                        onClick={() => openDockedChat({ expanded: false, message: chip })}
                        className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-[6px] border border-[#DDE2EE] bg-white px-2 py-1.5 transition-colors hover:bg-[#F7F9FC]"
                      >
                        <img src={sparkleAi} alt="" className="h-5 w-5" />
                        <span className="font-manrope text-[14px] font-semibold tracking-[0.42px] text-black">
                          {chip}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hero composer — same ChatInput used across the app. Typing here and
                  sending opens the docked co-marketer side panel (RHS) with that
                  message already "sent" — same as the suggestion chips and the
                  "Ask co-marketer" entry point. The dashboard's first view stays
                  intact; the user can still expand to full-screen from inside the
                  panel. */}
              <div className="w-full max-w-[768px]">
                <ChatInput
                  layout="linear"
                  showAddButton={false}
                  flat
                  borderShimmer={heroShimmer}
                  placeholderIcon="/thinking-loader.gif"
                  placeholder="Ask anything — What's driving churn this month?  or  Create a win-back campaign for lapsed users"
                  onSend={handleHeroSend}
                  onFieldFocus={() => setHeroShimmer(false)}
                />
              </div>
            </div>

            {/* Performance overview strip — title + Customize / Edit preferences /
                Date filter actions in one row, directly above the metric cards
                (Figma "Performance overview" header). "Edit preferences" only
                shows once the user has actually submitted preferences — before
                that, personalizing happens via the discovery banner below. */}
            <div className="mt-6 flex items-center gap-6">
              <p className="min-w-0 flex-1 font-manrope text-[20px] font-bold text-[#17173A]">Performance overview</p>
              <div className="flex shrink-0 items-center gap-3">
                <HeaderIconButton icon={Settings} label="Customize metrics" onClick={() => setIsCustomizeOpen(true)} />
                {isPersonalized && (
                  <HeaderIconButton icon={SlidersHorizontal} label="Edit preferences" onClick={openPersonalizeEdit} />
                )}
                <DateRangeFilter value={presetKey} onApply={handleApplyDateFilter} />
              </div>
            </div>

            {/* Metric cards — tinted panel + title header wrapping a white
                inner card; skeleton while a newly-applied date range loads */}
            <div className="mt-6 flex gap-6">
              {isDataLoading
                ? Array.from({ length: visibleMetrics.length || MAX_CARDS }).map((_, i) => (
                    <div key={i} className="flex flex-1 flex-col overflow-hidden rounded-[8px] bg-[#ECEFF5]">
                      <div className="flex items-center py-2 pl-4 pr-2">
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <div className="flex flex-1 px-1 pb-1">
                        <div className="flex flex-1 flex-col gap-2 rounded-[8px] border-[0.25px] border-[#DCDCDC] bg-white px-3 py-4">
                          <Skeleton className="h-8 w-16" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    </div>
                  ))
                : visibleMetrics.map((m) => (
                    <div key={m.label} className="flex flex-1 flex-col overflow-hidden rounded-[8px] bg-[#ECEFF5]">
                      <div className="flex items-center py-2 pl-4 pr-2">
                        <p className="font-manrope text-[14px] font-bold text-[#17173A]">{m.label}</p>
                      </div>
                      <div className="flex flex-1 px-1 pb-1">
                        <div className="flex flex-1 flex-col gap-1 rounded-[8px] border-[0.25px] border-[#DCDCDC] bg-white px-3 py-4">
                          <div className="flex items-center gap-2">
                            <p className="font-manrope text-[32px] font-bold leading-none text-[#17173A]">{m.value}</p>
                            {/* Period-over-period chip — only on the two "previous
                                period" presets, which have a prior period to beat. */}
                            {m.delta && (
                              <span
                                className={cn(
                                  "rounded-[11px] px-1 py-0.5 font-manrope text-[11px] font-semibold whitespace-nowrap",
                                  m.delta.tone === "up"
                                    ? "bg-[#E8F8F4] text-[#00A68C]"
                                    : "bg-[#FEEDED] text-[#F05C5C]"
                                )}
                              >
                                {m.delta.text}
                              </span>
                            )}
                          </div>
                          <p className="font-manrope text-[12px] leading-[17px] text-[#6F6F8D]">{m.sub}</p>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>

            {/* More wins / Needs attention — tinted panel + header, each item
                its own white card; same skeleton gate */}
            <div className="mt-6 flex gap-6">
              <div className="flex flex-1 flex-col overflow-hidden rounded-[8px] bg-[#ECEFF5]">
                <div className="flex items-center py-2 pl-4 pr-2">
                  <p className="font-manrope text-[14px] font-bold text-[#17173A]">What's working</p>
                </div>
                <div className="flex flex-col gap-1 px-1 pb-1">
                  {isDataLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-1.5 rounded-[8px] border-[0.25px] border-[#DCDCDC] bg-white p-3">
                          <Skeleton className="h-4 w-24 rounded-[11px]" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))
                    : visibleWins.map((win) => (
                        <div key={win.title} className="flex items-start justify-between gap-4 rounded-[8px] border-[0.25px] border-[#DCDCDC] bg-white p-3">
                          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <div className="flex gap-1.5">
                              {win.badges.map((b) => (
                                <CategoryBadge key={b} label={b} />
                              ))}
                            </div>
                            <p className="font-manrope text-[13px] font-semibold text-[#17173A]">{win.title}</p>
                            <p className="font-manrope text-[11px] text-[#6F6F8D]">{win.sub}</p>
                            <ItemFeedback onSubmit={handleItemFeedback} />
                          </div>
                          <GetInsightsLink
                            onClick={() =>
                              handleOpenInsightChat({
                                sectionLabel: "What's working",
                                badges: win.badges,
                                title: win.title,
                                sub: win.sub,
                                badgeTone: "blue",
                              })
                            }
                          />
                        </div>
                      ))}
                </div>
              </div>

              <div className="flex flex-1 flex-col overflow-hidden rounded-[8px] bg-[#ECEFF5]">
                <div className="flex items-center py-2 pl-4 pr-2">
                  <p className="font-manrope text-[14px] font-bold text-[#17173A]">Needs attention</p>
                </div>
                <div className="flex flex-col gap-1 px-1 pb-1">
                  {isDataLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-1.5 rounded-[8px] border-[0.25px] border-[#DCDCDC] bg-white p-3">
                          <Skeleton className="h-4 w-20 rounded-[11px]" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))
                    : visibleNeedsAttention.map((item) => (
                        <div key={item.title} className="flex items-start justify-between gap-4 rounded-[8px] border-[0.25px] border-[#DCDCDC] bg-white p-3">
                          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <CategoryBadge label={item.badge} tone="red" />
                            <p className="font-manrope text-[13px] font-semibold text-[#17173A]">{item.title}</p>
                            <p className="font-manrope text-[11px] text-[#6F6F8D]">{item.sub}</p>
                            <ItemFeedback onSubmit={handleItemFeedback} />
                          </div>
                          <GetInsightsLink
                            onClick={() =>
                              handleOpenInsightChat({
                                sectionLabel: "Needs attention",
                                badges: [item.badge],
                                title: item.title,
                                sub: item.sub,
                                badgeTone: "red",
                              })
                            }
                          />
                        </div>
                      ))}
                </div>
              </div>
            </div>

            {/* Discovery banner — dismissed for good once personalization is saved */}
            {!isPersonalized && (
              <div className="mt-6 flex items-center gap-5 rounded-[12px] border border-[#DDE2EE] bg-white py-5 pl-6 pr-5 shadow-[0px_5px_10px_0px_rgba(23,23,58,0.05)]">
                <div className="flex shrink-0 items-center justify-center rounded-[12px] bg-[#F0F5FF] p-3.5">
                  <img src={sparkleNav} alt="" className="h-5 w-5" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <p className="text-[16px] font-bold leading-[22px] text-[#17173A]">
                    Make Zeno more relevant to you
                  </p>
                  <p className="text-[13px] leading-[19px] text-[#6F6F8D]">
                    Tell us what you care about, and Zeno will prioritize insights, recommendations, and
                    actions around your goals.
                  </p>
                  <p className="text-[11px] font-medium text-[#6F6F8D]">
                    Takes less than a minute &middot; You can update this anytime
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openPersonalize}
                  className="shrink-0 rounded-[6px] bg-[#2F68E5] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#255ad2]"
                >
                  Personalize Zeno
                </button>
              </div>
            )}
          </div>
          )}

          {/* Feedback confirmation — same DSL pill used for chat feedback.
              Portaled to <body> so no ancestor stacking/overflow can hide it. */}
          {showFeedbackPill &&
            createPortal(
              <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 z-[100] flex justify-center pointer-events-none">
                <div className="feedback-nudge-in inline-flex items-center gap-[8px] rounded-full border border-[var(--color-line)] bg-card px-[14px] py-[8px] shadow-[0px_8px_20px_-6px_oklch(0.21_0.034_263.436_/_0.22)]">
                  <CheckCircle2 className="size-[16px] text-[var(--color-success)] shrink-0" />
                  <span className="text-[13px] text-[var(--color-ink)] whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Feedback taken
                  </span>
                </div>
              </div>,
              document.body
            )}

          <CustomizeCardsPanel
            open={isCustomizeOpen}
            onClose={() => setIsCustomizeOpen(false)}
            prefs={cardPrefs}
            labels={METRIC_LABELS}
            maxEnabled={MAX_CARDS}
            minEnabled={MIN_CARDS}
            onSave={setCardPrefs}
          />

          <PersonalizeCoMarketerModal
            open={isPersonalizeOpen}
            startInSteps={isPersonalizeEditing}
            initialData={isPersonalizeEditing ? savedPrefs : null}
            onClose={() => setIsPersonalizeOpen(false)}
            onComplete={(prefs: PersonalizeCoMarketerData) => {
              console.log("Co-Marketer preferences saved:", prefs);
              setSavedPrefs(prefs);
              setIsPersonalizeOpen(false);
              setIsPersonalized(true);
              toast({
                title: isPersonalizeEditing ? "Preferences updated" : "Preferences saved",
                description: "Zeno will now prioritize insights around what matters to you.",
              });
            }}
          />

          {/* Co-marketer chat — docked column, identical to Campaigns/DecisioningEngine. */}
          {chatMounted && (
            <div
              className={cn(
                "flex h-full min-h-0 shrink-0 justify-end overflow-hidden",
                onSegmentCanvas ? "py-3" : "pr-1",
                "transition-[width,opacity] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "motion-reduce:transition-none",
                chatIn ? "w-[474px] opacity-100" : "w-0 opacity-0"
              )}
              onTransitionEnd={(e) => {
                if (e.target === e.currentTarget && e.propertyName === "width" && !chatIn) {
                  setChatMounted(false);
                }
              }}
            >
              <MarketingAgentsOverlay
                isOpen={isAgentsOverlayOpen}
                onOpenChange={setIsAgentsOverlayOpen}
                enabledAgents={enabledAgents}
                onToggleAgent={handleToggleAgent}
              />
              <ChatInterface
                key={chatSession}
                initialExpanded={chatInitialExpanded}
                docked
                conversationVariant="campaigns"
                initialMessage={chatInitialMessage || undefined}
                initialInsightCard={chatInitialInsight ?? undefined}
                onBotIconClick={() => setIsAgentsOverlayOpen(true)}
                enabledAgents={enabledAgents}
                setEnabledAgents={setEnabledAgents}
                onCloseInterface={() => setChatOpen(false)}
                onReviewArtifact={(card) =>
                  setReviewSegment({ title: card.title, description: card.description })
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
