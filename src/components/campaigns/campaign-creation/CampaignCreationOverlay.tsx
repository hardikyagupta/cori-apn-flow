import { useEffect, useRef, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import {
  BellRing,
  Calendar,
  Check,
  ChevronDown,
  FileText,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Monitor,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Sparkles,
  Tag,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import ErrorToast from "./ErrorToast";
import CampaignCreationNavbar from "./CampaignCreationNavbar";
import AppPushIcon from "@/components/AppPushIcon";
import CampaignSettingsDrawer from "./CampaignSettingsDrawer";
import CampaignCreationIntro from "./CampaignCreationIntro";
import CampaignAIGenerating from "./CampaignAIGenerating";
import CampaignLaunchingModal from "./CampaignLaunchingModal";
import CampaignCreationStepper, { type Step } from "./CampaignCreationStepper";
import { isPushDraftPatchApplied } from "./SetupApplyCard";
import CampaignAIPanel, {
  isContentPatchApplied,
  isPatchApplied,
  isSchedulePatchApplied,
  toSetupApplyCard,
  type CampaignSuggestion,
} from "./CampaignAIPanel";
import CampaignSetupStep, {
  CAMPAIGN_GOALS,
  goalLabel,
  mergeTags,
  DEFAULT_UTM_PARAMETERS,
  DEFAULT_KEY_VALUE_PARAMETERS,
  DEFAULT_CONVERSION_PAYLOAD_PARAMETERS,
  defaultUtmParameters,
  type SetupValues,
} from "./CampaignSetupStep";
import CampaignAssetsStep, { EMPTY_ASSETS, type AssetsValues } from "./CampaignAssetsStep";
import CampaignAudienceStep, {
  AudienceReachablePill,
  ConfigPendingPill,
  AudienceReachStat,
  EMPTY_AUDIENCE,
  reachFor,
  type AudienceValues,
} from "./CampaignAudienceStep";
import { cohortsForGoal, type AudienceCohort } from "./audienceCohorts.data";
import { segmentConditionsFor } from "./segmentConditions";
import CampaignContentStep, {
  EMPTY_CONTENT,
  type ContentValues,
} from "./CampaignContentStep";
import CampaignScheduleStep, {
  EMPTY_SCHEDULE,
  defaultSendAt,
  describeSlot,
  sliceSummaryLabel,
  type ScheduleValues,
} from "./CampaignScheduleStep";
import { emailTemplates } from "./emailTemplates.data";
import { pushScenarioFor } from "./pushAIScenarios.data";
import { emailScenarioFor } from "./emailAIScenarios.data";
import {
  WELCOME_SEGMENT_CONDITIONS,
  WELCOME_SEGMENT_REACH,
  welcomeSegmentTopic,
  welcomeCraftMessageTopic,
  welcomeTemplatesTopic,
  welcomeSubjectOptionsTopic,
  welcomeScheduleChoiceTopic,
  welcomeSendTimeRecommendationTopic,
  welcomeRecommendedSendAt,
  welcomeSummaryTopic,
} from "./welcomeNewCustomersFlow.data";
import { SEGMENT_STARTERS } from "@/components/campaigns/SegmentSuggestions";
import SegmentCreationOverlay from "@/components/campaigns/segment-creation/SegmentCreationOverlay";
import {
  buildFindings,
  isExclusiveDealsReviewScenario,
  exclusiveDealsReviewFindings,
  EXCLUSIVE_DEALS_REVIEW_REPLY,
  type Finding,
} from "./previewFindings.data";
import CampaignPreview from "./CampaignPreview";
import PushCampaignNavbar from "./PushCampaignStepper";
import PushSetupStep from "./PushSetupStep";
import PushContentStep from "./PushContentStep";
import { EMPTY_REGULAR_DRAFT, type RegularLayoutDraft } from "./PushRegularLayoutEditor";
import { buildPushFindings } from "./pushFindings.data";
import GoalApprovalCard, { type ApprovalQuestion } from "./GoalApprovalCard";
import { describeApprovalAnswers } from "@/data/approvalTranscript";
import type { AudienceAgentHost, AudienceDraft } from "@/data/audienceAgentFlow";
import StepCard from "./StepCard";
import { CONSUMER_APPS } from "./pushAIScenarios.data";
import { PUSH_CONTENT_CTA, type PushCampaignPrefill } from "@/data/pushCartFlow";
import ChatInterface, {
  type SeededTopic,
  type StarterChip,
} from "@/components/ChatInterface";
import sparkle from "/campaign-assets/ic-sparkle.gif";
import "./campaign-creation.css";
// The one-page accordion reuses the objective v2 card styling (.ov2-*) so both
// flows read the same; campaign-creation.css supplies the tokens it references.
import "@/components/decisioning/objective-v2/objective-flow-v2.css";

/**
 * Full-screen campaign creation wizard, opened from the top bar's quick-create
 * menu. Slides up from the bottom on open and back down on close.
 *
 * Layout follows the shared campaign-creation reference — navbar, stepper,
 * step card, right summary — so every channel's flow is the same shell. Only
 * the step content differs per channel; today Setup is built for Email and the
 * remaining three steps are stubs.
 */

/** How long the slide runs; must match the duration class below. */
const SLIDE_MS = 380;

/** Ring around freshly-plotted audience fields; matches .cmk-plot-flash. */
const AUDIENCE_FLASH_MS = 2200;

/** Lucide icons and hand-drawn channel glyphs both fit this — just an SVG
 *  component taking the usual className/strokeWidth presentation props. */
type ChannelIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const CHANNEL_ICONS: Record<string, ChannelIconComponent> = {
  Email: Mail,
  SMS: MessageSquare,
  Whatsapp: MessageCircle,
  "App Push Notification": AppPushIcon,
  "Web Push Notification": Monitor,
  "In-app Message": MessageSquare,
  "Web Message": Monitor,
};

/** Channels that open on the prompt screen and can draft a whole campaign
 *  from a typed goal — every other channel goes straight to the wizard. */
const hasAIFlow = (channel: string) => channel === "Email" || channel === "App Push Notification";

/** Temporarily hide Assets without removing its configuration or UI. */
const SHOW_ASSETS_STEP = false;

/** App Push regular campaign's own step-by-step flow (see PushCampaignStepper):
 *  Setup holds the apps and tracking, Audience who it goes to. */
const PUSH_STEPS: Step[] = [
  { id: "setup", label: "Setup", icon: Settings },
  { id: "audience", label: "Audience", icon: Users },
  { id: "content", label: "Content", icon: FileText },
  { id: "schedule", label: "Schedule", icon: Calendar },
];

/** Canonical order — Assets can be restored ahead of the shared three steps. */
function stepsFor(channel: string): Step[] {
  const base: Step[] = [
    { id: "audience", label: "Send to", icon: Users },
    { id: "content", label: "Message", icon: FileText },
    { id: "schedule", label: "Schedule", icon: Calendar },
  ];
  return SHOW_ASSETS_STEP && channel !== "Email"
    ? [{ id: "assets", label: "Assets", icon: Package }, ...base]
    : base;
}

/**
 * Contextual co-marketer chips per step — what "Ask co-marketer" opens with
 * while that card is the one on screen, instead of the generic home-page set.
 */
const STEP_CHIPS: Record<string, StarterChip[]> = {
  content: [
    {
      label: "Promote a new offer",
      icon: Percent,
      header: "Find templates for a new offer",
      prompts: [
        "Recommend a template for promoting a new offer.",
        "Which template gets the most opens for a discount promotion?",
        "Suggest a subject line to go with a new-offer template.",
      ],
    },
    {
      label: "Announce a seasonal sale",
      icon: Tag,
      header: "Find templates for a seasonal sale",
      prompts: [
        "Recommend a template for a seasonal sale announcement.",
        "Which of our templates fits an end-of-season clearance best?",
        "Suggest a subject line to go with a seasonal-sale template.",
      ],
    },
    {
      label: "Launch a new product",
      icon: Megaphone,
      header: "Find templates for a product launch",
      prompts: [
        "Recommend a template for launching a new product.",
        "Which template best builds excitement for a product launch?",
        "Suggest a subject line to go with a product-launch template.",
      ],
    },
  ],
};

/** App Push's own Message-step chips — notification copy (a short title and
 *  body, an emoji, a call to action) rather than an email's subject line and
 *  body. Audience and Schedule have their own push-aware sets below/above. */
const PUSH_STEP_CHIPS: Record<string, StarterChip[]> = {
  ...STEP_CHIPS,
  content: [
    {
      label: "Offer 50% off",
      icon: Percent,
      header: "Write a 50% off push notification",
      prompts: [
        "Write a push title and message for a 50% off sale.",
        "Draft a body under 100 characters for a 50% off push.",
        "Suggest an emoji and call to action that lifts taps on a 50% off push.",
      ],
    },
    {
      label: "Cart reminder",
      icon: ShoppingCart,
      header: "Write an abandoned-cart push",
      prompts: [
        "Write a push title and message nudging someone to finish their cart.",
        "Draft a cart reminder that offers free shipping to complete the order.",
        "What's the best delay before sending a cart reminder push?",
      ],
    },
    {
      label: "Flash sale countdown",
      icon: Timer,
      header: "Write a flash-sale countdown push",
      prompts: [
        "Write a push title and message for a flash sale that ends tonight.",
        "Draft a countdown-timer push that creates urgency without sounding spammy.",
        "Suggest a rich-media image style for a flash-sale push.",
      ],
    },
    {
      label: "Back in stock alert",
      icon: BellRing,
      header: "Write a back-in-stock push",
      prompts: [
        "Write a push title and message telling someone a product they wanted is back in stock.",
        "Draft a back-in-stock push that names the product and links straight to it.",
        "Which deep link should a back-in-stock push open?",
      ],
    },
  ],
};

/** App Push's audience pills — app behaviour and lifecycle cuts. "Welcome new
 *  customers" keeps its wording because its prompt already has a scripted
 *  segment flow behind it; the rest are answered by the generic segment build. */
const PUSH_AUDIENCE_STARTERS: { title: string; prompt: string }[] = [
  {
    title: "Re-engage lapsed app users",
    prompt: "Find users who haven't opened the app in the last 30 days",
  },
  {
    title: "Recover abandoned carts",
    prompt: "Find users who added products to their cart but haven't purchased in the last 3 days",
  },
  {
    title: "Welcome new customers",
    prompt: "Create a segment of new customers who joined within the last 60 days",
  },
  {
    title: "Notify product viewers",
    prompt: "Find users who viewed or wishlisted a product in the last 30 days",
  },
];

/** Empty-state greeting for the docked chat, per open step — replaces the
 *  generic "Good afternoon, Amit" with a question about what that step is
 *  actually for. A step missing here falls back to the generic one. */
const STEP_GREETINGS: Record<string, string> = {
  audience: "What type of segment would you like to create?",
  content: "What are you planning to send?",
  schedule: "Want help choosing a send time?",
};

/** Paired with STEP_GREETINGS — replaces the docked composer's default
 *  placeholder for the same steps. Content asks for the goal because the
 *  co-marketer recommends existing templates here rather than building one
 *  from scratch. */
const STEP_PLACEHOLDERS: Record<string, string> = {
  content: "Tell me what you're looking for",
  schedule: "Recommend a best time based on the audience and message",
};

/** Sub-line under each accordion header, before the step has a summary. */
const STEP_DESCRIPTIONS: Record<string, string> = {
  assets: "Select the app(s) this campaign's assets belong to.",
  audience: "Select the target audience.",
  content: "Design the message which would go to your selected contacts.",
  schedule: "Decide when this do you want to send this campaign.",
};

/** Draft name every new campaign starts on: Untitled_YYYYMMDDHHMMSS, local time. */
function newCampaignName() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `Untitled_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

const EMPTY_SETUP: SetupValues = {
  goal: "",
  tags: "",
  // On by default for every new campaign — see the toggle's own copy for why.
  gaTracking: true,
  conversionTracking: false,
  conversionEvent: "",
  conversionWindowValue: "1",
  conversionWindowUnit: "Days",
  revenueParameter: "",
  audienceSuggestion: "",
  avoidDuplicateComms: false,
  utmParameters: DEFAULT_UTM_PARAMETERS,
  keyValueParameters: DEFAULT_KEY_VALUE_PARAMETERS,
  conversionPayloadParameters: DEFAULT_CONVERSION_PAYLOAD_PARAMETERS,
};

/**
 * The co-marketer's audience thread: the Segment agent scores cohorts against
 * the goal and hands back cuts to plot. Reached both by landing on the step and
 * by "Audience options" in the suggestion rail, so it lives out here.
 */
function audienceCutsTopic(
  goalValue: string,
  brief = "",
  goalText = "",
  /** The card read back as questions and answers. Becomes the opening turn:
   *  it is what the reader actually said, skips included. */
  transcript = "",
): SeededTopic {
  // Whatever the reader gave us is what we work from: a goal they picked, text
  // they typed instead, or nothing at all. A skip is an answer — it means "you
  // decide" — so the agent still cuts, and its reply owns the assumption.
  const label = goalLabel(goalValue) ?? (goalText.trim() || undefined);
  const ask = label
    ? `Build the audience for my ${label.toLowerCase()} campaign`
    : "Build the audience for this campaign";
  return {
    // The goal belongs in the ask: the thread is answering "who should this
    // win-back campaign go to", not the generic question, and the reply and
    // the cards below both hang off that goal.
    prompt: transcript || (brief ? `${ask} — ${brief}` : ask),
    navLabel: "Audience",
    // Building the cuts is the Segment agent's job, so the co-marketer hands
    // over and the thread shows that work happening before the cards land.
    agentId: "segment-agent",
    reasoningSteps: [
      "Reading 90 days of opens, clicks and orders",
      label ? `Scoring cohorts against "${label}"` : "Scoring cohorts on engagement and recency",
      "Checking channel reachability and consent",
      "Pairing each cut with the suppression it needs",
    ],
    reply: label
      ? `I read your last 90 days of engagement against "${label}" and pulled three cuts worth ` +
        `considering, best fit first. Each one comes with the suppression I'd pair it with. ` +
        `Review one and I'll plot it onto the form — you can still edit it there.`
      : `You left the brief to me, so I scored your last 90 days on engagement and recency and ` +
        `pulled the three cuts that tend to pay whatever the campaign is for, best fit first. ` +
        `Each one comes with the suppression I'd pair it with. Review one and I'll plot it onto ` +
        `the form — tell me the goal and I'll re-cut against it.`,
    setupApplyCard: {
      kind: "cohorts",
      title: "Audience options",
      applyLabel: "Review audience",
      appliedLabel: "Plotted on audience",
      cohorts: cohortsForGoal(goalValue),
      goalLabel: label,
    },
  };
}

/**
 * What the Segment agent asks before it can cut an audience. This is the goal
 * the setup step used to ask for outright — the agent needs it to score
 * cohorts, so it asks in the chat instead of gating the form.
 */
const AUDIENCE_QUESTIONS: ApprovalQuestion[] = [
  {
    q: "What is this campaign for?",
    type: "radio",
    options: CAMPAIGN_GOALS.map((g) => ({ value: g.value, label: g.label })),
  },
  // The goal says which cohorts are relevant; these two say how to cut them.
  // Reach against precision changes the size of every cut the agent proposes,
  // and the holdbacks are the suppression it pairs with them — both are things
  // only the marketer knows, and both are cheaper to ask than to undo.
  {
    q: "How should I balance reach and precision?",
    type: "radio",
    optional: true,
    options: [
      { value: "tight", label: "Tighter cut, highest intent" },
      { value: "balanced", label: "Balanced" },
      { value: "broad", label: "Widest reachable audience" },
    ],
  },
  {
    q: "Anyone I should hold back?",
    type: "check",
    // Nobody to hold back is a normal answer, so Send stays live either way.
    optional: true,
    options: [
      { value: "recent-purchasers", label: "Recent purchasers" },
      { value: "active-journey", label: "Already in an active journey" },
      { value: "recently-contacted", label: "Contacted in the last 7 days" },
      { value: "bounced", label: "Bounced or complained" },
    ],
  },
];

/** Sentence fragments for the answers, so the user's own turn reads as prose. */
const REACH_PHRASE: Record<string, string> = {
  tight: "a tight, high-intent cut",
  balanced: "a balanced cut",
  broad: "the widest reachable audience",
};

const HOLDBACK_PHRASE: Record<string, string> = {
  "recent-purchasers": "recent purchasers",
  "active-journey": "anyone already in an active journey",
  "recently-contacted": "anyone contacted in the last 7 days",
  bounced: "bounced or complained addresses",
};

/** "…, a balanced cut, holding back recent purchasers and bounced addresses." */
function audienceBrief(reach?: string, holdbacks: string[] = [], holdbackText = ""): string {
  const parts: string[] = [];
  if (reach && REACH_PHRASE[reach]) parts.push(REACH_PHRASE[reach]);
  const held = holdbacks.map((h) => HOLDBACK_PHRASE[h]).filter(Boolean);
  if (holdbackText.trim()) held.push(holdbackText.trim());
  if (held.length === 1) parts.push(`holding back ${held[0]}`);
  else if (held.length > 1)
    parts.push(`holding back ${held.slice(0, -1).join(", ")} and ${held[held.length - 1]}`);
  return parts.join(", ");
}

export default function CampaignCreationOverlay({
  open,
  channel,
  onClose,
  onLaunched,
  prefill,
}: {
  open: boolean;
  /** Quick-create label that opened this, e.g. "Email". */
  channel: string;
  onClose: () => void;
  /** Fired once the launching pop-up finishes, right before the wizard
   *  closes — the listing page uses this to add the row, toast, and confetti. */
  onLaunched?: (info: { name: string; aiGenerated: boolean }) => void;
  /** A campaign Cori already drafted in chat (App Push) — the wizard opens
   *  straight on its preview screen with these values instead of the prompt. */
  prefill?: PushCampaignPrefill | null;
}) {
  // Which cards this channel's accordion has — see stepsFor's own comment.
  const STEPS = stepsFor(channel);
  // `mounted` keeps the panel in the DOM through its exit slide; `shown` drives
  // the transform. Same mount → enter → leave → unmount dance the docked chat
  // on the campaigns page uses.
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  // The Email flow opens on a goal prompt before the step-by-step wizard;
  // "Start from scratch" (or submitting a goal) is what gets past it.
  const [introOpen, setIntroOpen] = useState(true);
  // Done on Send to without a target app: the toast says so, and the field
  // keeps a red message until an app is picked.
  const [appRequiredToast, setAppRequiredToast] = useState<string | null>(null);
  const [appRequiredTried, setAppRequiredTried] = useState(false);
  const [conversionTried, setConversionTried] = useState(false);
  // Shown between submitting a goal on the intro and landing on the wizard —
  // the phase checklist animates while the AI draft is applied underneath.
  const [generating, setGenerating] = useState(false);
  // Flags a campaign the AI drafted end-to-end, for the navbar's badge.
  const [campaignAIGenerated, setCampaignAIGenerated] = useState(false);
  // Brief pop-up shown the moment "Launch" is clicked, before handing off
  // to the listing page — skips the Preview/review screen entirely.
  const [launching, setLaunching] = useState(false);
  // Which accordion cards are expanded — each opens and closes independently,
  // so opening one never collapses the others. Empty means every card is
  // collapsed.
  const [openStepIds, setOpenStepIds] = useState<Set<string>>(new Set());
  // The step most recently opened — separate from openStepIds, since a few
  // side effects (the co-marketer rail, the audience auto-open, scrolling)
  // still need a single "current" step rather than the whole open set.
  const [focusStepId, setFocusStepId] = useState<string | null>(null);
  // Steps the user has tapped "Done" on. Only these show the green check and
  // the inline summary when collapsed, same rule as the objective v2 flow.
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  // The step the co-marketer rail is answering for. Tracked separately from
  // focusStepId so collapsing every card doesn't blank the suggestions.
  const [railStepId, setRailStepId] = useState<string>("audience");
  // The campaign's own name — set once per open and only ever changed by the
  // navbar rename, so picking a goal no longer retitles the draft.
  const [campaignName, setCampaignName] = useState(newCampaignName);
  const [setup, setSetup] = useState<SetupValues>(EMPTY_SETUP);
  const [assets, setAssets] = useState<AssetsValues>(EMPTY_ASSETS);
  const [audience, setAudience] = useState<AudienceValues>(EMPTY_AUDIENCE);
  const [content, setContent] = useState<ContentValues>(EMPTY_CONTENT);
  const [schedule, setSchedule] = useState<ScheduleValues>(EMPTY_SCHEDULE);
  // Preview is the screen after the last step, not a fifth step — it replaces
  // the wizard chrome with its own header while the draft stays in state.
  const [previewOpen, setPreviewOpen] = useState(false);
  // App Push's stepper: which step is showing, and the furthest one reached.
  // The Segment agent's questions, drawn above the chat composer until answered.
  const [goalApprovalOpen, setGoalApprovalOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [reachedIndex, setReachedIndex] = useState(0);
  // Campaign-level settings (tags, for now) live in their own drawer off the
  // navbar rather than a step, since they don't belong to any one of them.
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Docked co-marketer chat, opened from the navbar CTA. `chatSession` is
  // bumped per open so the widget remounts on a fresh thread.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSession, setChatSession] = useState(0);
  // A notification Cori drafted on the Content step; `n` makes each one a new event.
  // The Regular layout notification written on the Content step (by hand or by Cori).
  const [pushDraft, setPushDraft] = useState<RegularLayoutDraft>(EMPTY_REGULAR_DRAFT);
  // What Cori built for this App Push campaign, as opposed to set by hand.
  const [coriMade, setCoriMade] = useState({ audience: false, content: false });
  const [contentSeed, setContentSeed] = useState<{ title: string; message: string; media?: string; n: number } | null>(null);
  const [chatTopic, setChatTopic] = useState<SeededTopic | null>(null);
  const [followUpTopic, setFollowUpTopic] = useState<SeededTopic | null>(null);
  const [followUpSeq, setFollowUpSeq] = useState(0);
  const [enabledAgents, setEnabledAgents] = useState<Set<string>>(new Set());
  const [aiReady, setAiReady] = useState(false);
  const [highlight, setHighlight] = useState<Partial<Record<keyof SetupValues, boolean>>>({});
  const [contentHighlight, setContentHighlight] = useState<
    Partial<Record<keyof ContentValues, boolean>>
  >({});
  const [audienceFlash, setAudienceFlash] = useState(false);
  // The docked chat can play either storyline: the campaign relay, or the
  // Segment agent's thread when an audience pill is picked. Both run in the
  // same column, so picking a pill never takes the user out of the wizard.
  const [chatVariant, setChatVariant] = useState<"campaigns" | "segments">("campaigns");
  const [chatMessage, setChatMessage] = useState<string>();
  // A segment starting point was picked from the audience pills — opens the
  // same segment creation canvas the Segments page uses, on that ask.
  const [segmentPrompt, setSegmentPrompt] = useState<string>();
  // The audience thread seeds once per wizard open, not every time the step is
  // revisited — coming back shouldn't wipe what the user already discussed.
  const audienceSeeded = useRef(false);
  // Whether the open chat is the audience thread — it closes when the step does.
  const audienceChat = useRef(false);
  // The segment Cori has drafted but the marketer hasn't applied yet — it stays
  // in the chat until they choose Apply audience.
  const pendingAudience = useRef<AudienceDraft | null>(null);
  // Scroll container + per-card nodes, so opening a card can bring its header
  // up to the top of the canvas.
  const canvasRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Each new draft gets its own timestamped name — the tracking drawer's
      // medium/campaign defaults follow it, rather than sitting blank until
      // the user opens that drawer and fills them in by hand.
      const freshName = newCampaignName();
      setCampaignName(freshName);
      setSetup((s) => ({ ...s, utmParameters: defaultUtmParameters(channel, freshName) }));
      // App Push's Audience step opens on All contacts, like the reference.
      if (channel === "App Push Notification") setAudience((a) => ({ ...a, mode: "all" }));
      // Channels with a prompt screen land here via it, and its "Build from
      // scratch" opens Audience on continue — every other channel skips that
      // screen, so open Send to itself here instead of starting with every
      // card collapsed.
      if (!hasAIFlow(channel)) {
        setOpenStepIds(new Set(["audience"]));
        setFocusStepId("audience");
      }
      return;
    }
    setShown(false);
    const id = setTimeout(() => {
      setMounted(false);
      setChatOpen(false);
      setChatTopic(null);
      setChatVariant("campaigns");
      setChatMessage(undefined);
      setFollowUpTopic(null);
      setFollowUpSeq(0);
      // Reset only after the panel is gone, so the exit slide doesn't show the
      // wizard snapping back to step 1.
      setIntroOpen(true);
      setGenerating(false);
      setCampaignAIGenerated(false);
      setLaunching(false);
      setOpenStepIds(new Set());
      setFocusStepId(null);
      setCompletedSteps(new Set());
      setRailStepId("audience");
      setSetup(EMPTY_SETUP);
      setAssets(EMPTY_ASSETS);
      setAudience(EMPTY_AUDIENCE);
      setContent(EMPTY_CONTENT);
      setPushDraft(EMPTY_REGULAR_DRAFT);
      setCoriMade({ audience: false, content: false });
      setPreviewOpen(false);
      setStepIndex(0);
      setReachedIndex(0);
      setGoalApprovalOpen(false);
      // Fresh default send time — the module-level one ages with the session.
      setSchedule({ ...EMPTY_SCHEDULE, sendAt: defaultSendAt() });
      setAudienceFlash(false);
      audienceSeeded.current = false;
      setAiReady(false);
      setHighlight({});
      setAppRequiredTried(false);
      setAppRequiredToast(null);
      setConversionTried(false);
    }, SLIDE_MS);
    return () => clearTimeout(id);
  }, [open]);

  // A campaign drafted in Cori's chat lands here fully built, on the preview
  // screen — declared after the open effect above so its values win.
  useEffect(() => {
    if (!open || !prefill || channel !== "App Push Notification") return;
    setCampaignAIGenerated(true);
    audienceChat.current = false;
    setCampaignName(prefill.campaignName);
    setAudience({
      ...EMPTY_AUDIENCE,
      mode: "adhoc",
      selectedApps: CONSUMER_APPS,
      conditions: prefill.conditions,
      conditionsReach: prefill.reach,
    });
    setContent({ ...EMPTY_CONTENT, templateId: prefill.templateId });
    setSchedule({
      ...EMPTY_SCHEDULE,
      sendAt: prefill.sendAt ?? defaultSendAt(),
      mode: prefill.sendAt ? "later" : "optimize",
    });
    setSetup((s) => ({
      ...s,
      tags: prefill.details.tags,
      gaTracking: true,
      conversionTracking: true,
      conversionEvent: "Purchase",
      conversionWindowValue: "7",
      conversionWindowUnit: "Days",
      revenueParameter: "Order value",
      utmParameters: {
        ...s.utmParameters,
        campaign: { enabled: true, value: prefill.campaignName },
        content: { enabled: true, value: "cart_recovery" },
      },
    }));
    setReachedIndex(PUSH_STEPS.length - 1);
    setIntroOpen(false);
    setPreviewOpen(true);
  }, [open, prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flip to open only once the closed panel is actually in the DOM — hence a
  // second effect keyed on `mounted` rather than doing this above. Scheduling
  // it alongside setMounted lets React batch the mount and the transform into
  // one paint, and the slide never runs. The double rAF then guarantees the
  // closed state gets a frame of its own before the transform changes.
  useEffect(() => {
    if (!mounted || !open) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [mounted, open]);

  // Keep the rail pointed at the last card the user opened.
  useEffect(() => {
    if (focusStepId) setRailStepId(focusStepId);
  }, [focusStepId]);

  // Co-marketer suggestions skeleton in while the goal is new, then reveal.
  useEffect(() => {
    if (!setup.goal) {
      setAiReady(false);
      return;
    }
    setAiReady(false);
    const id = setTimeout(() => setAiReady(true), 1600);
    return () => clearTimeout(id);
  }, [setup.goal]);

  // Esc closes, and the page behind shouldn't scroll while we're over it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // Landing on Audience opens the co-marketer, but it doesn't answer anything
  // yet — the thread offers the segment starting points as pills and waits.
  // An AI-generated draft skips this: the campaign already arrived built, so
  // there's nothing left for the co-marketer to open a thread about — unlike
  // "Build from scratch", which still gets the co-marketer by default.
  useEffect(() => {
    if (!open || introOpen || generating) return;
    // Only Email opens the co-marketer here by default — App Push's wizard
    // has never had it pop open on its own, and coming through the prompt
    // screen doesn't change that.
    if (channel !== "Email") return;
    if (focusStepId !== "audience") return;
    if (audienceSeeded.current) return;
    audienceSeeded.current = true;
    if (campaignAIGenerated) return;
    audienceChat.current = true;
    // Previously seeded the Segment agent's cuts thread here:
    // setChatTopic(audienceCutsTopic(setup.goal));
    setChatVariant("campaigns");
    setChatMessage(undefined);
    setChatTopic(null);
    setFollowUpTopic(null);
    setFollowUpSeq(0);
    setChatSession((n) => n + 1);
    setChatOpen(true);
  }, [open, introOpen, generating, focusStepId, campaignAIGenerated, setup.goal, channel]);

  // The audience thread belongs to its step. Actually leaving Audience —
  // its card closes, not just another one opening alongside it — closes the
  // thread rather than carrying an answered conversation into work it has
  // nothing to say about. A chat the user opened themselves from the navbar
  // is left alone.
  useEffect(() => {
    // Every card collapsed isn't "moved on" — the thread stays until another
    // step is actually opened. Nor is opening Message or Schedule while
    // Audience stays expanded alongside it — only Audience itself closing
    // counts as moving away.
    if (!open || !focusStepId || focusStepId === "audience" || !audienceChat.current) return;
    if (openStepIds.has("audience")) return;
    audienceChat.current = false;
    setChatOpen(false);
    setChatTopic(null);
    setFollowUpTopic(null);
    setFollowUpSeq(0);
  }, [open, focusStepId, openStepIds]);

  // App Push: the docked Cori follows the stepper. Moving to another step starts
  // that step's own conversation (Content gets the template prompts) instead of
  // carrying the previous step's thread along.
  const pushStepId = channel === "App Push Notification" ? PUSH_STEPS[stepIndex]?.id : undefined;
  const lastPushStepId = useRef(pushStepId);
  useEffect(() => {
    if (lastPushStepId.current === pushStepId) return;
    lastPushStepId.current = pushStepId;
    if (!chatOpen) return;
    setChatMessage(undefined);
    setChatTopic(null);
    setChatVariant("campaigns");
    setFollowUpTopic(null);
    setFollowUpSeq(0);
    setChatSession((n) => n + 1);
  }, [pushStepId, chatOpen]);

  if (!mounted) return null;

  const toSeeded = (point: CampaignSuggestion): SeededTopic => ({
    prompt: point.prompt,
    reply: point.reply,
    navLabel: point.navLabel,
    // A prompt-only rail card is a question, not an offer — no apply card.
    setupApplyCard: point.promptOnly ? undefined : toSetupApplyCard(point),
  });

  /** Plots a proposed cut onto the audience form as co-marketer-built chips. */
  const applyCohort = (cohort: AudienceCohort) => {
    setAudience((a) => ({
      ...a,
      mode: "segments",
      segments: [
        {
          id: `cohort-${cohort.id}`,
          name: cohort.name,
          reach: cohort.reachable,
          ai: true,
          rationale: {
            status: "Draft",
            members: cohort.matched,
            conditions: cohort.signals,
            why: `${cohort.why} ${cohort.matched.toLocaleString("en-US")} contacts match, of which ${cohort.reachable.toLocaleString("en-US")} are reachable after consent and suppression checks. This cut converts at ${cohort.cvr} historically.`,
          },
        },
      ],
      excludeEnabled: true,
      excludeSegments: [
        {
          id: `suppress-${cohort.id}`,
          name: cohort.exclude.name,
          reach: cohort.exclude.reach,
          ai: true,
          rationale: {
            status: "Draft",
            members: cohort.exclude.reach,
            conditions: [cohort.exclude.name],
            why: "Held back so this campaign doesn't land on contacts who are already being messaged — it keeps the send from competing with itself.",
          },
        },
      ],
      cohortId: cohort.id,
    }));
    setAudienceFlash(true);
    window.setTimeout(() => setAudienceFlash(false), AUDIENCE_FLASH_MS);
  };

  /** Segment saved on the canvas — plot it straight onto the audience form. */
  const plotSavedSegment = (saved: { name: string; count: string; aiGenerated: boolean }) => {
    const reach = Number(String(saved.count).replace(/,/g, "")) || 0;
    setAudience((a) => ({
      ...a,
      mode: "segments",
      segments: [{ id: `seg-${Date.now()}`, name: saved.name, reach, ai: saved.aiGenerated }],
    }));
    setAudienceFlash(true);
    window.setTimeout(() => setAudienceFlash(false), AUDIENCE_FLASH_MS);
  };

  /**
   * Audience pills — the same four starting points the Segments page offers.
   * Picking one replays the Segment agent's thread for that ask in the docked
   * chat, so the wizard stays exactly where it is.
   */
  const isPushChannel = channel === "App Push Notification";
  const audienceStarters = isPushChannel ? PUSH_AUDIENCE_STARTERS : SEGMENT_STARTERS;
  const audienceChips: StarterChip[] = audienceStarters.map((starter) => ({
    label: starter.title,
    icon: Users,
    onSelect: () => {
      // This one chip runs the scripted, autonomous walkthrough instead of
      // replaying the Segment agent's thread — segment straight onto the
      // form, then a chained SeededTopic sequence through template, subject,
      // and schedule (see welcomeNewCustomersFlow.data.ts).
      if (!isPushChannel && starter.title === "Welcome new customers") {
        audienceChat.current = true;
        openTopic(welcomeSegmentTopic(), true);
        return;
      }
      audienceChat.current = true;
      setChatVariant("segments");
      setChatMessage(starter.prompt);
      setChatTopic(null);
      setFollowUpTopic(null);
      setFollowUpSeq(0);
      setChatSession((n) => n + 1);
      setChatOpen(true);
      // Previously handed off to the full-screen segment canvas:
      // setSegmentPrompt(starter.prompt);
    },
  }));

  // App Push Content step: "Cart reminder" asks Cori to write v1 of the notification.
  const pushContentChips: StarterChip[] = PUSH_STEP_CHIPS.content.map((chip) =>
    chip.label === "Cart reminder"
      ? {
          ...chip,
          onSelect: () => {
            setChatMessage(chip.prompts?.[0]);
            setChatTopic(null);
            setFollowUpTopic(null);
            setFollowUpSeq(0);
            setChatSession((n) => n + 1);
            setChatOpen(true);
          },
        }
      : chip,
  );

  // Renaming from the navbar (or the Settings drawer) should carry through to
  // the tracking drawer's own campaign value — but only while that value is
  // still just mirroring the old name; once the user has typed something else
  // in there themselves, a rename shouldn't clobber it.
  const renameCampaign = (name: string) => {
    setCampaignName(name);
    setSetup((s) =>
      s.utmParameters.campaign.value === campaignName
        ? {
            ...s,
            utmParameters: { ...s.utmParameters, campaign: { ...s.utmParameters.campaign, value: name } },
          }
        : s
    );
  };

  const applySetup = (patch: Partial<SetupValues>) => {
    setSetup((s) => {
      const next = { ...s, ...patch };
      if (patch.tags) next.tags = mergeTags(s.tags, patch.tags);
      return next;
    });
    const flashed = Object.fromEntries(
      Object.keys(patch).map((k) => [k, true])
    ) as Partial<Record<keyof SetupValues, boolean>>;
    setHighlight(flashed);
    window.setTimeout(() => setHighlight({}), 1200);
  };

  /** Plots a content suggestion — subject, pre-header, template — onto the form. */
  const applyContent = (patch: Partial<ContentValues>) => {
    setContent((c) => ({ ...c, ...patch }));
    const flashed = Object.fromEntries(
      Object.keys(patch).map((k) => [k, true])
    ) as Partial<Record<keyof ContentValues, boolean>>;
    setContentHighlight(flashed);
    window.setTimeout(() => setContentHighlight({}), 1200);
  };

  /**
   * Drafts a whole campaign from a typed goal — audience, message and
   * schedule all at once — rather than handing the user a blank wizard. The
   * generating screen covers the wizard while this runs, so there's nothing
   * to stagger: every field can land in one pass.
   */
  const applyAIGeneratedCampaign = (prompt: string) => {
    setCampaignAIGenerated(true);
    // Landing on Audience normally opens the co-marketer by default, but a
    // draft that arrived pre-built has nothing left to open a thread about —
    // that auto-open is skipped for an AI-generated campaign (see the
    // `campaignAIGenerated` check in the audience-seed effect). Clearing this
    // ref too guards against a stale `true` left over from a previous open.
    audienceChat.current = false;
    if (channel === "App Push Notification") {
      // Each push goal drafts its own audience, notification and send time.
      // Target apps are filled in too — without them Message and Schedule
      // stay locked.
      const scenario = pushScenarioFor(prompt);
      setReachedIndex(PUSH_STEPS.length - 1);
      setCampaignName(scenario.campaignName);
      setAudience({
        ...EMPTY_AUDIENCE,
        mode: "adhoc",
        selectedApps: scenario.apps,
        conditions: scenario.conditions,
        conditionsReach: scenario.reach,
      });
      setContent({ ...EMPTY_CONTENT, templateId: scenario.templateId });
      setSchedule({
        ...EMPTY_SCHEDULE,
        sendAt: defaultSendAt(),
        mode: "optimize",
        ...scenario.sendAt?.(),
      });
      setSetup((s) => ({
        ...s,
        conversionTracking: true,
        conversionEvent: scenario.conversionEvent,
        conversionWindowValue: scenario.conversionWindowValue,
        conversionWindowUnit: scenario.conversionWindowUnit,
        revenueParameter: scenario.revenueParameter,
        utmParameters: {
          ...s.utmParameters,
          campaign: { ...s.utmParameters.campaign, value: scenario.campaignName },
        },
      }));
      return;
    }
    // A typed goal that matches one of Email's own scenarios gets that
    // specific draft; anything else still falls through to the one default
    // draft below, same as every prompt got before scenarios existed.
    const emailScenario = emailScenarioFor(prompt);
    if (emailScenario) {
      setCampaignName(emailScenario.campaignName);
      setAudience({
        ...EMPTY_AUDIENCE,
        mode: "adhoc",
        conditions: emailScenario.conditions,
        conditionsReach: emailScenario.reach,
      });
      setContent({
        ...EMPTY_CONTENT,
        senderName: emailScenario.senderName,
        subject: emailScenario.subject,
        preHeader: emailScenario.preHeader,
        templateId: emailScenario.templateId,
      });
      setSchedule({ ...EMPTY_SCHEDULE, sendAt: defaultSendAt(), mode: "optimize" });
      setSetup((s) => ({
        ...s,
        conversionTracking: true,
        conversionEvent: emailScenario.conversionEvent,
        conversionWindowValue: emailScenario.conversionWindowValue,
        conversionWindowUnit: emailScenario.conversionWindowUnit,
        revenueParameter: emailScenario.revenueParameter,
        utmParameters: {
          ...s.utmParameters,
          campaign: { ...s.utmParameters.campaign, value: emailScenario.campaignName },
        },
      }));
      return;
    }
    const fallbackCampaignName = "Re-engage Multi-View Shoppers — Free Shipping";
    setCampaignName(fallbackCampaignName);
    setAudience({
      ...EMPTY_AUDIENCE,
      mode: "adhoc",
      conditions: [
        { attribute: "Product viewed", type: "recency", operator: "in the last", value: "30 days", count: 2 },
        { attribute: "Purchase", type: "recency", operator: "not in the last", value: "30 days" },
      ],
      conditionsReach: 28_450,
    });
    setContent({
      ...EMPTY_CONTENT,
      senderName: "Forest Essentials",
      subject: "Still thinking it over? Enjoy free shipping🚛",
      preHeader: "Complete your purchase with free shipping on us.",
      templateId: 9101,
    });
    setSchedule({ ...EMPTY_SCHEDULE, sendAt: defaultSendAt(), mode: "optimize" });
    setSetup((s) => ({
      ...s,
      conversionTracking: true,
      conversionEvent: "Purchase",
      conversionWindowValue: "7",
      conversionWindowUnit: "Days",
      revenueParameter: "Order value",
      utmParameters: {
        ...s.utmParameters,
        campaign: { ...s.utmParameters.campaign, value: fallbackCampaignName },
      },
    }));
  };

  /** "Send" on the intro's prompt box — unlike "Build from scratch", this one
   *  hands the goal to the AI draft instead of an empty wizard. */
  const handleGenerateFromPrompt = (prompt: string) => {
    applyAIGeneratedCampaign(prompt);
    setIntroOpen(false);
    setGenerating(true);
    // Same as "Build from scratch" — land on Send to open rather than every
    // card collapsed, since there's now a filled-in draft worth looking at.
    setOpenStepIds((prev) => new Set(prev).add("audience"));
    setFocusStepId("audience");
  };

  /** The launching pop-up's own timer calls this — hands the finished
   *  campaign to the listing page and closes the wizard behind it. */
  const handleLaunchDone = () => {
    onLaunched?.({ name: campaignName, aiGenerated: campaignAIGenerated });
    setLaunching(false);
    onClose();
  };

  /** Brings a card's header to the top of the canvas once it has opened. */
  const scrollToStep = (id: string) => {
    const container = canvasRef.current;
    const el = cardRefs.current[id];
    if (!container || !el) return;
    const top =
      container.scrollTop +
      (el.getBoundingClientRect().top - container.getBoundingClientRect().top) -
      12;
    container.scrollTo({ top, behavior: "smooth" });
  };

  /** Accordion header: open that card, or shut it if it's already open —
   *  each card is independent, so opening one never closes the others. */
  const toggleStep = (index: number) => {
    const id = STEPS[index].id;
    const isOpen = openStepIds.has(id);
    setOpenStepIds((prev) => {
      const next = new Set(prev);
      if (isOpen) next.delete(id);
      else next.add(id);
      return next;
    });
    if (!isOpen) setFocusStepId(id);
    // Opening Message or Schedule by hand brings the co-marketer back if it
    // was closed, primed for that step's recommendations. An AI-built draft
    // arrives finished, so it stays out of the way.
    if (!isOpen && (id === "content" || id === "schedule") && !chatOpen && !campaignAIGenerated) {
      openFreshChat();
    }
  };

  /** Navbar stepper: make sure a step is open and scroll to it, rather than
   *  toggling it shut the way clicking its own accordion header would. */
  const selectStep = (id: string) => {
    const index = STEPS.findIndex((s) => s.id === id);
    if (index < 0) return;
    setOpenStepIds((prev) => new Set(prev).add(id));
    setFocusStepId(id);
    window.setTimeout(() => scrollToStep(id), 380);
  };

  /** Steps the navbar stepper shows. */
  const navbarSteps = STEPS.map((s) => ({ id: s.id, label: s.label }));

  /** "Done" on a card: mark it finished, close it, and open the next one. */
  const completeStep = (index: number) => {
    const id = STEPS[index].id;
    if (id === "audience" && channel !== "Email" && audience.selectedApps.length === 0) {
      setAppRequiredTried(true);
      setAppRequiredToast("Application is required.");
      return;
    }
    if (id === "audience" && setup.conversionTracking && !setup.conversionEvent.trim()) {
      setConversionTried(true);
      setAppRequiredToast("Conversion goal is not selected.");
      return;
    }
    setCompletedSteps((prev) => new Set(prev).add(id));
    const next = index + 1;
    const nextId = next < STEPS.length ? STEPS[next].id : null;
    // Done marks the card finished and opens the next one, but leaves this
    // card open rather than collapsing it — the next step should be one more
    // thing to fill in, not a reason to lose sight of what was just set up.
    if (nextId) {
      setOpenStepIds((prev) => new Set(prev).add(nextId));
    }
    if (!nextId) {
      setFocusStepId(null);
      return;
    }
    setFocusStepId(nextId);
    // Let the expand transition run before chasing the new position.
    window.setTimeout(() => scrollToStep(nextId), 380);
  };

  /** App Push stepper — NEXT STEP / PREVIEW: check what the current step needs,
   *  then move on (or open the preview from the last step). */
  const goNextPushStep = () => {
    if (stepIndex === 0) {
      if (audience.selectedApps.length === 0) {
        setAppRequiredTried(true);
        setAppRequiredToast("Application is required.");
        return;
      }
      if (setup.conversionTracking && !setup.conversionEvent.trim()) {
        setConversionTried(true);
        setAppRequiredToast("Conversion goal is not selected.");
        return;
      }
    }
    if (stepIndex >= PUSH_STEPS.length - 1) {
      setPreviewOpen(true);
      return;
    }
    const next = stepIndex + 1;
    setStepIndex(next);
    setReachedIndex((r) => Math.max(r, next));
    canvasRef.current?.scrollTo({ top: 0 });
  };

  /** Has this step got enough on it to read as done? */
  const isStepComplete = (id: string): boolean => {
    switch (id) {
      case "assets":
        return assets.selectedAssets.length > 0;
      case "audience":
        return reachFor(audience) > 0;
      case "content":
        return Boolean(content.subject || content.templateId);
      // Nothing here is required — the goal question is out, and a send
      // time always has a default.
      case "schedule":
        return true;
      default:
        return false;
    }
  };

  /** One-line recap shown on a finished card while it's collapsed. */
  const summaryFor = (id: string): ReactNode => {
    switch (id) {
      case "assets": {
        const n = assets.selectedAssets.length;
        return n === 0 ? "No app selected" : `${n} app${n === 1 ? "" : "s"} selected`;
      }
      case "audience": {
        const reachable = `${reachFor(audience).toLocaleString()} reachable`;
        if (audience.mode === "segments") {
          if (audience.segments.length === 0) return `No segment selected · ${reachable}`;
          return (
            <span className="inline-flex min-w-0 items-center gap-1.5 overflow-hidden">
              {audience.segments.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#DDE2EE] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#17173A]"
                >
                  {s.ai && <Sparkles className="size-2.5 shrink-0 text-[#7B5CFA]" strokeWidth={2.2} />}
                  {s.name}
                </span>
              ))}
              <span className="shrink-0 font-semibold text-[#17173A]">· {reachable}</span>
            </span>
          );
        }
        const who =
          audience.mode === "all"
            ? "All contacts"
            : audience.mode === "table"
              ? audience.table || "No table selected"
              : audience.conditions.length === 0
                ? "No conditions added"
                : `${audience.conditions.length} condition${audience.conditions.length === 1 ? "" : "s"}`;
        return `${who} · ${reachable}`;
      }
      case "content": {
        const template = emailTemplates.find((t) => t.id === content.templateId);
        return (
          [content.subject, template?.name].filter(Boolean).join(" · ") || "Nothing written yet"
        );
      }
      case "schedule": {
        const when =
          schedule.mode === "now"
            ? "As soon as this is published"
            : schedule.mode === "later"
              ? describeSlot(schedule.sendAt)
              : schedule.mode === "slice"
                ? sliceSummaryLabel(schedule, reachFor(audience))
                : `Optimised per contact · ${schedule.optimizeWindow}`;
        const goalBits = [
          setup.gaTracking ? "GA tracking on" : null,
          setup.conversionTracking ? "Conversion tracking on" : null,
        ].filter(Boolean);
        return [when, ...goalBits].join(" · ");
      }
      default:
        return "";
    }
  };

  /** A draft (then a refined draft) from Cori's conversation, plotted onto the
   *  Audience fields the same way a picked cut is. */
  const plotAudienceDraft = (d: AudienceDraft) => {
    setAudience((a) => ({
      ...a,
      mode: "adhoc",
      conditions: d.conditions,
      conditionsReach: d.reach,
      excludeEnabled: d.excludes.length > 0,
      excludeSegments: d.excludes.map((e) => ({ id: e.id, name: e.name, reach: e.reach, ai: true })),
    }));
    setAudienceFlash(true);
    window.setTimeout(() => setAudienceFlash(false), AUDIENCE_FLASH_MS);
  };

  /** The summary card and the Apply / Continue refining question live in the chat;
   *  the wizard only plots the segment once the marketer applies it. */
  const audienceAgentHost: AudienceAgentHost = {
    // A draft only lives in the chat card; the form is untouched until Apply.
    onDraft: (d) => {
      pendingAudience.current = d;
    },
    onDecision: (decision) => {
      if (decision !== "apply" || !pendingAudience.current) return;
      plotAudienceDraft(pendingAudience.current);
      pendingAudience.current = null;
      setCoriMade((m) => ({ ...m, audience: true }));
    },
  };

  /**
   * "Build with Audience agent": open the docked chat and put the agent's
   * questions above its composer. It can't cut an audience without knowing
   * what the campaign is for, so it asks before doing anything.
   */
  const askGoalForSegment = () => {
    audienceChat.current = true;
    // No seeded topic: the agent has nothing to say until it knows the goal,
    // and seeding one posted a user turn, started a generation behind the
    // card and left the composer shimmering while it waited. The card is the
    // whole turn.
    setChatVariant("campaigns");
    setChatMessage(undefined);
    setChatTopic(null);
    setFollowUpTopic(null);
    setFollowUpSeq(0);
    setGoalApprovalOpen(true);
    setChatSession((n) => n + 1);
    setChatOpen(true);
  };

  /** The answers came back — record the goal, drop the card, and let it cut. */
  const handleGoalApproved = (goalValue: string, brief = "", goalText = "", transcript = "") => {
    setGoalApprovalOpen(false);
    // Only a picked goal is the campaign's goal — typed text and a skip are
    // instructions to the agent, not values for the setup step's field.
    if (goalValue) setSetup((st) => ({ ...st, goal: goalValue }));
    // Same thread the cohort cards and their "Review audience" apply use.
    setFollowUpTopic(audienceCutsTopic(goalValue, brief, goalText, transcript));
    setFollowUpSeq((n) => n + 1);
  };

  /** Opens a brand-new co-marketer thread, from either header CTA. Not tied to
   *  the audience step, so it's exempt from the auto-close effect below —
   *  expanding a card elsewhere in the wizard shouldn't dismiss a chat the
   *  user opened themselves from the navbar. */
  const openFreshChat = () => {
    audienceChat.current = false;
    setGoalApprovalOpen(false);
    setChatVariant("campaigns");
    setChatMessage(undefined);
    setChatTopic(null);
    setFollowUpTopic(null);
    setFollowUpSeq(0);
    setChatSession((n) => n + 1);
    setChatOpen(true);
  };

  /** Drops a topic into the docked chat, opening it if it isn't up yet. */
  const openTopic = (topic: SeededTopic, fromAudienceStep = false) => {
    audienceChat.current = fromAudienceStep;
    setGoalApprovalOpen(false);
    if (chatOpen) {
      setFollowUpTopic(topic);
      setFollowUpSeq((n) => n + 1);
      return;
    }
    setChatVariant("campaigns");
    setChatMessage(undefined);
    setChatTopic(topic);
    setChatSession((n) => n + 1);
    setChatOpen(true);
  };

  /** A preview finding, as a thread the co-marketer is already answering. */
  const findingTopic = (finding: Finding): SeededTopic => {
    const action = finding.action;
    const patchText = () => {
      const sp = action?.schedulePatch;
      const cp = action?.contentPatch;
      const stp = action?.setupPatch;
      if (sp?.mode === "optimize") return "Optimised per contact, inside the next 24 hours";
      if (sp?.mode === "later" && sp.sendAt) return describeSlot(sp.sendAt);
      if (sp?.skipFrequencyCap === false) return "Respect the account frequency cap";
      if (cp?.subject) return cp.subject;
      if (cp?.preHeader) return cp.preHeader;
      if (cp?.templateId) {
        const t = emailTemplates.find((x) => x.id === cp.templateId);
        return t ? `${t.name} (Id: ${t.id})` : "Recommended template";
      }
      if (stp?.conversionEvent) return stp.conversionEvent;
      const pp = action?.pushDraftPatch;
      if (pp?.landing) return `Open the ${pp.landing.toLowerCase()} on tap`;
      if (pp?.android?.buttons?.[0]?.label) return `Action button: ${pp.android.buttons[0].label}`;
      return undefined;
    };

    return {
      prompt: finding.askLabel,
      navLabel: finding.category,
      reply:
        `${finding.detail}\n\n**Evidence** — ${finding.evidence}\n\n` +
        (action
          ? "I can fix it from here, or you can open the step and do it by hand."
          : `This one needs the ${finding.link.stepLabel} step — open it and I'll stay on this thread while you change it.`),
      setupApplyCard: action
        ? {
            kind: action.kind,
            title: finding.title,
            applyLabel: action.label,
            appliedLabel: "Applied",
            blurb: finding.impact,
            text: patchText(),
            contentPatch: action.contentPatch,
            schedulePatch: action.schedulePatch,
            pushDraftPatch: action.pushDraftPatch,
            patch: action.setupPatch,
          }
        : undefined,
    };
  };

  /** "Audit campaign" — the same review the preview screen's co-marketer rail
   *  runs, asked for from inside the wizard instead of waiting until publish.
   *  The findings land as cards on this one thread turn. */
  const auditTopic = (findings: Finding[]): SeededTopic => ({
    prompt: "Audit this campaign before I publish it.",
    navLabel: "Audit",
    reply:
      findings.length === 0
        ? "I've been through this one and found nothing that would hold it back."
        : `I went through this campaign against your last 90 days. ${findings.length} thing${
            findings.length === 1 ? "" : "s"
          } worth fixing before it goes out.`,
    findings,
  });

  // A whole campaign built from Cori's brief has nothing for the review to flag;
  // otherwise only the parts Cori built herself are left alone.
  const pushAiMade = prefill
    ? { timing: true, audience: true, content: true }
    : { audience: coriMade.audience, content: coriMade.content && content.templateId === null };

  const handleAuditCampaign = () => {
    // An AI-built campaign was already drafted against the account's best-
    // performing patterns — there's nothing left for the audit to flag, so
    // skip running it and say so instead of surfacing manual-build findings.
    if (campaignAIGenerated) {
      openTopic({
        prompt: "Audit this campaign before I publish it.",
        navLabel: "Audit",
        reply:
          "I've taken a look at your campaign and checked for potential issues. Everything looks good to go!🚀",
        findings: [],
      });
      return;
    }
    // A scripted walkthrough for one specific demo setup — the "High-Intent
    // Re-Engagers" segment with the "Exclusive Deals" template — rather than
    // the computed audit, so the same three findings show every time.
    if (isExclusiveDealsReviewScenario({ audience, content })) {
      applyContent({ senderName: "promotions" });
      openTopic({
        prompt: "Audit this campaign before I publish it.",
        navLabel: "Audit",
        reply: EXCLUSIVE_DEALS_REVIEW_REPLY,
        findings: exclusiveDealsReviewFindings(),
      });
      return;
    }
    if (isPushChannel) {
      openTopic(auditTopic(buildPushFindings({ audience, content, schedule, draft: pushDraft, aiMade: pushAiMade })));
      return;
    }
    openTopic(auditTopic(buildFindings({ setup, audience, content, schedule })));
  };

  /* Co-marketer chat — docked column. Opened from a suggestion card (seeded
     on that prompt), from a preview finding, or from "Ask co-marketer" in
     either header. Rendered beside whichever screen is up. */
  // App Push drives its steps from the stepper, not the accordion rail, so the
  // chat's starter chips and greeting follow the step on screen.
  const chatStepId = isPushChannel ? PUSH_STEPS[stepIndex].id : railStepId;
  const chatColumn = chatOpen ? (
    <div className="flex h-full min-h-0 w-[474px] shrink-0 justify-end overflow-hidden py-3">
      <ChatInterface
        key={chatSession}
        initialExpanded={false}
        docked
        conversationVariant={chatVariant}
        initialMessage={chatMessage}
        starterChipSet={
          chatStepId === "audience"
            ? audienceChips
            // Schedule has no starter chips of its own — an empty array (not
            // undefined) so the chat doesn't fall back to the generic set.
            : chatStepId === "schedule"
              ? []
              : (isPushChannel ? (chatStepId === "content" ? { ...PUSH_STEP_CHIPS, content: pushContentChips } : PUSH_STEP_CHIPS) : STEP_CHIPS)[chatStepId]
        }
        emptyStateGreeting={STEP_GREETINGS[chatStepId]}
        emptyStatePlaceholder={STEP_PLACEHOLDERS[chatStepId]}
        initialTopic={chatTopic ?? undefined}
        // A segment the agent built — its rules land on the Conditions tab as
        // editable rows, rather than as a read-only segment the user can't
        // adjust from inside the wizard.
        artifactActionLabel="Use segment conditions"
        onReviewArtifact={(card) => {
          const conditions = segmentConditionsFor(card.title, card.description);
          if (conditions.length === 0) return;
          const reach = Number(String(card.stats?.[0]?.label ?? "").replace(/[^0-9]/g, "")) || 0;
          setAudience((a) => ({
            ...a,
            mode: "adhoc",
            conditions,
            conditionsReach: reach || undefined,
          }));
          setAudienceFlash(true);
          window.setTimeout(() => setAudienceFlash(false), AUDIENCE_FLASH_MS);
        }}
        followUpTopic={followUpTopic}
        followUpSeq={followUpSeq}
        audienceAgent={audienceAgentHost}
        contentAgent={
          isPushChannel && chatStepId === "content"
            ? {
                onDraft: (d) => {
                  setContentSeed({ title: d.title, message: d.message, media: d.media, n: Date.now() });
                  setCoriMade((m) => ({ ...m, content: true }));
                },
              }
            : undefined
        }
        approvalCard={
          goalApprovalOpen ? (
            <GoalApprovalCard
              questions={AUDIENCE_QUESTIONS}
              title="Segment agent"
              onSubmit={(answers) => {
                // None of the three is required — a skip means "you decide",
                // so the agent still runs on whatever it was given, including
                // free text typed instead of a pick.
                handleGoalApproved(
                  answers[0]?.values[0] ?? "",
                  audienceBrief(
                    answers[1]?.values[0],
                    answers[2]?.values ?? [],
                    answers[2]?.custom ?? "",
                  ),
                  answers[0]?.custom ?? "",
                  describeApprovalAnswers(AUDIENCE_QUESTIONS, answers),
                );
              }}
              onDismiss={() => setGoalApprovalOpen(false)}
            />
          ) : null
        }
        onAskFinding={(finding) => openTopic(findingTopic(finding))}
        onSetupApply={(card, selectedId) => {
          const cohort = card.cohorts?.find((c) => c.id === selectedId);
          if (cohort) {
            applyCohort(cohort);
            return;
          }
          // App Push review: a change to the notification being drafted.
          if (card.pushDraftPatch) {
            setPushDraft((d) => ({ ...d, ...card.pushDraftPatch }));
            return;
          }
          // App Push: Cori's hand-off from Audience to the Content step.
          if (card.kind === "cta" && card.title === PUSH_CONTENT_CTA) {
            const to = PUSH_STEPS.findIndex((st) => st.id === "content");
            setStepIndex(to);
            setReachedIndex((r) => Math.max(r, to));
            canvasRef.current?.scrollTo({ top: 0 });
            return;
          }
          // The "Welcome new customers" walkthrough's own chain — each card
          // both patches real form state and opens the next scripted topic.
          if (card.kind === "audience" && card.title === "Audience match") {
            setAudience((a) => ({
              ...a,
              mode: "adhoc",
              conditions: WELCOME_SEGMENT_CONDITIONS,
              conditionsReach: WELCOME_SEGMENT_REACH,
            }));
            openTopic(welcomeCraftMessageTopic());
            return;
          }
          if (card.kind === "cta" && card.title === "Craft the message") {
            setOpenStepIds((prev) => new Set(prev).add("content"));
            setFocusStepId("content");
            window.setTimeout(() => scrollToStep("content"), 380);
            openTopic(welcomeTemplatesTopic());
            return;
          }
          if (card.templates) {
            const tpl = card.templates.find((t) => String(t.templateId) === selectedId);
            if (tpl) {
              applyContent({ templateId: tpl.templateId });
              openTopic(welcomeSubjectOptionsTopic(tpl.name));
            }
            return;
          }
          if (card.subjectOptions) {
            const opt = card.subjectOptions[Number(selectedId)];
            if (opt) {
              applyContent({ subject: opt.subject, preHeader: opt.preHeader });
              setOpenStepIds((prev) => new Set(prev).add("schedule"));
              setFocusStepId("schedule");
              window.setTimeout(() => scrollToStep("schedule"), 380);
              openTopic(welcomeScheduleChoiceTopic(opt.subject));
            }
            return;
          }
          if (card.kind === "scheduleChoice") {
            if (selectedId === "optimize") {
              setSchedule((s) => ({ ...s, mode: "optimize", optimizeWindow: "Next 24 hours" }));
              openTopic(welcomeSendTimeRecommendationTopic());
            } else {
              window.setTimeout(() => scrollToStep("schedule"), 380);
            }
            return;
          }
          if (card.kind === "sendTimeRecommendation") {
            if (selectedId === "use") {
              setSchedule((s) => ({ ...s, mode: "later", sendAt: welcomeRecommendedSendAt() }));
              const templateName = emailTemplates.find((t) => t.id === content.templateId)?.name ?? "your template";
              openTopic(
                welcomeSummaryTopic({
                  templateName,
                  subject: content.subject,
                  sendTimeLabel: "Tomorrow at 10:30 AM",
                })
              );
            } else {
              setOpenStepIds((prev) => new Set(prev).add("schedule"));
              setFocusStepId("schedule");
              window.setTimeout(() => scrollToStep("schedule"), 380);
            }
            return;
          }
          if (card.kind === "cta" && card.title === "Launch campaign") {
            // Same action as the navbar's own Launch button — the launching
            // pop-up still runs its full course before the campaign lands on
            // the listing page, so this isn't a silent bypass of that step.
            setLaunching(true);
            return;
          }
          if (card.contentPatch) {
            applyContent(card.contentPatch);
            return;
          }
          if (card.schedulePatch) {
            setSchedule((s) => ({ ...s, ...card.schedulePatch }));
            return;
          }
          if (card.patch) applySetup(card.patch);
        }}
        isSetupApplyApplied={(card) =>
          card.pushDraftPatch
            ? isPushDraftPatchApplied(card.pushDraftPatch, pushDraft)
            : card.contentPatch
            ? isContentPatchApplied(card.contentPatch, content)
            : card.schedulePatch
              ? isSchedulePatchApplied(card.schedulePatch, schedule)
              : card.patch
                ? isPatchApplied(card.patch, setup)
                : false
        }
        appliedCohortId={audience.cohortId}
        enabledAgents={enabledAgents}
        setEnabledAgents={setEnabledAgents}
        onCloseInterface={() => {
          audienceChat.current = false;
          setGoalApprovalOpen(false);
          setChatOpen(false);
          setChatTopic(null);
          setChatVariant("campaigns");
          setChatMessage(undefined);
        }}
      />
    </div>
  ) : null;

  const Icon = CHANNEL_ICONS[channel] ?? Mail;
  const goal = goalLabel(setup.goal);
  // The suggestion rail stays closed until the campaign has a goal — before
  // that there's nothing for the co-marketer to be relevant about — and stands
  // down whenever the chat is docked, so the co-marketer is only ever in one
  // place. Closing the chat brings the rail back, which is the way back into
  // the conversation on a step whose thread has already been dismissed.
  const showAIPanel = Boolean(goal) && !chatOpen;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Create ${channel} campaign`}
      className={cn(
        "campaign-create-shell fixed inset-0 z-[60] flex flex-col bg-[#F4F8FF]",
        "transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "motion-reduce:transition-none",
        shown ? "translate-y-0" : "translate-y-full"
      )}
    >
      {launching && (
        <CampaignLaunchingModal campaignName={campaignName} onDone={handleLaunchDone} />
      )}
      {appRequiredToast && (
        <ErrorToast message={appRequiredToast} onDismiss={() => setAppRequiredToast(null)} />
      )}

      {hasAIFlow(channel) && introOpen ? (
        <CampaignCreationIntro
          channel={channel}
          icon={Icon}
          campaignName={campaignName}
          onRenameCampaign={renameCampaign}
          onContinue={() => {
            setIntroOpen(false);
            // Land on Audience open by default, same as the co-marketer
            // being up already — the intro screen was already a co-marketer
            // prompt. The auto-open effect below ties the thread to the
            // audience step once it sees the focus land here.
            setOpenStepIds((prev) => new Set(prev).add("audience"));
            setFocusStepId("audience");
          }}
          onGenerate={handleGenerateFromPrompt}
          onClose={onClose}
        />
      ) : hasAIFlow(channel) && generating ? (
        <CampaignAIGenerating
          icon={Icon}
          campaignName={campaignName}
          onClose={onClose}
          onDone={() => setGenerating(false)}
        />
      ) : previewOpen ? (
        <CampaignPreview
          campaignId="1234"
          campaignName={campaignName}
          setup={setup}
          audience={audience}
          content={content}
          schedule={schedule}
          onBack={() => setPreviewOpen(false)}
          onPublish={prefill || isPushChannel ? () => setLaunching(true) : onClose}
          publishLabel={prefill ? (prefill.sendAt ? "Schedule campaign" : "Launch campaign") : undefined}
          onEditStep={(stepId) => {
            if (isPushChannel) {
              // The stepper has its own Setup step; the preview's "Setup" card
              // (tracking) lives there too, the rest map one-to-one.
              const to = Math.max(0, PUSH_STEPS.findIndex((st) => st.id === (stepId === "schedule" ? "schedule" : stepId)));
              setStepIndex(to);
              setReachedIndex(PUSH_STEPS.length - 1);
              setPreviewOpen(false);
              return;
            }
            setOpenStepIds((prev) => new Set(prev).add(stepId));
            setFocusStepId(stepId);
            setPreviewOpen(false);
          }}
          onAskCoMarketer={openFreshChat}
          onAskFinding={(finding) => openTopic(findingTopic(finding))}
          chatOpen={chatOpen}
          chatSlot={chatColumn}
          channel={channel}
          pushDetails={prefill?.details}
          customDraft={pushDraft}
          aiMade={pushAiMade}
        />
      ) : isPushChannel ? (
        <>
          <PushCampaignNavbar
            campaignName={campaignName}
            aiGenerated={campaignAIGenerated}
            icon={Icon}
            isLastStep={stepIndex === PUSH_STEPS.length - 1}
            onRenameCampaign={renameCampaign}
            onAskCoMarketer={openFreshChat}
            onFinishLater={onClose}
            onNext={goNextPushStep}
            onClose={onClose}
          />
          <CampaignCreationStepper
            steps={PUSH_STEPS}
            activeIndex={stepIndex}
            reachedIndex={reachedIndex}
            campaignId="1234"
            lastSaved="just now"
            onStepSelect={setStepIndex}
          />
          <div className="flex min-h-0 flex-1">
          {/* Same 56px side inset as the navbar and step strip, so the cards sit
              under the icon/"Setup" on the left and the close box on the right. */}
          <div
            ref={canvasRef}
            className={cn(
              "scroll-slim min-w-0 flex-1 overflow-y-auto py-6 pl-14",
              chatOpen ? "pr-6" : "pr-14"
            )}
          >
            {/* 3/4 of the canvas by default; with Cori docked the canvas is already
                narrower, so the content takes all of it. The layout picker also takes
                it all — seven cards a row need the room (see PushContentStep). */}
            <div className={chatOpen || PUSH_STEPS[stepIndex].id === "content" ? "w-full" : "w-3/4"}>
              {PUSH_STEPS[stepIndex].id === "setup" && (
                // The old accordion rows for apps / tracking / conversion
                // (CampaignAudienceStep part="setup") are parked for now.
                <PushSetupStep
                  campaignName={campaignName}
                  onRename={renameCampaign}
                  selectedApps={audience.selectedApps}
                  onAppsChange={(selectedApps) => setAudience((a) => ({ ...a, selectedApps }))}
                  appsError={
                    appRequiredTried && audience.selectedApps.length === 0
                      ? "Select at least one target app."
                      : undefined
                  }
                  setup={setup}
                  onSetupChange={(patch) => setSetup((st) => ({ ...st, ...patch }))}
                  controlGroupEnabled={schedule.controlGroupEnabled}
                  onControlGroupChange={(controlGroupEnabled) =>
                    setSchedule((sc) => ({ ...sc, controlGroupEnabled }))
                  }
                  conversionEventError={
                    conversionTried && setup.conversionTracking && !setup.conversionEvent.trim()
                      ? "Conversion goal is not selected."
                      : undefined
                  }
                />
              )}
              {PUSH_STEPS[stepIndex].id === "audience" && (
                <CampaignAudienceStep
                  onUseSegmentAgent={askGoalForSegment}
                  part="flow"
                  values={audience}
                  highlight={audienceFlash}
                  onChange={(patch) => setAudience((a) => ({ ...a, ...patch }))}
                  tracking={{
                    gaTracking: setup.gaTracking,
                    conversionTracking: setup.conversionTracking,
                    conversionEvent: setup.conversionEvent,
                    conversionWindowValue: setup.conversionWindowValue,
                    conversionWindowUnit: setup.conversionWindowUnit,
                    revenueParameter: setup.revenueParameter,
                    utmParameters: setup.utmParameters,
                    keyValueParameters: setup.keyValueParameters,
                    conversionPayloadParameters: setup.conversionPayloadParameters,
                  }}
                  onTrackingChange={(patch) => setSetup((st) => ({ ...st, ...patch }))}
                  channel={channel}
                  campaignName={campaignName}
                />
              )}
              {PUSH_STEPS[stepIndex].id === "content" && (
                // The layout picker + template drawer. The earlier template grid
                // with A/B test (CampaignContentStep) is parked for push.
                <PushContentStep
                  seed={contentSeed}
                  draft={pushDraft}
                  onDraftChange={(update) => setPushDraft(update)}
                  onCreateFresh={() => setCoriMade((m) => ({ ...m, content: false }))}
                  values={content}
                  onChange={(patch) => setContent((c) => ({ ...c, ...patch }))}
                />
              )}
              {PUSH_STEPS[stepIndex].id === "schedule" && (
                <CampaignScheduleStep
                  values={schedule}
                  onChange={(patch) => setSchedule((sc) => ({ ...sc, ...patch }))}
                  audienceCount={reachFor(audience)}
                />
              )}
            </div>
          </div>
          {/* chatColumn carries py-3; the canvas beside it has py-6 — the extra 12px
              here lines the panel's top and bottom up with the cards. */}
          {chatOpen && <div className="flex h-full min-h-0 shrink-0 py-3 pr-14">{chatColumn}</div>}
          </div>
        </>
      ) : (
        <>
      <CampaignCreationNavbar
        campaignName={campaignName}
        aiGenerated={campaignAIGenerated}
        icon={Icon}
        channelLabel={channel}
        onRenameCampaign={renameCampaign}
        onOpenSettings={() => setSettingsOpen(true)}
        onLaunch={() => setLaunching(true)}
        onAskCoMarketer={openFreshChat}
        onClose={onClose}
        steps={navbarSteps}
        activeStepId={focusStepId}
        onSelectStep={selectStep}
      />

      {/* Step rail — replaced by the accordion below. Kept for reference.
      <CampaignCreationStepper
        steps={STEPS}
        activeIndex={activeIndex}
        campaignId="1234"
        lastSaved="just now"
        onStepSelect={setActiveIndex}
      />
      */}

      {/* Keep the canvas beside the docked chat with only the shared row gap.
          Any spare width belongs on the left, not between the two panels. */}
      <div
        className={cn(
          "flex min-h-0 flex-1 gap-5",
          chatOpen ? "pl-[7.875rem] pr-5" : "pl-[20rem] pr-[20rem]"
        )}
      >
        <div
          ref={canvasRef}
          className="scroll-hidden min-w-0 flex-1 overflow-y-auto py-6"
        >
          <div className="cc-accordion ov2-accordion">
            {/* Push channels can't configure Message/Schedule before at least
                one target app is picked in Send to — those two cards stay
                locked (and explain why on hover) until then. */}
            {(() => {
              const targetAppSelectionRequired =
                channel !== "Email" && audience.selectedApps.length === 0;

              return STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const active = openStepIds.has(step.id);
                const complete =
                  !active && completedSteps.has(step.id) && isStepComplete(step.id);
                const state = active ? "active" : complete ? "complete" : "idle";
                const locked =
                  targetAppSelectionRequired && (step.id === "content" || step.id === "schedule");

                const header = (
                  <div
                    role="button"
                    tabIndex={locked ? -1 : 0}
                    aria-disabled={locked}
                    className={cn("ov2-card-header", locked && "cursor-not-allowed opacity-50")}
                    aria-expanded={active}
                    onClick={() => !locked && toggleStep(index)}
                    onKeyDown={(e) => {
                      if (locked) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleStep(index);
                      }
                    }}
                  >
                    <span className="ov2-badge">
                      {complete ? <Check /> : <StepIcon />}
                    </span>
                    <span className="ov2-card-label">
                      <strong>{step.label}</strong>
                      {step.id === "assets" ||
                      step.id === "audience" ||
                      step.id === "content" ||
                      step.id === "schedule" ? (
                        active && (
                          <span className="ov2-card-desc">{STEP_DESCRIPTIONS[step.id]}</span>
                        )
                      ) : complete ? (
                        <span className="ov2-card-summary">{summaryFor(step.id)}</span>
                      ) : (
                        <span className="ov2-card-desc">{STEP_DESCRIPTIONS[step.id]}</span>
                      )}
                    </span>
                    {/* App Push keeps expanded reach beside the header chevron. */}
                    {step.id === "audience" && active && channel === "App Push Notification" && (
                      <div
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <AudienceReachStat reach={reachFor(audience)} />
                      </div>
                    )}
                    {/* Collapsed reach stays in its existing pill for every channel. */}
                    {step.id === "audience" && !active && (
                      <div
                        className="relative flex shrink-0 items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ConfigPendingPill
                          count={setup.conversionTracking && !setup.conversionEvent.trim() ? 1 : 0}
                        />
                        <AudienceReachablePill reach={reachFor(audience)} />
                      </div>
                    )}
                    <ChevronDown className="ov2-chevron" />
                  </div>
                );

                return (
                  <section
                    key={step.id}
                    ref={(el) => (cardRefs.current[step.id] = el)}
                    data-step-id={step.id}
                    className={cn("ov2-card", state)}
                  >
                    {locked ? (
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>{header}</TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="start"
                            sideOffset={8}
                            className="overflow-visible rounded-lg border-0 bg-black px-3 py-1.5 text-white shadow-none"
                          >
                            <p className="font-manrope text-xs leading-[18px]">
                              Select a target app to proceed ahead.
                            </p>
                            <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      header
                    )}

                  <div className={`ov2-card-bodywrap${active ? " open" : ""}`}>
                    <div className="ov2-card-bodywrap-inner">
                      <div className="ov2-card-body">
                        {step.id === "assets" && (
                          <CampaignAssetsStep
                            values={assets}
                            onChange={(patch) => setAssets((a) => ({ ...a, ...patch }))}
                          />
                        )}
                        {step.id === "audience" && (
                          <div className="relative">
                            <CampaignAudienceStep
                              onUseSegmentAgent={askGoalForSegment}
                              values={audience}
                              highlight={audienceFlash}
                              onChange={(patch) => setAudience((a) => ({ ...a, ...patch }))}
                              tracking={{
                                gaTracking: setup.gaTracking,
                                conversionTracking: setup.conversionTracking,
                                conversionEvent: setup.conversionEvent,
                                conversionWindowValue: setup.conversionWindowValue,
                                conversionWindowUnit: setup.conversionWindowUnit,
                                revenueParameter: setup.revenueParameter,
                                utmParameters: setup.utmParameters,
                                keyValueParameters: setup.keyValueParameters,
                                conversionPayloadParameters: setup.conversionPayloadParameters,
                              }}
                              onTrackingChange={(patch) => setSetup((s) => ({ ...s, ...patch }))}
                              trackingHighlight={highlight}
                              channel={channel}
                              campaignName={campaignName}
                              appsError={
                                appRequiredTried && audience.selectedApps.length === 0
                                  ? "Select at least one target app."
                                  : undefined
                              }
                              conversionEventError={
                                conversionTried &&
                                setup.conversionTracking &&
                                !setup.conversionEvent.trim()
                                  ? "Conversion goal is not selected."
                                  : undefined
                              }
                            />
                            {/* Pinned over the card's own top-right corner rather than
                                sat beside it as a full-height flex column — a full-height
                                column made every row below the first one lose that same
                                width, even though only the top row shares this space.
                                right-0/top-0, not right-8/top-8: campaign-creation.css
                                zeroes StepCard's own border+p-8 inside the accordion body
                                (avoids a double border/padding look), so this "relative"
                                wrapper's edges already sit flush with the card's real
                                content edges — an 8-unit inset would double-count padding
                                that isn't actually there and misalign from the tracking
                                box/dropdown below it. */}
                            {channel !== "App Push Notification" && (
                              <div className="absolute right-0 top-0">
                                <AudienceReachStat reach={reachFor(audience)} />
                              </div>
                            )}
                          </div>
                        )}
                        {step.id === "content" && (
                          <CampaignContentStep
                            values={content}
                            highlight={contentHighlight}
                            onChange={(patch) => setContent((c) => ({ ...c, ...patch }))}
                            reach={reachFor(audience)}
                            aiGenerated={campaignAIGenerated}
                            channel={channel}
                            hasTargetApps={audience.selectedApps.length > 0}
                          />
                        )}
                        {step.id === "schedule" && (
                          <>
                            <CampaignScheduleStep
                              values={schedule}
                              onChange={(patch) => setSchedule((s) => ({ ...s, ...patch }))}
                              audienceCount={reachFor(audience)}
                            />
                            <div className="mt-8">
                              <CampaignSetupStep
                                values={setup}
                                highlight={highlight}
                                onChange={(patch) => setSetup((s) => ({ ...s, ...patch }))}
                              />
                            </div>
                          </>
                        )}

                        <div className="ov2-card-actions">
                          <Button type="button" onClick={() => completeStep(index)}>
                            Done
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              );
            });
          })()}
          </div>

          {/* Same treatment as the navbar's "Ask co-marketer" CTA — white fill,
              rotating conic-gradient ring (.snake-border), sparkle GIF. */}
          <div className="mt-5">
            <button
              type="button"
              onClick={handleAuditCampaign}
              className="relative z-[1] flex h-8 items-center gap-1.5 overflow-hidden rounded-lg bg-white px-2.5 transition-shadow hover:shadow-sm"
            >
              <span aria-hidden="true" className="snake-border" />
              <img src={sparkle} alt="" className="relative z-[1] h-5 w-5" />
              <span className="relative z-[1] font-manrope text-xs font-semibold tracking-[0.42px] text-ash">
                Review with audit agent
              </span>
            </button>
          </div>

          {/* One step at a time, driven by the rail above. Replaced by the
              accordion; kept for reference.
          {activeStep.id === "setup" ? (
            <CampaignSetupStep
              values={setup}
              highlight={highlight}
              onChange={(patch) => setSetup((s) => ({ ...s, ...patch }))}
            />
          ) : activeStep.id === "audience" ? (
            <CampaignAudienceStep
              onUseSegmentAgent={askGoalForSegment}
              values={audience}
              highlight={audienceFlash}
              onChange={(patch) => setAudience((a) => ({ ...a, ...patch }))}
            />
          ) : activeStep.id === "content" ? (
            <CampaignContentStep
              values={content}
              highlight={contentHighlight}
              onChange={(patch) => setContent((c) => ({ ...c, ...patch }))}
            />
          ) : (
            <CampaignScheduleStep
              values={schedule}
              onChange={(patch) => setSchedule((s) => ({ ...s, ...patch }))}
            />
          )}
          */}
        </div>

        {/* Standing suggestion rail — not part of phase 1. The co-marketer now
            leads with the open step's chips inside the chat instead.
        {showAIPanel && (
          <CampaignAIPanel
            key={setup.goal}
            stepId={railStepId}
            goal={setup.goal}
            loading={!aiReady}
            values={setup}
            contentValues={content}
            scheduleValues={schedule}
            onAsk={(point) => {
              // "Audience options" re-runs the cuts rather than replaying a
              // canned answer, so it rebuilds the Segment agent's thread.
              const topic =
                point.key === "audience-cuts" ? audienceCutsTopic(setup.goal) : toSeeded(point);
              openTopic(topic, railStepId === "audience");
            }}
          />
        )}
        */}

        {chatColumn}
      </div>
        </>
      )}

      <CampaignSettingsDrawer
        open={settingsOpen}
        values={setup}
        highlight={highlight}
        onChange={(patch) => setSetup((s) => ({ ...s, ...patch }))}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Segment creation canvas — an audience pill used to hand off to the
          full-screen Segments experience. It now plays in the docked chat
          instead, so the wizard is never replaced mid-campaign.
      <SegmentCreationOverlay
        open={segmentPrompt !== undefined}
        segment={null}
        initialPrompt={segmentPrompt}
        onSaved={plotSavedSegment}
        onClose={() => setSegmentPrompt(undefined)}
      />
      */}
    </div>
  );
}
