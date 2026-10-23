import {
  BarChart3,
  Check,
  ChevronRight,
  Clock,
  Info,
  LayoutTemplate,
  ShieldCheck,
  Sparkles,
  Tag,
  Target,
  Type,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";
import type { SetupApplyCardData } from "./SetupApplyCard";
import type { SetupValues } from "./CampaignSetupStep";
import type { ContentValues } from "./CampaignContentStep";
import { describeSlot, nextSlot, type ScheduleValues } from "./CampaignScheduleStep";
import { emailTemplates } from "./emailTemplates.data";

export type SuggestionId =
  | "tags"
  | "tracking"
  | "conversion"
  | "audience"
  | "subject"
  | "preheader"
  | "template"
  | "sendtime"
  | "optimize"
  | "cap";

export interface CampaignSuggestion {
  id: SuggestionId;
  /** Distinct key when a step lists several prompts of the same kind. */
  key?: string;
  /** Opens the thread on this subject without an apply card attached. */
  promptOnly?: boolean;
  title: string;
  /** Short line on the list card (omitted when `tags` is set). */
  blurb?: string;
  tags?: string[];
  icon: LucideIcon;
  iconWrap: string;
  iconColor: string;
  /** What the user "asks" when they tap the card — seeds the chat thread. */
  prompt: string;
  navLabel: string;
  /** Spoken reply in the thread; the apply card carries the values. */
  reply: string;
  applyLabel: string;
  appliedLabel: string;
  patch: Partial<SetupValues>;
  /** Content-step suggestions write here instead of onto setup. */
  contentPatch?: Partial<ContentValues>;
  /** Schedule-step suggestions write here. */
  schedulePatch?: Partial<ScheduleValues>;
  /** Copy the apply card shows above the button — subject line, pre-header. */
  text?: string;
  alternates?: string[];
}

export function toSetupApplyCard(s: CampaignSuggestion): SetupApplyCardData {
  return {
    kind: s.id,
    title: s.title,
    applyLabel: s.applyLabel,
    appliedLabel: s.appliedLabel,
    tags: s.tags,
    conversionEvent: s.patch.conversionEvent,
    audience: s.patch.audienceSuggestion,
    blurb: s.blurb,
    text: s.text,
    alternates: s.alternates,
    patch: s.patch,
    contentPatch: s.contentPatch,
    schedulePatch: s.schedulePatch,
  };
}

const ICON: Record<
  SuggestionId,
  { icon: LucideIcon; iconWrap: string; iconColor: string }
> = {
  tags: { icon: Tag, iconWrap: "bg-[#E6F8F0]", iconColor: "text-[#00A86B]" },
  tracking: { icon: BarChart3, iconWrap: "bg-[#E8F0FE]", iconColor: "text-[#2F68E5]" },
  conversion: { icon: Target, iconWrap: "bg-[#F0E8FF]", iconColor: "text-[#7B5CFA]" },
  audience: { icon: Users, iconWrap: "bg-[#FFF1E6]", iconColor: "text-[#E07A2F]" },
  subject: { icon: Type, iconWrap: "bg-[#E8F0FE]", iconColor: "text-[#2F68E5]" },
  preheader: { icon: Type, iconWrap: "bg-[#E6F8F0]", iconColor: "text-[#00A86B]" },
  template: { icon: LayoutTemplate, iconWrap: "bg-[#F0E8FF]", iconColor: "text-[#7B5CFA]" },
  sendtime: { icon: Clock, iconWrap: "bg-[#E8F0FE]", iconColor: "text-[#2F68E5]" },
  optimize: { icon: Sparkles, iconWrap: "bg-[#F0E8FF]", iconColor: "text-[#7B5CFA]" },
  cap: { icon: ShieldCheck, iconWrap: "bg-[#E6F8F0]", iconColor: "text-[#00A86B]" },
};

function tagsForGoal(goal: string): string[] {
  switch (goal) {
    case "promo-offer":
      return ["sale", "promo", "limited-time"];
    case "reengage-dormant":
      return ["reengagement", "q3-retention", "email"];
    case "first-purchase":
      return ["first-purchase", "conversion", "welcome"];
    case "repeat-purchase":
      return ["loyalty", "repeat", "retention"];
    case "abandoned-cart":
      return ["cart-recovery", "checkout", "urgency"];
    case "product-launch":
      return ["launch", "new-product", "announcement"];
    case "onboarding":
      return ["onboarding", "welcome", "activation"];
    case "winback":
      return ["winback", "churn", "last-chance"];
    default:
      return ["campaign", "email"];
  }
}

/**
 * Content the co-marketer proposes per goal. Subject lines are written for the
 * job the campaign is doing — a win-back opens differently from a launch — so
 * these are keyed on the goal rather than generated from the channel.
 */
interface GoalContent {
  subject: string;
  alternates: string[];
  subjectWhy: string;
  preHeader: string;
  preHeaderWhy: string;
  /** Name of the saved template that fits this goal's layout. */
  template: string;
  templateWhy: string;
}

const CONTENT_BY_GOAL: Record<string, GoalContent> = {
  "reengage-dormant": {
    subject: "We saved your spot — here's what you missed",
    alternates: ["It's been a while. Worth a look?", "Still interested? Here's what's new"],
    subjectWhy:
      "Curiosity beats discounting on a cold list — leading with an offer teaches dormant contacts to wait for one.",
    preHeader: "A quick catch-up on what's landed since you were last here.",
    preHeaderWhy: "Extends the subject rather than repeating it, which is where most pre-headers waste the slot.",
    template: "Reactivation nudge",
    templateWhy: "Single-column, one CTA — dormant contacts don't scroll a grid.",
  },
  "first-purchase": {
    subject: "Your first order comes with a little something",
    alternates: ["Ready when you are — here's 10% off", "The one thing most people start with"],
    subjectWhy:
      "Signups who haven't bought respond to a low-risk first step, not to a catalogue.",
    preHeader: "Free returns, so there's nothing to lose on the first try.",
    preHeaderWhy: "Answers the objection that actually stalls a first purchase.",
    template: "Welcome series 01",
    templateWhy: "Hero, one product row, one CTA — built for the first send in a series.",
  },
  "repeat-purchase": {
    subject: "Picked for you, based on your last order",
    alternates: ["Time for a top-up?", "Your usual, plus two you haven't tried"],
    subjectWhy: "Existing customers convert on relevance, so the subject names the connection to their history.",
    preHeader: "Reorder in two taps, or browse what pairs with it.",
    preHeaderWhy: "Gives the fast path and the browse path in one line.",
    template: "Bundle offer",
    templateWhy: "Product pairs with cross-sell slots — the layout repeat buyers respond to.",
  },
  "abandoned-cart": {
    subject: "You left something behind",
    alternates: ["Your cart's still here", "Still thinking it over?"],
    subjectWhy:
      "Plain and specific outperforms clever on cart recovery — the reader already knows what this is about.",
    preHeader: "We're holding it for 24 hours.",
    preHeaderWhy: "Adds the deadline without putting urgency in the subject, where it reads as pressure.",
    template: "Cart nudge — 24h",
    templateWhy: "Cart contents block plus a single checkout CTA, no distractions.",
  },
  "product-launch": {
    subject: "It's here: {product}",
    alternates: ["The one you've been asking for", "New in — and it won't stay in stock"],
    subjectWhy: "Announcements do best when the news is the subject; swap in the product name before you send.",
    preHeader: "First look, plus what makes this one different.",
    preHeaderWhy: "Promises the detail the subject deliberately withholds.",
    template: "New arrivals grid",
    templateWhy: "Image-led grid for showing the range around the launch item.",
  },
  "promo-offer": {
    subject: "48 hours: 30% off everything",
    alternates: ["Your early access starts now", "The sale you asked us to remind you about"],
    subjectWhy: "Offer plus deadline in the subject is what lifts open rates on a promo — burying either costs you.",
    preHeader: "Ends Sunday at midnight. No code needed.",
    preHeaderWhy: "Removes the two things that stall a promo click — the code and the doubt about the deadline.",
    template: "Weekend drop",
    templateWhy: "Bold offer banner with a countdown slot above the fold.",
  },
  onboarding: {
    subject: "Let's get you set up in 3 minutes",
    alternates: ["Start here — the two things that matter first", "Welcome. Here's step one"],
    subjectWhy: "New joiners act on a small, time-boxed ask, not on a feature tour.",
    preHeader: "Three short steps, and you're running.",
    preHeaderWhy: "Repeats the low effort promise where the eye lands next.",
    template: "Welcome series 02",
    templateWhy: "Numbered-steps layout that carries an activation checklist.",
  },
  winback: {
    subject: "One last thing before we stop emailing",
    alternates: ["Should we keep you on the list?", "We'd rather ask than assume"],
    subjectWhy:
      "Permission framing outperforms discounts on churned contacts, and it cleans the list either way.",
    preHeader: "Tell us to stay and we'll only send what's worth it.",
    preHeaderWhy: "Makes staying feel like a choice about frequency, not a commitment to buy.",
    template: "Winback — 60 day",
    templateWhy: "Two-CTA layout — stay subscribed, or come back with an offer.",
  },
};

const DEFAULT_CONTENT: GoalContent = {
  subject: "A quick note from us",
  alternates: ["Worth two minutes of your time", "Here's what's new"],
  subjectWhy: "Neutral opener — pick a goal upstream and I'll write to it properly.",
  preHeader: "Here's what's inside.",
  preHeaderWhy: "Fills the slot so the inbox doesn't scrape the first line of the body.",
  template: "Q3 newsletter",
  templateWhy: "General-purpose layout that works for most sends.",
};

/** Copy the co-marketer would write for a goal — also used by the preview findings. */
export function goalContent(goal: string): GoalContent {
  return CONTENT_BY_GOAL[goal] ?? DEFAULT_CONTENT;
}

function contentSuggestions(goal: string): CampaignSuggestion[] {
  const copy = CONTENT_BY_GOAL[goal] ?? DEFAULT_CONTENT;
  const template = emailTemplates.find((t) => t.name === copy.template);

  const out: CampaignSuggestion[] = [
    {
      id: "subject",
      title: "Subject line",
      blurb: copy.subject,
      ...ICON.subject,
      prompt: "What subject line should I use?",
      navLabel: "Subject line",
      reply:
        `This is the one I'd send. ${copy.subjectWhy} ` +
        `The two underneath are worth an A/B if you have the volume for it.`,
      applyLabel: "Use this subject line",
      appliedLabel: "Subject line applied",
      patch: {},
      contentPatch: { subject: copy.subject },
      text: copy.subject,
      alternates: copy.alternates,
    },
    {
      id: "preheader",
      title: "Pre-header",
      blurb: copy.preHeader,
      ...ICON.preheader,
      prompt: "What should the pre-header say?",
      navLabel: "Pre-header",
      reply:
        `Leave this blank and most inbox clients will scrape the first line of your template instead — usually a ` +
        `“view in browser” link. ${copy.preHeaderWhy}`,
      applyLabel: "Use this pre-header",
      appliedLabel: "Pre-header applied",
      patch: {},
      contentPatch: { preHeader: copy.preHeader },
      text: copy.preHeader,
    },
  ];

  if (template) {
    out.push({
      id: "template",
      title: "Template pick",
      blurb: `${template.name} — ${copy.templateWhy}`,
      ...ICON.template,
      prompt: "Which template fits this campaign?",
      navLabel: "Template pick",
      reply:
        `Of what's saved on your account, this is the closest fit. ${copy.templateWhy} ` +
        `I'll select it on the picker — you can still open it and edit the blocks.`,
      applyLabel: "Select this template",
      appliedLabel: "Template selected",
      patch: {},
      contentPatch: { templateId: template.id },
      text: `${template.name} (Id: ${template.id})`,
    });
  }

  return out;
}

/**
 * When each goal sends best, read off this account's own open curve. `weekday`
 * is a JS day index; leaving it out means "tomorrow at this hour", which is how
 * onboarding and cart recovery behave — they're paced off the signup or the
 * abandonment, not off a day of the week.
 */
interface GoalSchedule {
  weekday?: number;
  hour: number;
  /** Why that slot, in the co-marketer's voice. */
  why: string;
  /** True where waiting costs more than timing gains. */
  immediate?: boolean;
  /** Should this campaign skip the account's frequency cap? */
  skipCap: boolean;
  capWhy: string;
}

const SCHEDULE_BY_GOAL: Record<string, GoalSchedule> = {
  "reengage-dormant": {
    weekday: 2,
    hour: 10,
    why: "Dormant contacts on this list re-open mid-morning midweek — Tuesdays run about 20% ahead of your weekend sends.",
    skipCap: false,
    capWhy:
      "Keep the cap on. These contacts went quiet partly from volume; a second message this week is what turns dormant into unsubscribed.",
  },
  "first-purchase": {
    weekday: 4,
    hour: 19,
    why: "Signups who haven't bought browse in the evening — your Thursday 7pm sends convert at roughly double your morning slots.",
    skipCap: false,
    capWhy: "Keep the cap on — a first purchase is a considered decision, and chasing it reads as pressure.",
  },
  "repeat-purchase": {
    weekday: 3,
    hour: 11,
    why: "Repeat buyers open around late morning midweek, before the evening promo rush from everyone else's sends.",
    skipCap: false,
    capWhy: "Keep the cap on. Your best customers get the most mail already — this is the group it protects.",
  },
  "abandoned-cart": {
    hour: 9,
    immediate: true,
    why: "Cart recovery decays by the hour — most of what you'll recover comes back inside the first two. Send this as soon as it's approved.",
    skipCap: true,
    capWhy:
      "Skip it here. Cart recovery is expected mail, and capping it means the one message people actually want gets dropped.",
  },
  "product-launch": {
    weekday: 2,
    hour: 9,
    why: "Launch news does best first thing Tuesday — it lands at the top of the inbox before the day's volume builds.",
    skipCap: false,
    capWhy: "Keep the cap on so the launch doesn't collide with whatever else is scheduled this week.",
  },
  "promo-offer": {
    weekday: 5,
    hour: 18,
    why: "Friday evening is where your promos peak — the offer lands as people start the weekend rather than mid-workday.",
    skipCap: true,
    capWhy:
      "Worth skipping for a time-boxed offer, otherwise the deadline can pass while the send sits capped behind another campaign.",
  },
  onboarding: {
    hour: 9,
    why: "Next morning, while the signup is still fresh — activation drops sharply after the first 48 hours.",
    skipCap: false,
    capWhy: "Keep the cap on. New joiners are the easiest group to over-mail and the quickest to opt out.",
  },
  winback: {
    weekday: 0,
    hour: 11,
    why: "Sunday late morning — lapsed contacts read personal mail at the weekend, when your competitors aren't sending.",
    skipCap: false,
    capWhy: "Keep the cap on. This audience is one message away from unsubscribing; frequency is the whole risk.",
  },
};

const DEFAULT_SCHEDULE: GoalSchedule = {
  weekday: 2,
  hour: 10,
  why: "Tuesday mid-morning is the steadiest slot on your account across campaign types.",
  skipCap: false,
  capWhy: "Keep the cap on unless this campaign is time-boxed and can't wait behind another send.",
};

function scheduleSuggestions(goal: string): CampaignSuggestion[] {
  const plan = SCHEDULE_BY_GOAL[goal] ?? DEFAULT_SCHEDULE;
  const slot = nextSlot(plan.hour, plan.weekday);

  const sendTime: CampaignSuggestion = plan.immediate
    ? {
        id: "sendtime",
        title: "Send this one now",
        blurb: "Cart recovery decays by the hour — don't schedule it.",
        ...ICON.sendtime,
        prompt: "When should this campaign go out?",
        navLabel: "Send time",
        reply: plan.why + " I'd set it to go the moment you launch rather than pick a slot.",
        applyLabel: "Set to send now",
        appliedLabel: "Sending now",
        patch: {},
        schedulePatch: { mode: "now" },
        text: "Send now, on launch",
      }
    : {
        id: "sendtime",
        title: "Best send window",
        blurb: describeSlot(slot),
        ...ICON.sendtime,
        prompt: "When should this campaign go out?",
        navLabel: "Send time",
        reply:
          plan.why +
          " I've picked the next one of those — move it if it clashes with anything else you have scheduled.",
        applyLabel: "Schedule for this slot",
        appliedLabel: "Send time set",
        patch: {},
        schedulePatch: { mode: "later", sendAt: slot },
        text: describeSlot(slot),
      };

  return [
    sendTime,
    {
      id: "optimize",
      title: "Let me pick per contact",
      blurb: "Send each contact at the hour they usually open.",
      ...ICON.optimize,
      prompt: "Should I let you optimise the send time?",
      navLabel: "Send-time optimisation",
      reply:
        "A single slot is an average, and your list isn't average — roughly a third of it opens outside your best hour. " +
        "Give me a 24-hour window and I'll send each contact at their own hour, falling back to your account's best " +
        "for anyone without enough history. On a list this size that's usually worth a few points of open rate.",
      applyLabel: "Optimise send time",
      appliedLabel: "Optimisation on",
      patch: {},
      schedulePatch: { mode: "optimize", optimizeWindow: "Next 24 hours" },
      text: "Optimised per contact, inside the next 24 hours",
    },
    {
      id: "cap",
      title: plan.skipCap ? "Skip the frequency cap" : "Keep the frequency cap",
      blurb: plan.capWhy,
      ...ICON.cap,
      prompt: "Should this campaign skip the frequency cap?",
      navLabel: "Frequency cap",
      reply:
        plan.capWhy +
        " Whichever way you go, remember the cap check runs on synced data — two sends inside 30 minutes can slip past it.",
      applyLabel: plan.skipCap ? "Skip the cap" : "Keep the cap on",
      appliedLabel: "Cap setting applied",
      patch: {},
      schedulePatch: { skipFrequencyCap: plan.skipCap },
      text: plan.skipCap ? "Skip capping for this campaign" : "Respect the account frequency cap",
    },
  ];
}

function suggestionsFor(goal: string, stepId: string): CampaignSuggestion[] {
  const tags = tagsForGoal(goal);
  const isPromo = goal === "promo-offer";
  const isCart = goal === "abandoned-cart";

  // "schedule" is the combined "Schedule and tracking" step — send-time
  // suggestions plus the tracking ones that used to live on Setup. Tags
  // live in Campaign settings, not this step.
  if (stepId === "schedule") {
    return [
      {
        id: "tracking",
        title: "Tracking recommendation",
        blurb: isPromo
          ? "Enable GA tracking with sale UTMs to measure traffic and conversions accurately."
          : "Turn on GA tracking with campaign UTMs so this send isn’t dumped into Direct.",
        ...ICON.tracking,
        prompt: "Do I need GA tracking on for this campaign?",
        navLabel: "Tracking advice",
        reply:
          "Yes — with UTMs. Your last few sends went out without them, so the traffic landed in GA as direct and the channel got no credit. I can turn it on from here.",
        applyLabel: "Enable GA tracking",
        appliedLabel: "GA tracking on",
        patch: { gaTracking: true },
      },
      {
        id: "conversion",
        title: "Conversion goal",
        blurb: isCart
          ? "Track Checkout completed as the primary conversion for this campaign."
          : "Track Purchase completed as the primary conversion for this campaign.",
        ...ICON.conversion,
        prompt: "What conversion goal should I set for this campaign?",
        navLabel: "Conversion goal",
        reply:
          "Set a primary conversion or the attribution window closes and you’ll only be able to report opens and clicks. This is the event I’d track.",
        applyLabel: "Set conversion goal",
        appliedLabel: "Conversion goal set",
        patch: {
          conversionTracking: true,
          conversionEvent: isCart ? "Checkout completed" : "Purchase completed",
        },
      },
      ...scheduleSuggestions(goal),
    ];
  }

  // The audience thread opens on its own the first time this step is reached.
  // These are the way back into it once it's been closed — the first re-runs
  // the cuts, the rest are the questions that follow picking one.
  if (stepId === "audience") {
    const base: Omit<CampaignSuggestion, "key" | "title" | "blurb" | "prompt" | "reply"> = {
      id: "audience",
      ...ICON.audience,
      navLabel: "Audience",
      promptOnly: true,
      applyLabel: "",
      appliedLabel: "",
      patch: {},
    };
    return [
      {
        ...base,
        key: "audience-cuts",
        title: "Audience options",
        blurb: "Three cuts scored against your goal, best fit first.",
        prompt: "Who should this campaign go to?",
        // Replaced by the overlay with the full cohorts thread.
        reply: "",
        promptOnly: false,
      },
      {
        ...base,
        key: "audience-exclude",
        title: "Who to hold back",
        blurb: "Suppressions worth adding before this goes out.",
        prompt: "Who should I exclude from this send?",
        reply:
          "Hold back anyone already in a journey — they'd get two messages in the same week and the journey usually wins. " +
          "I'd also drop contacts messaged in the last 7 days, plus opt-outs and hard bounces, which never leave the platform anyway. " +
          "The exclusion field on the form takes all three.",
      },
      {
        ...base,
        key: "audience-size",
        title: "Is this big enough to send?",
        blurb: "Whether the reach you've got can prove anything.",
        prompt: "Is this audience big enough to send to?",
        reply:
          "For a single send, anything above ~5,000 reachable will give you a readable open and click rate within a day. " +
          "Below that, treat the result as directional rather than a verdict on the copy. " +
          "If the cut you picked comes in small, widen the recency window before you widen the rule.",
      },
    ];
  }

  if (stepId === "content") return contentSuggestions(goal);

  return [
    {
      id: "tags",
      title: "Keep tagging consistent",
      tags,
      ...ICON.tags,
      prompt: "What tags should I put on this campaign?",
      navLabel: "Tagging help",
      reply: "Same tags as setup — applying again just fills any that are still missing.",
      applyLabel: "Add tags to campaign",
      appliedLabel: "Tags added",
      patch: { tags: tags.join(", ") },
    },
  ];
}

/** Every key the suggestion proposes already matches the form. */
function fieldsMatch<T extends object>(patch: Partial<T>, values: T): boolean {
  return (Object.keys(patch) as (keyof T)[]).every((key) => values[key] === patch[key]);
}

/** Has a content-step suggestion already been written onto the content form? */
export function isContentPatchApplied(
  patch: Partial<ContentValues>,
  values: ContentValues
): boolean {
  return fieldsMatch(patch, values);
}

/** Same, for the schedule step. */
export function isSchedulePatchApplied(
  patch: Partial<ScheduleValues>,
  values: ScheduleValues
): boolean {
  return fieldsMatch(patch, values);
}

export function isPatchApplied(patch: Partial<SetupValues>, values: SetupValues): boolean {
  if (patch.tags) {
    const have = new Set(
      values.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    );
    return patch.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .every((t) => have.has(t));
  }
  if (patch.gaTracking) return values.gaTracking;
  if (patch.conversionTracking) {
    return (
      values.conversionTracking &&
      (!patch.conversionEvent || values.conversionEvent === patch.conversionEvent)
    );
  }
  if (patch.audienceSuggestion) {
    return values.audienceSuggestion === patch.audienceSuggestion;
  }
  return false;
}

export function isApplied(suggestion: CampaignSuggestion, values: SetupValues): boolean {
  return isPatchApplied(suggestion.patch, values);
}

function SuggestionSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="flex items-center gap-2">
        <span className="cmk-skel-pulse size-5 shrink-0 rounded-full bg-[#E4EAF4]" />
        <div className="flex-1 space-y-1.5">
          <div className="cmk-skel-pulse h-2.5 w-[70%] rounded bg-[#E4EAF4]" />
          <div className="cmk-skel-pulse h-2.5 w-[44%] rounded bg-[#E4EAF4]" />
        </div>
      </div>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-[#E6EAF4] bg-white p-3"
        >
          <span className="cmk-skel-pulse size-9 shrink-0 rounded-md bg-[#E4EAF4]" />
          <div className="flex-1 space-y-1.5">
            <div className="cmk-skel-pulse h-2.5 w-[88%] rounded bg-[#E4EAF4]" />
            <div className="cmk-skel-pulse h-2.5 w-[62%] rounded bg-[#E4EAF4]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TagPills({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-[#DDE2EE] bg-white px-2.5 py-0.5 font-manrope text-[11px] font-medium text-[#17173A]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

/**
 * Right-hand co-marketer panel. Once a goal is picked it skeletons, then
 * surfaces suggestion cards. Tapping a card opens the docked co-marketer
 * already answering that prompt, with a card to plot the values onto setup.
 */
export default function CampaignAIPanel({
  stepId,
  goal,
  loading,
  values,
  contentValues,
  scheduleValues,
  onAsk,
}: {
  stepId: string;
  goal: string;
  loading: boolean;
  values: SetupValues;
  /** Content form state — what a content suggestion is checked "applied" against. */
  contentValues: ContentValues;
  /** Schedule form state, for the same reason. */
  scheduleValues: ScheduleValues;
  onAsk: (point: CampaignSuggestion) => void;
}) {
  const suggestions = suggestionsFor(goal, stepId);

  return (
    <aside className="flex w-[320px] shrink-0 flex-col pt-5">
      <div className="flex items-center gap-1.5">
        <img src={sparkle} alt="" className="h-5 w-5 shrink-0" />
        <h2 className="font-manrope text-base font-bold text-[#17173A]">Zeno</h2>
      </div>
      <p className="mb-4 mt-1 font-manrope text-xs text-[#6F6F8D]">
        Suggestions based on your campaign goal.
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto scroll-slim pb-4">
        {loading ? (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <img src={sparkle} alt="" className="h-4 w-4 shrink-0" />
              <p className="font-manrope text-xs font-medium text-[#2F68E5]">
                Preparing suggestions...
              </p>
            </div>
            <SuggestionSkeleton />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {suggestions.map((s, i) => {
              const applied = s.contentPatch
                ? isContentPatchApplied(s.contentPatch, contentValues)
                : s.schedulePatch
                  ? isSchedulePatchApplied(s.schedulePatch, scheduleValues)
                  : isApplied(s, values);
              const Icon = s.icon;
              return (
                <button
                  key={s.key ?? s.id}
                  type="button"
                  onClick={() => onAsk(s)}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className={cn(
                    "cmk-reveal group flex w-full items-center gap-3 rounded-lg border bg-white p-3 text-left",
                    "border-[#DDE2EE] transition-colors hover:border-[#2F68E5] hover:bg-[#F7F9FF]"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-md",
                      s.iconWrap
                    )}
                  >
                    <Icon className={cn("size-4", s.iconColor)} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    {s.tags ? (
                      <>
                        <span className="mb-1.5 block font-manrope text-[13px] font-semibold leading-[18px] text-[#17173A]">
                          {s.title}
                        </span>
                        <TagPills tags={s.tags} />
                      </>
                    ) : (
                      <>
                        <span className="block font-manrope text-[13px] font-semibold leading-[18px] text-[#17173A]">
                          {s.title}
                        </span>
                        {s.blurb && (
                          <span className="mt-0.5 block font-manrope text-[11px] leading-[16px] text-[#6F6F8D]">
                            {s.blurb}
                          </span>
                        )}
                      </>
                    )}
                    {applied && (
                      <span className="mt-1.5 inline-flex items-center gap-1 font-manrope text-[10px] font-semibold text-[#00A86B]">
                        <Check className="size-3" strokeWidth={3} />
                        Applied
                      </span>
                    )}
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-[#A0A0B8] transition-colors group-hover:text-[#2F68E5]"
                    strokeWidth={2}
                  />
                </button>
              );
            })}
            <p className="mt-1 flex items-start gap-1.5 pb-5 font-manrope text-[11px] leading-[16px] text-[#8A8AA3]">
              <Info className="mt-px size-3.5 shrink-0" strokeWidth={2} />
              Suggestions improve as you add more campaign details.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
