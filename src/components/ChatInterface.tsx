import React, { useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAtmosphere } from '@/contexts/AtmosphereContext';
// Lucide icons for various UI elements
import { MoreHorizontal, Maximize2, Plus, X, Bot, Minimize2, Bookmark, PlusCircle, PanelLeftOpen, PanelLeftClose, Settings2, MessageSquare, CornerDownRight, Users, Trash2, Info, ChevronDown, StopCircle, MoreVertical, ArrowDown, Menu } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SystemMessage from './SystemMessage';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import { MarketingAgent, marketingAgents } from '@/data/agents';
import { CONVERSATIONS, ConversationVariant, CAMPAIGNS_FLOW, AgentArtifactCardData, DEEP_RESEARCH_TOPICS, resolveDeepResearchOpener, resolveSegmentsFlow, type CampaignsTurn, type DeepResearchTopic } from '@/data/conversations';

// The topic the "+"-popover deep-research mode falls back to when the typed /
// picked prompt doesn't match a specific topic.
const DEFAULT_DEEP_RESEARCH_TOPIC =
  DEEP_RESEARCH_TOPICS.find((t) => t.id === 'whatsapp-performance') ?? DEEP_RESEARCH_TOPICS[0];
import type { InsightCardContext } from '@/types/insightCard';
import { formatInsightContent } from '@/types/insightCard';
import type { SetupApplyCardData } from '@/components/campaigns/campaign-creation/SetupApplyCard';
import type { Finding } from '@/components/campaigns/campaign-creation/previewFindings.data';
import type { ExperimentCardData, TestBranchConfig } from '@/components/ExperimentCard';
import type { NodeInsightCardData, NodeInsightResponse } from '@/components/NodeOptimizationInsightCard';
import type { JourneyProposalCardData } from '@/components/JourneyOptimizationProposalCard';
import type { AudienceTestCardData } from '@/components/AudienceTestQuestionCard';
import type { QuestionRecapEntry } from '@/components/campaigns/CoMarketerQuestionCard';
import {
  isPushCartPrompt,
  isChannelAskPrompt,
  isCancelPrompt,
  isCartReminderPrompt,
  CART_REMINDER_V1,
  isBrochurePrompt,
  isQrImagePrompt,
  qrImageFeedback,
  quickReplyVariations,
  pickedVariation,
  QR_IMAGE,
  QR_PRODUCT_QUESTION,
  QR_TYPE_QUESTION,
  QR_TYPE_YES,
  QR_THEME_QUESTION,
  PUSH_APPS_QUESTION,
  appIdsFor,
  themesFor,
  PUSH_CONTENT_CTA,
  CART_REMINDER_V2,
  CART_V2_FEEDBACK,
  isCartFeedbackPrompt,
  type ContentAgentHost,
  matchOption,
  namedChannel,
  CHANNEL_QUESTIONS,
  CHANNEL_RECOMMENDATION,
  CHANNEL_RECOMMENDATION_STATEMENT,
  SHOW_CHANNEL_QUESTION,
  CHANNEL_YES,
  DISCOUNT_OBJECTIVE,
  FIRST_DRAFT_TITLE,
  FIRST_DRAFT_BODY,
  FIRST_DRAFT_FEEDBACK,
  STAGE_ONE_QUESTIONS,
  STAGE_TWO_QUESTIONS,
  PROMO_YES,
  OPTIMIZER_RECOMMENDATION,
  draftFrom,
  prefillFrom,
  type FlowAnswers,
  type FlowQuestion,
  type PushCartDraft,
  type PushCampaignPrefill,
  type PushFlowCard,
  type PushFlowEvent,
} from '@/data/pushCartFlow';
import {
  isAudienceGoalPrompt,
  FOCUS_QUESTION,
  FOCUS_RECOVER,
  INTEREST_QUESTION,
  recencyQuestion,
  CHECKOUT_QUESTION,
  CHECKOUT_YES,
  REACH_QUESTION,
  HOLDBACK_QUESTION,
  APPLY_QUESTION,
  APPLY_YES,
  buildAudienceDraft,
  draftSentence,
  holdbackSentence,
  type AudienceAgentHost,
  type AudienceAgentState,
} from '@/data/audienceAgentFlow';
import AgentSwitchDivider from './AgentSwitchDivider';
import AgentThreadHeader from './AgentThreadHeader';
import AvatarStack from './AvatarStack';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Classic } from '@/components/ui/classic-loader';
import { ThemeToggle } from '../../components/theme-provider';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import DeepResearchPlan from "./DeepResearchPlan";
import DeepResearchDoc from "./DeepResearchDoc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeSwitchConfirmation } from './ModeSwitchConfirmation';
import LhsSidebar, { defaultChats } from './LhsSidebar';
import type { LhsChatItem, LhsNavKey } from './LhsSidebar';
import SettingsModal from './SettingsModal';
import ChatListPage from './ChatListPage';
import ReportsPage from './ReportsPage';
import SchedulerPage from './SchedulerPage';
import AgentsSurface from './AgentsSurface';
import CreateCustomAgentModal from './CreateCustomAgentModal';
import { useCustomAgents } from '@/contexts/CustomAgentsContext';
import { MONTHLY_REPORT_AGENT_NAME } from '@/data/customAgents';
import { generateAgentOrbTheme } from '@/lib/agentAvatar';
import type { OrbTheme } from '@/components/orb/agentOrbTheme';
import { generatedReports } from '@/data/reports';
import { scheduledReports, scheduleTemplates } from '@/data/schedules';
import RhsHeader from './RhsHeader';
import RotatingWord from './RotatingWord';
import { GradientShimmer } from 'gradient-shimmer';
import MinViewLhsOverlay from './MinViewLhsOverlay';
import ArtifactPreview from './ArtifactPreview';
import LineNav, { LineNavItem } from './LineNav';
import ScheduleDialog, { type SchedulePrefill } from './ScheduleDialog';
import FeedbackModal, { FeedbackSentiment } from './FeedbackModal';
import { ThumbsUp, ThumbsDown, CheckCircle2, TrendingUp, MousePointerClick, FileText, Activity, DollarSign, Search, RefreshCw, Megaphone, Compass } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { playResponseCue, playToggleCue, playExpandCue } from '@/lib/playCue';
import { ContentAgentSegmentAccordions } from './ContentAgentSegmentAccordions';
import GeneratingLoader from './GeneratingLoader';
import PushFlowCardView from '@/components/PushFlowCards';
import { BorderBeam } from 'border-beam';
import { welcomeCardBeamStyleBlock } from './welcomeCardBeamStyles';
import DiscoveryBanners from './DiscoveryBanners';


// Interface for individual chat message data
export interface ChatMessageData {
  type: 'system' | 'chat';
  isAI?: boolean;
  content: string;
  agentName?: string;
  agentId?: string;
  avatarSrc?: string;
  avatarIcon?: React.ElementType;
  avatarBgClass?: string;
  animate?: boolean;
  animationSpeed?: number;
  onAnimationComplete?: () => void;
  // System message specific
  systemType?: 'join' | 'leave';
  agentIcon?: React.ElementType;
  agentColorClass?: string;
  // Chat message specific
  showExecuteFlowCTA?: boolean;
  onExecuteFlow?: () => void;
  isContentAgent?: boolean;
  isContentAgentClarification?: boolean;
  isContentAgentQuestionChoice?: boolean;
  onAnswerQuestions?: () => void;
  onSkipAndGenerate?: () => void;
  onGenerateContent?: () => void;
  showApproveContentCTA?: boolean;
  onApproveContent?: () => void;
  isFlowExecutionProgress?: boolean;
  onFlowExecutionComplete?: () => void;
  waitForUserInput?: boolean;
  isPlanMode?: boolean;
  isSegmentAccordion?: boolean;
  isSchedulerAccordion?: boolean;
  isSegmentAgentRationale?: boolean;
  isContentAgentRationale?: boolean;
  isExecutiveSummaryWithContent?: boolean;
  onContinueSegment?: () => void;
  onRefineThis?: () => void;
  updatedContent?: any; // New field to store updated content
  // "You stopped after Xs" notice appended when the user hits the composer's
  // stop button mid-generation (rendered as grey text + a hairline below).
  stoppedNotice?: { seconds: number };
  // Thinking state specific
  isThinkingState?: boolean;
  thinkingDuration?: number;
  /** See ChatMessage's own doc — replaces "Thinking..." for a
   *  longer-running action (e.g. building the test journey on canvas). */
  thinkingLabel?: string;
  reasoningSteps?: string[];
  // Doc-like artifact
  artifact?: { title: string; subtitle?: string; intro?: string };
  // Inline campaign performance dashboard escape hatch
  hidePerformanceDashboard?: boolean;
  // Short title used by the vertical line-nav (only meaningful on user turns)
  navLabel?: string;
  // Lightweight per-message graphics for follow-up answers (visual parity)
  statCards?: { label: string; value: string; sub?: string }[];
  miniChart?: 'delivery' | 'rates';
  // Centered "Switched to <agent>" divider (campaigns agent-relay flow).
  // The divider reuses avatarSrc/avatarIcon/avatarBgClass for the agent chip.
  isAgentSwitch?: boolean;
  switchAgentLabel?: string;
  // Previous agent in the relay — the 3D orb morphs from their color (baton pass).
  switchFromLabel?: string;
  // Set once this switch's answer finishes streaming: the header swaps the live
  // orb for the agent's SVG avatar and the divider waves freeze.
  switchSettled?: boolean;
  // Custom-agent hand-off: an orb theme derived from the agent's avatar palette
  // (so the live fluid orb matches it) and a one-line "what it does" saying.
  switchOrbTheme?: OrbTheme;
  switchSaying?: string;
  // Agent-handed artifact card (segment / journey), revealed after the answer streams.
  agentArtifactCard?: AgentArtifactCardData;
  // ChatGPT-style deep-research plan card (title + steps), rendered inline.
  deepResearchPlan?: { title: string; steps: string[] };
  // Finished deep-research report, shown as a full-width doc preview.
  deepResearchDoc?: { title: string; citations: number; summaryHeading?: string; paragraphs: string[]; skeletonMs?: number; docFeedback?: boolean };
  // The doc a plan card swaps itself into once it finishes (agent report flow).
  planResultDoc?: { title: string; citations: number; summaryHeading?: string; paragraphs: string[] };
  // Optional Co-marketer line shown above that finished doc, framing the result.
  planResultLeadIn?: string;
  // Suppress this message's copy/thumbs feedback row (e.g. a lead-in above a doc).
  hideFeedback?: boolean;
  // Reply chip shown above a user turn (e.g. the plan title an edit follows up on).
  replyContext?: string;
  // AI Dashboard insight card carried into the opening user turn.
  insightCard?: InsightCardContext;
  setupApplyCard?: SetupApplyCardData;
  // Co-marketer audit findings — the review rail's cards, dropped into chat.
  findings?: Finding[];
  // Journey Optimization Agent's proposal/results card.
  experimentCard?: ExperimentCardData;
  // Journey Optimization Agent's node-level finding, shown before the
  // experiment card once a marketer explores a specific node.
  nodeInsightCard?: NodeInsightCardData;
  // The goal-first conversation's own proposal — a shrunk read-only canvas
  // preview of the recommended change, plus the test/make-primary/explore
  // question. Only ever set on the LAST message of a staged reply (see
  // SeededTopic's replySegments), same as nodeInsightCard/experimentCard.
  journeyProposalCard?: JourneyProposalCardData;
  // The goal-first conversation's audience-percentage question — same
  // reuse of CoMarketerQuestionCard, attached the same way.
  audienceTestCard?: AudienceTestCardData;
  // A CoMarketerQuestionCard's answers, recapped as the user's own turn —
  // bold question + plain answer per row — instead of a single joined
  // string, once a question (or short batch) has just been answered.
  questionRecap?: QuestionRecapEntry[];
  // Cori's App Push cart flow — a Questions / notification draft / brief card
  // attached under this message's text (see startPushCartFlow).
  pushFlowCard?: PushFlowCard;
  // The goal-first conversation's "merge the test journey into main" CTA —
  // a prominent standalone button (not a CoMarketerQuestionCard, since
  // there's only one action, not a set of options) shown below this
  // message's text. `mergeTestCtaDone` freezes it into its answered state
  // once clicked, including across a resumed/persisted conversation.
  mergeTestCta?: boolean;
  mergeTestCtaDone?: boolean;
  /** One button per answer to this message's question — clicking sends
   *  that exact text down the same path typing it would (handleSendMessage),
   *  so every existing typed-answer check (goalStage, pendingProposal,
   *  pendingTestConfirmation, ...) fires identically either way; typing
   *  the answer instead still works exactly as before. Multiple steps in
   *  the goal-first conversation attach these instead of leaving the
   *  marketer to type a reply. `replyOptionsSelectedValue` freezes the row
   *  once one is picked. */
  replyOptions?: { label: string; value: string }[];
  replyOptionsSelectedValue?: string;
}

// Distance (px) from the true bottom still counted as "at the bottom" — for
// deciding whether new content should auto-scroll into view or wait for an
// explicit "scroll to latest" click. Generous on purpose: a card can land in
// one mutation (not a typed character at a time), so the gap can jump by
// more than a couple of lines in a single step without the user having
// actually scrolled away to reread something.
const NEAR_BOTTOM_PX = 400;

// Props for the main ChatInterface component
interface ChatInterfaceProps {
  onBotIconClick?: () => void; // Handler for agent selection overlay toggle in widget view
  enabledAgents: Set<string>;
  setEnabledAgents: React.Dispatch<React.SetStateAction<Set<string>>>;
  onCloseInterface?: () => void; // Handler to close the entire chat interface
  initialExpanded?: boolean; // Start expanded (full-screen) vs. docked widget. Defaults to true.
  docked?: boolean; // When true (and not dragged), the widget fills its parent height instead of a fixed 776px.
  conversationVariant?: ConversationVariant; // Which scripted storyline to play. Defaults to 'default' (home page); '/campaigns' passes 'campaigns'.
  /** Auto-sent once on mount against a fresh (empty) thread — as if the caller's
   *  own composer had typed this and hit Enter. Used to carry a message typed
   *  elsewhere (e.g. the AI Dashboard hero composer) into a freshly-opened,
   *  full-page instance of this same scripted conversation. */
  initialMessage?: string;
  /** AI Dashboard insight card — auto-sent on mount as a rich first user turn. */
  initialInsightCard?: InsightCardContext;
  /** Agent chat opened from a host page's agent detail (the L1 Agents page).
   *  Primed once on mount down the same paths the in-app agent detail page uses,
   *  so the hand-off intro plays and the chat lands in the shared history.
   *  One of three shapes: start a fresh chat (`agent` + `message`); re-open a
   *  past one (`chatId`), which renders as already-finished; or just bind the
   *  agent (`agent` + `bind`), which opens an empty thread with the agent's chip
   *  in the composer and sends nothing — the L1 page's "Start chat". */
  initialAgentChat?:
    | { agent: { id: string; name: string; avatarSrc?: string }; message: string; chatId?: never; bind?: never }
    | { chatId: string; agent?: never; message?: never; bind?: never }
    | { agent: { id: string; name: string; avatarSrc?: string }; bind: true; message?: never; chatId?: never };
  /** Campaign picked from the co-marketer review banner above the campaigns
   *  table. Seeds a short review thread on mount instead of playing a scripted
   *  flow — the user asks to review it, the co-marketer walks through it. */
  initialReviewCampaign?: ReviewCampaignContext;
  /** Canned prompt/answer pair seeded on mount — used by the campaign-creation
   *  discovery points, which open the chat already on a subject. */
  initialTopic?: SeededTopic;
  /**
   * Extra canned turn to append onto an already-open thread (campaign-creation
   * suggestion cards). `followUpSeq` must bump so the same topic can be asked
   * more than once.
   */
  followUpTopic?: SeededTopic | null;
  followUpSeq?: number;
  /** Apply a co-marketer setup suggestion onto the campaign form. For a cohorts
   *  card, `cohortId` says which cut the user picked. */
  onSetupApply?: (card: SetupApplyCardData, cohortId?: string) => void;
  /** Whether a given setup-apply card has already been plotted. */
  isSetupApplyApplied?: (card: SetupApplyCardData) => boolean;
  /** Cohort already plotted from a cohorts card, if any. */
  appliedCohortId?: string;
  /** "Review segment" / "Review journey" on an agent's artifact card. The host
   *  page decides where that goes — the segments pages open the segment
   *  creation canvas on the card's rules. */
  onReviewArtifact?: (card: AgentArtifactCardData) => void;
  /** Overrides the action label on artifact cards. The campaign wizard uses it
   *  because there the action plots conditions onto the form rather than
   *  opening a segment canvas — everywhere else keeps the card's own label. */
  artifactActionLabel?: string;
  /** "Ask" on an audit finding card rendered inline in the chat — same
   *  callback the preview screen's review rail uses for its own cards. */
  onAskFinding?: (finding: Finding) => void;
  /** Replaces the generic starter chips under the composer with a set the host
   *  page decides — the campaign wizard passes the open step's own chips, so
   *  the opening suggestions are about the step the user is actually on. */
  starterChipSet?: StarterChip[];
  /** Replaces the empty-state "Good afternoon, Amit" greeting — the campaign
   *  wizard asks a step-specific question instead, since a docked thread
   *  opened onto a particular step already knows what it's there to help with. */
  emptyStateGreeting?: string;
  /** Replaces the empty-state composer's "How can I help you today?"
   *  placeholder — paired with `emptyStateGreeting` for the same reason. */
  emptyStatePlaceholder?: string;
  /** Lets the host page recognize a typed message as one of its own intents
   *  (e.g. the journey builder's "audit my flow") before it falls into this
   *  component's own scripted routing (CAMPAIGNS_FLOW, the performance
   *  story, etc). Returning true means the host has handled it — usually by
   *  pushing its own reply through `followUpTopic`/`followUpSeq` — and this
   *  component does nothing further with that message. */
  onBeforeSend?: (message: string) => boolean;
  /** See ChatMessage's own doc — forwarded straight through to every
   *  message's experiment card. */
  onCreateTest?: (config: TestBranchConfig) => void;
  onUpdateTestSplit?: (variantPercent: number) => void;
  onPostTestDecision?: (decision: "make-main" | "keep-existing" | "test-another") => void;
  /** See ChatMessage's own doc — forwarded straight through to every
   *  message's node insight card. */
  onRespondNodeInsight?: (response: NodeInsightResponse, data: NodeInsightCardData, recap: QuestionRecapEntry[]) => void;
  /** See ChatMessage's own doc — forwarded straight through to every
   *  message's audience-test question card. */
  onRespondAudienceTest?: (percent: number) => void;
  /** The wizard hosting this chat can have Cori build its audience in
   *  conversation (see audienceAgentFlow). Without it, that prompt is just a
   *  prompt. */
  audienceAgent?: AudienceAgentHost;
  /** On the wizard's Content step: lets Cori draft the notification into the editor. */
  contentAgent?: ContentAgentHost;
  /** A question card the host wants answered before anything is generated —
   *  drawn above the composer, and the empty state stands down while it's up
   *  (e.g. the Segment agent asking what the campaign is for). */
  approvalCard?: React.ReactNode;
  /** "Preview campaign" on Cori's App Push brief — the host opens the creation
   *  wizard on its preview screen with this draft. */
  onPreviewPushCampaign?: (prefill: PushCampaignPrefill) => void;
  /** Full prior transcript to resume onto (a persisted conversation the host
   *  page is restoring, e.g. Journey Builder's test-journey session) —
   *  replayed instantly (no re-typing animation, no thinking-timer restart)
   *  instead of the usual empty-thread start. Omit for every normal case. */
  initialMessages?: ChatMessageData[];
  /** Fires whenever the message list changes, carrying the full list — lets
   *  a host page mirror this thread into its own persisted store (see
   *  `initialMessages`) without this component knowing that store exists. */
  onMessagesChange?: (messages: ChatMessageData[]) => void;
  /** "Yes, merge as main journey" CTA (see ChatMessageData's mergeTestCta). */
  onMergeTestJourney?: () => void;
}

/** A contextual starter chip: the pill's label, its icon, and the prompts it
 *  opens (with the heading shown above them). A chip can instead carry an
 *  `onSelect`, in which case clicking it hands straight back to the host page
 *  (the campaign wizard's audience pills open segment creation) rather than
 *  expanding into a prompt list. */
export interface StarterChip {
  label: string;
  icon?: LucideIcon;
  /** Heading above the prompt list; falls back to "Suggested prompts". */
  header?: string;
  prompts?: string[];
  /** Clicking the pill runs this instead of revealing `prompts`. */
  onSelect?: () => void;
}

/** A tap-to-open co-marketer thread: what the user "asked", and the answer. */
export interface SeededTopic {
  prompt: string;
  /** Optional only when `replySegments` is set instead — one or the other
   *  must be present. */
  reply?: string;
  navLabel?: string;
  setupApplyCard?: SetupApplyCardData;
  /** Co-marketer audit findings — same cards as the preview screen's review
   *  rail, rendered inline on this topic's answer. */
  findings?: Finding[];
  /** Journey Optimization Agent's proposal/results card. */
  experimentCard?: ExperimentCardData;
  /** Journey Optimization Agent's node-level finding — shown first, before
   *  experimentCard, when this topic came from exploring one specific node. */
  nodeInsightCard?: NodeInsightCardData;
  /** The goal-first conversation's canvas-preview + decision card — see
   *  ChatMessageData's own doc. */
  journeyProposalCard?: JourneyProposalCardData;
  /** The goal-first conversation's audience-percentage question — see
   *  ChatMessageData's own doc. */
  audienceTestCard?: AudienceTestCardData;
  /** Recaps the CoMarketerQuestionCard answer(s) that led to this topic, as
   *  the user's own turn — see ChatMessageData's own doc. */
  questionRecap?: QuestionRecapEntry[];
  /**
   * Hand the answer to a specialist rather than the co-marketer. When set, the
   * thread plays the full hand-off — switch divider, then that agent thinking
   * through `reasoningSteps` — before the reply and any card land. Used where
   * the answer is real work (building audience cuts), not just advice.
   */
  agentId?: string;
  reasoningSteps?: string[];
  /** Overrides the hand-off header's default one-line saying for this
   *  specific topic (AgentThreadHeader's own AGENT_SAYINGS lookup otherwise
   *  applies to every hand-off to that agent, regardless of what it's doing
   *  this time). */
  agentSaying?: string;
  /** Skips the "Switched to X Agent" divider while still playing the
   *  thinking pause and (staged) reply — for a follow-up turn that's a
   *  continuation of an already-announced hand-off, not a fresh one. */
  skipAgentSwitchBanner?: boolean;
  /** Overrides the thinking pause's length (seconds) — defaults to 4 when
   *  unset, same as before this existed. */
  thinkingDurationSeconds?: number;
  /** See ChatMessage's own doc — replaces "Thinking..." for this topic's
   *  thinking pause. */
  thinkingLabel?: string;
  /** Reveals the reply as several separate turns, one per array entry, each
   *  fully typed out before the next begins (with a short pause between) —
   *  instead of one message whose whole text streams in one continuous
   *  animation. Any cards (nodeInsightCard, journeyProposalCard, etc.) still
   *  land on the LAST segment only. Falls back to the plain `reply` string
   *  when unset. */
  replySegments?: string[];
  /** Skips pushing `prompt` as a user turn — for an agent message that
   *  isn't answering anything the user just typed (e.g. a status summary
   *  volunteered after reopening an already-built test). `prompt` is still
   *  required by the type but goes unused. */
  suppressPromptTurn?: boolean;
  /** See ChatMessageData's own doc — attached to the last reply segment. */
  mergeTestCta?: boolean;
  /** See ChatMessageData's own doc — attached to the last reply segment. */
  replyOptions?: { label: string; value: string }[];
}

/** The campaign handed over by the co-marketer review banner. */
export interface ReviewCampaignContext {
  title: string;
  subtitle?: string;
  id?: string;
}

// Rotating example topics shown in the empty-state greeting slot animation
const GREETING_TOPICS = [
  'Campaign performance',
  'Revenue trends',
  'Journey drop-offs',
  'Audience behavior',
  'Channel anomalies',
  'Conversion opportunities',
];

// Bookmarked chats — the saved subset of the chat list
const bookmarkedChats = defaultChats.filter((c) => ['2', '5', '8', '11', '17'].includes(c.id));


// Pinned to "Good afternoon" so the greeting reads the same in every demo,
// regardless of what time the deck is being presented.
const getGreeting = () => 'Good afternoon';

/**
 * What the docked panel shows for its first beat, while the real content is still
 * assembling. The header has already landed, so this stands in for the body only.
 *
 * Shapes are taken from the live layout's measured geometry so the swap doesn't
 * shift anything: 'home' mirrors the centred greeting / composer / context chips
 * with the discovery banner pinned at the bottom; 'thread' mirrors a reopened
 * conversation — the user's bubble, a hand-off divider, then the agent's answer.
 */
const DockedBodySkeleton = ({
  variant,
  expanded,
}: {
  variant: 'home' | 'thread';
  expanded: boolean;
}) => {
  // Same gutters and content width as the real messages area, so the skeleton
  // occupies exactly the column the conversation will land in.
  const frame = cn(
    'flex flex-1 flex-col overflow-hidden',
    expanded ? 'px-[28px] py-[20px]' : 'p-[16px]'
  );
  const column = cn('mx-auto flex w-full flex-col', expanded ? 'max-w-[768px]' : 'max-w-full');

  if (variant === 'thread') {
    // One exchange's worth of placeholders: the user's bubble, the hand-off
    // divider, the agent's byline, its answer, and whatever it handed back.
    const exchange = (key: string, lines: string[], card: number | null) => (
      <div key={key} className="flex flex-col gap-[22px]">
        <div className="flex justify-end">
          <Skeleton className="h-[44px] w-[62%] rounded-[12px]" />
        </div>
        <Skeleton className="mx-auto h-[12px] w-[190px] rounded-full" />
        <div className="flex items-center gap-[8px]">
          <Skeleton className="size-[28px] shrink-0 rounded-full" />
          <Skeleton className="h-[14px] w-[128px] rounded-full" />
        </div>
        <div className="flex flex-col gap-[10px]">
          {lines.map((w, i) => (
            <Skeleton key={i} className="h-[13px] rounded-full" style={{ width: w }} />
          ))}
        </div>
        {card !== null && (
          <Skeleton className="w-full rounded-[12px]" style={{ height: card }} />
        )}
      </div>
    );

    // The composer is deliberately absent — it stays live underneath, so only the
    // conversation itself reads as loading.
    return (
      <div className={frame} aria-hidden="true">
        <div className={cn(column, 'gap-[28px]')}>
          {exchange('a', ['100%', '97%', '90%', '74%'], 124)}
          {exchange('b', ['100%', '92%', '68%'], null)}
        </div>
      </div>
    );
  }

  return (
    <div className={frame} aria-hidden="true">
      {/* Greeting + composer + chips, centred in the space above the banner —
          the same `my-auto` behaviour the live empty state uses. */}
      <div className={cn(column, 'flex-1 items-center justify-center gap-[32px]')}>
        <Skeleton className="h-[30px] w-[254px] rounded-[8px]" />
        <div className="flex w-full flex-col gap-[16px]">
          <Skeleton className="h-[106px] w-full rounded-[12px]" />
          <div className="flex flex-wrap justify-center gap-[8px]">
            {[132, 133, 109, 154, 159].map((w) => (
              <Skeleton key={w} className="h-[30px] rounded-full" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
      {/* Discovery banner, pinned at the bottom */}
      <div className={column}>
        <Skeleton className="h-[96px] w-full shrink-0 rounded-[12px]" />
      </div>
    </div>
  );
};

const PUSH_LOADER_LABELS = {
  audience: ['Reading shopper behaviour...', 'Sizing the audience...', 'Checking suppression rules...'],
  channel: ['Comparing channel performance...', 'Checking engagement over 30 days...', 'Picking the best channel...'],
  questions: ['Reviewing cart activity...', 'Estimating app push reach...', 'Preparing a few questions...'],
  draft: ['Finding the right template...', 'Writing the title and message...', 'Adding cart image and countdown...'],
  delivery: ['Analyzing engagement patterns...', 'Sizing up customer segments...', 'Balancing conversion and profit...'],
  brief: ['Estimating campaign reach...', 'Checking the best send window...', 'Assembling your brief...'],
  reply: ['Reading your request...', 'Checking the campaign brief...', 'Putting a reply together...'],
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBotIconClick, enabledAgents, setEnabledAgents, onCloseInterface, initialExpanded = true, docked = false, conversationVariant = 'default', initialMessage, initialInsightCard, initialAgentChat, initialReviewCampaign, initialTopic, onReviewArtifact, artifactActionLabel, followUpTopic, followUpSeq = 0, onSetupApply, isSetupApplyApplied, appliedCohortId, starterChipSet, onAskFinding, emptyStateGreeting, emptyStatePlaceholder, onBeforeSend, onCreateTest, onUpdateTestSplit, onPostTestDecision, onRespondNodeInsight, onRespondAudienceTest, onPreviewPushCampaign, approvalCard, audienceAgent, contentAgent, initialMessages, onMessagesChange, onMergeTestJourney }) => {
  const navigate = useNavigate();
  const { active: atmoActive } = useAtmosphere();
  // The scripted storyline this interface plays. Home (`/`) uses 'default';
  // the /campaigns docked chat passes 'campaigns'. See src/data/conversations.ts.
  const script = CONVERSATIONS[conversationVariant];
  // A resumed conversation replays instantly — no re-typing animation (which
  // would replay the whole history as if freshly generated) and no
  // isThinkingState bubbles (which drive their own mount-time countdown and
  // would restart "Thinking..." rather than showing the settled "Thought for
  // Ns" they'd already reached).
  const [messages, setMessages] = useState<ChatMessageData[]>(() =>
    (initialMessages ?? []).filter((m) => !m.isThinkingState).map((m) => ({ ...m, animate: false })),
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // Whether new content should keep following to the bottom. True until the
  // user scrolls away on their own — checked against NEAR_BOTTOM_PX, not
  // "genuinely user-driven vs our own write", since a whole stack of cards
  // (e.g. three template recommendations landing in one mutation) can grow
  // the container by more than any one threshold would forgive; once stuck,
  // it stays stuck through the whole burst rather than re-litigating each
  // mutation against the gap it just created. programmaticScrollRef flags a
  // scroll event this effect caused itself, so the 'scroll' listener (which
  // also fires for our own scrollTop writes) doesn't mistake it for the user
  // scrolling away and unstick.
  const stickToBottomRef = useRef(true);
  const programmaticScrollRef = useRef(false);
  // A resumed conversation should land on its latest turn (e.g. the pending
  // "Yes, merge as main journey" question), not force the marketer to
  // scroll down past the whole replayed history to find it. A single
  // scrollIntoView right on mount isn't enough: rich cards further up the
  // resumed thread (e.g. the proposal's own embedded JourneyCanvas) finish
  // laying out a beat after mount, growing the scroll container's height
  // after that first jump already landed — so this retries across a few
  // animation frames plus a short trailing timeout to catch that late
  // growth, then stops; it never fires again after that (a real new
  // message already gets its own auto-scroll from stickToBottomFor).
  const didLandOnResumedBottomRef = useRef(false);
  useLayoutEffect(() => {
    if (didLandOnResumedBottomRef.current) return;
    if (!initialMessages || initialMessages.length === 0 || messages.length === 0) return;
    didLandOnResumedBottomRef.current = true;
    const scrollToEnd = () => messagesEndRef.current?.scrollIntoView({ block: "end" });
    // No cleanup here on purpose — under StrictMode's dev-only double-invoke
    // (mount, cleanup, mount again), a cleanup that cancels these would
    // cancel every retry before it ever fires, since the guard above
    // already makes the second invocation a no-op; letting all of them run
    // is what actually catches the late-laying-out cards further up the
    // resumed thread (see this effect's own doc above).
    scrollToEnd();
    requestAnimationFrame(() => {
      scrollToEnd();
      requestAnimationFrame(scrollToEnd);
    });
    [100, 350, 700, 1200].forEach((ms) => window.setTimeout(scrollToEnd, ms));
  }, [messages, initialMessages]);
  // Mirrors every message-list change out to the host page (see
  // `onMessagesChange`'s own doc) — a ref keeps this from re-running just
  // because the host re-created the callback identity on its own re-render.
  const onMessagesChangeRef = useRef(onMessagesChange);
  onMessagesChangeRef.current = onMessagesChange;
  useEffect(() => {
    onMessagesChangeRef.current?.(messages);
  }, [messages]);
  const [isMockAgentChatActive, setIsMockAgentChatActive] = useState(false);
  // Briefly shimmers the input after every send (survives the empty→conversation input swap)
  const [inputShimmer, setInputShimmer] = useState(false);
  const inputShimmerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When the current response started generating — used to label the
  // "You stopped after Xs" notice when the user hits the stop button.
  const generationStartedAtRef = useRef<number | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  // True once the chat has actually been scrolled down — used to reveal the top
  // fade only while scrolling (not on the resting first message).
  const [isChatScrolled, setIsChatScrolled] = useState(false);
  const [mockChatCompleted, setMockChatCompleted] = useState(() => !!initialMessages?.length); // New state
  // Shows the suggested follow-up chips after the first output completes (until thread 2 starts)
  const [showSuggestions, setShowSuggestions] = useState(false);
  // Contextual suggested prompts driven by the campaigns agent-relay flow. When
  // set, these override the static script.suggestedPrompts under the last answer.
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[] | null>(null);
  // Which turn of the campaigns flow (Insights → Segment → Journey) is next.
  const campaignsTurnRef = useRef(0);
  // Which two-turn Segment-agent thread this chat is playing — resolved from the
  // opening prompt (i.e. the suggestion card the user tapped) and then held so
  // later turns stay on the same thread. Only used by the 'segments' variant.
  const segmentsFlowRef = useRef<CampaignsTurn[] | null>(null);
  // Deep-research narrative step (variant-agnostic, see DEEP_RESEARCH_TOPICS):
  // 0 = not started, 1 = insight shown / awaiting the follow-up (two-step topics
  // only), 2 = plan card dropped (the card self-drives from there). The active
  // topic is remembered across the two turns. Reset on new chat / mode switch.
  const deepResearchStoryStepRef = useRef(0);
  const deepResearchTopicRef = useRef<DeepResearchTopic | null>(null);
  // End-of-conversation feedback: floating prompt → modal (up/down) → success toast
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackSentiment | null>(null);
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulePrefill, setSchedulePrefill] = useState<SchedulePrefill | undefined>();
  const feedbackToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Feedback nudge/toast occupies the band just above the input; while it's up we
  // hide the scroll-to-latest button so the two don't overlap (until dismissed).
  const feedbackNudgeVisible = showFeedbackToast || (showFeedbackPrompt && !feedbackModal);

  const handleFeedbackSubmit = () => {
    setFeedbackModal(null);
    setShowFeedbackPrompt(false);
    setShowFeedbackToast(true);
    if (feedbackToastTimerRef.current) clearTimeout(feedbackToastTimerRef.current);
    feedbackToastTimerRef.current = setTimeout(() => setShowFeedbackToast(false), 3000);
  };

  const resetFeedback = () => {
    setShowFeedbackPrompt(false);
    setFeedbackModal(null);
    setShowFeedbackToast(false);
    if (feedbackToastTimerRef.current) clearTimeout(feedbackToastTimerRef.current);
  };
  const [isGeneratingOutput, setIsGeneratingOutput] = useState(false); // Drives the persistent bottom-of-thread loader
  const [contentApproved, setContentApproved] = useState(false); // New state for content approval
  const [segmentsApproved, setSegmentsApproved] = useState(false); // New state for segments approval
  const [contentGenerated, setContentGenerated] = useState(false); // New state for content generation
  const mockMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMockAgentChatActiveRef = useRef(isMockAgentChatActive);
  // Bumped every time appendTopic starts a new specialist sequence — lets a
  // *stale* sequence's own step() calls recognize they've been superseded
  // and no-op instead of resuming. Needed because a step's own continuation
  // isn't only scheduled by this file's setTimeout chain (which a fresh
  // appendTopic call already clears) — a thinkingEntry's ThinkingState also
  // fires its message's onAnimationComplete straight from its own internal
  // countdown, whenever that happens to elapse, entirely independent of
  // whether a newer sequence has since taken over. Without this guard, that
  // late callback both clears and then immediately re-fills the shared
  // mockMessageTimeoutRef with the OLD sequence's own next step, silently
  // hijacking a newer append that's already mid-flight — e.g. a follow-up
  // volunteered right as the previous turn's own thinking pause was still
  // settling.
  const activeSequenceIdRef = useRef(0);
  // True while the performance "story" flow is running, so re-typing restarts the
  // story instead of being captured by the Valentine collaborative continuation path.
  const isStoryFlowActiveRef = useRef(false);
  // Which "act" of the performance story the conversation is on: the opening
  // recap runs first, then the next message auto-plays the follow-up batch.
  const hasRunStoryRef = useRef(false);
  const hasRunFollowupsRef = useRef(false);
  const [selectedMode, setSelectedMode] = useState<'collaborative' | 'autonomous'>('collaborative'); // Added state for mode
  const [autonomousWaitingForInput, setAutonomousWaitingForInput] = useState(false); // State to track if autonomous mode is waiting for user input
  const [showModeSwitchConfirmation, setShowModeSwitchConfirmation] = useState(false); // State for mode switch confirmation popup
  const [pendingMode, setPendingMode] = useState<'collaborative' | 'autonomous' | null>(null); // Mode that user wants to switch to
  
  // Dev mode states
  const [showDevOptions, setShowDevOptions] = useState(false);
  const [disableAnimation, setDisableAnimation] = useState(false);
  const [disableContentAccordion, setDisableContentAccordion] = useState(true); // Enabled by default to hide old content accordion
  const [promptTemplateExists, setPromptTemplateExists] = useState(true); // New toggle for prompt template existence - ON by default
  
  // Chat options dropdown state
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [selectedStarterChip, setSelectedStarterChip] = useState<string | null>(null);
  // Deep-research mode — toggled from the ChatInput "+" popover. When on, the
  // empty-state starter chips are replaced by the deep-research category pills;
  // picking a category then reveals its prompts (mirrors the starter-chip flow).
  const [deepResearchActive, setDeepResearchActive] = useState(false);
  const [selectedDeepResearchCategory, setSelectedDeepResearchCategory] = useState<string | null>(null);
  // Set (to the card's title) when the user taps "Edit" on a plan card — the
  // composer switches into an editable "follow up" field carrying that reply chip.
  const [deepResearchEditTitle, setDeepResearchEditTitle] = useState<string | null>(null);
  // True while a deep-research plan card is actively researching (Start → done).
  // Drives the persistent spinner on the chat's LHS list row.
  const [deepResearchRunning, setDeepResearchRunning] = useState(false);
  // Fallback finished report for the plan card when a flow doesn't carry its own
  // target doc (kept for safety — every scripted flow now sets planResultDoc).
  const DEEP_RESEARCH_DOC = {
    title: 'WhatsApp Channel Performance — This Quarter',
    citations: 0, // citations label hidden for the deep-research report

    summaryHeading: 'Executive summary',
    docFeedback: true,
    paragraphs: [
      "This quarter WhatsApp reached more people than any other channel but <strong>delivered the least of what it sent</strong> — over 60% of published messages never landed. The gap traces back to a handful of templates and unverified sender numbers, not the audience, which means most of it is recoverable.",
      "Email and APN are quietly carrying your qualified engagement, with near-100% delivery and the steadiest click rates. WhatsApp's raw reach is being wasted at the delivery step, so the channel looks weak on outcomes despite the largest send volume.",
      "The three lowest-performing templates account for the majority of failures, and a small cluster of multi-channel, high-intent users are the ones most worth protecting. Re-verifying sender identities and re-sequencing the 48-hour follow-up are the highest-leverage fixes.",
      "If delivery recovers to roughly 85%, we estimate <strong>~4,800 recovered conversations and an 18–24% lift in WhatsApp-attributed conversions</strong> next quarter — at no additional send cost.",
    ],
  };
  // Monthly report agent — the report it generates when a chat is launched from
  // its page. Reuses DeepResearchDoc (skeleton loader → report preview).
  const MONTHLY_REPORT_DOC = {
    title: 'Monthly Marketing Performance — Last Month',
    citations: 0, // hide the citations label for this report
    summaryHeading: 'Executive summary',
    skeletonMs: 2200,
    docFeedback: true, // show a thumbs feedback row below the finished report
    paragraphs: [
      "Last month total marketing-attributed revenue rose <strong>+14.2% month-over-month</strong> to ₹2.41 Cr, driven almost entirely by Email and a recovering WhatsApp channel. Overall reach was flat, so the gain came from better conversion of the audience you already have — not more sends.",
      "Email remains the workhorse: <strong>near-100% delivery, a 22.6% open rate, and 41% of attributed revenue</strong>. Push quietly had its best month of the year on click-through, while SMS engagement slipped and is the one channel trending the wrong way for the third month running.",
      "The top three journeys — Welcome, Abandoned Cart, and Win-back — account for <strong>68% of automated revenue</strong>, with Abandoned Cart the single biggest mover at +31% MoM after the 48-hour follow-up was re-sequenced. High-intent, multi-channel users are your most valuable and fastest-growing segment.",
      "Going into next month, the highest-leverage moves are to <strong>scale the re-sequenced cart journey, refresh the two fatiguing SMS templates, and shift more Win-back budget to Push</strong>, where cost-per-conversion is now lowest.",
    ],
  };
  const defaultStarterChips = [
    "Seasonal Trend",
    "CTR Monitoring",
    "QBR Report",
    "Channel Anomalies",
    "Revenue Monitoring",
  ];
  // A relevant icon for each starter chip.
  const defaultStarterChipIcons: Record<string, LucideIcon> = {
    "Seasonal Trend": TrendingUp,
    "CTR Monitoring": MousePointerClick,
    "QBR Report": FileText,
    "Channel Anomalies": Activity,
    "Revenue Monitoring": DollarSign,
  };
  // Flat outline icons for the deep-research category pills — matches the default
  // starter chips (was emoji). Keyed by the group header.
  const deepResearchGroupIcons: Record<string, LucideIcon> = {
    "Performance & diagnostics": Search,
    "Retention & lifetime value": TrendingUp,
    "Revenue growth": DollarSign,
    "Win-back & reactivation": RefreshCw,
    "Channels & campaigns": Megaphone,
    "Journeys & audiences": Compass,
  };
  const defaultStarterPromptsByChip: Record<string, string[]> = {
    "Seasonal Trend": [
      "Show me seasonal engagement trends across channels for the last 12 months.",
      "Which campaigns performed best during festival periods, and why?",
      "What seasonal patterns should we use for next quarter planning?",
    ],
    "CTR Monitoring": [
      "Which campaigns had the highest CTR but lowest conversions, and what could be the possible reasons?",
      "Find the top 5 and bottom 5 campaigns in the last 30 days. Show success rates and patterns behind high and low performance.",
      "Tell me the best time slots to send campaigns on APN, WPN, Email, SMS, and WhatsApp for higher engagement.",
    ],
    "QBR Report": [
      "Summarize this quarter's campaign performance with wins, gaps, and next actions.",
      "Build a QBR snapshot by channel with CTR, CVR, and revenue trends.",
      "Highlight top opportunities and risks for next quarter's campaign plan.",
    ],
    "Channel Anomalies": [
      "Detect unusual drops or spikes in campaign performance by channel in the last 30 days.",
      "Which channels show anomaly patterns in delivery, CTR, or conversion rates?",
      "Suggest likely reasons and next checks for identified channel anomalies.",
    ],
    "Revenue Monitoring": [
      "Which campaigns contributed the most revenue in the last 30 days?",
      "Show revenue trends by channel with week-over-week changes.",
      "Identify low-efficiency campaigns with high spend but low revenue impact.",
    ],
  };
  // Contextual header shown above the suggested prompts for the selected category
  const defaultStarterPromptHeaderByChip: Record<string, string> = {
    "Seasonal Trend": "Explore seasonal trends",
    "CTR Monitoring": "Monitor click-through performance",
    "QBR Report": "Build your QBR report",
    "Channel Anomalies": "Investigate channel anomalies",
    "Revenue Monitoring": "Track revenue performance",
  };

  // A host page can hand over its own chips (the campaign wizard passes the
  // chips for the step that's open); otherwise the generic set above stands.
  const starterChips = starterChipSet
    ? starterChipSet.map((chip) => chip.label)
    : defaultStarterChips;
  const starterChipIcons: Record<string, LucideIcon> = starterChipSet
    ? Object.fromEntries(
        starterChipSet.filter((chip) => chip.icon).map((chip) => [chip.label, chip.icon]),
      )
    : defaultStarterChipIcons;
  const starterPromptsByChip: Record<string, string[]> = starterChipSet
    ? Object.fromEntries(starterChipSet.map((chip) => [chip.label, chip.prompts ?? []]))
    : defaultStarterPromptsByChip;
  const starterPromptHeaderByChip: Record<string, string> = starterChipSet
    ? Object.fromEntries(
        starterChipSet.filter((chip) => chip.header).map((chip) => [chip.label, chip.header]),
      )
    : defaultStarterPromptHeaderByChip;
  // Chips that hand back to the host page instead of opening a prompt list.
  const starterChipActions: Record<string, () => void> = starterChipSet
    ? Object.fromEntries(
        starterChipSet.filter((chip) => chip.onSelect).map((chip) => [chip.label, chip.onSelect]),
      )
    : {};

  // Deep-research suggestion set: category sections (emoji + header) each with a
  // couple of chips. The chip's short `label` is shown; clicking sends the fuller
  // `prompt` — a "get a detailed report" style deep-research request.
  const deepResearchPromptGroups: {
    emoji: string;
    header: string;
    chips: { label: string; prompt: string }[];
  }[] = [
    {
      emoji: "🔍",
      header: "Performance & diagnostics",
      chips: [
        {
          label: "Quarterly performance diagnostic",
          prompt:
            "Run a full quarterly performance diagnostic across every channel — delivery, engagement, conversion, and spend — and tell me exactly where we're winning and where we're leaking.",
        },
        {
          label: "Executive summary & opportunities",
          prompt:
            "Give me an executive summary of this quarter's marketing performance, with the top three opportunities I should act on next.",
        },
      ],
    },
    {
      emoji: "📈",
      header: "Retention & lifetime value",
      chips: [
        {
          label: "Is our retention improving?",
          prompt:
            "Analyze our customer retention and repeat-purchase trends over the last four quarters and tell me whether retention is actually improving.",
        },
        {
          label: "Best long-term-value channel",
          prompt:
            "Which acquisition channel produces the highest long-term customer lifetime value, and how should that change where we invest?",
        },
      ],
    },
    {
      emoji: "💰",
      header: "Revenue growth",
      chips: [
        {
          label: "Last 30 days revenue (marketing read)",
          prompt: "Break down our last 30 days of revenue in plain marketing terms.",
        },
        {
          label: "A plan to grow revenue",
          prompt:
            "Build me a data-backed plan to grow revenue next quarter, with the specific segments, channels, and journeys to prioritize.",
        },
        {
          label: "Where revenue concentrates",
          prompt:
            "Show me where our revenue actually concentrates — by segment, channel, and campaign — and how dependent we are on our top customers.",
        },
      ],
    },
    {
      emoji: "🔁",
      header: "Win-back & reactivation",
      chips: [
        {
          label: "Reactivate lapsed customers",
          prompt:
            "Identify our lapsed customers and design a win-back strategy to reactivate the ones most likely to return.",
        },
        {
          label: "Dormant-audience opportunity",
          prompt:
            "Estimate the revenue opportunity sitting in our dormant audience and the best way to re-engage them.",
        },
      ],
    },
    {
      emoji: "📢",
      header: "Channels & campaigns",
      chips: [
        {
          label: "Optimize the channel mix",
          prompt:
            "Analyze our current channel mix and recommend how to reallocate budget across channels for the best return.",
        },
        {
          label: "What made winning campaigns win",
          prompt:
            "Break down what our best-performing campaigns had in common and how to repeat those wins.",
        },
      ],
    },
    {
      emoji: "🧭",
      header: "Journeys & audiences",
      chips: [
        {
          label: "Journey health audit",
          prompt:
            "Audit the health of our active journeys — entry rates, drop-off points, and conversion — and flag the ones that need fixing.",
        },
        {
          label: "Best & worst segments",
          prompt:
            "Compare our best and worst performing segments and tell me what's driving the difference.",
        },
      ],
    },
  ];

  // Live mirror of the ChatInput textarea value — drives the typed-trigger suggestions below.
  const [liveInputValue, setLiveInputValue] = useState("");
  // Recognized opening phrases → 5 curated, product-grounded prompt completions each.
  const typedSuggestionTriggers: { trigger: string; suggestions: string[] }[] = [
    {
      trigger: "I want to",
      suggestions: [
        "I want to plan a campaign around this month's seasonal trends.",
        "I want to create content variants for our next email campaign.",
        "I want to segment our customer base by engagement level.",
        "I want to find the best send times for our WhatsApp campaigns.",
        "I want to improve the conversion rate on our last campaign.",
      ],
    },
    {
      trigger: "How do I",
      suggestions: [
        "How do I set up A/B testing for a new campaign?",
        "How do I write subject lines that improve open rates?",
        "How do I build a lookalike segment from my top customers?",
        "How do I choose the right channel mix for a launch?",
        "How do I fix a campaign with high CTR but low conversions?",
      ],
    },
    {
      trigger: "What is",
      suggestions: [
        "What is the best performing channel for us this quarter?",
        "What is driving the drop in email engagement this month?",
        "What is the ideal send time for my SMS campaigns?",
        "What is the size of our high-value customer segment?",
        "What is causing the anomaly in yesterday's delivery rates?",
      ],
    },
    {
      trigger: "Show me",
      suggestions: [
        "Show me seasonal engagement trends across channels for the last 12 months.",
        "Show me the top 5 and bottom 5 campaigns from the last 30 days.",
        "Show me a breakdown of customers by lifecycle stage.",
        "Show me the best time slots to send campaigns by channel.",
        "Show me revenue trends by channel with week-over-week changes.",
      ],
    },
    {
      trigger: "Help me",
      suggestions: [
        "Help me plan next quarter's campaign calendar.",
        "Help me write content for a re-engagement campaign.",
        "Help me identify at-risk customers before they churn.",
        "Help me schedule campaigns for maximum engagement.",
        "Help me understand why our QBR numbers dipped this quarter.",
      ],
    },
  ];
  const matchedTypedTrigger = useMemo(() => {
    const normalized = liveInputValue.trim().toLowerCase();
    if (!normalized) return null;
    return typedSuggestionTriggers.find((t) =>
      normalized.startsWith(t.trigger.toLowerCase())
    ) ?? null;
  }, [liveInputValue]);

  const handleCopyChatId = (chatId: string) => {
    navigator.clipboard.writeText(chatId);
    setOpenChatId(null);
  };

  const handleShareChat = () => {
    setOpenChatId(null);
  };

  const handleDeleteChat = () => {
    setOpenChatId(null);
  };
  
  // Reference to mock messages definition for use in handlers across the component
  const mockMessagesDefinitionRef = useRef<(Omit<ChatMessageData, 'onAnimationComplete'> & { agentId?: string })[]>([]);
  // Function reference to continue the mock conversation from a specific index
  const addNextMockMessageRef = useRef<(index: number) => void>(() => {}); // Default no-op function

  // State to manage the expanded (full-screen like) view vs. widget view
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  // Opening the docked panel straight onto a finished UI reads as a jump-cut, so
  // the body holds a skeleton for one beat while the header lands immediately.
  // Only for a panel opening onto its home state: when the caller seeds a prompt
  // or a card, the thread starts right away and brings its own loading states.
  // 'home' on a fresh docked open; 'thread' when a past chat is being reopened.
  const [bootPhase, setBootPhase] = useState<'home' | 'thread' | null>(
    docked &&
      !initialExpanded &&
      !initialMessage &&
      !initialInsightCard &&
      !initialAgentChat &&
      !initialTopic &&
      !initialReviewCampaign
      ? 'home'
      : null
  );
  useEffect(() => {
    if (!bootPhase) return;
    const id = setTimeout(() => setBootPhase(null), bootPhase === 'home' ? 620 : 760);
    return () => clearTimeout(id);
  }, [bootPhase]);

  // State to manage which sidebar (bookmarks/history or agents) is active in expanded view
  const [activeSidebar, setActiveSidebar] = useState<'bookmarks' | 'agents' | null>('bookmarks');
  // Collapsed (icon-rail) state for the LHS sidebar in expanded view.
  // A single sidebar component animates its own width + label opacity, so there is
  // no component swap and no position jump between the two states.
  const [lhsCollapsed, setLhsCollapsed] = useState(false);
  // RHS page: the default conversation view, or the full Chats / Bookmarks list page
  const [activePage, setActivePage] = useState<'home' | 'chats' | 'bookmarks' | 'reports' | 'scheduler' | 'custom-agents'>('home');
  // Chats / Agents / Reports / Scheduled / Bookmarks come up behind a spinner
  // rather than appearing fully-formed. Driven off `activePage` so every entry
  // point — widget drawer, expanded sidebar, in-page links — gets it for free.
  const [pageBooting, setPageBooting] = useState(false);
  useEffect(() => {
    if (activePage === 'home') {
      setPageBooting(false);
      return;
    }
    setPageBooting(true);
    const id = setTimeout(() => setPageBooting(false), 700);
    return () => clearTimeout(id);
  }, [activePage]);

  // Custom agents (Claude-Projects-style) — the store is shared with the L1
  // `/agents` page, so an agent created on either surface shows on both. The
  // list page shows all agents; selecting one opens its detail page.
  const { allAgents, agentChats, setAgentChats, createCustomAgent, cloneCustomAgent } = useCustomAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  // Agent attached to the home composer via "+" → "Add to agent" (shows a chip).
  const [composerAgent, setComposerAgent] = useState<{ id: string; name: string; avatarSrc?: string } | null>(null);
  const [composerCreateOpen, setComposerCreateOpen] = useState(false);
  // Seed applied to the empty-state composer when a discovery banner is tapped.
  // Bumping `key` remounts ChatInput so it picks up the new value / deep-research
  // state (see handleDiscoveryBanner).
  const [composerSeed, setComposerSeed] = useState<{ key: number; value: string; deepResearch: boolean; agentMenu: boolean }>({
    key: 0,
    value: '',
    deepResearch: false,
    agentMenu: false,
  });
  // When a chat is launched from a custom-agent's detail page, we (a) override the
  // derived chat title with the agent's name and (b) queue the launch so the
  // scripted "Switched to <agent>" intro can play once the view has reset.
  const [chatTitleOverride, setChatTitleOverride] = useState<string | null>(null);
  const [pendingAgentChat, setPendingAgentChat] = useState<{ agent: { id: string; name: string }; message: string; instant?: boolean } | null>(null);
  // `agentChats` (chats started from an agent's page) lives in the shared store
  // so both agents surfaces show the same history; it also feeds Recents here.
  // `activeAgentChatId` is the one currently open in the conversation view (so
  // Recents doesn't double it up).
  const [activeAgentChatId, setActiveAgentChatId] = useState<string | null>(null);

  const openCustomAgents = () => { setSelectedAgentId(null); setActivePage('custom-agents'); };

  // Which LHS menu row is highlighted. 'home' is the conversation view, so it
  // only counts as "New chat" while the thread is still empty — once the user
  // sends something they're in a chat, not on the new-chat screen.
  const activeNav: LhsNavKey | null =
    activePage === 'home' ? (messages.length === 0 ? 'new-chat' : null) : activePage;
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  // Minimized-view LHS overlay (opened from the widget header menu icon)
  const [showMinOverlay, setShowMinOverlay] = useState(false);
  // Artifact preview split-view (opened from a message's "Preview" button)
  const [showArtifactPreview, setShowArtifactPreview] = useState(false);
  const [artifactFullExpanded, setArtifactFullExpanded] = useState(false);
  // Opened from the Reports page → no chat to split with (hide the split-view
  // toggle), and closing returns to the Reports page rather than home.
  const [artifactFromReports, setArtifactFromReports] = useState(false);
  const [artifactClosing, setArtifactClosing] = useState(false); // exit-animation flag
  const hasOpenedArtifactRef = useRef(false);
  const artifactCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // What the artifact panel renders. `null` → the default dashboard readout;
  // a `deepResearch` entry → that report's document (see ArtifactPreview `doc`).
  const [activeArtifact, setActiveArtifact] = useState<
    | { kind: 'deepResearch'; doc: { title: string; citations: number; summaryHeading?: string; paragraphs: string[] } }
    | null
  >(null);

  // Artifact column is drag-resizable; width is a % of the whole content row.
  // Minimum widths (px) that must hold while resizing so nothing overflows or
  // bounces: the artifact never goes below ARTIFACT_MIN, and the chat keeps CHAT_MIN.
  const ARTIFACT_MIN = 360;
  const CHAT_MIN = 460;
  const [artifactWidth, setArtifactWidth] = useState(50);
  const [artifactResizing, setArtifactResizing] = useState(false);
  const contentRowRef = useRef<HTMLDivElement>(null);

  const startArtifactResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setArtifactResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      const row = contentRowRef.current;
      if (!row) return;
      const rect = row.getBoundingClientRect();
      // Artifact sits on the right, so its width is (right edge − cursor).
      // Clamp in PIXELS to the valid range so it can't overshoot the min/max and
      // then snap back — the panel stays exactly where the cursor leaves it.
      const maxPx = Math.max(ARTIFACT_MIN, rect.width - CHAT_MIN);
      const px = Math.min(maxPx, Math.max(ARTIFACT_MIN, rect.right - ev.clientX));
      setArtifactWidth((px / rect.width) * 100);
    };
    const onUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('mouseup', onUp, true);
      setArtifactResizing(false);
      // No snap — leave the panel where the user dropped it.
    };
    // Capture phase so charts/SVGs inside the artifact can't swallow mousemove
    // via stopPropagation while dragging right to shrink the panel.
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
  };

  const handleOpenArtifactPreview = () => {
    if (artifactCloseTimerRef.current) clearTimeout(artifactCloseTimerRef.current);
    setArtifactClosing(false);
    setShowArtifactPreview(true);
    setArtifactFullExpanded(false);
    // First time a user previews, collapse the LHS to give room
    if (!hasOpenedArtifactRef.current) {
      hasOpenedArtifactRef.current = true;
      setLhsCollapsed(true);
    }
  };

  // Open a Deep Research report in the RHS artifact panel. `fullExpanded` opens
  // the doc previewer full-bleed (chat hidden) — used when arriving from the
  // Reports page, where there's no conversation to sit beside.
  const openDeepResearchArtifact = (
    doc: { title: string; citations: number; summaryHeading?: string; paragraphs: string[] },
    opts?: { fullExpanded?: boolean; fromReports?: boolean }
  ) => {
    setActiveArtifact({ kind: 'deepResearch', doc });
    handleOpenArtifactPreview();
    if (opts?.fullExpanded) setArtifactFullExpanded(true);
    setArtifactFromReports(!!opts?.fromReports);
  };

  const openScheduleFromDoc = (doc: { title: string }) => {
    const report =
      generatedReports.find((r) => r.doc.title === doc.title || r.title === doc.title) ??
      generatedReports[0];
    setSchedulePrefill({
      reportId: report.id,
      name: doc.title,
      lockReport: true,
    });
    setScheduleDialogOpen(true);
  };

  const handleCloseArtifactPreview = () => {
    // If the doc was opened from the Reports page, return there on close
    // (instead of landing on whatever chat/home was behind it).
    const returnToReports = artifactFromReports;
    // Play the slide-out/fade exit before unmounting
    setArtifactClosing(true);
    if (artifactCloseTimerRef.current) clearTimeout(artifactCloseTimerRef.current);
    artifactCloseTimerRef.current = setTimeout(() => {
      setShowArtifactPreview(false);
      setArtifactFullExpanded(false);
      setArtifactFromReports(false);
      setArtifactClosing(false);
      setActiveArtifact(null);
      if (returnToReports) setActivePage('reports');
    }, 320);
  };

  // --- DRAG AND DROP STATE AND REFS ---
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null); // Ref for the main draggable window
  const dragStartRef = useRef({ initialMouseX: 0, initialMouseY: 0, initialWindowX: 0, initialWindowY: 0 });

  // FLIP animation for expand/collapse: capture the panel's rect just before the
  // layout change, then invert + play so it smoothly morphs between the docked
  // widget and full-screen (instead of an instant jump).
  const flipFirstRect = useRef<DOMRect | null>(null);
  const flipAnimRef = useRef<Animation | null>(null);
  const requestExpand = useCallback((next: boolean) => {
    const el = chatWindowRef.current;
    if (el) flipFirstRect.current = el.getBoundingClientRect();
    setIsExpanded(next);
  }, []);

  useLayoutEffect(() => {
    const el = chatWindowRef.current;
    const first = flipFirstRect.current;
    flipFirstRect.current = null;
    if (!el || !first || typeof el.animate !== 'function') return;

    const last = el.getBoundingClientRect();
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = last.width ? first.width / last.width : 1;
    const sy = last.height ? first.height / last.height : 1;
    // Nothing meaningful to animate.
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;

    flipAnimRef.current?.cancel();
    const anim = el.animate(
      [
        { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transformOrigin: 'top left', transform: 'translate(0px, 0px) scale(1, 1)' },
      ],
      { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' }
    );
    flipAnimRef.current = anim;
    const clear = () => {
      el.style.transform = '';
      el.style.willChange = '';
      el.style.zIndex = '';
    };
    // Keep the morphing panel above page content (e.g. the table's sticky cells) while it animates.
    el.style.willChange = 'transform';
    el.style.zIndex = '50';
    anim.onfinish = clear;
    anim.oncancel = clear;
  }, [isExpanded]);

  useEffect(() => {
    // Reset position if window is expanded
    if (isExpanded) {
      setPosition(null);
      setIsDragging(false); // Ensure dragging stops if expanded mid-drag
    }
    // Suppress the atmosphere gradient in minimized/widget view only
    if (isExpanded) {
      document.documentElement.removeAttribute('data-chat-minimized');
    } else {
      document.documentElement.setAttribute('data-chat-minimized', 'true');
    }
    return () => { document.documentElement.removeAttribute('data-chat-minimized'); };
  }, [isExpanded]);

  // Keep the ref synchronized with the state
  useEffect(() => {
    isMockAgentChatActiveRef.current = isMockAgentChatActive;
  }, [isMockAgentChatActive]);


  const handleDragMouseDown = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const targetElement = event.target as HTMLElement;
    // Check if the click was on an interactive element within the header, not the header itself.
    // If so, don't start dragging, let the button/interactive element handle the click.
    if (targetElement.closest('button, a, input, select, textarea, [role="button"]')) {
      // Further check if the closest interactive element is actually part of the header controls,
      // and not the drag handle itself if it somehow gained a role=button.
      // This ensures clicks on actual buttons within the header are not hijacked.
      if (event.currentTarget.contains(targetElement) && targetElement !== event.currentTarget) {
         return;
      }
    }

    if (isExpanded || !chatWindowRef.current) {
      return;
    }
    event.preventDefault();
    setIsDragging(true);

    const currentPosition = position ?? (() => {
      const rect = chatWindowRef.current!.getBoundingClientRect();
      return { x: rect.left, y: rect.top };
    })();

    dragStartRef.current = {
      initialMouseX: event.clientX,
      initialMouseY: event.clientY,
      initialWindowX: currentPosition.x,
      initialWindowY: currentPosition.y,
    };
    
    if (!position) { // If it's the first drag, set the position to activate fixed styling
      setPosition(currentPosition);
    }
    document.body.style.userSelect = 'none';
  }, [isExpanded, position]);

  const handleDragMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || isExpanded || !chatWindowRef.current) {
      return;
    }

    const deltaX = event.clientX - dragStartRef.current.initialMouseX;
    const deltaY = event.clientY - dragStartRef.current.initialMouseY;

    let newX = dragStartRef.current.initialWindowX + deltaX;
    let newY = dragStartRef.current.initialWindowY + deltaY;

    const windowWidth = chatWindowRef.current.offsetWidth;
    const windowHeight = chatWindowRef.current.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    newX = Math.max(0, Math.min(newX, viewportWidth - windowWidth));
    newY = Math.max(0, Math.min(newY, viewportHeight - windowHeight));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging, isExpanded]);

  const handleDragMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.userSelect = '';
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging && !isExpanded) {
      document.addEventListener('mousemove', handleDragMouseMove);
      document.addEventListener('mouseup', handleDragMouseUp);
    } else {
      document.removeEventListener('mousemove', handleDragMouseMove);
      document.removeEventListener('mouseup', handleDragMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMouseMove);
      document.removeEventListener('mouseup', handleDragMouseUp);
      if (document.body.style.userSelect === 'none') { // Clean up just in case
          document.body.style.userSelect = '';
      }
    };
  }, [isDragging, isExpanded, handleDragMouseMove, handleDragMouseUp]);

  // Toggles the enabled state of a marketing agent and dispatches an event
  const handleAgentToggle = (agentId: string) => {
    const agent = marketingAgents.find(a => a.id === agentId);
    if (!agent) return;

    let newStatus: 'join' | 'leave';

    setEnabledAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
        newStatus = 'leave';
      } else {
        newSet.add(agentId);
        newStatus = 'join';
      }
      return newSet;
    });

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('agentStatusChange', {
        detail: {
          name: agent.name,
          status: newStatus,
          icon: agent.icon,
          colorClass: agent.colorClass
        }
      }));
    }, 0);
  };

  const activeAgents: MarketingAgent[] = useMemo(() => {
    return marketingAgents.filter(agent => enabledAgents.has(agent.id));
  }, [enabledAgents]);

  // Whether the current live conversation has been bookmarked from the RHS header.
  const [isChatBookmarked, setIsChatBookmarked] = useState(false);

  // Chat name shown in the header — derived from the first user turn, kept short.
  const chatName = useMemo(() => {
    const firstUser = messages.find(m => m.type === 'chat' && !m.isAI);
    const raw = (firstUser?.navLabel || firstUser?.content || '').trim();
    if (!raw) return null;
    const MAX = 32;
    return raw.length > MAX ? `${raw.slice(0, MAX).trimEnd()}…` : raw;
  }, [messages]);

  // Agent-launched chats (newest first) sit above the seeded defaults in Recents.
  const allRecents = useMemo<LhsChatItem[]>(() => [...agentChats, ...defaultChats], [agentChats]);

  // The live conversation shows up as the top "active" chat in the LHS list.
  const CURRENT_CHAT_ID = '__current__';
  const lhsChats = useMemo(() => {
    if (messages.length === 0) return allRecents;
    const live: LhsChatItem = { id: CURRENT_CHAT_ID, title: chatName || 'New chat', time: 'now' };
    // The live chat already represents the active agent chat — drop its persisted
    // twin so Recents doesn't show it twice.
    return [live, ...allRecents.filter(c => c.id !== activeAgentChatId)];
  }, [messages.length, chatName, allRecents, activeAgentChatId]);
  const activeLhsChatId = messages.length > 0 ? CURRENT_CHAT_ID : null;
  // Pulse the active chat while it is still generating output.
  const busyLhsChatId =
    messages.length > 0 && (isGeneratingOutput || isMockAgentChatActive) ? CURRENT_CHAT_ID : null;
  // Spin the active chat in the LHS list while a deep research is running (from
  // the "Start" tap until the report is ready), so it reads as work-in-progress.
  const researchingLhsChatId =
    messages.length > 0 && deepResearchRunning ? CURRENT_CHAT_ID : null;

  // One line-nav entry per user turn, anchored to its message div (msg-<index>).
  const navItems: LineNavItem[] = useMemo(() => {
    const stripHtml = (s: string) =>
      s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    return messages
      .map((m, index) => ({ m, index }))
      .filter(({ m }) => m.type === 'chat' && !m.isAI)
      .map(({ m, index }) => {
        // The AI reply for this turn is the next chat message that carries text.
        const reply = messages
          .slice(index + 1)
          .find(n => n.type === 'chat' && n.isAI && !!stripHtml(n.content));
        return {
          id: `msg-${index}`,
          label: m.navLabel || (m.content.length > 28 ? `${m.content.slice(0, 28)}…` : m.content),
          userText: stripHtml(m.content) || m.navLabel || '',
          aiText: reply ? stripHtml(reply.content) : '',
        };
      });
  }, [messages]);

  const scrollToBottom = () => {
    stickToBottomRef.current = true;
    programmaticScrollRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false); // Hide button after scrolling
  };

  // Jumps instantly rather than animating — used right after a deliberate
  // follow-up turn (see appendTopic), where the thread below is still
  // growing (typing animation, a card mounting in). Sets scrollTop directly
  // on the scroll container rather than messagesEndRef.scrollIntoView: a
  // smooth OR instant scrollIntoView call made mid-mutation reliably landed
  // back at its pre-call position in testing (scroll anchoring fighting the
  // in-flight layout changes), where forcing scrollTop straight to
  // scrollHeight does not.
  const scrollToBottomInstant = () => {
    const container = chatContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
    setShowScrollButton(false);
  };

  // A single scrollToBottomInstant() call made right after a message mounts
  // lands short of true bottom when that message is still growing (the
  // typewriter effect, a card animating in) — scrollHeight at call time
  // isn't yet the final height. This instead keeps pinning to the bottom on
  // every subsequent DOM mutation inside the thread for `ms`, which covers
  // however long that turn's content takes to finish rendering.
  const stickToBottomFor = (ms: number) => {
    const container = chatContainerRef.current;
    if (!container) return;
    const observer = new MutationObserver(() => {
      container.scrollTop = container.scrollHeight;
    });
    observer.observe(container, { childList: true, subtree: true, characterData: true });
    container.scrollTop = container.scrollHeight;
    window.setTimeout(() => observer.disconnect(), ms);
  };

  // Detect if the user has scrolled away from the bottom on their own —
  // once they have, new content waits for the explicit "scroll to latest"
  // click instead of yanking their view back down.
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      // This 'scroll' event was caused by our own scrollTop write below
      // (or scrollToBottom's scrollIntoView), not the user — consume the
      // flag and leave stickToBottomRef exactly as we just set it.
      if (programmaticScrollRef.current) {
        programmaticScrollRef.current = false;
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < NEAR_BOTTOM_PX;
      stickToBottomRef.current = isNearBottom;
      setShowScrollButton(!isNearBottom);
      // Reveal the top fade only once content has scrolled up under the header.
      setIsChatScrolled(scrollTop > 4);
    };

    chatContainer.addEventListener('scroll', handleScroll);

    return () => chatContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Follow new content to the bottom while the user hasn't scrolled away.
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const checkScrollButton = () => {
      const { scrollHeight, clientHeight } = chatContainer;

      // Stuck to the bottom — keep following through the whole burst of
      // content (reasoning steps, streamed reply, then however many cards
      // land with it), not just one mutation at a time. A stack of several
      // template/subject cards can grow the container by far more than any
      // one mutation's "was I near the bottom before this" check would
      // forgive, so once stuck, stay stuck until the user actually scrolls
      // away themselves (handleScroll above is what un-sticks it).
      if (stickToBottomRef.current) {
        if (chatContainer.scrollTop !== scrollHeight) {
          programmaticScrollRef.current = true;
          chatContainer.scrollTop = scrollHeight;
        }
        setShowScrollButton(false);
        return;
      }
      if (scrollHeight > clientHeight) {
        setShowScrollButton(true);
      }
    };

    // Use MutationObserver to detect when content changes (including typing animation).
    // Observe the scroll container's whole subtree — the messages list class isn't
    // stable, so keying off a specific selector silently no-ops.
    const observer = new MutationObserver(() => {
      checkScrollButton();
    });
    observer.observe(chatContainer, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false,
    });

    // Also re-check on messages load and whenever generation starts/ends, so the
    // button appears once the output finishes and the view is scrolled up.
    checkScrollButton();

    return () => {
      observer.disconnect();
    };
  }, [messages, isGeneratingOutput]);

  // Stop the input shimmer (output generation ended / was stopped).
  const clearInputShimmer = () => {
    if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
    setInputShimmer(false);
  };

  // Track when the current response started so a user-initiated stop can say
  // how long it ran. Cleared as soon as generation ends by any route.
  useEffect(() => {
    const generating = isGeneratingOutput || isMockAgentChatActive || inputShimmer;
    if (generating) {
      if (generationStartedAtRef.current === null) generationStartedAtRef.current = Date.now();
    } else {
      generationStartedAtRef.current = null;
    }
  }, [isGeneratingOutput, isMockAgentChatActive, inputShimmer]);

  const stopMockConversation = (options?: { userInitiated?: boolean }) => {
    if (options?.userInitiated) {
      const startedAt = generationStartedAtRef.current;
      const seconds = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
      // Drop the in-flight thinking placeholder (if any) and close the turn with
      // the "You stopped after Xs" notice.
      setMessages(prev => {
        const base = prev.length && prev[prev.length - 1].isThinkingState ? prev.slice(0, -1) : prev;
        if (base.length && base[base.length - 1].stoppedNotice) return base;
        return [...base, { type: 'chat' as const, content: '', isAI: true, stoppedNotice: { seconds } }];
      });
    }
    setIsMockAgentChatActive(false);
    isStoryFlowActiveRef.current = false;
    setIsGeneratingOutput(false);
    clearInputShimmer();
    if (mockMessageTimeoutRef.current) {
      clearTimeout(mockMessageTimeoutRef.current);
      mockMessageTimeoutRef.current = null;
    }
  };

  const handleComposerDeepResearchChange = (active: boolean) => {
    setDeepResearchActive(active);
    if (active) setComposerAgent(null);
    setSelectedStarterChip(null);
    setSelectedDeepResearchCategory(null);
  };

  const handleComposerAgentChip = (agent: { id: string; name: string; avatarSrc?: string } | null) => {
    if (agent) {
      setDeepResearchActive(false);
      setSelectedStarterChip(null);
      setSelectedDeepResearchCategory(null);
    }
    setComposerAgent(agent);
  };

  // Discovery banner taps — each card wires the empty-state composer to a
  // different entry point. Keyed by the banner id from DiscoveryBanners.tsx.
  const handleDiscoveryBanner = (bannerId: string) => {
    switch (bannerId) {
      case 'custom-agents': {
        // Open the composer's "+" menu with the Custom-agents L2 flyout expanded
        // so the user can pick any agent themselves (rather than auto-attaching one).
        handleComposerAgentChip(null);
        setDeepResearchActive(false);
        setComposerSeed((s) => ({ key: s.key + 1, value: '', deepResearch: false, agentMenu: true }));
        break;
      }
      case 'deep-research-reports': {
        // Turn on deep research (parent state + remount composer into DR mode).
        handleComposerDeepResearchChange(true);
        setComposerSeed((s) => ({ key: s.key + 1, value: '', deepResearch: true, agentMenu: false }));
        break;
      }
      case 'schedule-reports': {
        // Jump to the Schedule tab.
        setActivePage('scheduler');
        break;
      }
      case 'multi-agent': {
        // Pre-type a prompt that calls on both the insights and segment agents.
        const prompt =
          'Get insights on what changed in my campaigns this month, then have the segment agent build target audiences from those findings.';
        handleComposerAgentChip(null);
        setDeepResearchActive(false);
        setComposerSeed((s) => ({ key: s.key + 1, value: prompt, deepResearch: false, agentMenu: false }));
        break;
      }
    }
  };

  // Resets the RHS to its default empty state so the user can start a fresh chat.
  const handleNewChat = () => {
    stopMockConversation();
    hasRunStoryRef.current = false;
    hasRunFollowupsRef.current = false;
    setActivePage('home');
    setSelectedAgentId(null);
    setComposerAgent(null);
    setChatTitleOverride(null);
    setPendingAgentChat(null);
    setActiveAgentChatId(null);
    setMessages([]);
    setShowSuggestions(false);
    setDynamicSuggestions(null);
    campaignsTurnRef.current = 0;
    segmentsFlowRef.current = null;
    deepResearchStoryStepRef.current = 0;
    deepResearchTopicRef.current = null;
    setDeepResearchRunning(false);
    setIsChatBookmarked(false);
    resetFeedback();
    setMockChatCompleted(false);
    setContentApproved(false);
    setContentGenerated(false);
    setAutonomousWaitingForInput(false);
    setSelectedStarterChip(null);
    setLiveInputValue("");
    // Reset the empty-state composer seed so a fresh chat never reopens a
    // banner-triggered state (e.g. the Custom agents popover) or a pre-typed
    // prompt / deep-research chip. Bumping the key forces a clean remount.
    setDeepResearchActive(false);
    setSelectedDeepResearchCategory(null);
    setComposerSeed((s) => ({ key: s.key + 1, value: "", deepResearch: false, agentMenu: false }));
    setShowMinOverlay(false);
    // Tear down the artifact preview split-view
    if (artifactCloseTimerRef.current) {
      clearTimeout(artifactCloseTimerRef.current);
      artifactCloseTimerRef.current = null;
    }
    setShowArtifactPreview(false);
    setArtifactFullExpanded(false);
    setArtifactClosing(false);
    setActiveArtifact(null);
    hasOpenedArtifactRef.current = false;
  };

  // A recents-list title, derived from the user's first message. Kept short.
  const shortenChatTitle = (raw: string) => {
    const t = raw.trim();
    const MAX = 32;
    return t.length > MAX ? `${t.slice(0, MAX).trimEnd()}…` : t;
  };

  // The user can type anything into the composer, but the first message shown in
  // an agent chat should always read as a sensible, well-formed prompt for that
  // agent. So we map whatever was typed to the agent's clean starter prompt: its
  // own `starterPrompt` when set, otherwise one derived from its name/description.
  const senseAgentPrompt = (agentId: string, _typed: string): string => {
    const full = allAgents.find(a => a.id === agentId);
    const starter = full?.starterPrompt?.trim();
    if (starter) return starter;
    // No explicit starter: a clean, always-grammatical opener based on the name.
    const name = full?.name?.trim() || 'this agent';
    return `Help me get started with ${name}.`;
  };

  // Reset the conversation and queue a scripted "Switched to <agent>" intro for
  // the given agent + prompt. Shared by both a fresh launch from the agent's
  // page (handleStartAgentChat) and re-opening a past chat (handleOpenAgentChat).
  const primeAgentChat = (agent: { id: string; name: string; avatarSrc?: string }, message: string, chatId: string, instant = false) => {
    handleNewChat();
    setComposerAgent({ id: agent.id, name: agent.name, avatarSrc: agent.avatarSrc });
    setChatTitleOverride(agent.name); // header label = agent name
    setActiveAgentChatId(chatId);
    setPendingAgentChat({ agent, message, instant });
  };

  // Bind an agent to the composer without sending anything: an empty thread with
  // the agent's chip already in the field, ready for the user to type. Used by
  // the L1 agent page's "Start chat", where the page has no composer of its own.
  // No Recents entry until the user actually sends (handleSendMessage routes
  // through handleStartAgentChat once `composerAgent` is set).
  const bindComposerAgent = (agent: { id: string; name: string; avatarSrc?: string }) => {
    handleNewChat();
    setComposerAgent({ id: agent.id, name: agent.name, avatarSrc: agent.avatarSrc });
    setChatTitleOverride(agent.name);
  };

  // Launched from a custom-agent's detail page: persist a Recents entry for this
  // agent, then prime the scripted intro chat.
  const handleStartAgentChat = (agent: { id: string; name: string; avatarSrc?: string }, message: string) => {
    const chatId = `agent-chat-${Date.now()}`;
    // Map whatever the user typed into a sensible, well-formed first prompt.
    const prompt = senseAgentPrompt(agent.id, message);
    const title = prompt.trim() ? shortenChatTitle(prompt) : `Chat with ${agent.name}`;
    setAgentChats(prev => [{ id: chatId, title, time: 'now', agentId: agent.id }, ...prev]);
    primeAgentChat(agent, prompt, chatId);
  };

  // Re-open a persisted agent chat from a Recents / history row — this is
  // browsing history, not starting a new exchange, so it renders the finished
  // conversation instantly (`instant: true`) instead of replaying the typing /
  // hand-off / thinking animation that a fresh launch plays.
  const handleOpenAgentChat = (chat: LhsChatItem) => {
    const agent = allAgents.find(a => a.id === chat.agentId);
    if (!agent) return;
    setAgentChats(prev => [chat, ...prev.filter(c => c.id !== chat.id)]); // bump to top
    primeAgentChat({ id: agent.id, name: agent.name, avatarSrc: agent.avatarSrc }, chat.title, chat.id, true);
  };

  /**
   * A seeded Recents row has no scripted agent behind it, so reopening one drops
   * in a finished conversation built from the campaigns relay — the Insights
   * hand-off and the segment it produced. Browsing history, so it renders as
   * already-resolved: no typewriter, no thinking beat, switch markers settled.
   */
  const loadHistoryThread = (chat?: LhsChatItem) => {
    handleNewChat();
    const turns = CAMPAIGNS_FLOW.slice(0, 2);
    const thread: ChatMessageData[] = [];
    turns.forEach((turn, i) => {
      const agent = marketingAgents.find(a => a.id === turn.switchAgentId);
      thread.push({
        type: 'chat', isAI: false, content: turn.userPrompt, animate: false,
        navLabel: turn.navLabel, onAnimationComplete: () => {},
      });
      thread.push({
        type: 'chat', isAI: true, content: '',
        isAgentSwitch: true, switchSettled: true,
        switchAgentLabel: turn.switchAgentLabel,
        switchFromLabel: i > 0 ? turns[i - 1].switchAgentLabel : undefined,
        reasoningSteps: turn.reasoningSteps,
        avatarSrc: agent?.avatarSrc, avatarIcon: agent?.icon, avatarBgClass: agent?.colorClass,
        animate: false,
      });
      thread.push({
        type: 'chat', isAI: true, agentName: turn.switchAgentLabel,
        avatarSrc: agent?.avatarSrc, avatarIcon: agent?.icon, avatarBgClass: agent?.colorClass,
        content: turn.output,
        hidePerformanceDashboard: !turn.showDashboard,
        agentArtifactCard: turn.artifactCard,
        animate: false,
      });
    });
    setMessages(thread);
    setMockChatCompleted(true);
    // A follow-up send picks the relay up where this history left off.
    campaignsTurnRef.current = turns.length;
    if (chat) setChatTitleOverride(chat.title);
  };

  // Selecting any Recents / chat-list row: agent chats replay their scripted
  // intro, seeded rows load the history thread above. Either way the chat area
  // holds a thread-shaped skeleton for a beat first, so the conversation arrives
  // rather than snapping in.
  const handleSelectChat = (id: string) => {
    const agentChat = agentChats.find(c => c.id === id);
    setBootPhase('thread');
    setActivePage('home');
    if (agentChat) handleOpenAgentChat(agentChat);
    else loadHistoryThread(allRecents.find(c => c.id === id));
  };

  // Scripted intro for an agent-launched chat: the user's prompt, a
  // "Switched to <agent>" hand-off divider, a thinking beat, then the agent's
  // reply. Mirrors the campaigns relay sequencer (switch → thinking → answer).
  const runAgentIntroChat = (agent: { id: string; name: string }, message: string, instant = false) => {
    const userMessage: ChatMessageData = {
      type: 'chat', isAI: false, content: message, onAnimationComplete: () => {},
    };
    // The agent's soft-gradient avatar drives the hand-off thread header.
    const fullAgent = allAgents.find(a => a.id === agent.id);
    const avatarSrc = fullAgent?.avatarSrc;
    const isReportAgent = agent.name.trim().toLowerCase() === MONTHLY_REPORT_AGENT_NAME.toLowerCase();
    // One-line "what it does" saying under the agent's name in the hand-off header.
    const saying = isReportAgent
      ? "Let me pull last month's performance into a clear report."
      : (fullAgent?.description || undefined);

    // The "Switched to <agent>" hand-off + a thinking beat open every agent chat.
    const intro: ChatMessageData[] = [
      {
        type: 'chat', isAI: true, content: '',
        isAgentSwitch: true,
        switchAgentLabel: agent.name,
        avatarSrc,
        // The live fluid orb animates in the agent's own avatar colors, then
        // settles into its SVG avatar; plus a one-line "what it does" saying.
        switchOrbTheme: generateAgentOrbTheme(agent.name),
        switchSaying: saying,
        reasoningSteps: [`Understanding your request`, `Reviewing ${agent.name}'s instructions`],
      },
      {
        type: 'chat', isAI: true, content: '',
        isThinkingState: true,
        thinkingDuration: 3,
        reasoningSteps: isReportAgent
          ? [
              `Gathering last month's campaign metrics`,
              `Comparing against the prior month and last year`,
              `Drafting the report outline`,
            ]
          : [
              `Reading the prompt and any attached context`,
              `Mapping it to ${agent.name}'s instructions`,
              `Outlining a first response`,
            ],
      },
    ];

    // The Monthly report agent generates a document: a short lead-in line
    // (feedback suppressed so nothing sits between it and the doc), then the
    // finished report reveals itself (loading skeleton → report → thumbs).
    const body: ChatMessageData[] = isReportAgent
      ? [
          {
            type: 'chat', isAI: true, agentName: agent.name, avatarSrc,
            content:
              "Here's your monthly performance report. I pulled last month's numbers across " +
              "every channel, compared them to the prior month and last year, and summarized " +
              "the headline movers below.",
            hidePerformanceDashboard: true,
            hideFeedback: true,
          },
          {
            type: 'chat', isAI: true, content: '',
            deepResearchDoc: MONTHLY_REPORT_DOC,
          },
        ]
      : [
          {
            type: 'chat', isAI: true, agentName: agent.name, avatarSrc,
            content:
              `I'm on it as <strong>${agent.name}</strong>. Here's how I'd approach ` +
              `${message.trim() ? `“${message.trim()}”` : 'this'}:\n\n` +
              `• Break the request down and pull in the relevant context from my instructions and files\n` +
              `• Draft an initial plan and flag anything I need from you\n` +
              `• Iterate with you until it's ready to ship\n\n` +
              `Want me to go deeper on any of these?`,
            hidePerformanceDashboard: true,
          },
        ];

    const sequence: ChatMessageData[] = [...intro, ...body];

    // Reopening a past chat is browsing history, not generating a new reply —
    // drop the whole finished thread in as-is (switch marker pre-settled, text
    // rendered without the typewriter effect, no thinking timers, no shimmer)
    // instead of replaying the animation.
    if (instant) {
      setMessages([
        { ...userMessage, animate: false },
        // Drop the "thinking…" beat — by the time this is history it's already
        // resolved into the final answer, so showing it would read as stuck.
        ...sequence
          .filter(m => !m.isThinkingState)
          .map(m => ({
            ...m,
            animate: false,
            ...(m.isAgentSwitch ? { switchSettled: true } : {}),
            // Skip the report doc's own loading skeleton for the same reason.
            ...(m.deepResearchDoc ? { deepResearchDoc: { ...m.deepResearchDoc, skeletonMs: 0 } } : {}),
          })),
      ]);
      setMockChatCompleted(true);
      return;
    }

    setMessages([userMessage]);
    setIsGeneratingOutput(true);
    setInputShimmer(true);
    setIsMockAgentChatActive(true);
    isMockAgentChatActiveRef.current = true;
    isStoryFlowActiveRef.current = true;

    const finalize = () => {
      // Settle the switch marker (orb → SVG avatar, waves stop) and hand control
      // back. A plan card, if present, self-drives from here and swaps to the doc.
      setMessages(prev => prev.map(m =>
        m.isAgentSwitch && !m.switchSettled ? { ...m, switchSettled: true } : m
      ));
      setIsMockAgentChatActive(false);
      isStoryFlowActiveRef.current = false;
      setIsGeneratingOutput(false);
      clearInputShimmer();
      setMockChatCompleted(true);
      playResponseCue();
      if (mockMessageTimeoutRef.current) { clearTimeout(mockMessageTimeoutRef.current); mockMessageTimeoutRef.current = null; }
    };

    const step = (index: number) => {
      if (!isMockAgentChatActiveRef.current) {
        if (mockMessageTimeoutRef.current) { clearTimeout(mockMessageTimeoutRef.current); mockMessageTimeoutRef.current = null; }
        return;
      }
      if (index >= sequence.length) { finalize(); return; }
      const def = sequence[index];
      // The switch divider isn't a ChatMessage and never fires onAnimationComplete
      // — advance on a timer once its two-beat reveal has played.
      if (def.isAgentSwitch) {
        setMessages(prev => [...prev, def]);
        if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
        mockMessageTimeoutRef.current = setTimeout(() => step(index + 1), 2600);
        return;
      }
      // The report doc renders its own loading skeleton before revealing and
      // isn't a streaming ChatMessage — drop it in and finalize.
      if (def.deepResearchDoc || def.deepResearchPlan) {
        setMessages(prev => [...prev, def]);
        finalize();
        return;
      }
      setMessages(prev => [...prev, {
        ...def,
        onAnimationComplete: () => {
          if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
          mockMessageTimeoutRef.current = setTimeout(() => step(index + 1), 650);
        },
      }]);
    };

    if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
    mockMessageTimeoutRef.current = setTimeout(() => step(0), 600);
  };

  // Play the queued agent intro once `handleNewChat` has emptied the thread, so
  // the sequence runs from a fresh, clean conversation.
  useEffect(() => {
    if (!pendingAgentChat || messages.length > 0) return;
    const { agent, message, instant } = pendingAgentChat;
    setPendingAgentChat(null);
    runAgentIntroChat(agent, message, instant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAgentChat, messages.length]);

  const handleModeSwitch = (newMode: 'collaborative' | 'autonomous') => {
    if (newMode !== selectedMode) {
      // If there are messages, show confirmation popup
      if (messages.length > 0) {
        setPendingMode(newMode);
        setShowModeSwitchConfirmation(true);
      } else {
        // If no messages, switch directly
        setSelectedMode(newMode);
      }
    }
  };

  const confirmModeSwitch = () => {
    if (pendingMode) {
      // Clear current conversation
      setMessages([]);
      setIsMockAgentChatActive(false);
      isStoryFlowActiveRef.current = false;
      hasRunStoryRef.current = false;
      hasRunFollowupsRef.current = false;
      setShowSuggestions(false);
      setDynamicSuggestions(null);
      campaignsTurnRef.current = 0;
      segmentsFlowRef.current = null;
      deepResearchStoryStepRef.current = 0;
      deepResearchTopicRef.current = null;
      setDeepResearchRunning(false);
      resetFeedback();
      setIsGeneratingOutput(false);
      setMockChatCompleted(false);
      setContentApproved(false);
      setContentGenerated(false);
      setAutonomousWaitingForInput(false);
      
      // Clear any timeouts
      if (mockMessageTimeoutRef.current) {
        clearTimeout(mockMessageTimeoutRef.current);
        mockMessageTimeoutRef.current = null;
      }
      
      // Switch to new mode
      setSelectedMode(pendingMode);
      
      // Close popup and reset pending mode
      setShowModeSwitchConfirmation(false);
      setPendingMode(null);
    }
  };

  const cancelModeSwitch = () => {
    setShowModeSwitchConfirmation(false);
    setPendingMode(null);
  };

  // Dev mode handlers
  const toggleDevOptions = () => {
    setShowDevOptions(!showDevOptions);
  };

  const handleDisableAnimationToggle = () => {
    setDisableAnimation(!disableAnimation);
  };

  const handleDisableContentAccordionToggle = () => {
    setDisableContentAccordion(!disableContentAccordion);
  };

  const handlePromptTemplateExistsToggle = () => {
    setPromptTemplateExists(!promptTemplateExists);
  };

  const handleApproveContent = () => {
    setContentApproved(true);
    // Find the Content Agent Response message index and continue from the next message (Scheduler Agent)
    const contentAgentResponseIndex = mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgent);
    if (contentAgentResponseIndex >= 0) {
      // Continue the flow from the next message after content agent response (Scheduler Agent)
      addNextMockMessageRef.current(contentAgentResponseIndex + 1);
    }
  };

  const handleApproveSegments = () => {
    setSegmentsApproved(true);
    // Find the Segment Agent table message index and continue from the next message (Content Agent Question Choice)
    const segmentAgentTableIndex = mockMessagesDefinitionRef.current.findIndex(msg => 
      msg.agentName === 'Segment agent' && msg.content.includes('<table')
    );
    if (segmentAgentTableIndex >= 0) {
      // Continue the flow from the next message after segment agent table (Content Agent Question Choice)
      addNextMockMessageRef.current(segmentAgentTableIndex + 1);
    }
  };

  const handleUpdateContent = (updatedContent: any) => {
    // Find the content agent from the imported marketingAgents
    const contentAgent = marketingAgents.find(agent => agent.id === 'content-agent');
    
    // Create a summary of the changes made
    const { collaborativeContentData, selectedSegment } = updatedContent;
    const segmentData = collaborativeContentData.email[selectedSegment];
    
    // Create a message that shows the updated content
    const updateMessage = `I've incorporated your changes into the content. Here's the updated version with your modifications:

**Email Subject Line:** ${segmentData.subject}

The content has been updated across all channels to reflect your changes.`;
    
    // Create a new content agent response message with the updated content
    const newContentAgentMessage = {
      agentId: contentAgent?.id || 'content-agent',
      type: 'chat' as const,
      isAI: true,
      agentName: contentAgent?.name || 'Content Agent',
      content: updateMessage,
      avatarSrc: contentAgent?.avatarSrc,
      avatarIcon: contentAgent?.icon,
      avatarBgClass: contentAgent?.colorClass,
      isContentAgent: true,
      isPlanMode: false,
      showApproveContentCTA: true,
      updatedContent: updatedContent  // Pass the updated content
    };

    // Add the new message to the conversation
    setMessages(prev => [...prev, newContentAgentMessage]);
    
    // Reset content approved state so user needs to approve the new content
    setContentApproved(false);
  };

  const handleDiscardChanges = () => {
    // Just revert the changes, no new message needed
    // The ContentAgentResponse component will handle the actual content revert
  };

  const handleFlowExecutionMessage = () => {
    const coMarketer = marketingAgents.find(agent => agent.id === 'co-marketer');
    const executionMessage: ChatMessageData = {
      type: 'chat',
      agentName: coMarketer?.name || "Cori",
      avatarSrc: coMarketer?.avatarSrc,
      avatarIcon: coMarketer?.icon,
      avatarBgClass: coMarketer?.colorClass,
      isAI: true,
      content: "", // Content is handled by the FlowExecutionProgress component
      isFlowExecutionProgress: true,
      onFlowExecutionComplete: () => {
        // This callback is called when the FlowExecutionProgress component completes all steps
        setTimeout(() => {
          const followUpMessage: ChatMessageData = {
            type: 'chat',
            agentName: coMarketer?.name || "Cori",
            avatarSrc: coMarketer?.avatarSrc,
            avatarIcon: coMarketer?.icon,
            avatarBgClass: coMarketer?.colorClass,
            isAI: true,
            content: `Great! The <strong>Email</strong> and <strong>APN campaigns</strong> have now been saved as drafts and are ready to go. However, there's a slight issue with the <strong>WhatsApp templates</strong> that requires your manual review.\n\n<strong>WhatsApp Template Issues:</strong>\n• Initial template was approved but Meta assigned it a different category than expected\n• Second template was rejected by Meta due to policy compliance issues\n\n<strong>Manual Steps Required:</strong>\n1. <strong>Review Template Categories:</strong> Log into Meta Business Manager and check the assigned category for the approved template. Decide if you want to proceed with the different category or request a change.\n\n2. <strong>Address Rejected Template:</strong> Review the rejection reasons in your Meta Business Manager dashboard. Common issues include:\n   • Promotional content in template headers\n   • Missing required opt-out language\n   • Non-compliant call-to-action buttons\n\n3. <strong>Template Resubmission:</strong> If needed, modify and resubmit the rejected template with the necessary compliance updates.\n\n4. <strong>Campaign Activation:</strong> Once WhatsApp templates are resolved, you can activate all three campaigns simultaneously.\n\nWould you like me to provide more specific guidance on any of these steps?`,
            onAnimationComplete: () => {}
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 1000); // Small delay to make the conversation flow feel natural
      },
      onAnimationComplete: () => {}
    };
    setMessages(prev => [...prev, executionMessage]);
  };

  // --- Campaigns agent-relay flow --------------------------------------------
  // A scripted three-turn hand-off (Insights → Segment → Insights). Every send
  // advances one turn: it drops a centered "Switched to <agent>" divider, plays
  // the agent's thinking, streams the answer (+ dashboard or artifact card), and
  // surfaces the single prompt that leads into the next agent. See CAMPAIGNS_FLOW.
  const handleCampaignsSend = (message: string, insightCard?: InsightCardContext) => {
    const turnIndex = campaignsTurnRef.current;
    // 'segments' plays a per-card Segment-agent thread picked from the opening
    // prompt; every other variant plays the fixed campaigns relay.
    let flow = CAMPAIGNS_FLOW;
    if (conversationVariant === 'segments') {
      if (!segmentsFlowRef.current) segmentsFlowRef.current = resolveSegmentsFlow(message);
      flow = segmentsFlowRef.current;
    }
    const turn = flow[turnIndex];

    // Turn 0 keeps the caller's message (e.g. an insight card or hero composer);
    // later scripted turns still substitute the canonical prompt.
    const userMessage: ChatMessageData = {
      type: 'chat',
      isAI: false,
      content: turn
        ? turnIndex === 0
          ? insightCard
            ? formatInsightContent(insightCard)
            : message
          : turn.userPrompt
        : message,
      insightCard: turnIndex === 0 ? insightCard : undefined,
      navLabel: turn?.navLabel,
      onAnimationComplete: () => {},
    };
    const sentMsgIndex = messages.length;
    setMessages(prev => [...prev, userMessage]);
    setShowSuggestions(false);
    setDynamicSuggestions(null);
    resetFeedback();
    setMockChatCompleted(false);
    setIsGeneratingOutput(true);

    // Pin the just-sent message near the top so the response reveals below it.
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    setInputShimmer(true);
    if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
    inputShimmerTimerRef.current = setTimeout(() => setInputShimmer(false), 30000);

    // Past the scripted turns — a gentle acknowledgement, no further hand-offs.
    if (!turn) {
      setIsGeneratingOutput(false);
      clearInputShimmer();
      const coMarketer = marketingAgents.find(a => a.id === 'co-marketer');
      setTimeout(() => {
        setMessages(prev => [...prev, {
          type: 'chat', isAI: true, agentName: coMarketer?.name,
          avatarSrc: coMarketer?.avatarSrc, avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass,
          content: "Your insights and segment are all set. Tap the card above to review, or ask me for anything else.",
          hidePerformanceDashboard: true,
          onAnimationComplete: () => {},
        }]);
      }, 400);
      return;
    }

    campaignsTurnRef.current = turnIndex + 1;
    const agent = marketingAgents.find(a => a.id === turn.switchAgentId);
    // Turn 0 has no previous agent — the orb morphs from the neutral default
    // theme, reading as "handed off from the system".
    const prevLabel = turnIndex > 0 ? flow[turnIndex - 1].switchAgentLabel : undefined;

    // This turn's sequence: switch divider → thinking → the agent's answer.
    const sequence: ChatMessageData[] = [
      {
        type: 'chat', isAI: true, content: '',
        isAgentSwitch: true,
        switchAgentLabel: turn.switchAgentLabel,
        switchFromLabel: prevLabel,
        reasoningSteps: turn.reasoningSteps,
        avatarSrc: agent?.avatarSrc, avatarIcon: agent?.icon, avatarBgClass: agent?.colorClass,
      },
      {
        type: 'chat', isAI: true, content: '',
        isThinkingState: true, thinkingDuration: 4, reasoningSteps: turn.reasoningSteps,
      },
      {
        type: 'chat', isAI: true,
        agentName: turn.switchAgentLabel,
        avatarSrc: agent?.avatarSrc, avatarIcon: agent?.icon, avatarBgClass: agent?.colorClass,
        content: turn.output,
        hidePerformanceDashboard: !turn.showDashboard,
        agentArtifactCard: turn.artifactCard,
      },
    ];

    setIsMockAgentChatActive(true);
    isMockAgentChatActiveRef.current = true;
    isStoryFlowActiveRef.current = true;

    const step = (index: number) => {
      if (!isMockAgentChatActiveRef.current) {
        if (mockMessageTimeoutRef.current) { clearTimeout(mockMessageTimeoutRef.current); mockMessageTimeoutRef.current = null; }
        return;
      }
      if (index >= sequence.length) {
        // The answer has fully streamed — settle every switch marker so the
        // orb hands over to the agent's SVG avatar and the divider waves stop.
        setMessages(prev => prev.map(m =>
          m.isAgentSwitch && !m.switchSettled ? { ...m, switchSettled: true } : m
        ));
        setIsMockAgentChatActive(false);
        isStoryFlowActiveRef.current = false;
        setIsGeneratingOutput(false);
        clearInputShimmer();
        setMockChatCompleted(true);
        if (turn.nextSuggestion) {
          setDynamicSuggestions([turn.nextSuggestion]);
          setShowSuggestions(true);
        } else {
          setShowFeedbackPrompt(true);
        }
        playResponseCue();
        if (mockMessageTimeoutRef.current) { clearTimeout(mockMessageTimeoutRef.current); mockMessageTimeoutRef.current = null; }
        return;
      }
      const def = sequence[index];
      // Dividers aren't ChatMessages and never fire onAnimationComplete — advance on a timer.
      if (def.isAgentSwitch) {
        setMessages(prev => [...prev, def]);
        if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
        // Let the two-beat divider (Calling in agents… → Switched to <agent>)
        // and the staged thread-header reveal play out before the thinking dots.
        mockMessageTimeoutRef.current = setTimeout(() => step(index + 1), 2600);
        return;
      }
      setMessages(prev => [...prev, {
        ...def,
        onAnimationComplete: () => {
          if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
          mockMessageTimeoutRef.current = setTimeout(() => step(index + 1), 650);
        },
      }]);
    };

    if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
    mockMessageTimeoutRef.current = setTimeout(() => step(0), 500);
  };

  // --- Cori App Push "cart recovery" flow ------------------------------------
  // Typing "create an app push campaign for users who added products to their
  // cart" in the campaigns chat plays this instead of CAMPAIGNS_FLOW: Cori asks
  // Questions cards, drafts the notification on template 80006, shows a brief,
  // and "Preview campaign" hands it to the creation wizard's preview screen.
  // Pill labels shown above the composer while Cori works on the current turn —
  // specific to the app push step instead of the generic insights ones.
  const [coriLoaderLabels, setCoriLoaderLabels] = useState<string[] | null>(null);
  // The Questions card in flight — docked above the composer (not in the thread)
  // so it stays in line with the input, like the journey co-marketer's.
  const [dockedQuestions, setDockedQuestions] = useState<Extract<PushFlowCard, { kind: 'questions' }> | null>(null);
  const pushFlowRef = useRef<{ active: boolean; one: FlowAnswers; two: FlowAnswers; draft: PushCartDraft | null; v2?: PushCartDraft | null; apps?: string[] }>({
    active: false, one: {}, two: {}, draft: null,
  });

  /** Thinking beat, then one Cori message (optionally carrying a flow card). */
  const playCoriReply = (
    reply: { content: string; pushFlowCard?: PushFlowCard; inlineCard?: PushFlowCard; setupApplyCard?: SetupApplyCardData },
    reasoningSteps?: string[],
    seconds = 3,
    loaderLabels?: string[],
  ) => {
    const cori = marketingAgents.find(a => a.id === 'co-marketer');
    setCoriLoaderLabels(loaderLabels ?? null);
    const docked = reply.pushFlowCard?.kind === 'questions' ? reply.pushFlowCard : null;
    setDockedQuestions(null);
    setIsMockAgentChatActive(true);
    isMockAgentChatActiveRef.current = true;
    setIsGeneratingOutput(true);
    setInputShimmer(true);
    if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
    inputShimmerTimerRef.current = setTimeout(() => setInputShimmer(false), 30000);
    const finish = () => {
      setIsMockAgentChatActive(false);
      isMockAgentChatActiveRef.current = false;
      setIsGeneratingOutput(false);
      clearInputShimmer();
      setMockChatCompleted(true);
      playResponseCue();
      if (docked) {
        setDockedQuestions(docked);
        stickToBottomFor(2500);
      }
    };
    setMessages(prev => [...prev, {
      type: 'chat', isAI: true, content: '',
      isThinkingState: true, thinkingDuration: seconds, reasoningSteps,
      onAnimationComplete: () => {
        window.setTimeout(() => {
          setMessages(p => [...p, {
            type: 'chat', isAI: true,
            agentName: cori?.name,
            avatarSrc: cori?.avatarSrc, avatarIcon: cori?.icon, avatarBgClass: cori?.colorClass,
            content: reply.content,
            pushFlowCard: docked ? reply.inlineCard : reply.pushFlowCard,
            setupApplyCard: reply.setupApplyCard,
            hidePerformanceDashboard: true,
            onAnimationComplete: finish,
          }]);
          stickToBottomFor(2500);
        }, 650);
      },
    }]);
    stickToBottomFor(2500);
  };

  const appendUserTurn = (turn: Partial<ChatMessageData> & { content: string }) => {
    setMessages(prev => [...prev, { type: 'chat', isAI: false, onAnimationComplete: () => {}, ...turn }]);
    setShowSuggestions(false);
    setDynamicSuggestions(null);
    resetFeedback();
    setMockChatCompleted(false);
    stickToBottomFor(2500);
  };

  // --- Cori builds an audience in conversation ---------------------------------
  // "I want to increase repeat purchases…" in the wizard's chat: Cori narrows the
  // goal with a few questions while the Audience step updates beside it (see
  // data/audienceAgentFlow). Only runs when the wizard hosts this chat.
  const audFlowRef = useRef<{ active: boolean; state: AudienceAgentState }>({ active: false, state: {} });
  // After "Explore other channels": the next message is expected to name a channel.
  const awaitingChannelRef = useRef(false);

  const askAudience = (
    content: string,
    stage: string,
    question: FlowQuestion,
    steps?: string[],
    inlineCard?: PushFlowCard,
  ) => {
    playCoriReply(
      { content, pushFlowCard: { kind: 'questions', stage, questions: [question] }, inlineCard },
      steps,
      steps ? 3 : 2,
      PUSH_LOADER_LABELS.audience,
    );
  };

  const startAudienceAgent = (message: string) => {
    audFlowRef.current = { active: true, state: {} };
    const sentMsgIndex = messages.length;
    appendUserTurn({ content: message, navLabel: 'Audience' });
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    askAudience(
      "We could focus on shoppers who haven't completed a purchase, encourage existing customers to buy again, or re-engage inactive customers.\n\nWhat would you like to focus on?",
      'aud-focus',
      FOCUS_QUESTION,
      ['Reviewing your customers to see where repeat purchases and sales can grow'],
    );
  };

  /** The marketer typed instead of tapping while a question card is waiting.
   *  If the words amount to one of the options (or a custom answer the card
   *  allows) take them as the answer; otherwise say what's needed and put the
   *  card back — playCoriReply clears it, which would leave the flow stuck. */
  const answerOrReDock = (message: string): boolean => {
    const pending = dockedQuestions;
    if (!pending) return false;
    if (pending.questions.length === 1) {
      const q = pending.questions[0];
      const answer = q.multi ? null : matchOption(message, q.options) ?? (q.otherPlaceholder ? message.trim() : null);
      if (answer) {
        handlePushFlowEvent({ type: 'questions', stage: pending.stage, questions: pending.questions, answers: { [q.id]: answer } });
        return true;
      }
    }
    appendUserTurn({ content: message });
    const q = pending.questions[0];
    const ask = pending.questions.length === 1
      ? `I still need an answer to "${q.title}". Pick one of the options below${q.otherPlaceholder || q.multi ? ', or type your own under Other' : ''}.`
      : 'I still need your answers to the questions below before I can move on. Pick an option for each, or skip the ones you want to leave.';
    playCoriReply({ content: ask, pushFlowCard: pending }, undefined, 2, PUSH_LOADER_LABELS.reply);
    return true;
  };

  /** "cancel" / "start over" — drop whichever scripted flow is running. */
  const cancelFlows = (message: string) => {
    audFlowRef.current = { active: false, state: {} };
    pushFlowRef.current = { active: false, one: {}, two: {}, draft: null };
    awaitingChannelRef.current = false;
    setDockedQuestions(null);
    setDynamicSuggestions(null);
    appendUserTurn({ content: message });
    playCoriReply(
      { content: "No problem, I've set that aside. Tell me what you'd like to do next, or carry on in the wizard yourself." },
      undefined,
      2,
      PUSH_LOADER_LABELS.reply,
    );
  };

  /** Content step, "Cart reminder": Cori writes v1 and drops it into the editor. */
  // 1 once v1 is on screen and waiting for feedback; 2 after v2.
  const cartVersionRef = useRef(0);

  // The brochure flow: product → template type → quick reply template → image.
  const SHOW_QR_IMAGE_SUGGESTION = false;
  const qrRef = useRef<{ stage: 'idle' | 'v1'; product: string; applied: { title: string; message: string; buttonText: string; image?: string } | null }>({ stage: 'idle', product: 'Herbal creams', applied: null });

  const startQuickReplyFlow = (message: string) => {
    qrRef.current = { stage: 'idle', product: 'Herbal creams', applied: null };
    cartVersionRef.current = 0;
    const sentMsgIndex = messages.length;
    appendUserTurn({ content: message, navLabel: 'Quick reply' });
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    playCoriReply(
      {
        content: 'Happy to help with that. I just need to know which offer this is for.',
        pushFlowCard: { kind: 'questions', stage: 'qr-product', questions: [QR_PRODUCT_QUESTION] },
      },
      ['Reading what you want to send', 'Checking which offers are live'],
      2,
      PUSH_LOADER_LABELS.questions,
    );
  };

  const handleQuickReplyEvent = (event: Extract<PushFlowEvent, { type: 'questions' }>) => {
    setDockedQuestions(null);
    const recap: QuestionRecapEntry[] = event.questions
      .filter(q => q.id in event.answers)
      .map(q => ({ title: q.title, answer: event.answers[q.id] ?? 'Skipped' }));
    appendUserTurn({ content: '', questionRecap: recap });

    if (event.stage === 'qr-product') {
      qrRef.current.product = (event.answers.product ?? 'Herbal creams').trim() || 'Herbal creams';
      playCoriReply(
        {
          content: 'A quick reply template would be a good fit for your offer. It lets customers respond directly from the notification to express interest.',
          pushFlowCard: { kind: 'questions', stage: 'qr-type', questions: [QR_TYPE_QUESTION] },
        },
        ['Matching the offer to a template type', 'Comparing how each type drives responses'],
        3,
        PUSH_LOADER_LABELS.questions,
      );
      return;
    }

    // qr-type, explore: hand back to the layout picker.
    if (event.stage === 'qr-type' && event.answers.type !== QR_TYPE_YES) {
      playCoriReply(
        { content: "Sure. Pick a layout from the Content step, or tell me what you'd like the notification to do and I'll suggest one." },
        undefined,
        2,
        PUSH_LOADER_LABELS.reply,
      );
      return;
    }
    if (event.stage === 'qr-type') {
      // Before writing anything, settle how the notification should read.
      playCoriReply(
        {
          content: 'Great choice. Before I write it, let’s decide how the notification should read.',
          pushFlowCard: { kind: 'questions', stage: 'qr-theme', questions: [QR_THEME_QUESTION] },
        },
        undefined,
        2,
        PUSH_LOADER_LABELS.questions,
      );
      return;
    }

    // qr-theme: write the picked theme, or all three to compare.
    const { product } = qrRef.current;
    const themes = themesFor(event.answers.theme ?? '');
    const variations = quickReplyVariations(product).filter((v) => themes.includes(v.name));
    qrRef.current.stage = 'v1';
    // Nothing goes in the editor until the marketer picks a variation.
    qrRef.current.applied = null;
    playCoriReply(
      {
        content:
          variations.length > 1
            ? '<p>I’ve created the template in three variations. Choose Use on the one you like to add it to the editor and preview, then tell me what you’d like to change.</p>'
            : `<p>I’ve created the template in the ${variations[0].name} theme. Choose Use to add it to the editor and preview, then tell me what you’d like to change.</p>`,
        pushFlowCard: { kind: 'variations', variations },
      },
      ['Choosing the quick reply layout', variations.length > 1 ? 'Writing three angles on the offer' : `Writing the ${variations[0].name.toLowerCase()} copy`, 'Adding a reply button'],
      3,
      PUSH_LOADER_LABELS.draft,
    );
    // The image request is parked as a one-tap reply for now; typing it still works.
    if (SHOW_QR_IMAGE_SUGGESTION) {
      window.setTimeout(() => {
        setDynamicSuggestions([qrImageFeedback(product)]);
        setShowSuggestions(true);
      }, 7500);
    }
  };

  /** "Add an image…": the same template, now with the product photo. */
  const startQuickReplyImage = (message: string) => {
    qrRef.current.stage = 'idle';
    setDynamicSuggestions(null);
    const { product } = qrRef.current;
    // "Variation 2 looks ok…" settles on that variation; otherwise keep
    // whatever lines are in the editor now.
    const n = pickedVariation(message);
    const variations = quickReplyVariations(product);
    const draft = (n && variations[n - 1]) || qrRef.current.applied || variations[0];
    const image = ('image' in draft && draft.image) || variations[0].image || QR_IMAGE;
    const sentMsgIndex = messages.length;
    appendUserTurn({ content: message, navLabel: 'Quick reply v2' });
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    playCoriReply(
      {
        content: `<p>I’ve added an image of the ${product.toLowerCase()} to ${n && variations[n - 1] ? `Variation ${n} (${variations[n - 1].name})` : 'your notification'}. The editor and preview are updated with its title, message and reply button.</p>`,
      },
      ['Finding a product image', 'Adding it to the notification'],
      2,
      PUSH_LOADER_LABELS.draft,
    );
    window.setTimeout(
      () =>
        contentAgent?.onDraft({
          title: draft.title,
          message: draft.message,
          version: 2,
          media: image,
          quickReply: { buttonText: draft.buttonText },
        }),
      2700,
    );
  };

  const startCartReminder = (message: string) => {
    cartVersionRef.current = 1;
    const sentMsgIndex = messages.length;
    appendUserTurn({ content: message, navLabel: 'Notification' });
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    playCoriReply(
      {
        content: `<p>Here’s a cart reminder to nudge shoppers to complete their purchase.</p>\n\n<p>Title: ${CART_REMINDER_V1.title}</p>\n\n<p>Message: ${CART_REMINDER_V1.message}</p>\n\n<p>I’ve filled in the fields on the left, and the preview shows how your notification will look. What would you like to change? I can refine the copy based on your feedback.</p>`,
      },
      ['Matching the cart reminder to your audience', 'Writing a short title and message', 'Filling in the notification editor'],
      3,
      PUSH_LOADER_LABELS.draft,
    );
    window.setTimeout(() => contentAgent?.onDraft({ ...CART_REMINDER_V1, version: 1 }), 3700);
    // The feedback is offered as a one-tap reply rather than typed for them.
    window.setTimeout(() => {
      setDynamicSuggestions([CART_V2_FEEDBACK]);
      setShowSuggestions(true);
    }, 7500);
  };

  /** Feedback on v1: Cori writes v2 with the discount and the urgency. */
  const startCartReminderV2 = (message: string) => {
    cartVersionRef.current = 2;
    setDynamicSuggestions(null);
    const sentMsgIndex = messages.length;
    appendUserTurn({ content: message, navLabel: 'Notification v2' });
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    playCoriReply(
      {
        content: `<p>I’ve updated the campaign to make it more urgent and highlight the discount.</p>\n\n<p>Title: ${CART_REMINDER_V2.title}</p>\n\n<p>Message: ${CART_REMINDER_V2.message}</p>\n\n<p>The discount is personalised for each customer, and I’ve added a sale banner to reinforce the offer. The editor and preview are updated.</p>`,
      },
      ['Reading your feedback', 'Adding the discount value and an ends-tonight deadline', 'Picking a sale banner'],
      3,
      PUSH_LOADER_LABELS.draft,
    );
    window.setTimeout(() => contentAgent?.onDraft({ ...CART_REMINDER_V2, version: 2 }), 3700);
  };

  const handleAudienceFreeText = (message: string): boolean => {
    // A brand-new request for another flow wins over the audience conversation.
    if (!dockedQuestions && (isChannelAskPrompt(message) || isPushCartPrompt(message))) return false;
    if (answerOrReDock(message)) return true;
    appendUserTurn({ content: message });
    playCoriReply(
      { content: "I can't change the conditions from chat yet. Adjust them on the left yourself, or apply the audience when you're happy with it." },
      undefined,
      2,
      PUSH_LOADER_LABELS.reply,
    );
    return true;
  };

  const handleAudienceEvent = (event: Extract<PushFlowEvent, { type: 'questions' }>) => {
    const f = audFlowRef.current;
    const say = (id: string) => (event.answers[id] ?? '').trim();
    setDockedQuestions(null);

    switch (event.stage) {
      case 'aud-focus': {
        const picked = say('focus');
        appendUserTurn({ content: `${picked}.` });
        if (picked === FOCUS_RECOVER) {
          f.state.focus = picked;
          askAudience(
            "A good place to start is shoppers who have shown interest in products but haven't completed their purchase.\n\nWould you like to focus on shoppers who added products to their cart or those who viewed products without adding them?",
            'aud-interest',
            INTEREST_QUESTION,
          );
        } else {
          // Only the lost-purchases route is built out so far — say so, and ask again.
          askAudience(
            "That's a good direction too. In this preview I can build the lost-purchases audience end to end, so let's start there.\n\nWhat would you like to focus on?",
            'aud-focus',
            FOCUS_QUESTION,
          );
        }
        return;
      }
      case 'aud-interest': {
        f.state.interest = say('interest');
        appendUserTurn({ content: `${f.state.interest}.` });
        askAudience(
          f.state.interest === 'Viewed products'
            ? 'How recently should they have viewed products?'
            : f.state.interest === 'Both'
              ? 'How recently should they have shown interest?'
              : 'How recently should they have added products to their cart?',
          'aud-recency',
          recencyQuestion(f.state.interest),
        );
        return;
      }
      case 'aud-recency': {
        f.state.recency = say('recency');
        appendUserTurn({ content: `${f.state.recency}, and exclude users who have already checked out.` });
        askAudience('Should we exclude users who have already completed checkout?', 'aud-checkout', CHECKOUT_QUESTION);
        return;
      }
      case 'aud-checkout': {
        f.state.excludeCheckout = say('checkout') === CHECKOUT_YES;
        appendUserTurn({ content: say('checkout') });
        // The Audience step on the left picks up the draft right away.
        const first = buildAudienceDraft(f.state);
        audienceAgent?.onDraft(first);
        askAudience(
          `${draftSentence(f.state)}\n\nHow should I balance reach and precision?`,
          'aud-reach',
          REACH_QUESTION,
          undefined,
          { kind: 'audience', draft: { ...first, status: 'draft' } },
        );
        return;
      }
      case 'aud-reach': {
        f.state.reach = say('reach');
        appendUserTurn({ content: `${f.state.reach}.` });
        askAudience('Anyone I should hold back?', 'aud-holdback', HOLDBACK_QUESTION);
        return;
      }
      case 'aud-holdback': {
        const picks = say('holdback').split('\n').map(x => x.trim()).filter(Boolean);
        f.state.holdbacks = picks;
        appendUserTurn({ content: holdbackSentence(picks) });
        const draft = buildAudienceDraft(f.state);
        audienceAgent?.onDraft(draft);
        const n = picks.length;
        const done =
          n === 0
            ? "Done. I haven't added any exclusions and kept your existing audience conditions."
            : n === 2
              ? "Done. I've added both exclusions while keeping your existing audience conditions."
              : `Done. I've added ${n === 1 ? 'the exclusion' : `all ${n} exclusions`} while keeping your existing audience conditions.`;
        askAudience(
          `${done}\n\nYour audience is ready. Review the conditions and estimated reach on the left. Would you like to apply this audience to your campaign?`,
          'aud-apply',
          APPLY_QUESTION,
          undefined,
          { kind: 'audience', draft: { ...draft, status: 'draft' } },
        );
        return;
      }
      case 'aud-apply': {
        const choice = say('apply');
        appendUserTurn({ content: `${choice}.` });
        if (choice === APPLY_YES) {
          audienceAgent?.onDecision('apply');
          f.active = false;
          setMessages(prev => {
            const last = [...prev].map((m, i) => ({ m, i })).reverse().find(x => x.m.pushFlowCard?.kind === 'audience');
            if (!last) return prev;
            return prev.map((m, i) => i === last.i && m.pushFlowCard?.kind === 'audience'
              ? { ...m, pushFlowCard: { ...m.pushFlowCard, draft: { ...m.pushFlowCard.draft, status: 'applied' as const } } }
              : m);
          });
          playCoriReply(
            {
              content: "Your audience has been applied to the campaign. Next up is the notification itself. I can help you write the title and message.",
              setupApplyCard: {
                kind: 'cta',
                title: PUSH_CONTENT_CTA,
                applyLabel: 'Go to Content',
                appliedLabel: 'Opening Content',
              },
            },
            undefined,
            2,
            PUSH_LOADER_LABELS.audience,
          );
        } else {
          audienceAgent?.onDecision('refine');
          playCoriReply(
            { content: "Sure. Tell me what you'd like to change, or adjust the conditions on the left and apply when you're ready." },
            undefined,
            2,
            PUSH_LOADER_LABELS.reply,
          );
        }
        return;
      }
    }
  };

  /** "I want to target users who added to cart but haven't checked out" — no
   *  channel named, so Cori recommends one before asking anything about the
   *  campaign. Confirming App Push carries straight on into the usual flow. */
  const startChannelAsk = (message: string) => {
    pushFlowRef.current = { active: true, one: {}, two: {}, draft: null };
    const sentMsgIndex = messages.length;
    appendUserTurn({ content: message, navLabel: 'Channel' });
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    playCoriReply(
      {
        content: SHOW_CHANNEL_QUESTION ? CHANNEL_RECOMMENDATION : CHANNEL_RECOMMENDATION_STATEMENT,
        pushFlowCard: SHOW_CHANNEL_QUESTION
          ? { kind: 'questions', stage: 0, questions: CHANNEL_QUESTIONS }
          : { kind: 'questions', stage: 1, questions: STAGE_ONE_QUESTIONS },
      },
      ['Comparing how each channel performed over the last 30 days to find the best fit for re-engaging shoppers who left items in their cart'],
      3,
      PUSH_LOADER_LABELS.channel,
    );
  };

  const startPushCartFlow = (message: string) => {
    pushFlowRef.current = { active: true, one: {}, two: {}, draft: null };
    const sentMsgIndex = messages.length;
    appendUserTurn({ content: message, navLabel: 'App push campaign' });
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    playCoriReply(
      {
        content: "Absolutely! Let's create an app push campaign to bring shoppers back to their carts.\n\nI want to make sure I understand what you're building before I draft anything. Could you tell me a bit more?",
        pushFlowCard: { kind: 'questions', stage: 1, questions: STAGE_ONE_QUESTIONS },
      },
      ['Reviewing cart activity and estimating the potential app push audience to prepare a few relevant questions'],
      3,
      PUSH_LOADER_LABELS.questions,
    );
  };

  /** After "Explore other channels" the marketer names one in their own words. */
  const handleChannelFollowup = (message: string): boolean => {
    const named = namedChannel(message);
    if (!named) return false;
    awaitingChannelRef.current = false;
    pushFlowRef.current = { active: true, one: {}, two: {}, draft: null };
    appendUserTurn({ content: message });
    if (named === 'push') {
      playCoriReply(
        {
          content: "Great! Let's identify the right audience for this campaign.",
          pushFlowCard: { kind: 'questions', stage: 1, questions: STAGE_ONE_QUESTIONS },
        },
        undefined,
        2,
        PUSH_LOADER_LABELS.questions,
      );
    } else {
      playCoriReply(
        {
          content: "I can only build App Push campaigns end to end for now. Shall we continue with App Push for this audience?",
          pushFlowCard: { kind: 'questions', stage: 0, questions: CHANNEL_QUESTIONS },
        },
        undefined,
        2,
        PUSH_LOADER_LABELS.channel,
      );
    }
    return true;
  };

  const handlePushFlowFreeText = (message: string): boolean => {
    const flow = pushFlowRef.current;
    // A first draft is waiting on feedback: whatever the marketer says is the
    // brief for the next version, which replaces it.
    if (flow.v2) {
      const next = flow.v2;
      flow.v2 = null;
      flow.draft = next;
      setDynamicSuggestions(null);
      setMessages(prev => prev.map(m =>
        m.pushFlowCard?.kind === 'content' && !m.pushFlowCard.superseded
          ? { ...m, pushFlowCard: { ...m.pushFlowCard, superseded: true } }
          : m
      ));
      appendUserTurn({ content: message });
      playCoriReply(
        {
          content: "Updated. The title now carries the discount amount, and the copy says the exclusive offer ends tonight.",
          pushFlowCard: { kind: 'content', draft: next, needsPromo: flow.one.promo === PROMO_YES, version: 2 },
        },
        ['Rewriting the title to show the discount and the body to stress that the offer ends tonight'],
        3,
        PUSH_LOADER_LABELS.draft,
      );
      return true;
    }
    if (answerOrReDock(message)) return true;
    // Nothing is waiting on the marketer. Only edit requests belong to this flow;
    // anything else is a new topic, so let the regular handlers have it.
    if (!/\b(change|edit|update|make|shorter|longer|rewrite|replace|add|remove|tone|different|swap|fix)\b/i.test(message)) return false;
    appendUserTurn({ content: message });
    playCoriReply(
      { content: "Noted. I can't apply free-form edits to the brief yet. Open Preview campaign and use Edit on any section to adjust it." },
      undefined,
      2,
      PUSH_LOADER_LABELS.reply,
    );
    return true;
  };

  const handlePushFlowEvent = (event: PushFlowEvent) => {
    const flow = pushFlowRef.current;
    if (event.type === 'useVariation') {
      const { variation } = event;
      qrRef.current.applied = {
        title: variation.title,
        message: variation.message,
        buttonText: variation.buttonText,
        image: variation.image,
      };
      contentAgent?.onDraft({
        title: variation.title,
        message: variation.message,
        version: 1,
        // The image only goes in once it has finished generating.
        media: event.withImage ? variation.image : undefined,
        quickReply: { buttonText: variation.buttonText },
      });
      return;
    }
    if (event.type === 'field') {
      // Lines can be mixed from any variation. The first one sent opens the
      // quick reply editor with just that line in it.
      if (!qrRef.current.applied) {
        const applied = { title: '', message: '', buttonText: '', [event.field]: event.value } as {
          title: string; message: string; buttonText: string; image?: string;
        };
        qrRef.current.applied = applied;
        contentAgent?.onDraft({
          title: applied.title,
          message: applied.message,
          version: 1,
          media: applied.image,
          quickReply: { buttonText: applied.buttonText || 'REPLY NOW' },
        });
        return;
      }
      qrRef.current.applied = { ...qrRef.current.applied, [event.field]: event.value };
      contentAgent?.onField?.(event.field, event.value);
      return;
    }
    if (event.type === 'questions' && typeof event.stage === 'string' && event.stage.startsWith('aud-')) {
      handleAudienceEvent(event);
      return;
    }
    if (event.type === 'questions' && typeof event.stage === 'string' && event.stage.startsWith('qr-')) {
      handleQuickReplyEvent(event);
      return;
    }
    if (event.type === 'questions' && event.stage === 0) {
      setDockedQuestions(null);
      const picked = event.answers.channel ?? '';
      appendUserTurn({ content: '', questionRecap: event.questions.map(q => ({ title: q.title, answer: picked || 'Skipped' })) });
      if (picked === CHANNEL_YES) {
        playCoriReply(
          {
            content: "Great! Let's identify the right audience for this campaign.",
            pushFlowCard: { kind: 'questions', stage: 1, questions: STAGE_ONE_QUESTIONS },
          },
          undefined,
          2,
          PUSH_LOADER_LABELS.questions,
        );
      } else {
        // Nothing else is wired up for other channels yet, so say so plainly
        // and hand the conversation back rather than pretend to plan one.
        flow.active = false;
        awaitingChannelRef.current = true;
        playCoriReply(
          { content: "Sure. Tell me which channel you'd like to look at and I'll start from there." },
          undefined,
          2,
          PUSH_LOADER_LABELS.reply,
        );
      }
      return;
    }
    if (event.type === 'questions') {
      setDockedQuestions(null);
      const recap: QuestionRecapEntry[] = event.questions
        .filter(q => q.id in event.answers)
        .map(q => ({ title: q.title, answer: event.answers[q.id] ?? 'Skipped' }));
      appendUserTurn({ content: '', questionRecap: recap });
      if (event.stage === 1) {
        flow.one = event.answers;
        flow.draft = draftFrom(flow.one, {});
        // Before any copy is written, ask which apps the campaign covers.
        playCoriReply(
          {
            content: 'Got it. Before I write the notification, I need to know where it will go.',
            pushFlowCard: { kind: 'questions', stage: 'push-apps', questions: [PUSH_APPS_QUESTION] },
          },
          undefined,
          2,
          PUSH_LOADER_LABELS.questions,
        );
        return;
      }
      if (event.stage === 'push-apps') {
        flow.apps = appIdsFor(event.answers.apps);
        const needsPromo = flow.one.promo === PROMO_YES;
        if (!flow.draft) flow.draft = draftFrom(flow.one, {});
        if (flow.one.objective === DISCOUNT_OBJECTIVE) {
          // Discount path: a softer first draft, then the marketer's feedback
          // turns it into the current copy (flow.v2).
          flow.v2 = flow.draft;
          const first = { ...flow.draft, title: FIRST_DRAFT_TITLE, body: FIRST_DRAFT_BODY };
          playCoriReply(
            {
              content: "Here's a first draft of the notification on the Coupon Expiry Reminder template. Continue with it, or tell me what to change.",
              pushFlowCard: { kind: 'content', draft: first, needsPromo, version: 1 },
            },
            ['Matching your objective to a template', 'Writing a first title and body', 'Adding the cart image and countdown'],
            3,
            PUSH_LOADER_LABELS.draft,
          );
          // The feedback is offered as a one-tap reply rather than typed for them.
          setDynamicSuggestions([FIRST_DRAFT_FEEDBACK]);
          setShowSuggestions(true);
          return;
        }
        playCoriReply(
          {
            content: "Here's the notification I've drafted on the Coupon Expiry Reminder template. Edit the title, body, discount, image or countdown, then continue.",
            pushFlowCard: { kind: 'content', draft: flow.draft, needsPromo },
          },
          ['Finding a suitable template and crafting the notification title and message, with the cart image and countdown timer'],
          3,
          PUSH_LOADER_LABELS.draft,
        );
        return;
      }
      flow.two = event.answers;
      const base = flow.draft ?? draftFrom(flow.one, flow.two);
      const picked = draftFrom(flow.one, flow.two);
      const draft: PushCartDraft = { ...base, devices: picked.devices, sendMode: picked.sendMode, sendLabel: picked.sendLabel };
      flow.draft = draft;
      const optimizer = draft.sendMode === 'optimizer'
        ? `<p>The send time optimizer recommends sending your campaign <strong>${OPTIMIZER_RECOMMENDATION.replace('Today, ', 'today at ')}</strong>, when shoppers with abandoned carts are most likely to engage.</p>\n\n`
        : '';
      playCoriReply(
        {
          content: `${optimizer}I've prepared your campaign brief. Review the details before proceeding.`,
          pushFlowCard: { kind: 'brief', draft },
        },
        ['Resolving your audience and exclusions', 'Estimating reach', 'Assembling the brief'],
        3,
        PUSH_LOADER_LABELS.brief,
      );
      return;
    }
    if (event.type === 'content') {
      flow.draft = event.draft;
      flow.v2 = null;
      setDynamicSuggestions(null);
      appendUserTurn({ content: 'This notification looks good.' });
      playCoriReply(
        {
          content: "Great. Now delivery. I'll ask about devices and timing.",
          pushFlowCard: { kind: 'questions', stage: 2, questions: STAGE_TWO_QUESTIONS },
        },
        ['Analyzing purchase and engagement patterns to identify valuable customer segments and recommend a discount that balances conversion potential and profitability'],
        2,
        PUSH_LOADER_LABELS.delivery,
      );
      return;
    }
    if (event.type === 'save') {
      const campaignName = prefillFrom(event.draft, flow.apps).campaignName;
      const campaignId = String(33000 + Math.floor(Math.random() * 900));
      playCoriReply(
        {
          content: 'Your campaign is saved.',
          pushFlowCard: { kind: 'saved', draft: event.draft, campaignName, campaignId },
        },
        undefined,
        2,
        PUSH_LOADER_LABELS.reply,
      );
      return;
    }
    if (event.type === 'changes') {
      appendUserTurn({ content: 'Make changes with Cori' });
      playCoriReply(
        { content: 'Sure. Tell me what to change, or open Preview campaign and use Edit on any section.' },
        undefined,
        2,
        PUSH_LOADER_LABELS.reply,
      );
      return;
    }
    onPreviewPushCampaign?.(prefillFrom(event.draft, flow.apps));
  };

  // Deep-research narrative — a variant-agnostic story any co-marketer chat can
  // play (see DEEP_RESEARCH_TOPICS). A two-step topic opens with the Insights
  // agent's fast read + a "go deeper" chip, then the follow-up spins up the
  // research; a direct topic goes straight to the research. The research turn is
  // a Co-marketer lead-in → thinking → a ChatGPT-style plan card that self-drives
  // from "Start" to the finished document, so this handler stops after the card.
  //
  // `opener` is the topic resolved from the message when starting; on the
  // follow-up turn it's null and the active topic comes from the ref.
  const handleDeepResearchStory = (rawMessage: string, opener: DeepResearchTopic | null) => {
    const topic = opener ?? deepResearchTopicRef.current;
    if (!topic) return;
    deepResearchTopicRef.current = topic;

    // Which turn are we running? A two-step topic that's just been opened plays
    // its Insights turn first; everything else (direct openers, and the
    // two-step follow-up) plays the research turn.
    const isInsightTurn = opener != null && topic.mode === 'two-step';

    const insightAgent = marketingAgents.find((a) => a.id === 'insight-agent');
    const coMarketer = marketingAgents.find((a) => a.id === 'co-marketer');

    // Common send scaffolding: drop the user's turn, pin it near the top, shimmer.
    const sentMsgIndex = messages.length;
    const userMessage: ChatMessageData = {
      type: 'chat',
      isAI: false,
      content: rawMessage,
      navLabel: isInsightTurn ? topic.insightNavLabel : topic.researchNavLabel,
      onAnimationComplete: () => {},
    };
    setMessages((prev) => [...prev, userMessage]);
    setShowSuggestions(false);
    setDynamicSuggestions(null);
    resetFeedback();
    setMockChatCompleted(false);
    setIsGeneratingOutput(true);
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    setInputShimmer(true);
    if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
    inputShimmerTimerRef.current = setTimeout(() => setInputShimmer(false), 30000);

    // Insight turn — switch to the Insights agent, think, answer, offer to dig in.
    // Research turn — Co-marketer lead-in, think, then the plan card takes over.
    const sequence: ChatMessageData[] = isInsightTurn
      ? [
          {
            type: 'chat', isAI: true, content: '',
            isAgentSwitch: true,
            switchAgentLabel: insightAgent?.name ?? 'Insight agent',
            reasoningSteps: topic.insightReasoningSteps,
            avatarSrc: insightAgent?.avatarSrc, avatarIcon: insightAgent?.icon, avatarBgClass: insightAgent?.colorClass,
          },
          {
            type: 'chat', isAI: true, content: '',
            isThinkingState: true, thinkingDuration: 4,
            reasoningSteps: topic.insightReasoningSteps,
          },
          {
            type: 'chat', isAI: true,
            agentName: insightAgent?.name,
            avatarSrc: insightAgent?.avatarSrc, avatarIcon: insightAgent?.icon, avatarBgClass: insightAgent?.colorClass,
            content: topic.insightOutput ?? '',
            hidePerformanceDashboard: true,
          },
        ]
      : [
          // Thinking first — the collapsed "Thought for Xs" beat renders above
          // the lead-in, matching the monthly-report flow (thinking → lead-in →
          // doc). The lead-in suppresses its own feedback row so the plan card
          // sits directly beneath the text instead of below a copy/thumbs row.
          {
            type: 'chat', isAI: true, content: '',
            isThinkingState: true, thinkingDuration: 3,
            reasoningSteps: topic.planReasoningSteps,
          },
          {
            type: 'chat', isAI: true,
            agentName: coMarketer?.name,
            avatarSrc: coMarketer?.avatarSrc, avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass,
            content: topic.leadIn,
            hidePerformanceDashboard: true,
            hideFeedback: true,
          },
          {
            type: 'chat', isAI: true, content: '',
            deepResearchPlan: topic.plan,
            planResultDoc: topic.doc,
            planResultLeadIn: topic.resultLeadIn,
          },
        ];

    setIsMockAgentChatActive(true);
    isMockAgentChatActiveRef.current = true;
    isStoryFlowActiveRef.current = true;

    const finishTurn = () => {
      setMessages((prev) => prev.map((m) => (m.isAgentSwitch && !m.switchSettled ? { ...m, switchSettled: true } : m)));
      setIsMockAgentChatActive(false);
      isStoryFlowActiveRef.current = false;
      setIsGeneratingOutput(false);
      clearInputShimmer();
      setMockChatCompleted(true);
      playResponseCue();
      if (isInsightTurn) {
        // Advance to the follow-up turn and surface the single "go deeper" chip.
        deepResearchStoryStepRef.current = 1;
        if (topic.followupChip) {
          setDynamicSuggestions([topic.followupChip]);
          setShowSuggestions(true);
        }
      } else {
        // Plan card is in the thread now and self-drives to the doc — we're done.
        deepResearchStoryStepRef.current = 2;
      }
      if (mockMessageTimeoutRef.current) { clearTimeout(mockMessageTimeoutRef.current); mockMessageTimeoutRef.current = null; }
    };

    const runStep = (index: number) => {
      if (!isMockAgentChatActiveRef.current) {
        if (mockMessageTimeoutRef.current) { clearTimeout(mockMessageTimeoutRef.current); mockMessageTimeoutRef.current = null; }
        return;
      }
      if (index >= sequence.length) { finishTurn(); return; }
      const def = sequence[index];
      // The switch divider isn't a ChatMessage and never fires onAnimationComplete.
      if (def.isAgentSwitch) {
        setMessages((prev) => [...prev, def]);
        if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
        mockMessageTimeoutRef.current = setTimeout(() => runStep(index + 1), 2600);
        return;
      }
      // The plan card renders itself and isn't a streaming message — drop it and finish.
      if (def.deepResearchPlan) {
        setMessages((prev) => [...prev, def]);
        finishTurn();
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          ...def,
          onAnimationComplete: () => {
            if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = setTimeout(() => runStep(index + 1), 650);
          },
        },
      ]);
    };

    if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
    mockMessageTimeoutRef.current = setTimeout(() => runStep(0), 500);
  };

  // Deep-research turn for the "+"-popover mode: the user's prompt lands, a
  // thinking beat runs, then a short Co-marketer lead-in frames the work before
  // the ChatGPT-style plan card drops in (so the card never appears cold). The
  // card self-drives from "Start" to the topic's finished document.
  const addDeepResearchTurn = (userMessage: ChatMessageData, topic: DeepResearchTopic) => {
    const coMarketer = marketingAgents.find((a) => a.id === 'co-marketer');
    const sentMsgIndex = messages.length;

    setMessages((prev) => [...prev, userMessage]);
    setShowSuggestions(false);
    setDynamicSuggestions(null);
    resetFeedback();
    setMockChatCompleted(false);
    setIsGeneratingOutput(true);
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    setInputShimmer(true);
    if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
    inputShimmerTimerRef.current = setTimeout(() => setInputShimmer(false), 30000);

    // thinking → Co-marketer lead-in (feedback suppressed so the card attaches
    // straight to the text) → the plan card.
    const sequence: ChatMessageData[] = [
      {
        type: 'chat', isAI: true, content: '',
        isThinkingState: true, thinkingDuration: 3,
        reasoningSteps: topic.planReasoningSteps,
      },
      {
        type: 'chat', isAI: true,
        agentName: coMarketer?.name,
        avatarSrc: coMarketer?.avatarSrc, avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass,
        content: topic.leadIn,
        hidePerformanceDashboard: true,
        hideFeedback: true,
      },
      {
        type: 'chat', isAI: true, content: '',
        deepResearchPlan: topic.plan,
        planResultDoc: topic.doc,
        planResultLeadIn: topic.resultLeadIn,
      },
    ];

    setIsMockAgentChatActive(true);
    isMockAgentChatActiveRef.current = true;
    isStoryFlowActiveRef.current = true;

    const finish = () => {
      setIsMockAgentChatActive(false);
      isStoryFlowActiveRef.current = false;
      setIsGeneratingOutput(false);
      clearInputShimmer();
      setMockChatCompleted(true);
      playResponseCue();
      if (mockMessageTimeoutRef.current) { clearTimeout(mockMessageTimeoutRef.current); mockMessageTimeoutRef.current = null; }
    };

    const runStep = (index: number) => {
      if (!isMockAgentChatActiveRef.current) {
        if (mockMessageTimeoutRef.current) { clearTimeout(mockMessageTimeoutRef.current); mockMessageTimeoutRef.current = null; }
        return;
      }
      if (index >= sequence.length) { finish(); return; }
      const def = sequence[index];
      // The plan card renders itself and isn't a streaming message — drop it and finish.
      if (def.deepResearchPlan) {
        setMessages((prev) => [...prev, def]);
        finish();
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          ...def,
          onAnimationComplete: () => {
            if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = setTimeout(() => runStep(index + 1), 650);
          },
        },
      ]);
    };

    if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
    mockMessageTimeoutRef.current = setTimeout(() => runStep(0), 500);
  };

  const handleDeepResearchSend = (message: string) => {
    // Leaving deep-research mode; the plan card drives the flow from here. The
    // picked / typed prompt selects the topic (WhatsApp, revenue, …); anything
    // unrecognized falls back to the default WhatsApp research.
    setDeepResearchActive(false);
    setSelectedDeepResearchCategory(null);
    setSelectedStarterChip(null);
    setShowSuggestions(false);
    setDynamicSuggestions(null);

    const topic = resolveDeepResearchOpener(message) ?? DEFAULT_DEEP_RESEARCH_TOPIC;
    addDeepResearchTurn(
      {
        type: 'chat',
        isAI: false,
        content: message.trim() || 'A deep research on my WhatsApp channel performance this quarter',
      },
      topic,
    );
  };

  // Submitting the "Edit" follow-up — post the tweak as a new user turn (carrying
  // the plan's reply chip) and re-run the same processing card beneath it.
  const handleDeepResearchFollowup = (followup: string) => {
    const replyContext = deepResearchEditTitle ?? undefined;
    setDeepResearchEditTitle(null);
    const topic = resolveDeepResearchOpener(followup) ?? DEFAULT_DEEP_RESEARCH_TOPIC;
    addDeepResearchTurn(
      {
        type: 'chat',
        isAI: false,
        content: followup,
        replyContext,
      },
      topic,
    );
  };

  const handleSendMessage = (message: string) => {
    // Give the host page first refusal on a typed message — e.g. the journey
    // builder recognizing "audit my flow" as its own audit intent — before
    // any of this component's own scripted routing below gets a chance to
    // play an unrelated canned flow instead.
    if (onBeforeSend && onBeforeSend(message)) return;
    // A custom-agent chip in the composer routes the opening turn into that
    // agent's scripted thread (Switched to <agent> → thinking → reply/report),
    // so an agent can be triggered from the main input, not just its own page.
    if (composerAgent && messages.length === 0) {
      handleStartAgentChat({ id: composerAgent.id, name: composerAgent.name, avatarSrc: composerAgent.avatarSrc }, message);
      return;
    }
    // Deep-research mode intercepts every send with the scripted research story.
    if (deepResearchActive) {
      handleDeepResearchSend(message);
      return;
    }
    // Follow-up submitted from the "Edit" composer.
    if (deepResearchEditTitle) {
      handleDeepResearchFollowup(message);
      return;
    }

    // Cori's App Push cart-recovery conversation outranks the generic stories
    // below — its prompt would otherwise match a deep-research opener.
    if (conversationVariant === 'campaigns') {
      if (contentAgent && dockedQuestions && String(dockedQuestions.stage).startsWith('qr-')) {
        answerOrReDock(message);
        return;
      }
      if (contentAgent && isBrochurePrompt(message)) {
        startQuickReplyFlow(message);
        return;
      }
      if (contentAgent && qrRef.current.stage === 'v1' && isQrImagePrompt(message)) {
        startQuickReplyImage(message);
        return;
      }
      if (contentAgent && cartVersionRef.current === 1 && isCartFeedbackPrompt(message)) {
        startCartReminderV2(message);
        return;
      }
      if (contentAgent && isCartReminderPrompt(message)) {
        startCartReminder(message);
        return;
      }
      if (audienceAgent && isAudienceGoalPrompt(message)) {
        startAudienceAgent(message);
        return;
      }
      if ((audFlowRef.current.active || pushFlowRef.current.active || awaitingChannelRef.current) && isCancelPrompt(message)) {
        cancelFlows(message);
        return;
      }
      if (audFlowRef.current.active && handleAudienceFreeText(message)) return;
      if (awaitingChannelRef.current && handleChannelFollowup(message)) return;
      if (isChannelAskPrompt(message)) {
        startChannelAsk(message);
        return;
      }
      if (isPushCartPrompt(message)) {
        startPushCartFlow(message);
        return;
      }
      if (pushFlowRef.current.active && handlePushFlowFreeText(message)) return;
    }

    // Variant-agnostic deep-research narrative — available from any co-marketer
    // chat (see DEEP_RESEARCH_TOPICS). A recognized opener starts a topic: a
    // two-step topic (WhatsApp) opens with an Insights read + offer, a direct
    // topic (revenue) goes straight to research. Step 1 means a two-step insight
    // is up and this send is the "go deeper" follow-up. Once the plan card is
    // dropped (step 2) we stop intercepting and the card drives itself.
    const deepResearchOpener =
      deepResearchStoryStepRef.current === 0 ? resolveDeepResearchOpener(message) : null;
    if (deepResearchStoryStepRef.current === 1 || deepResearchOpener) {
      handleDeepResearchStory(message, deepResearchOpener);
      return;
    }

    // The /campaigns and /audience/segments docked chats play bespoke
    // agent-relay flows (CAMPAIGNS_FLOW / SEGMENTS_FLOWS) rather than the
    // performance story.
    if (conversationVariant === 'campaigns' || conversationVariant === 'segments') {
      handleCampaignsSend(message);
      return;
    }

    const userMessagesCount = messages.filter(m => !m.isAI && m.type === 'chat').length + 1;
    const lowerCaseMessage = message.toLowerCase().trim();

    // Explicit Valentine demo triggers (scripted strings) — left untouched.
    const isAutonomousValentinesTrigger = selectedMode === 'autonomous' &&
      lowerCaseMessage === "can you help me create a valentine's day campaign for perfumes";
    const isCollaborativeValentinesTrigger = selectedMode === 'collaborative' &&
      (lowerCaseMessage === "hi" || lowerCaseMessage === "help me create a campaign for valentine's day");
    const isValentineTrigger = userMessagesCount === 1 &&
      (isAutonomousValentinesTrigger || isCollaborativeValentinesTrigger);

    // Continuations of an in-progress Valentine flow (waiting for the user's reply).
    const isAutonomousValentineContinuation = selectedMode === 'autonomous' && autonomousWaitingForInput;
    const isCollaborativeValentineContinuation = selectedMode === 'collaborative' &&
      isMockAgentChatActive && !isStoryFlowActiveRef.current;

    // Anything else the user types is anchored to the performance "story". The
    // first turn plays the opening recap; the next message auto-plays the
    // follow-up batch ("chapter 2"); anything after that restarts the recap.
    const isStoryTrigger = !isValentineTrigger &&
      !isAutonomousValentineContinuation && !isCollaborativeValentineContinuation;
    const storyPhase: 'story' | 'followups' = isStoryTrigger && hasRunStoryRef.current && !hasRunFollowupsRef.current
      ? 'followups'
      : 'story';

    const userMessage: ChatMessageData = {
      type: 'chat',
      content: !isStoryTrigger
        ? message
        : storyPhase === 'followups' ? script.followups[0].q : script.storyPrompt,
      navLabel: !isStoryTrigger
        ? undefined
        : storyPhase === 'followups' ? script.followups[0].label : script.storyNavLabel,
      isAI: false,
      onAnimationComplete: () => {}
    };
    // The just-sent message lands at this index — used to pin it near the top
    // after sending so the start of the incoming response is revealed.
    const sentMsgIndex = messages.length;
    setMessages(prev => [...prev, userMessage]);
    setShowSuggestions(false); // hide follow-up chips once a message is sent
    resetFeedback(); // clear any feedback prompt/toast on a new send
    setMockChatCompleted(false); // Reset when user sends a new message
    setIsGeneratingOutput(true); // Show the persistent bottom loader until this response finishes

    // Slight scroll: bring the user's message toward the top so they can see the
    // response begin loading below it, then scroll freely from there.
    setTimeout(() => {
      document.getElementById(`msg-${sentMsgIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    // Shimmer the input for the whole generation. Mock flows keep it on via
    // isMockAgentChatActive; non-mock responses clear it when their streaming
    // finishes (see the AI response's onAnimationComplete below). A long safety
    // fallback guards against a response that never reports completion.
    setInputShimmer(true);
    if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
    inputShimmerTimerRef.current = setTimeout(() => setInputShimmer(false), 30000);

    if (isStoryTrigger) {
      if (storyPhase === 'followups') hasRunFollowupsRef.current = true;
      else hasRunStoryRef.current = true;
      setIsMockAgentChatActive(true);
      isStoryFlowActiveRef.current = true;
      setContentApproved(false);
      setContentGenerated(false);
      setAutonomousWaitingForInput(false);
      isMockAgentChatActiveRef.current = true;

      const coMarketer = marketingAgents.find(agent => agent.id === 'co-marketer');

      // Opening recap (with dashboard + artifact) vs. the deeper follow-up batch.
      const storyMessages: (Omit<ChatMessageData, 'onAnimationComplete'> & { agentId?: string })[] = [
        {
          type: 'chat',
          isAI: true,
          content: '',
          isThinkingState: true,
          thinkingDuration: 3,
          reasoningSteps: script.storyReasoningSteps,
        },
        {
          agentId: coMarketer?.id,
          type: 'chat',
          isAI: true,
          agentName: coMarketer?.name,
          content: script.storyOutput,
          avatarIcon: coMarketer?.icon,
          avatarBgClass: coMarketer?.colorClass,
          artifact: script.storyArtifact,
        }
      ];

      // Follow-up batch: thinking → answer to Q0, then Q1/A1, Q2/A2, Q3/A3.
      // The user questions are rendered as their own bubbles (navigable turns)
      // and the answers suppress the dashboard so it isn't repeated each turn.
      const followupMessages: (Omit<ChatMessageData, 'onAnimationComplete'> & { agentId?: string })[] = [
        {
          type: 'chat',
          isAI: true,
          content: '',
          isThinkingState: true,
          thinkingDuration: 2,
          reasoningSteps: script.followupReasoningSteps,
        },
        {
          agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name,
          content: script.followups[0].a, avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass,
          hidePerformanceDashboard: true,
          statCards: script.followups[0].statCards, miniChart: script.followups[0].miniChart,
        },
        ...script.followups.slice(1).flatMap((f) => ([
          { type: 'chat' as const, isAI: false, content: f.q, navLabel: f.label },
          {
            agentId: coMarketer?.id, type: 'chat' as const, isAI: true, agentName: coMarketer?.name,
            content: f.a, avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass,
            hidePerformanceDashboard: true,
            statCards: f.statCards, miniChart: f.miniChart,
          },
        ])),
      ];

      const mockMessagesDefinition = storyPhase === 'followups' ? followupMessages : storyMessages;

      mockMessagesDefinitionRef.current = mockMessagesDefinition;
      
      const processedAgentIdsForJoinMessage = new Set<string>();

      const addNextMockMessage = (index: number) => {
        if (!isMockAgentChatActiveRef.current) {
          if (mockMessageTimeoutRef.current) {
            clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = null;
          }
          return;
        }

        if (index >= mockMessagesDefinition.length) {
          setIsMockAgentChatActive(false);
          setIsGeneratingOutput(false);
          clearInputShimmer();
          setMockChatCompleted(true);
          // After the opening recap, surface follow-up chips; after thread 2 (followups),
          // clear chips and float the end-of-conversation feedback prompt instead.
          setShowSuggestions(storyPhase === 'story');
          if (storyPhase === 'followups') setShowFeedbackPrompt(true);
          playResponseCue(); // response finished — audible cue
          if (mockMessageTimeoutRef.current) {
            clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = null;
          }
          return;
        }

        const currentMessageDef = mockMessagesDefinition[index];
        const messageWithCallback: ChatMessageData = {
          type: currentMessageDef.type,
          content: currentMessageDef.content,
          isAI: currentMessageDef.isAI,
          agentName: currentMessageDef.agentName,
          avatarSrc: coMarketer?.avatarSrc,
          avatarIcon: currentMessageDef.avatarIcon,
          avatarBgClass: currentMessageDef.avatarBgClass,
          animate: currentMessageDef.animate,
          animationSpeed: currentMessageDef.animationSpeed,
          isThinkingState: currentMessageDef.isThinkingState,
          thinkingDuration: currentMessageDef.thinkingDuration,
          reasoningSteps: currentMessageDef.reasoningSteps,
          // Preserve the doc-like artifact so the "Preview" card/split-view stays intact
          artifact: currentMessageDef.artifact,
          // Follow-up answers suppress the repeated dashboard; user turns carry a nav label
          hidePerformanceDashboard: currentMessageDef.hidePerformanceDashboard,
          navLabel: currentMessageDef.navLabel,
          // Per-message graphics so follow-up answers match the opening recap visually
          statCards: currentMessageDef.statCards,
          miniChart: currentMessageDef.miniChart,
          onAnimationComplete: () => {
            if (mockMessageTimeoutRef.current) {
              clearTimeout(mockMessageTimeoutRef.current);
            }
            mockMessageTimeoutRef.current = setTimeout(() => {
              addNextMockMessage(index + 1);
            }, 500);
          }
        };
        setMessages(prev => [...prev, messageWithCallback]);
      };

      addNextMockMessageRef.current = addNextMockMessage;

      if (mockMessageTimeoutRef.current) {
        clearTimeout(mockMessageTimeoutRef.current);
        mockMessageTimeoutRef.current = null; 
      }
      
      mockMessageTimeoutRef.current = setTimeout(() => {
        addNextMockMessage(0);
      }, 1000);
      
      return;
    }

    if (userMessagesCount === 1 && (isAutonomousValentinesTrigger || isCollaborativeValentinesTrigger)) {
      setIsMockAgentChatActive(true); // Set state
      setContentApproved(false); // Reset content approval when starting new conversation
      setContentGenerated(false); // Reset content generation when starting new conversation
      setAutonomousWaitingForInput(false); // Reset autonomous waiting state when starting new conversation
      isMockAgentChatActiveRef.current = true; // Set ref immediately for the first call to addNextMockMessage
      
      const coMarketer = marketingAgents.find(agent => agent.id === 'co-marketer');
      const segmentAgent = marketingAgents.find(agent => agent.id === 'segment-agent');
      const contentAgent = marketingAgents.find(agent => agent.id === 'content-agent');
      const schedulerAgent = marketingAgents.find(agent => agent.id === 'scheduler-agent');
      const insightAgent = marketingAgents.find(agent => agent.id === 'insight-agent');

            // Add agentId to mock messages for easier lookup
      const mockMessagesDefinition: (Omit<ChatMessageData, 'onAnimationComplete'> & { agentId?: string })[] = 
        selectedMode === 'autonomous' ? [
          { 
            agentId: coMarketer?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: coMarketer?.name, 
            content: "I'll help you design a Valentine's Day perfume campaign. To create the most effective campaign, I need some additional information:\n\n<strong>1. Campaign Goals:</strong>\n• What are your primary objectives? (e.g., increase sales, brand awareness, etc.)\n• Do you have specific revenue or sales targets?\n\n<strong>2. Product Details:</strong>\n• Which perfume brands/collections are you promoting?\n• What is the price range of the perfumes?\n• Are there any special Valentine's Day offers or bundles?\n\n<strong>3. Target Audience:</strong>\n• Are you targeting specific age groups?\n• Any specific gender focus (men buying for women, women for men, or both)?\n• Geographic location for the campaign?\n\n<strong>4. Campaign Duration:</strong>\n• When would you like to start the campaign?\n• How long do you want to run it? (typically Valentine's campaigns start 2-3 weeks before February 14th)\n\n<strong>5. Budget and Resources:</strong>\n• Do you have a specific marketing budget?\n• Which marketing channels would you like to use? (email, social media, etc.)\n\nPlease provide as much information as possible so I can help create a targeted and effective Valentine's Day campaign.", 
            avatarIcon: coMarketer?.icon, 
            avatarBgClass: coMarketer?.colorClass,
            waitForUserInput: true // Special flag to pause and wait for user input
          },
          // After user input, continue with autonomous flow
          { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "I'll start by creating audience segments based on the information provided. Let me work with the Segment Expert Agent to create optimal segments for the Valentine's campaign.", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass },
          { agentId: segmentAgent?.id, type: 'chat', isAI: true, agentName: segmentAgent?.name, content: "Let me retrieve the segments for this Valentine's Day perfume campaign by providing the campaign summary to the retrieve_segment tool.", avatarIcon: segmentAgent?.icon, avatarBgClass: segmentAgent?.colorClass },
          { 
            agentId: segmentAgent?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: segmentAgent?.name, 
            content: `Based on the segmentation rules and available segments, I'll create targeted micro-segments that incorporate:\n\n• RFM checks (Rule #1)\n• Product and Category Affinity (Enhanced Rules #1 & #2)\n• Price Sensitivity (Enhanced Rule #4)\n• Gender-Specific targeting (Enhanced Rule #5)\n• Channel Interactions (Enhanced Rule #6)\n• Avoiding overlap and campaign fatigue (Rule #2)\n\nLet me structure the segments optimally for the Valentine's campaign.\n\n<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; table-layout: fixed; border: 1px solid oklch(var(--border)); background-color: oklch(var(--background));">
                      <thead>
                        <tr>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 22%;">Segment info</th>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 30%;">Segment description</th>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 12%;">WhatsApp</th>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 12%;">Email</th>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 12%;">APN</th>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 12%;">Total users</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Premium Perfume Enthusiasts</strong></td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who clicked emails in the last 90 days AND have a high PBL_HI score AND engaged with luxury perfume categories</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">156,850</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">183,237</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">83,631</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>423,718</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Recent Beauty Browsers</strong></td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who opened emails in the last 90 days AND viewed skin or beauty/perfume category pages recently AND have not purchased yet</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">202,362</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">231,664</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">144,306</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>578,332</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Loyal Beauty Shoppers</strong></td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who bought skincare products in the last 90 days AND are repeat buyers based on PBL_buyers tag</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">171,724</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">196,177</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">122,452</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>490,353</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>High Intent New Customers</strong></td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">New buyers with high intent in the last 30 days (HI_NB_L30D) AND have opened emails recently AND haven't made a purchase yet</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">155,832</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">178,381</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">110,736</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>444,949</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Welcome Premium Segment</strong></td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users in the high-tier Welcome segment AND clicked emails in the last 180 days</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">205,200</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">234,515</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">146,571</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>586,286</strong></td>
                        </tr>
                      </tbody>
                    </table>`, 
            avatarIcon: segmentAgent?.icon, 
            avatarBgClass: segmentAgent?.colorClass,
            animate: true,
            animationSpeed: 50
          },
          { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "Now that I have the segments, I'll get insights from previous campaigns to optimize our approach. I'll contact the Insights Agent.", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass },
          { 
            agentId: insightAgent?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: insightAgent?.name, 
            content: `Based on comprehensive data analysis, here are the key performance drivers for perfume campaigns:\n\n<strong>Email Campaign Best Practices:</strong>\n• Subject Line Optimization: 31-62 characters (+44.03% click rate)\n• Words: 4-5 words (+18.94% click rate)\n• Use punctuation (+2.85% click rate)\n• Avoid emojis (23.78% better click rates)\n\n<strong>Timing & Scheduling:</strong>\n• Best revenue window: 19 PM - 22 PM (+14.61% revenue)\n• Optimal open rates: 15 PM - 19 PM (+2.27%)\n• Best click rates: 12 PM - 15 PM (+19.50%)\n• Schedule for weekends (+12.68% revenue)\n\n<strong>Content Strategy:</strong>\n• Use 'Content Engagement' approach (+37.81% click rate)\n• Implement 'Exclusivity' tone (+150% click rate)\n• Include 'Urgency' elements (+14.04% revenue)\n• Use 'Discounted Promotion' messaging (+12.20% revenue)\n\n<strong>SMS Campaign Optimization:</strong>\n• Timing: 9 AM - 11 AM for clicks (+13.73%)\n• Message length: 234-239 characters\n• Weekend scheduling (+13.80% revenue)\n\n<strong>Revenue Growth Strategy (to achieve 3% increase):</strong>\n• Combine weekend scheduling (+12.68%) with optimal timing\n• Use exclusivity messaging with urgency elements\n• Implement discounted promotions during peak hours\n• Focus on content engagement with clear call-to-actions`, 
            avatarIcon: insightAgent?.icon, 
            avatarBgClass: insightAgent?.colorClass 
          },
          { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "Now I'll work with the Content Agent to create personalized subject lines and content for each segment based on these insights.", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass },
                    // Old content agent message - conditionally included based on toggle (only in autonomous mode)
          ...(disableContentAccordion ? [] : [{ agentId: contentAgent?.id, type: 'chat' as const, isAI: true, agentName: contentAgent?.name, content: "I've prepared communication templates for your campaign across multiple channels.", avatarSrc: contentAgent?.avatarSrc, avatarIcon: contentAgent?.icon, avatarBgClass: contentAgent?.colorClass, isContentAgent: true, isPlanMode: true }]),
          // New content agent message with segment accordions
          { 
            agentId: contentAgent?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: contentAgent?.name, 
            content: '', // Empty content since we render the accordion component
            avatarSrc: contentAgent?.avatarSrc,
            avatarIcon: contentAgent?.icon, 
            avatarBgClass: contentAgent?.colorClass,
              isPlanMode: true,
            isSegmentAccordion: true
          },
          { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "Let me now work with the Scheduling Agent to optimize the campaign timing for maximum impact.", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass },
          { 
            agentId: schedulerAgent?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: schedulerAgent?.name, 
            content: 'Scheduler agent response', 
            avatarIcon: schedulerAgent?.icon, 
            avatarBgClass: schedulerAgent?.colorClass,
            isSchedulerAccordion: true
          },
          { 
            agentId: coMarketer?.id, 
            type: 'chat', 
            isAI: true, 
            agentName: coMarketer?.name, 
            content: `<strong>Valentine's Day Perfume Campaign Report</strong>\n\n<strong>Executive Summary</strong>\n• Campaign goal: Achieve 3% sales increase over Feb 7–14\n• Reach: Over 2.5 million customers\n• Strategy: Personalized messaging + optimal timing to drive engagement & conversion\n\n<strong>Audience Segments</strong>\n1. Premium Perfume Enthusiasts (423,718 users) - High-value customers with luxury perfume purchase history\n2. Recent Beauty Browsers (578,332 users) - Active browsers in beauty/perfume categories\n3. Loyal Beauty Shoppers (490,353 users) - Repeat beauty category purchasers\n4. High Intent New Customers (444,949 users) - Recent high-intent prospects\n5. Welcome Premium Segment (586,286 users) - Engaged new customers with premium potential\n\n<strong>Campaign Insights – Key Performance Drivers</strong>\n• Optimal revenue window: 19 PM – 22 PM (+14.61% revenue)\n• Weekend scheduling advantage: +12.68% revenue\n• Subject line length (31–62 characters): +44.03% click rate\n• Exclusivity messaging: +150% click rate\n• Urgency elements: +14.04% revenue\n\n<strong>Content Strategy</strong>\nPersonalized subject lines for each segment incorporating exclusivity, urgency, and Valentine's theme within optimal character limits.\n\n<strong>Campaign Schedule</strong>\n• Premium & Loyal Segments: Prime time 19–22 PM with Smart Time Optimization\n• New & Browse Segments: Fixed timing 15 PM weekdays, 19 PM weekends\n• Welcome Segment: Immediate trigger with 19 PM follow-up\n\n<strong>Conclusion</strong>\nCampaign designed to exceed 3% sales increase through strategic timing, personalization, and segment-specific offers. Continuous monitoring and optimization throughout the campaign duration.`, 
            avatarIcon: coMarketer?.icon, 
            avatarBgClass: coMarketer?.colorClass,
            isExecutiveSummaryWithContent: true
          }
        ] : [
        // Thinking state before Co-Marketer responds
        {
          type: 'chat',
          isAI: true,
          content: '',
          isThinkingState: true,
          thinkingDuration: 3,
          reasoningSteps: [
            "Analyzing campaign requirements for Valentine's Day",
            "Identifying key information needed for effective targeting",
            "Preparing strategic questions to gather campaign details",
            "Structuring questionnaire for optimal campaign planning"
          ]
        },
        // Add the questionnaire flow to collaborative mode as well
        { 
          agentId: coMarketer?.id, 
          type: 'chat', 
          isAI: true, 
          agentName: coMarketer?.name, 
          content: "I'll help you design a Valentine's Day perfume campaign. To create the most effective campaign, I need some additional information:\n\n<strong>1. Campaign Goals:</strong>\n• What are your primary objectives? (e.g., increase sales, brand awareness, etc.)\n• Do you have specific revenue or sales targets?\n\n<strong>2. Product Details:</strong>\n• Which perfume brands/collections are you promoting?\n• What is the price range of the perfumes?\n• Are there any special Valentine's Day offers or bundles?\n\n<strong>3. Target Audience:</strong>\n• Are you targeting specific age groups?\n• Any specific gender focus (men buying for women, women for men, or both)?\n• Geographic location for the campaign?\n\n<strong>4. Campaign Duration:</strong>\n• When would you like to start the campaign?\n• How long do you want to run it? (typically Valentine's campaigns start 2-3 weeks before February 14th)\n\n<strong>5. Budget and Resources:</strong>\n• Do you have a specific marketing budget?\n• Which marketing channels would you like to use? (email, social media, etc.)\n\nPlease provide as much information as possible so I can help create a targeted and effective Valentine's Day campaign.", 
          avatarIcon: coMarketer?.icon, 
          avatarBgClass: coMarketer?.colorClass,
          waitForUserInput: true // Wait for user to type and send something
        },
        // After user input, continue with collaborative flow starting with "This looks like a good campaign..."
        { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "This looks like a good project. <strong>Segment specialist</strong>, can you help identify the best audience segments for this campaign?", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass },
        // Segment agent rationale - explain approach before proceeding
        { 
          agentId: segmentAgent?.id, 
          type: 'chat', 
          isAI: true, 
          agentName: segmentAgent?.name, 
          content: '', // Content handled by component
          avatarIcon: segmentAgent?.icon, 
          avatarBgClass: segmentAgent?.colorClass,
          isSegmentAgentRationale: true,
          waitForUserInput: true // Wait for user to click Continue or type response
        },
        { 
          agentId: segmentAgent?.id, 
          type: 'chat', 
          isAI: true, 
          agentName: segmentAgent?.name, 
          // Enable animation for Segment agent to show thinking animation
          // Table content will still be handled appropriately by ChatMessage.tsx
          animate: true, 
          animationSpeed: 50, 
          content: `
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem; table-layout: fixed; border: 1px solid oklch(var(--border)); background-color: oklch(var(--background));">
                      <thead>
                        <tr>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 22%;">Segment info</th>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 30%;">Segment description</th>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 12%;">WhatsApp</th>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 12%;">Email</th>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 12%;">APN</th>
                          <th style="border: 1px solid oklch(var(--border)); padding: 8px; text-align: left; background-color: oklch(var(--muted)); color: oklch(var(--muted-foreground)); width: 12%;">Total users</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Affinity_based_segment</strong></td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who clicked emails in the last 90 days AND have a high PBL_HI score AND engaged with luxury perfume categories</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">19,537</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">22,321</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">10,820</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>52,678</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>High_AOV_segment</strong></td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who opened emails in the last 90 days AND viewed skin or beauty/perfume category pages recently AND have not purchased yet</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">4,578</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">5,234</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">2,533</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>12,345</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Seasonal_buyers</strong></td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users who bought skincare products in the last 90 days AND are repeat buyers based on PBL_buyers tag</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">12,810</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">14,647</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">7,110</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>34,567</strong></td>
                        </tr>
                        <tr>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;"><strong>Loyalty_program_members</strong></td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; overflow-wrap: break-word;">Users in the high-tier Welcome segment AND clicked emails in the last 180 days</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">3,304</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">3,777</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;">1,829</td>
                          <td style="border: 1px solid oklch(var(--border)); padding: 8px; vertical-align: top; text-align: right; overflow-wrap: break-word;"><strong>8,910</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  `.trim(), 
          avatarIcon: segmentAgent?.icon, 
          avatarBgClass: segmentAgent?.colorClass,
          waitForUserInput: true // Wait for user to approve segments
        },
        // New question choice message before clarification
        { agentId: contentAgent?.id, type: 'chat', isAI: true, agentName: contentAgent?.name, content: '', avatarSrc: contentAgent?.avatarSrc, avatarIcon: contentAgent?.icon, avatarBgClass: contentAgent?.colorClass, isContentAgentQuestionChoice: true },
        { agentId: contentAgent?.id, type: 'chat', isAI: true, agentName: contentAgent?.name, content: "Based on these segments, I'll need some information to craft the most effective content.", avatarSrc: contentAgent?.avatarSrc, avatarIcon: contentAgent?.icon, avatarBgClass: contentAgent?.colorClass, isContentAgentClarification: true },
        // Content agent rationale – appears after "Generate Content" click
        { agentId: contentAgent?.id, type: 'chat', isAI: true, agentName: contentAgent?.name, content: '', avatarSrc: contentAgent?.avatarSrc, avatarIcon: contentAgent?.icon, avatarBgClass: contentAgent?.colorClass, isContentAgentRationale: true, waitForUserInput: true },
        // Content agent accordion response – shown after user clicks "Continue" on rationale
        { agentId: contentAgent?.id, type: 'chat', isAI: true, agentName: contentAgent?.name, content: 'Content agent response', avatarSrc: contentAgent?.avatarSrc, avatarIcon: contentAgent?.icon, avatarBgClass: contentAgent?.colorClass, isContentAgent: true, isPlanMode: false },
        // Scheduler agent response in collaborative mode
        { 
          agentId: schedulerAgent?.id, 
          type: 'chat', 
          isAI: true, 
          agentName: schedulerAgent?.name, 
          content: 'Scheduler agent response', 
          avatarIcon: schedulerAgent?.icon, 
          avatarBgClass: schedulerAgent?.colorClass,
          isSchedulerAccordion: true
        },
        { agentId: coMarketer?.id, type: 'chat', isAI: true, agentName: coMarketer?.name, content: "Here\'s a summary of what our team has put together:\n\n1. We\'ve identified <strong>4 high-performing target segments</strong> for your Valentine\'s campaign\n2. <strong>Custom subject lines</strong> have been created for each segment to maximize engagement\n3. A <strong>strategic send schedule</strong> has been designed to optimize open rates\n4. All components are ready for your review\n\nWould you like to make any adjustments before we proceed to implementation?", avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass }
      ];
      
      // Store the mock messages definition in ref for use in other handlers
      mockMessagesDefinitionRef.current = mockMessagesDefinition;
      
      const processedAgentIdsForJoinMessage = new Set<string>();

      const addNextMockMessage = (index: number) => {
        // If mock chat is no longer active (e.g., stopped by user or ended), exit.
        if (!isMockAgentChatActiveRef.current) { // Always check the ref
          if (mockMessageTimeoutRef.current) { // Ensure any lingering timeout for this function is cleared
            clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = null;
          }
          return;
        }

        if (index >= mockMessagesDefinition.length) {
          setIsMockAgentChatActive(false); // End of sequence (ref will update via useEffect)
          setIsGeneratingOutput(false);
          clearInputShimmer();
          setMockChatCompleted(true); // <-- Set mock chat completed true
          playResponseCue(); // response finished — audible cue
          if (mockMessageTimeoutRef.current) { // Clear ref if sequence ends naturally
            clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = null;
          }
          return;
        }

        const currentMessageDef = mockMessagesDefinition[index];
        const agentToProcess = marketingAgents.find(a => a.id === currentMessageDef.agentId);

        if (agentToProcess && !enabledAgents.has(agentToProcess.id) && !processedAgentIdsForJoinMessage.has(agentToProcess.id)) {
          // 1. Update enabled state
          setEnabledAgents(prev => new Set(prev).add(agentToProcess.id));
          
          // Skip the join message dispatch since Co-marketer is always present
          // 2. Dispatch join event
          // window.dispatchEvent(new CustomEvent('agentStatusChange', {
          //   detail: {
          //     name: agentToProcess.name,
          //     status: 'join',
          //     icon: agentToProcess?.icon,
          //     colorClass: agentToProcess.colorClass
          //   }
          // }));
          processedAgentIdsForJoinMessage.add(agentToProcess.id);

          // Process the message immediately without delay since there's no join message
          setTimeout(() => {
                      const messageWithCallback: ChatMessageData = {
            type: currentMessageDef.type,
            content: currentMessageDef.content,
            isAI: currentMessageDef.isAI,
            agentName: currentMessageDef.agentName,
            avatarSrc: agentToProcess?.avatarSrc,
            avatarIcon: currentMessageDef.avatarIcon,
            avatarBgClass: currentMessageDef.avatarBgClass,
            // Transfer animation control properties from the message definition
            // This is important for messages like tables that shouldn't animate
            animate: currentMessageDef.animate,
            animationSpeed: currentMessageDef.animationSpeed,
            isContentAgent: currentMessageDef.isContentAgent,
            isContentAgentClarification: currentMessageDef.isContentAgentClarification,
            isContentAgentQuestionChoice: currentMessageDef.isContentAgentQuestionChoice,
            isPlanMode: currentMessageDef.isPlanMode,
            isSegmentAccordion: currentMessageDef.isSegmentAccordion,
            isSchedulerAccordion: currentMessageDef.isSchedulerAccordion,
            isSegmentAgentRationale: currentMessageDef.isSegmentAgentRationale,
            isContentAgentRationale: currentMessageDef.isContentAgentRationale,
            isExecutiveSummaryWithContent: currentMessageDef.isExecutiveSummaryWithContent,
            isThinkingState: currentMessageDef.isThinkingState,
            thinkingDuration: currentMessageDef.thinkingDuration,
            reasoningSteps: currentMessageDef.reasoningSteps,
            onAnimationComplete: () => {
              // Clear previous timeout before setting a new one
              if (mockMessageTimeoutRef.current) {
                clearTimeout(mockMessageTimeoutRef.current);
              }
              // For autonomous mode, check if this message should wait for user input
              if (selectedMode === 'autonomous' && currentMessageDef.waitForUserInput) {
                setAutonomousWaitingForInput(true);
                return;
              }
              // For collaborative mode, also check if this message should wait for user input
              if (selectedMode === 'collaborative' && currentMessageDef.waitForUserInput) {
                // Don't set autonomousWaitingForInput, just return to wait for user input
                return;
              }
              // For content agent question choice, we stop the auto flow until user clicks a choice
              if (currentMessageDef.isContentAgentQuestionChoice) {
                return;
              }
              // For content agent clarification, we stop the auto flow until Generate Content is clicked
              if (currentMessageDef.isContentAgentClarification) {
                return;
              }
              // For segment agent rationale, we stop the auto flow until Continue is clicked
              if (currentMessageDef.isSegmentAgentRationale) {
                return;
              }
              // For segment agent table, we stop the auto flow until Approve Segments is clicked
              if (currentMessageDef.agentName === 'Segment agent' && currentMessageDef.content.includes('<table')) {
                return;
              }
              // For content agent response, we stop the auto flow until Approve Content is clicked
              if (currentMessageDef.isContentAgent) {
                return;
              }
              mockMessageTimeoutRef.current = setTimeout(() => {
                addNextMockMessage(index + 1);
              }, 500); // Original delay
            }
          };
            setMessages(prev => [...prev, messageWithCallback]);
          }, 100); // Reduced delay since no join message
        } else {
          // Agent already enabled or join message already shown, or no agent found for this message
          const messageWithCallback: ChatMessageData = {
            type: currentMessageDef.type,
            content: currentMessageDef.content,
            isAI: currentMessageDef.isAI,
            agentName: currentMessageDef.agentName,
            avatarSrc: agentToProcess?.avatarSrc,
            avatarIcon: currentMessageDef.avatarIcon,
            avatarBgClass: currentMessageDef.avatarBgClass,
            // Transfer animation control properties from the message definition
            // This ensures tables and other complex content gets displayed properly
            animate: currentMessageDef.animate,
            animationSpeed: currentMessageDef.animationSpeed,
            isContentAgent: currentMessageDef.isContentAgent,
            isContentAgentClarification: currentMessageDef.isContentAgentClarification,
            isContentAgentQuestionChoice: currentMessageDef.isContentAgentQuestionChoice,
            isPlanMode: currentMessageDef.isPlanMode,
            isSegmentAccordion: currentMessageDef.isSegmentAccordion,
            isSchedulerAccordion: currentMessageDef.isSchedulerAccordion,
            isSegmentAgentRationale: currentMessageDef.isSegmentAgentRationale,
            isContentAgentRationale: currentMessageDef.isContentAgentRationale,
            isExecutiveSummaryWithContent: currentMessageDef.isExecutiveSummaryWithContent,
            isThinkingState: currentMessageDef.isThinkingState,
            thinkingDuration: currentMessageDef.thinkingDuration,
            reasoningSteps: currentMessageDef.reasoningSteps,
            onAnimationComplete: () => {
              // Clear previous timeout before setting a new one
              if (mockMessageTimeoutRef.current) {
                clearTimeout(mockMessageTimeoutRef.current);
              }
              // For autonomous mode, check if this message should wait for user input
              if (selectedMode === 'autonomous' && currentMessageDef.waitForUserInput) {
                setAutonomousWaitingForInput(true);
                return;
              }
              // For collaborative mode, also check if this message should wait for user input
              if (selectedMode === 'collaborative' && currentMessageDef.waitForUserInput) {
                // Don't set autonomousWaitingForInput, just return to wait for user input
                return;
              }
              // For content agent question choice, we stop the auto flow until user clicks a choice
              if (currentMessageDef.isContentAgentQuestionChoice) {
                return;
              }
              // For content agent clarification, we stop the auto flow until Generate Content is clicked
              if (currentMessageDef.isContentAgentClarification) {
                return;
              }
              // For segment agent rationale, we stop the auto flow until Continue is clicked
              if (currentMessageDef.isSegmentAgentRationale) {
                return;
              }
              // For segment agent table, we stop the auto flow until Approve Segments is clicked
              if (currentMessageDef.agentName === 'Segment agent' && currentMessageDef.content.includes('<table')) {
                return;
              }
              // For content agent response, we stop the auto flow until Approve Content is clicked
              if (currentMessageDef.isContentAgent) {
                return;
              }
              mockMessageTimeoutRef.current = setTimeout(() => {
                addNextMockMessage(index + 1);
              }, 500); // Original delay
            }
          };
          setMessages(prev => [...prev, messageWithCallback]);
        }
      };
      
      // Store the function reference for use elsewhere in the component
      addNextMockMessageRef.current = addNextMockMessage;

      // Initial delay before starting the sequence
      // Clear previous timeout before setting a new one
      if (mockMessageTimeoutRef.current) {
        clearTimeout(mockMessageTimeoutRef.current);
        mockMessageTimeoutRef.current = null; 
      }
      
      mockMessageTimeoutRef.current = setTimeout(() => {
        addNextMockMessage(0);
      }, 1000);

    } else if (selectedMode === 'autonomous' && autonomousWaitingForInput) {
      // In autonomous mode and waiting for user input, replace their input with the predefined response
      // and continue the autonomous flow
      setAutonomousWaitingForInput(false);
      
      // Add the predefined autonomous response
      const autonomousResponse: ChatMessageData = {
        type: 'chat',
        content: "Objective of the campaign is to increase sales for perfumes by 3%. I want to cater to entire audience base with demographic and Affinity bifurcations - feel free to make micro segments. Duration of the campaign is for 7 days from 7th Feb to 14th Feb.",
        isAI: false,
        onAnimationComplete: () => {}
      };
      
      // Replace the user's message with the predefined response
      setMessages(prev => {
        const updatedMessages = [...prev];
        updatedMessages[updatedMessages.length - 1] = autonomousResponse;
        return updatedMessages;
      });
      
      // Continue the autonomous flow from the next message (index 1, since index 0 was the question)
      setTimeout(() => {
        addNextMockMessageRef.current(1);
      }, 1000);
    } else if (selectedMode === 'collaborative' && isMockAgentChatActive) {
      // In collaborative mode and waiting for user input, handle different types of waiting states
      
      // Check if the questionnaire message (index 1, after thinking state at index 0) is waiting for user input
      const questionnaireMessage = mockMessagesDefinitionRef.current[1];
      if (questionnaireMessage && questionnaireMessage.waitForUserInput && !questionnaireMessage.isSegmentAgentRationale) {
        // Add the predefined collaborative response for questionnaire
        const collaborativeResponse: ChatMessageData = {
          type: 'chat',
          content: "Objective of the campaign is to increase sales for perfumes by 3%. I want to cater to entire audience base with demographic and Affinity bifurcations - feel free to make micro segments. Duration of the campaign is for 7 days from 7th Feb to 14th Feb.",
          isAI: false,
          onAnimationComplete: () => {}
        };
        
        // Replace the user's message with the predefined response
        setMessages(prev => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = collaborativeResponse;
          return updatedMessages;
        });
        
        // Continue the collaborative flow from the next message 
        // Index 0 is thinking state, Index 1 is questionnaire, so continue from Index 2
        setTimeout(() => {
          addNextMockMessageRef.current(2);
        }, 1000);
      } else {
        // Check if we're waiting for segment agent rationale continuation
        const segmentRationaleMessage = mockMessagesDefinitionRef.current.find(msg => msg.isSegmentAgentRationale);
        const contentRationaleMessage = mockMessagesDefinitionRef.current.find(msg => msg.isContentAgentRationale);

        if ((segmentRationaleMessage || contentRationaleMessage) && (lowerCaseMessage.includes('continue') || lowerCaseMessage.includes('yes') || lowerCaseMessage.includes('ok'))) {
          // Find the index of the segment rationale message and continue from the next one
          const rationaleIndex = segmentRationaleMessage
            ? mockMessagesDefinitionRef.current.findIndex(msg => msg.isSegmentAgentRationale)
            : mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgentRationale);
          if (rationaleIndex >= 0) {
            setTimeout(() => {
              addNextMockMessageRef.current(rationaleIndex + 1);
            }, 1000);
          }
        }
      }
    } else {
      // If it's not the start of a mock chat, or mock chat is already active and user sends another message, stop it.
      if (isMockAgentChatActiveRef.current) { // Check the ref here too
        stopMockConversation();
      }
      // Re-assert the bottom loader for this new (generic) response, since stopMockConversation clears it.
      setIsGeneratingOutput(true);
      // Re-arm the shimmer for this new response (stopMockConversation clears it).
      setInputShimmer(true);
      if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
      inputShimmerTimerRef.current = setTimeout(() => setInputShimmer(false), 30000);
      setMockChatCompleted(false); // Also reset if conversation is stopped manually

      const coMarketer = marketingAgents.find(agent => agent.id === 'co-marketer');

      // Guard so the AI response is appended only once even if
      // the thinking state's onComplete fires more than once.
      let hasResponded = false;

      // 1) Thinking state
      setTimeout(() => {
        const thinking: ChatMessageData = {
          type: 'chat',
          isAI: true,
          content: '',
          isThinkingState: true,
          thinkingDuration: 3,
          reasoningSteps: [
            "Understanding the campaign request",
            "Identifying information needed for targeting",
            "Structuring a questionnaire",
            "Preparing a ready-to-use artifact",
          ],
          onAnimationComplete: () => {
            if (hasResponded) return;
            hasResponded = true;
            // 2) AI response with the doc-like artifact
            const aiResponse: ChatMessageData = {
              type: 'chat',
              isAI: true,
              agentName: coMarketer?.name || 'Cori',
              avatarIcon: coMarketer?.icon,
              avatarBgClass: coMarketer?.colorClass,
              content:
                "I'll help you design a Valentine's Day perfume campaign. To create the most effective campaign, I need some additional information:\n\n" +
                "<strong>1. Campaign Goals:</strong>\n• What are your primary objectives? (e.g., increase sales, brand awareness, etc.)\n• Do you have specific revenue or sales targets?\n\n" +
                "<strong>2. Product Details:</strong>\n• Which perfume brands/collections are you promoting?\n• What is the price range of the perfumes?\n• Are there any special Valentine's Day offers or bundles?\n\n" +
                "<strong>3. Target Audience:</strong>\n• Are you targeting specific age groups?\n• Any specific gender focus (men buying for women, women for men, or both)?\n• Geographic location for the campaign?\n\n" +
                "<strong>4. Campaign Duration:</strong>\n• When would you like to start the campaign?\n• How long do you want to run it? (typically Valentine's campaigns start 2-3 weeks before February 14th)\n\n" +
                "<strong>5. Budget and Resources:</strong>\n• Do you have a specific marketing budget?\n• Which marketing channels would you like to use? (email, social media, etc.)",
              artifact: {
                intro: "I've created the Highest Engagement Last Quarter summary in an artifact with all the information you provided, formatted and ready to use",
                title: "Highest Engagement Last Quarter",
                subtitle: "WhatsApp Document",
              },
              onAnimationComplete: () => {
                // Output finished streaming — stop the input shimmer and bottom loader.
                if (inputShimmerTimerRef.current) clearTimeout(inputShimmerTimerRef.current);
                setInputShimmer(false);
                setIsGeneratingOutput(false);
                playResponseCue(); // response finished — audible cue
              },
            };
            setMessages(prev => [...prev, aiResponse]);
          },
        };
        setMessages(prev => [...prev, thinking]);
      }, 600);
    }
  };

  // Opens the docked chat on a campaign the co-marketer built and is waiting on:
  // the user's "review this" turn, then a copy-only walkthrough from the agent.
  // Deliberately bypasses CAMPAIGNS_FLOW — that script builds a *new* campaign,
  // while this thread talks about one that already exists.
  /** Drops a canned prompt/answer pair into an empty thread — copy only, no
   *  scripted hand-offs. Shared by the review banner and the campaign-creation
   *  discovery points, both of which open the chat already on a subject. */
  const appendTopic = (topic: SeededTopic) => {
    const coMarketer = marketingAgents.find(a => a.id === 'co-marketer');
    if (!topic.suppressPromptTurn) {
      setMessages(prev => [...prev, {
        type: 'chat',
        isAI: false,
        content: topic.prompt,
        navLabel: topic.navLabel,
        questionRecap: topic.questionRecap,
        onAnimationComplete: () => {},
      }]);
    }
    setShowSuggestions(false);
    // Jumps straight to the just-answered question (and, shortly after,
    // whatever the agent adds below it) rather than leaving the marketer to
    // scroll down and find it themselves — this only fires for a real
    // follow-up turn (a deliberate action just happened), never on the
    // panel's own initial mount.
    stickToBottomFor(2500);

    // Specialist-led topic: same switch → thinking → answer sequence the
    // scripted campaign flows play, so a cut the Segment agent actually built
    // arrives looking built rather than pre-canned.
    const specialist = topic.agentId
      ? marketingAgents.find(a => a.id === topic.agentId)
      : undefined;
    if (specialist) {
      const steps = topic.reasoningSteps ?? [];
      const switchEntry: ChatMessageData = {
        type: 'chat', isAI: true, content: '',
        isAgentSwitch: true,
        switchAgentLabel: specialist.name,
        switchSaying: topic.agentSaying,
        reasoningSteps: steps,
        avatarSrc: specialist.avatarSrc,
        avatarIcon: specialist.icon,
        avatarBgClass: specialist.colorClass,
      };
      const thinkingEntry: ChatMessageData = {
        type: 'chat', isAI: true, content: '',
        isThinkingState: true, thinkingDuration: topic.thinkingDurationSeconds ?? 4, thinkingLabel: topic.thinkingLabel, reasoningSteps: steps,
      };
      // Staged reveal (replySegments) when set — each its own fully-typed
      // turn before the next begins — else the usual single reply message.
      // Only the LAST segment carries any cards, same as a single reply
      // would.
      const replyTexts = topic.replySegments && topic.replySegments.length > 0 ? topic.replySegments : [topic.reply ?? ''];
      const replyEntries: ChatMessageData[] = replyTexts.map((text, i) => ({
        type: 'chat', isAI: true,
        agentName: specialist.name,
        avatarSrc: specialist.avatarSrc,
        avatarIcon: specialist.icon,
        avatarBgClass: specialist.colorClass,
        content: text,
        hidePerformanceDashboard: true,
        // The copy/thumbs row only makes sense once on a multi-segment
        // reveal — not repeated under every intermediate line.
        hideFeedback: i !== replyTexts.length - 1,
        ...(i === replyTexts.length - 1
          ? {
              setupApplyCard: topic.setupApplyCard,
              findings: topic.findings,
              experimentCard: topic.experimentCard,
              nodeInsightCard: topic.nodeInsightCard,
              journeyProposalCard: topic.journeyProposalCard,
              audienceTestCard: topic.audienceTestCard,
              mergeTestCta: topic.mergeTestCta,
              replyOptions: topic.replyOptions,
            }
          : {}),
      }));
      const sequence: ChatMessageData[] = topic.skipAgentSwitchBanner
        ? [thinkingEntry, ...replyEntries]
        : [switchEntry, thinkingEntry, ...replyEntries];

      setIsMockAgentChatActive(true);
      isMockAgentChatActiveRef.current = true;
      const mySequenceId = ++activeSequenceIdRef.current;

      const step = (index: number) => {
        if (mySequenceId !== activeSequenceIdRef.current) return;
        if (!isMockAgentChatActiveRef.current) {
          if (mockMessageTimeoutRef.current) {
            clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = null;
          }
          return;
        }
        if (index >= sequence.length) {
          // Settle the divider so the orb hands over to the agent's avatar.
          setMessages(prev => prev.map(m =>
            m.isAgentSwitch && !m.switchSettled ? { ...m, switchSettled: true } : m
          ));
          setIsMockAgentChatActive(false);
          isMockAgentChatActiveRef.current = false;
          setIsGeneratingOutput(false);
          setMockChatCompleted(true);
          if (mockMessageTimeoutRef.current) {
            clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = null;
          }
          return;
        }
        const def = sequence[index];
        // Dividers aren't ChatMessages and never fire onAnimationComplete.
        if (def.isAgentSwitch) {
          setMessages(prev => [...prev, def]);
          stickToBottomFor(2500);
          if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
          mockMessageTimeoutRef.current = setTimeout(() => step(index + 1), 2600);
          return;
        }
        setMessages(prev => [...prev, {
          ...def,
          onAnimationComplete: () => {
            // A ThinkingState message's onComplete fires straight from its
            // own internal countdown, whenever that happens to elapse —
            // entirely independent of whether a newer sequence has since
            // taken over the shared timeout ref. Guarding here (not just at
            // the top of step()) matters because the very next line clears
            // and re-schedules mockMessageTimeoutRef itself — without this
            // check, a stale callback firing after a newer append already
            // scheduled its own next step would cancel that legitimate,
            // still-pending timeout, silently dropping the newer sequence.
            if (mySequenceId !== activeSequenceIdRef.current) return;
            if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
            mockMessageTimeoutRef.current = setTimeout(() => step(index + 1), 650);
          },
        }]);
        stickToBottomFor(2500);
      };

      if (mockMessageTimeoutRef.current) clearTimeout(mockMessageTimeoutRef.current);
      mockMessageTimeoutRef.current = setTimeout(() => step(0), 500);
      return;
    }

    setIsGeneratingOutput(true);

    window.setTimeout(() => {
      setIsGeneratingOutput(false);
      setMessages(prev => [...prev, {
        type: 'chat',
        isAI: true,
        agentName: coMarketer?.name,
        avatarSrc: coMarketer?.avatarSrc,
        avatarIcon: coMarketer?.icon,
        avatarBgClass: coMarketer?.colorClass,
        content: topic.reply ?? '',
        hidePerformanceDashboard: true,
        setupApplyCard: topic.setupApplyCard,
        findings: topic.findings,
        experimentCard: topic.experimentCard,
        nodeInsightCard: topic.nodeInsightCard,
        onAnimationComplete: () => setMockChatCompleted(true),
      }]);
      stickToBottomFor(2500);
    }, 700);
  };

  const seedThread = (prompt: string, reply: string, navLabel?: string, setupApplyCard?: SetupApplyCardData) => {
    setMessages([]);
    appendTopic({ prompt, reply, navLabel, setupApplyCard });
  };

  /** Same as `seedThread`, but for topics that carry richer payloads. */
  const seedTopic = (topic: SeededTopic) => {
    setMessages([]);
    appendTopic(topic);
  };

  const seedReviewThread = (campaign: ReviewCampaignContext) => {
    seedThread(
      `Walk me through "${campaign.title}" before I approve it.`,
          `Here's **${campaign.title}**${campaign.id ? ` (${campaign.id})` : ''}.\n\n` +
          `**Why I built it** — ${campaign.subtitle ?? 'It targets an opportunity I spotted in your recent engagement data.'} ` +
          `I found a pocket of users who match the intent signal but haven't been contacted in the last 21 days.\n\n` +
          `**What's inside** — a single email send, subject line and body drafted in your brand voice, ` +
          `scheduled for the 10am–12pm window where this audience opens most.\n\n` +
          `**What I need from you** — a look at the copy and the send window. Approve it and I'll schedule it; ` +
          `tell me what to change and I'll redraft.`,
      'Review campaign'
    );
  };

  // Auto-fires once against a fresh thread when opened with `initialMessage` —
  // mirrors typing that text into this interface's own composer and hitting
  // Enter. Callers remount this component (key bump) per open, so this only
  // ever runs once against an empty conversation. Guarded with a ref (not
  // `messages.length`) because StrictMode double-invokes mount effects before
  // a re-render can reflect the first call's setMessages — a state check sees
  // an empty thread both times and would fire the scripted flow twice.
  const hasAutoSentRef = useRef(false);
  useEffect(() => {
    if (hasAutoSentRef.current) return;
    if (initialReviewCampaign) {
      hasAutoSentRef.current = true;
      seedReviewThread(initialReviewCampaign);
      return;
    }
    if (initialTopic) {
      hasAutoSentRef.current = true;
      seedTopic(initialTopic);
      return;
    }
    if (initialAgentChat) {
      hasAutoSentRef.current = true;
      if (initialAgentChat.chatId) handleSelectChat(initialAgentChat.chatId);
      else if (initialAgentChat.bind) bindComposerAgent(initialAgentChat.agent);
      else handleStartAgentChat(initialAgentChat.agent, initialAgentChat.message);
      return;
    }
    if (initialInsightCard) {
      hasAutoSentRef.current = true;
      handleCampaignsSend('', initialInsightCard);
      return;
    }
    if (initialMessage) {
      hasAutoSentRef.current = true;
      handleSendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consumedFollowUpSeq = useRef(0);
  useEffect(() => {
    if (!followUpTopic || followUpSeq <= 0 || followUpSeq === consumedFollowUpSeq.current) return;
    consumedFollowUpSeq.current = followUpSeq;
    appendTopic(followUpTopic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followUpSeq, followUpTopic]);

  useEffect(() => {
    const handleAgentStatus = (event: CustomEvent<{
      name: string;
      status: 'join' | 'leave';
      icon: React.ElementType | undefined;
      colorClass: string;
    }>) => {
      setMessages(prev => [...prev, {
        type: 'system',
        content: '',
        agentName: event.detail.name,
        systemType: event.detail.status === 'join' ? 'join' : 'leave',
        agentIcon: event.detail.icon,
        agentColorClass: event.detail.colorClass
      }]);
    };

    window.addEventListener('agentStatusChange' as any, handleAgentStatus as EventListener);
    return () => {
      window.removeEventListener('agentStatusChange' as any, handleAgentStatus as EventListener);
    };
  }, []);

  // Header for the compact widget view
  const WidgetViewHeader = () => (
    <div
      className={cn(
        "flex items-start shrink-0 w-full border-b border-[var(--color-line-input)]",
        !isExpanded && (isDragging ? "cursor-grabbing" : "cursor-grab")
      )}
      onMouseDown={!isExpanded ? handleDragMouseDown : undefined}
    >
      {/* Left: menu + icon + title */}
      <div className="flex flex-col items-start justify-center pl-[16px] py-[16px] shrink-0 w-[287px]">
        <div className="flex gap-[8px] items-center w-full">
          {/* Menu icon — minimized mode only. Always opens the LHS drawer,
              including while a Chats/Bookmarks page is open. */}
          <button
            type="button"
            className="flex items-center justify-center size-[32px] rounded-[8px] hover:bg-[var(--color-surface-1)] transition-colors shrink-0"
            aria-label="Menu"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setShowMinOverlay(true)}
          >
            <Menu className="w-[16px] h-[16px] text-[var(--color-slate)]" />
          </button>
          {/* Logo + title group (4px gap per Figma) */}
          <div className="flex gap-[4px] items-center min-w-0">
            {/* Co-marketer animated logo — purple disc behind the gif so the
                circular clip reads as a full circle (per Figma node 16367:9415) */}
            <div className="flex items-center justify-center rounded-full overflow-hidden shrink-0 size-[24px] bg-[var(--color-plum)]">
              <img
                src="/co-marketer-logo.gif"
                alt="Cori"
                className="size-full object-cover"
              />
            </div>
            <span
              className="font-bold text-[16px] leading-[20px] text-[var(--color-ink)] whitespace-nowrap"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Cori
            </span>
          </div>
        </div>
      </div>

      {/* Right: expand + close buttons.
          py-[16px] matches the left group's vertical padding so the icons line up
          with the menu icon + Co-marketer title (parent is items-start). */}
      <div className="flex flex-1 py-[16px] items-center justify-end pr-[24px] gap-[4px]">
        <button
          onClick={() => requestExpand(true)}
          className="flex items-center justify-center p-[8px] rounded-[8px] hover:bg-[var(--color-surface-1)] transition-colors"
          aria-label="Expand"
        >
          <Maximize2 className="w-[16px] h-[16px] text-[var(--color-slate)]" />
        </button>
        <button
          onClick={() => onCloseInterface?.()}
          className="flex items-center justify-center p-[8px] rounded-[8px] hover:bg-[var(--color-surface-1)] transition-colors"
          aria-label="Close"
        >
          <X className="w-[16px] h-[16px] text-[var(--color-slate)]" />
        </button>
      </div>
    </div>
  );

  // Header for the expanded view
  const ExpandedViewHeader = () => (
    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-background shadow-sm flex-shrink-0 h-[64px]">
      <div className="flex items-center gap-3">
        <div className="flex flex-col pl-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Cori</h1>
          </div>
          <p className="text-xs text-muted-foreground leading-tight">Your assistant for data-driven success</p>
        </div>
      </div>
      <div className="flex items-center space-x-1">
        <Button variant="ghost" className="text-muted-foreground hover:bg-transparent hover:text-muted-foreground">
          <Plus className="w-4 h-4 mr-2" />
          New chat
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="p-1.5 hover:bg-muted rounded-md"
          title="Agents"
          onClick={() => setActiveSidebar(prev => prev === 'agents' ? null : 'agents')}
        >
          <Bot className="w-5 h-5 text-muted-foreground" />
        </Button>
        <div>
          <Button
            variant="ghost"
            size="icon"
            className="p-1.5 hover:bg-muted rounded-md"
            title="Preferences"
            onClick={() => window.open('https://www.figma.com/proto/PpMyMSpfteIiBlbsBYryx2/Raman-AI---Co-Marketer---Co-Pilot?page-id=5891:1439&node-id=7073-4874&viewport=-442,2798,0.17&t=3ThX3Yd3gjcwJf8j-1&scaling=contain&content-scaling=responsive&starting-point-node-id=7073:4873&hide-ui=1', '_blank')}
          >
            <Settings2 className="w-8 h-8 text-muted-foreground" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="p-1.5 hover:bg-muted rounded-md"
          title="Chat history"
          onClick={() => setActiveSidebar(prev => prev === 'bookmarks' ? null : 'bookmarks')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted-foreground">
            <path d="M12 2a10 10 0 0 1 7.38 16.75"></path>
            <path d="M12 6v6l4 2"></path>
            <path d="M2.5 8.875a10 10 0 0 0-.5 3"></path>
            <path d="M2.83 16a10 10 0 0 0 2.43 3.4"></path>
            <path d="M4.636 5.235a10 10 0 0 1 .891-.857"></path>
            <path d="M8.644 21.42a10 10 0 0 0 7.631-.38"></path>
          </svg>
        </Button>
        <Button variant="ghost" size="icon" className="p-1.5 hover:bg-muted rounded-md" title="Toggle theme">
          <ThemeToggle />
        </Button>
        <Button variant="ghost" size="icon" className="p-1.5 hover:bg-muted rounded-md" onClick={() => requestExpand(false)} title="Minimize">
          <Minimize2 className="w-5 h-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="p-1.5 hover:bg-muted rounded-md" onClick={onCloseInterface} title="Close">
          <X className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );

  // Common props for sidebar components
  interface SidebarProps {
    onClose: () => void; // Function to close the current sidebar
  }

  // Sidebar for Saved Content and Chat History
  const AppSidebar: React.FC<SidebarProps> = ({ onClose }) => {
    // Placeholder data for recent chats - replace with actual data fetching
    const recentChats = [
      { id: "0", chatId: "5341", title: "Template generated", date: "07 April 2025, 05:42 PM" },
      { id: "1", chatId: "2847", title: "Unlock 50% OFF on New Courses! Limited Ti...", date: "02 September 2024, 01:03 PM" },
      { id: "2", chatId: "1629", title: "Grab 50% Discount on New Courses! Start L...", date: "02 September 2024, 01:03 PM" },
    ];

    return (
      <div className="w-[324px] h-full flex flex-col bg-background border-r border-border flex-shrink-0">
        <Tabs defaultValue="chat-history" className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <TabsList className="grid grid-cols-2 w-full bg-muted p-1 rounded-md">
              <TabsTrigger value="chat-history" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Chat history</TabsTrigger>
              <TabsTrigger value="saved-content" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Bookmarks</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="icon" onClick={onClose} className="ml-2 hover:bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>

          <TabsContent value="chat-history" className="flex-1 overflow-y-auto p-4 flex flex-col">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground mb-2">last 30 days</div>
              {recentChats.map((chat) => (
                <div key={chat.id} className={cn(
                  "group p-2 rounded-md cursor-pointer flex items-start justify-between",
                  "hover:bg-muted",
                  openChatId === chat.id && "bg-muted"
                )}>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm text-foreground truncate font-medium">
                      {chat.title}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {chat.date}
                    </span>
                  </div>
                  <DropdownMenu open={openChatId === chat.id} onOpenChange={(open) => setOpenChatId(open ? chat.id : null)}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-transparent"
                        aria-label="Chat options"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleCopyChatId(chat.chatId)} className="hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
                        Copy chat ID
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShareChat} className="hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground">
                        Share chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDeleteChat} className="text-destructive hover:bg-muted hover:text-destructive focus:bg-muted focus:text-destructive">
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {recentChats.length === 0 && (
                   <p className="text-xs text-muted-foreground italic text-center pt-10">No chat history yet.</p>
              )}
            </div>

            {/* Dev Options Panel - Aligned to bottom */}
            <div className="mt-auto pt-4 border-t border-border">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground font-mono">&lt;dev_options&gt;</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDevOptions}
                  className={cn(
                    "h-6 w-6 p-0 hover:bg-muted",
                    showDevOptions && "bg-muted"
                  )}
                  title="Toggle Dev Panel"
                >
                  <Settings2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              
              {showDevOptions && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <label htmlFor="disable-animation" className="text-xs font-medium text-foreground">
                        Disable Animation
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Messages load instantly
                      </span>
                    </div>
                    <Switch
                      id="disable-animation"
                      checked={disableAnimation}
                      onCheckedChange={handleDisableAnimationToggle}
                      className="scale-75"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <label htmlFor="disable-content-accordion" className="text-xs font-medium text-foreground">
                        Disable old content accordion
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Hides legacy accordion only
                      </span>
                    </div>
                    <Switch
                      id="disable-content-accordion"
                      checked={disableContentAccordion}
                      onCheckedChange={handleDisableContentAccordionToggle}
                      className="scale-75"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <label htmlFor="prompt-template-exists" className="text-xs font-medium text-foreground">
                        Prompt Template Exists
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Enabling this shows pre-made prompt templates in content agent response
                      </span>
                    </div>
                    <Switch
                      id="prompt-template-exists"
                      checked={promptTemplateExists}
                      onCheckedChange={handlePromptTemplateExistsToggle}
                      className="scale-75"
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="saved-content" className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-16">
              <div className="relative mb-4">
                <Bookmark className="w-20 h-20 text-grey-soft" />
                <div className="absolute -top-1 -right-1 bg-background p-1 rounded-full shadow-md">
                  <PlusCircle className="w-8 h-8 text-royal" />
                </div>
              </div>
              <p className="text-sm font-semibold">Nothing bookmarked yet</p>
              <p className="text-xs text-center mt-1">Save content from your chats to find it easily later.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Props for the AgentsSidebar, extending common SidebarProps
  interface AgentsSidebarProps extends SidebarProps {
    enabledAgents: Set<string>;
    onAgentToggle: (agentId: string) => void;
  }

  // Sidebar for managing Marketing Agents
  const AgentsSidebar: React.FC<AgentsSidebarProps> = ({ onClose, enabledAgents, onAgentToggle }) => {
    return (
      <div className="w-[324px] h-full flex flex-col bg-background border-r border-border flex-shrink-0">
        <div className="px-4 py-2 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">Marketing agents</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
             <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {marketingAgents.map((agent) => {
            const Icon = agent.icon;
            const isEnabled = enabledAgents.has(agent.id);
            return (
              <div key={agent.id} className="flex items-start gap-4 p-3 rounded-lg border border-border bg-card transition-colors hover:bg-muted/50">
                 <div className="mt-1 flex-shrink-0 w-10 h-10"> {/* Simplified container for positioning */} 
                  {/* Priority: avatarSrc (SVG) > Icon (Lucide) > GIF fallback */}
                  {agent.avatarSrc ? (
                    <Avatar className="h-full w-full rounded-lg"> {/* Squircle shape on Avatar */}
                      <AvatarImage src={agent.avatarSrc} alt={agent.name} className="object-cover" />
                      <AvatarFallback>{agent.initials}</AvatarFallback>
                    </Avatar>
                  ) : Icon ? (
                    <div className={cn(
                       "p-2 rounded-lg flex items-center justify-center h-full w-full", 
                       agent.colorClass?.replace('dark:', '') // Safely access colorClass
                      )}
                    >
                       <Icon className="w-5 h-5" />
                    </div>
                  ) : (
                    // Fallback for agents without avatarSrc or icon
                    <Avatar className="h-full w-full rounded-lg"> {/* Squircle shape on Avatar */}
                      <AvatarImage src="/avatarGIF.gif" alt={agent.name} className="object-cover" />
                      <AvatarFallback>{agent.initials}</AvatarFallback>
                    </Avatar>
                  )}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between">
                     <h3 className="font-semibold text-sm text-card-foreground truncate">{agent.name}</h3>
                     {agent.id === "co-marketer" ? (
                       <>
                         {/* Switch for Co-marketer intentionally removed as per request */}
                       </>
                     ) : (
                       <Switch
                         checked={isEnabled}
                         onCheckedChange={() => onAgentToggle(agent.id)}
                         aria-label={`Toggle ${agent.name}`}
                       />
                     )}
                   </div>
                   <p className="text-xs text-muted-foreground mt-1">{agent.description}</p>
                 </div>
               </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mode Switch Confirmation Popup */}
      <ModeSwitchConfirmation
        isOpen={showModeSwitchConfirmation}
        onConfirm={confirmModeSwitch}
        onCancel={cancelModeSwitch}
        targetMode={pendingMode || 'collaborative'}
      />
      
      {/* Overlay for expanded view background, click to minimize */}
      {isExpanded && <div className={cn("fixed inset-0 z-40 animate-in fade-in duration-300", atmoActive ? "bg-transparent" : "bg-black/10 backdrop-blur-sm")} onClick={() => requestExpand(false)}></div>}

      {/* 
        Main container: Switches between expanded and widget styles.
        NOTE: \`overflow-hidden\` is crucial here in conjunction with \`rounded-xl\` 
        to ensure child elements (like the header) are clipped by the parent's border radius.
      */}
      <div 
        ref={chatWindowRef} // Attach ref here
        className={cn(
          isExpanded
            // When atmosphere is on, go transparent so the page gradient shows
            // through the frosted nav surfaces (homepage reflect).
            ? cn("fixed z-50 inset-0 flex flex-col overflow-hidden", atmoActive ? "bg-transparent" : "bg-background")
            // For widget view, if position is null, it uses these classes. If position is set, inline style takes over for pos.
            : cn(
                "w-[470px] bg-background border border-border shadow-lg rounded-xl flex flex-col overflow-hidden relative",
                // Docked (and not dragged) → fill the parent column height and stay within the viewport.
                docked && !position ? "h-full max-h-full" : "h-[776px]"
              ),
            !isExpanded && position && "fixed z-50" // Ensure it's fixed and on top when dragged
        )}
        style={!isExpanded && position ? {
            top: `${position.y}px`,
            left: `${position.x}px`,
            width: '470px', // Keep width/height consistent
            height: '776px',
        } : {}}
      >
        {/* Widget (minimized) header sits above everything */}
        {!isExpanded && <WidgetViewHeader />}

        {/* Minimized-view LHS overlay — opened from the widget header menu icon */}
        {!isExpanded && showMinOverlay && (
          <MinViewLhsOverlay
            activeNav={activeNav}
            activeChatId={activeLhsChatId}
            // Recents rows were rendering off the component's own fallback list
            // with no select handler, so tapping one did nothing. Feed it the real
            // list and route taps through the same handler the expanded sidebar
            // and the Chats page use.
            chats={lhsChats}
            onSelectChat={handleSelectChat}
            onClose={() => setShowMinOverlay(false)}
            onNewChat={handleNewChat}
            onOpenCustomAgents={openCustomAgents}
            onOpenChats={() => setActivePage('chats')}
            onOpenBookmarks={() => setActivePage('bookmarks')}
            onOpenReports={() => setActivePage('reports')}
            onOpenScheduler={() => setActivePage('scheduler')}
          />
        )}

        {/* Feedback modal (👍 happy / 👎 improvement) — overlays the whole chat window */}
        {feedbackModal && (
          <FeedbackModal
            sentiment={feedbackModal}
            onClose={() => setFeedbackModal(null)}
            onSubmit={handleFeedbackSubmit}
          />
        )}

        <ScheduleDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          reports={generatedReports}
          onCreate={() => {}}
          prefill={schedulePrefill}
        />

        {/* Settings — opened from the Settings button at the bottom of the LHS
            rail. Nav rail on the left, section on the right; the brand wiki is
            the section it lands on. */}
        <SettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
        />

        {/* Create-agent modal — opened from the composer's "+" → "Add to agent" →
            "Create a new agent". The new agent is attached to the composer as a chip. */}
        <CreateCustomAgentModal
          open={composerCreateOpen}
          onClose={() => setComposerCreateOpen(false)}
          onSubmit={(data) => {
            const agent = createCustomAgent(data);
            setComposerAgent({ id: agent.id, name: agent.name, avatarSrc: agent.avatarSrc });
            setComposerCreateOpen(false);
          }}
        />


        {/* Main content area: Layout changes based on view mode */}
        <div
          className={cn(
          "flex flex-1 overflow-hidden",
          isExpanded ? "flex-row pt-0" : "flex-col"
        )}>
          {/* Full-height LHS sidebar (expanded view) — single component animates between full and icon-rail */}
          {isExpanded && activeSidebar === 'bookmarks' && (
            <LhsSidebar
              collapsed={lhsCollapsed}
              chats={lhsChats}
              activeNav={activeNav}
              activeChatId={activeLhsChatId}
              busyChatId={busyLhsChatId}
              researchingChatId={researchingLhsChatId}
              onNewChat={handleNewChat}
              onOpenCustomAgents={openCustomAgents}
              onOpenChats={() => setActivePage('chats')}
              onOpenBookmarks={() => setActivePage('bookmarks')}
              onOpenReports={() => setActivePage('reports')}
              onOpenScheduler={() => setActivePage('scheduler')}
              onSelectChat={handleSelectChat}
              onOpenSettings={() => setSettingsModalOpen(true)}
              onToggleCollapse={() => setLhsCollapsed(prev => !prev)}
            />
          )}
          {/* Conditional rendering of AgentsSidebar in expanded view */}
          {isExpanded && activeSidebar === 'agents' && (
            <AgentsSidebar
              onClose={() => setActiveSidebar(null)}
              enabledAgents={enabledAgents}
              onAgentToggle={handleAgentToggle}
            />
          )}

          {/* Chat + artifact region — flex-1 after the LHS. contentRowRef lives here
              so the artifact width is a % of THIS region (excludes the LHS). That
              keeps chat + artifact stable when the sidebar expands/collapses and
              prevents the artifact from overflowing onto the chat. */}
          <div ref={contentRowRef} className="flex flex-row flex-1 min-w-0 overflow-hidden">
          {/* Right column: header + chat (expanded) / chat only (widget) */}
          <div className={cn(
            "flex flex-col flex-1 min-h-0",
            // When the artifact is fully expanded, hide the entire chat column
            // (header + conversation) so the artifact reaches the LHS nav.
            isExpanded && showArtifactPreview && artifactFullExpanded
              ? "hidden"
              : isExpanded && showArtifactPreview ? "min-w-[460px]" : "min-w-0"
          )}>
          {isExpanded && (
            <RhsHeader
              chatName={activePage === 'home' ? (chatTitleOverride ?? chatName) : null}
              showSidebarToggle={false}
              sidebarCollapsed={lhsCollapsed}
              onToggleSidebar={() => setLhsCollapsed(prev => !prev)}
              isBookmarked={isChatBookmarked}
              onToggleBookmark={() => setIsChatBookmarked(prev => !prev)}
              onDeleteChat={handleNewChat}
              onMinimize={() => requestExpand(false)}
              onClose={onCloseInterface}
              hideClose={showArtifactPreview}
            />
          )}

          {/* Chat messages and input area.
              Edge-to-edge: the chat surface fills the RHS column with no gutter,
              border, or rounding — it merges with the bordered LHS into one dashboard. */}
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <ChatCardBeam enabled={isExpanded} active={false}>
          <div className="relative flex flex-1 overflow-hidden min-h-0 min-w-0 bg-[var(--color-surface-0)]">
          {/* Chats / Bookmarks full page — overlays the conversation when active.
              Renders in both expanded and minimized (mobile) views. */}
          {activePage !== 'home' && (
            <div className="absolute inset-0 z-20 overflow-hidden bg-[var(--color-surface-0)]">
              {pageBooting ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Classic className="size-8 text-[var(--color-slate)]" />
                </div>
              ) : activePage === 'reports' ? (
                <ReportsPage
                  reports={generatedReports}
                  compact={!isExpanded}
                  onSelectReport={(report) => {
                    // Leave the reports overlay and open the doc previewer full-bleed
                    // (no chat beside it — there's no conversation to show).
                    setActivePage('home');
                    openDeepResearchArtifact({ ...report.doc }, { fullExpanded: true, fromReports: true });
                  }}
                />
              ) : activePage === 'scheduler' ? (
                <SchedulerPage
                  initialSchedules={scheduledReports}
                  templates={scheduleTemplates}
                  availableReports={generatedReports}
                  compact={!isExpanded}
                  onSelectSchedule={(schedule) => {
                    // Leave the scheduler overlay and open the report in the doc
                    // previewer full-bleed (same as opening a report).
                    setActivePage('home');
                    openDeepResearchArtifact({ ...schedule.doc }, { fullExpanded: true, fromReports: true });
                  }}
                />
              ) : activePage === 'custom-agents' ? (
                <AgentsSurface
                  compact={!isExpanded}
                  selectedAgentId={selectedAgentId}
                  onSelectAgentId={setSelectedAgentId}
                  onStartChat={handleStartAgentChat}
                  onSelectChat={handleSelectChat}
                />
              ) : (
                <ChatListPage
                  title={activePage === 'chats' ? 'Chats' : 'Bookmarks'}
                  searchPlaceholder={activePage === 'chats' ? 'Search chats' : 'Search bookmarks'}
                  chats={activePage === 'chats' ? allRecents : bookmarkedChats}
                  showNewChat={activePage === 'chats'}
                  onNewChat={handleNewChat}
                  onSelectChat={handleSelectChat}
                  compact={!isExpanded}
                />
              )}
            </div>
          )}
          {/* Conversation column — fills the chat area. In expanded view the artifact
              is now its own top-level third column (not a nested split). Widget view
              still hides the chat when the artifact takes over full-screen. */}
          <div
            className={cn(
              "relative z-10 flex flex-col overflow-hidden min-w-0 min-h-0 w-full flex-1",
              !isExpanded && showArtifactPreview && "hidden",
              // Full-screen artifact hides the chat in expanded view too.
              isExpanded && showArtifactPreview && artifactFullExpanded && "hidden"
            )}
          >
            {/* Loading stand-in for the conversation. Replaces the messages area
                only — the sidebar, the header, and the composer below all stay
                live, so just the thread reads as loading. */}
            {bootPhase && <DockedBodySkeleton variant={bootPhase} expanded={isExpanded} />}

            {/* Scrollable chat messages area */}
            <div
              // overflow-anchor: none — without it, the browser's native scroll
              // anchoring yanks scrollTop back up whenever content above the
              // anchor node resizes (a card mounting in, a typing animation),
              // fighting scrollToBottomInstant's explicit jump to the bottom.
              style={{ overflowAnchor: "none" }}
              className={cn(
                "relative z-0 flex-1 flex flex-col overflow-y-auto hover-scroll",
                isExpanded ? "px-[28px]" : "p-[16px]",
                // Held back for the skeleton's beat — hidden rather than unmounted
                // so the scroll refs set themselves up exactly once.
                bootPhase && "hidden"
              )}
              ref={chatContainerRef}
            >
              {/* Top fade edge — pins just under the navbar so messages fade out
                  as they scroll up, for a smooth scroll-under-header effect.
                  Only reveals once the chat is actually scrolled, so the resting
                  first message keeps its padding and isn't faded from the start. */}
              {isExpanded && messages.length > 0 && (
                <div
                  className={cn(
                    "sticky top-0 z-10 h-[32px] -mb-[32px] w-full pointer-events-none bg-gradient-to-b from-[var(--color-surface-0)] to-transparent transition-opacity duration-200",
                    isChatScrolled ? "opacity-100" : "opacity-0"
                  )}
                />
              )}
              {/* Centered container for chat content - 768px width as per Figma */}
              <div className={cn(
                "flex flex-col items-center w-full min-h-full",
                isExpanded && messages.length > 0 ? "pt-[20px]" : "",
                messages.length === 0 ? "justify-center" : ""
              )}>
                <div className={cn(
                  "flex flex-col items-start space-y-[24px] w-full",
                  isExpanded ? "max-w-[768px]" : "max-w-full",
                  messages.length > 0 ? "pb-8" : "",
                  // Empty state: center the greeting/composer in the space above the
                  // discovery banner (my-auto), so it stays vertically centred while
                  // the banner sits at the bottom.
                  messages.length === 0 ? "my-auto" : ""
                )}>
                {messages.length === 0 && !isGeneratingOutput && !approvalCard && (
                  <div className="w-full flex flex-col items-center">
                    <div className={cn("w-full flex flex-col gap-[32px] items-center", isExpanded ? "max-w-[768px]" : "max-w-full")}>
                      {/* Greeting — single line ("Good afternoon, Amit"), unless
                          the host page asked a step-specific question instead. */}
                      <div className="flex flex-col gap-[6px] items-center">
                        <GreetingShimmer
                          text={emptyStateGreeting ?? `${getGreeting()}, Amit`}
                          small={Boolean(emptyStateGreeting)}
                        />
                      </div>
                      <div className="w-full flex flex-col gap-[16px] items-center">
                        <ChatInput
                          key={composerSeed.key}
                          placeholder={emptyStatePlaceholder}
                          initialValue={composerSeed.value}
                          initialDeepResearch={composerSeed.deepResearch}
                          initialAgentMenuOpen={composerSeed.agentMenu}
                          onSend={handleSendMessage}
                          isMockAgentChatActive={isMockAgentChatActive}
                          onStopMockConversation={() => stopMockConversation({ userInitiated: true })}
                          isQuestionnaireActive={false}
                          selectedContextChip={deepResearchActive ? selectedDeepResearchCategory : selectedStarterChip}
                          onClearSelectedContextChip={
                            deepResearchActive
                              ? () => setSelectedDeepResearchCategory(null)
                              : () => setSelectedStarterChip(null)
                          }
                          onInputValueChange={setLiveInputValue}
                          onDeepResearchChange={handleComposerDeepResearchChange}
                          agents={allAgents.map((a) => ({ id: a.id, name: a.name, avatarSrc: a.avatarSrc }))}
                          selectedAgentChip={composerAgent}
                          onSelectAgentChip={handleComposerAgentChip}
                          onCreateAgentFromComposer={() => setComposerCreateOpen(true)}
                        />
                        {/* Deep research: category pills first (like the default
                            starter pills). */}
                        {deepResearchActive && !selectedDeepResearchCategory && (
                          <div
                            key="deep-research-hints"
                            className="composer-hints-enter flex flex-wrap gap-[8px] items-center justify-center w-full"
                          >
                            {deepResearchPromptGroups.map((group) => {
                              const GroupIcon = deepResearchGroupIcons[group.header];
                              return (
                              <button
                                key={group.header}
                                type="button"
                                className="fig-chip fig-chip-muted flex items-center justify-center gap-[6px] px-[10px] py-[6px] rounded-[8px] whitespace-nowrap shrink-0"
                                onClick={() => setSelectedDeepResearchCategory(group.header)}
                              >
                                {GroupIcon && (
                                  <GroupIcon className="size-[14px] text-[var(--color-slate)] shrink-0" />
                                )}
                                <span
                                  className="font-normal text-[12px] leading-[16px] text-[var(--color-ink)] tracking-[0.36px]"
                                  style={{ fontFamily: "Manrope, sans-serif" }}
                                >
                                  {group.header}
                                </span>
                              </button>
                              );
                            })}
                          </div>
                        )}
                        {/* Deep research: the selected category's prompts (like the
                            default selected-chip prompt list). */}
                        {deepResearchActive && selectedDeepResearchCategory && (
                          <div key={`dr-prompts-${selectedDeepResearchCategory}`} className="composer-hints-enter w-full flex flex-col gap-[8px]">
                            <p
                              className="px-[2px] font-semibold text-[13px] leading-[18px] text-[var(--color-grey)] tracking-[0.42px]"
                              style={{ fontFamily: "Manrope, sans-serif" }}
                            >
                              {selectedDeepResearchCategory}
                            </p>
                            {(deepResearchPromptGroups.find((g) => g.header === selectedDeepResearchCategory)?.chips ?? []).map((chip) => (
                              <button
                                key={chip.label}
                                type="button"
                                className="w-full text-left p-[12px] rounded-[8px] cursor-pointer bg-card border border-[var(--color-line)] hover:bg-[var(--color-surface-0)] transition-colors"
                                onClick={() => handleSendMessage(chip.prompt)}
                              >
                                <p
                                  className="text-[13px] leading-[18px] text-[var(--color-slate)]"
                                  style={{ fontFamily: "Manrope, sans-serif" }}
                                >
                                  {chip.label}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                        {!deepResearchActive && matchedTypedTrigger && (
                          <div key={matchedTypedTrigger.trigger} className="w-full flex flex-col">
                            {matchedTypedTrigger.suggestions.map((suggestion, index) => {
                              const prefix = suggestion.slice(0, matchedTypedTrigger.trigger.length);
                              const rest = suggestion.slice(matchedTypedTrigger.trigger.length);
                              const isLast = index === matchedTypedTrigger.suggestions.length - 1;
                              return (
                                <button
                                  key={`typed-${index}`}
                                  type="button"
                                  className="suggest-drop-in group relative w-full text-left px-[12px] py-[12px] rounded-[8px] cursor-pointer hover:bg-[oklch(0_0_0_/_0.06)] transition-colors"
                                  style={{ animationDelay: `${index * 45}ms` }}
                                  onClick={() => handleSendMessage(suggestion)}
                                >
                                  {/* Full-width divider between rows; hidden on hover so the
                                      hover box reads cleanly (matches the chats list style). */}
                                  {!isLast && (
                                    <span
                                      aria-hidden
                                      className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-[var(--color-line)] group-hover:hidden"
                                    />
                                  )}
                                  <p
                                    className="text-[13px] leading-[18px]"
                                    style={{ fontFamily: "Manrope, sans-serif" }}
                                  >
                                    <span className="text-[var(--color-grey)]">{prefix}</span>
                                    <span className="text-[var(--color-ink)]">{rest}</span>
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {!deepResearchActive && !matchedTypedTrigger && !selectedStarterChip && (
                          <div
                            key="starter-hints"
                            className="composer-hints-enter flex flex-wrap gap-[8px] items-center justify-center w-full"
                          >
                            {starterChips.map((chipLabel, index) => {
                              const ChipIcon = starterChipIcons[chipLabel];
                              return (
                                <button
                                  key={index}
                                  type="button"
                                  className="fig-chip flex items-center justify-center gap-[6px] px-[10px] py-[6px] rounded-[8px] whitespace-nowrap shrink-0"
                                  onClick={() => {
                                    const action = starterChipActions[chipLabel];
                                    if (action) action();
                                    else setSelectedStarterChip(chipLabel);
                                  }}
                                >
                                  {ChipIcon && (
                                    <ChipIcon className="size-[14px] text-[var(--color-slate)] shrink-0" />
                                  )}
                                  <span
                                    className="font-normal text-[12px] leading-[16px] text-[var(--color-ink)] tracking-[0.36px]"
                                    style={{ fontFamily: "Manrope, sans-serif" }}
                                  >
                                    {chipLabel}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {!deepResearchActive && !matchedTypedTrigger && selectedStarterChip && (
                          <div key={`starter-prompts-${selectedStarterChip}`} className="composer-hints-enter w-full flex flex-col gap-[8px]">
                            <p
                              className="px-[2px] font-semibold text-[13px] leading-[18px] text-[var(--color-grey)] tracking-[0.42px]"
                              style={{ fontFamily: "Manrope, sans-serif" }}
                            >
                              {starterPromptHeaderByChip[selectedStarterChip] ?? "Suggested prompts"}
                            </p>
                            {(starterPromptsByChip[selectedStarterChip] ?? []).map((suggestion, index) => (
                              <button
                                key={`${selectedStarterChip}-${index}`}
                                type="button"
                                className="w-full text-left p-[12px] rounded-[8px] cursor-pointer bg-card border border-[var(--color-line)] hover:bg-[var(--color-surface-0)] transition-colors"
                                onClick={() => handleSendMessage(suggestion)}
                              >
                                <p
                                  className="text-[13px] leading-[18px] text-[var(--color-slate)]"
                                  style={{ fontFamily: "Manrope, sans-serif" }}
                                >
                                  {suggestion}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    id={`msg-${index}`}
                    // scroll-margin keeps the message clear of the top edge when we
                    // scrollIntoView({block:'start'}) on send. Expanded must also clear
                    // the 32px sticky top-fade; widget just needs breathing room.
                    className={cn(
                      "w-full",
                      isExpanded ? "scroll-mt-[44px]" : "scroll-mt-[16px]",
                      // Tighten the agent-turn intro. The messages share a 24px
                      // space-y, but the header → "Thought for Xs" → answer
                      // sequence reads as one unit. Overriding the space-y here
                      // (the header's mb-8 + the thought's py-2-top already add
                      // 16px; the thought's py-2-bottom + the answer's py-2-top
                      // add 16px) lands the two gaps at 16px and 24px.
                      message.isThinkingState && messages[index - 1]?.isAgentSwitch && "!mt-0",
                      messages[index - 1]?.isThinkingState && "!mt-[8px]",
                    )}
                  >
                  {message.stoppedNotice ? (
                    // User hit stop mid-generation — a quiet line stating how long
                    // the response ran, closed off by a hairline.
                    <div className="w-full animate-in fade-in duration-300">
                      <p
                        className="text-[14px] leading-[20px] text-[var(--color-grey)] pb-[16px]"
                        style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
                      >
                        You stopped after {message.stoppedNotice.seconds}s
                      </p>
                      <div className="h-px w-full bg-[var(--color-line)]" />
                    </div>
                  ) : message.isAgentSwitch ? (
                    // Per Figma (node 16530:16033): the wavy "Switched to <agent>"
                    // divider, then the avatar + name + saying header below it,
                    // stacked with a 16px gap, introducing this agent's thread.
                    <div className="flex w-full flex-col gap-[16px] mb-[8px] animate-in fade-in duration-500">
                      <AgentSwitchDivider
                        agentLabel={message.switchAgentLabel || ''}
                        avatarSrc={message.avatarSrc}
                        icon={message.avatarIcon}
                        colorClass={message.avatarBgClass}
                        settled={!!message.switchSettled}
                      />
                      <AgentThreadHeader
                        name={message.switchAgentLabel || ''}
                        avatarSrc={message.avatarSrc}
                        saying={message.switchSaying}
                        theme={message.switchOrbTheme}
                        fromName={message.switchFromLabel}
                        settled={!!message.switchSettled}
                        // Only the most recent hand-off keeps the live WebGL orb —
                        // older headers fall back to the static SVG so a single
                        // WebGL context exists at a time.
                        live={index === messages.reduce((acc, m, i) => (m.isAgentSwitch ? i : acc), -1)}
                        // Hold the header until the "Calling in agents… → Switched
                        // to" divider above has settled so the hand-off reads as a
                        // sequence rather than everything landing at once.
                        revealDelay={1700}
                      />
                    </div>
                  ) : message.deepResearchDoc ? (
                    // Finished report — full-width doc preview replacing the card.
                    <DeepResearchDoc
                      title={message.deepResearchDoc.title}
                      citations={message.deepResearchDoc.citations}
                      summaryHeading={message.deepResearchDoc.summaryHeading}
                      paragraphs={message.deepResearchDoc.paragraphs}
                      skeletonMs={message.deepResearchDoc.skeletonMs}
                      onExpand={() => openDeepResearchArtifact(message.deepResearchDoc!)}
                      showCreateSchedule
                      onCreateSchedule={() => openScheduleFromDoc(message.deepResearchDoc!)}
                      showFeedback={message.deepResearchDoc.docFeedback !== false}
                      onThumbsUp={() => setFeedbackModal('up')}
                      onThumbsDown={() => setFeedbackModal('down')}
                    />
                  ) : message.deepResearchPlan ? (
                    // Constrained width — the plan/progress card shouldn't span the
                    // full chat column.
                    <div
                      className={cn(
                        'w-full max-w-[600px]',
                        messages[index - 1]?.isThinkingState && '!mt-[8px]',
                      )}
                    >
                      <DeepResearchPlan
                        title={message.deepResearchPlan.title}
                        steps={message.deepResearchPlan.steps}
                        onEdit={() => {
                          // Switch the composer into "follow up" edit mode.
                          setDeepResearchEditTitle(message.deepResearchPlan!.title);
                        }}
                        onStart={() => setDeepResearchRunning(true)}
                        onCancel={() => setDeepResearchRunning(false)}
                        onComplete={() => {
                          // Research finished — drop the LHS running spinner and
                          // replace this plan card with the finished doc preview.
                          // Agent report flows carry their own target doc. When a
                          // result lead-in is set, a short Co-marketer line lands
                          // above the doc so the report doesn't appear cold.
                          setDeepResearchRunning(false);
                          const resultDoc = message.planResultDoc ?? DEEP_RESEARCH_DOC;
                          const coMarketer = marketingAgents.find((a) => a.id === 'co-marketer');
                          const leadIn = message.planResultLeadIn
                            ? {
                                type: 'chat' as const, isAI: true,
                                agentName: coMarketer?.name,
                                avatarSrc: coMarketer?.avatarSrc, avatarIcon: coMarketer?.icon, avatarBgClass: coMarketer?.colorClass,
                                content: message.planResultLeadIn,
                                hidePerformanceDashboard: true,
                                hideFeedback: true,
                                animate: false,
                              }
                            : null;
                          const docMsg: ChatMessageData = { type: 'chat', isAI: true, content: '', deepResearchDoc: resultDoc };
                          setMessages((prev) =>
                            prev.flatMap((m, i) =>
                              i === index ? (leadIn ? [leadIn, docMsg] : [docMsg]) : [m]
                            )
                          );
                        }}
                      />
                    </div>
                  ) : message.type === 'system' ? (
                    <SystemMessage
                      type={message.systemType || 'join'}
                      agentName={message.agentName || ''}
                      agentIcon={message.agentIcon}
                      agentColorClass={message.agentColorClass}
                    />
                  ) : (
                    <>
                    {message.replyContext && (
                      // Reply chip above a user turn (e.g. the plan an edit follows up on).
                      <div className="flex w-full justify-end mb-[6px]">
                        <span
                          className="flex items-center gap-[6px] text-[13px] leading-[18px] text-[var(--color-grey)]"
                          style={{ fontFamily: "Manrope, sans-serif" }}
                        >
                          <CornerDownRight className="h-[14px] w-[14px] shrink-0" />
                          <span className="truncate max-w-[280px]">{message.replyContext}</span>
                        </span>
                      </div>
                    )}
                    <ChatMessage
                      messageId={`msg-${index}`}
                      isExpanded={isExpanded}
                      isAI={message.isAI ?? false}
                      content={message.content}
                      insightCard={message.insightCard}
                      agentName={message.agentName}
                      avatarSrc={message.avatarSrc}
                      avatarIcon={message.avatarIcon}
                      avatarBgClass={message.avatarBgClass}
                      animate={disableAnimation ? false : message.animate}
                      animationSpeed={message.animationSpeed}
                      isLastMessage={index === messages.length - 1}
                      hideFeedback={message.hideFeedback}
                      showExecuteFlowCTA={
                        index === messages.length - 1 &&
                        mockChatCompleted &&
                        message.agentName === "Cori" &&
                        message.content.startsWith("Here's a summary of what our team has put together:") &&
                        !isMockAgentChatActive
                      }
                      onExecuteFlow={handleFlowExecutionMessage}
                      isContentAgent={message.isContentAgent}
                      isContentAgentClarification={message.isContentAgentClarification}
                      isContentAgentQuestionChoice={message.isContentAgentQuestionChoice}
                      isFlowExecutionProgress={message.isFlowExecutionProgress}
                      onFlowExecutionComplete={message.onFlowExecutionComplete}
                      isPlanMode={message.isPlanMode}
                      isSegmentAccordion={message.isSegmentAccordion}
                      isSchedulerAccordion={message.isSchedulerAccordion}
                      isSegmentAgentRationale={message.isSegmentAgentRationale}
                      isContentAgentRationale={message.isContentAgentRationale}
                      isExecutiveSummaryWithContent={message.isExecutiveSummaryWithContent}
                      showPerformanceDashboard={
                        (message.isAI ?? false) &&
                        !message.isThinkingState &&
                        !message.hidePerformanceDashboard
                      }
                      statCards={message.statCards}
                      miniChart={message.miniChart}
                      agentArtifactCard={
                        message.agentArtifactCard && artifactActionLabel
                          ? { ...message.agentArtifactCard, actionLabel: artifactActionLabel }
                          : message.agentArtifactCard
                      }
                      onAgentArtifactAction={
                        message.agentArtifactCard && onReviewArtifact
                          ? () => {
                              // Reviewing hands the user to a canvas that renders
                              // *beside* this chat, so a full-screen thread has to
                              // collapse back to the docked column first —
                              // otherwise it covers the very canvas being built.
                              // Collapsing (not remounting) keeps the thread that
                              // led here — the Insights hand-off included — intact.
                              if (isExpanded) requestExpand(false);
                              onReviewArtifact(message.agentArtifactCard!);
                            }
                          : undefined
                      }
                      appliedCohortId={appliedCohortId}
                      setupApplyCard={message.setupApplyCard}
                      setupApplyApplied={
                        message.setupApplyCard
                          ? isSetupApplyApplied?.(message.setupApplyCard) ?? false
                          : false
                      }
                      onSetupApply={
                        message.setupApplyCard
                          ? (cohortId?: string) => onSetupApply?.(message.setupApplyCard!, cohortId)
                          : undefined
                      }
                      findings={message.findings}
                      experimentCard={message.experimentCard}
                      onCreateTest={onCreateTest}
                      onUpdateTestSplit={onUpdateTestSplit}
                      onPostTestDecision={onPostTestDecision}
                      nodeInsightCard={message.nodeInsightCard}
                      onRespondNodeInsight={onRespondNodeInsight}
                      journeyProposalCard={message.journeyProposalCard}
                      audienceTestCard={message.audienceTestCard}
                      onRespondAudienceTest={onRespondAudienceTest}
                      mergeTestCta={message.mergeTestCta}
                      mergeTestCtaDone={message.mergeTestCtaDone}
                      onMergeTestJourney={
                        message.mergeTestCta
                          ? () => {
                              setMessages(prev =>
                                prev.map((m, i) => (i === index ? { ...m, mergeTestCtaDone: true } : m)),
                              );
                              onMergeTestJourney?.();
                            }
                          : undefined
                      }
                      replyOptions={message.replyOptions}
                      replyOptionsSelectedValue={message.replyOptionsSelectedValue}
                      onSelectReplyOption={
                        message.replyOptions
                          ? (value: string) => {
                              setMessages(prev =>
                                prev.map((m, i) => (i === index ? { ...m, replyOptionsSelectedValue: value } : m)),
                              );
                              handleSendMessage(value);
                            }
                          : undefined
                      }
                      questionRecap={message.questionRecap}
                      pushFlowCard={message.pushFlowCard}
                      onPushFlowEvent={handlePushFlowEvent}
                      onAskFinding={onAskFinding}
                      onThumbsUp={() => setFeedbackModal('up')}
                      onThumbsDown={() => setFeedbackModal('down')}
                      onContinueSegment={() => {
                        if (message.isSegmentAgentRationale) {
                          const idx = mockMessagesDefinitionRef.current.findIndex(msg => msg.isSegmentAgentRationale);
                          if (idx >= 0) addNextMockMessageRef.current(idx + 1);
                        } else if (message.isContentAgentRationale) {
                          const idx = mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgentRationale);
                          if (idx >= 0) addNextMockMessageRef.current(idx + 1);
                        }
                      }}
                      onRefineThis={() => {
                        if (message.isContentAgentRationale) {
                          // Find the ContentAgentClarification message and add it after the current rationale
                          const clarificationMessage = mockMessagesDefinitionRef.current.find(msg => msg.isContentAgentClarification);
                          const contentAgent = marketingAgents.find(agent => agent.id === 'content-agent');
                          if (clarificationMessage) {
                            // Add the clarification message as a new message with proper avatar
                            setMessages(prevMessages => [...prevMessages, {
                              ...clarificationMessage,
                              avatarSrc: contentAgent?.avatarSrc,
                              avatarIcon: contentAgent?.icon,
                              avatarBgClass: contentAgent?.colorClass,
                              animate: true,
                              onAnimationComplete: () => {}
                            }]);
                          }
                        }
                      }}
                      onAnswerQuestions={() => {
                        if (message.isContentAgentQuestionChoice) {
                          const idx = mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgentQuestionChoice);
                          if (idx >= 0) addNextMockMessageRef.current(idx + 1);
                        }
                      }}
                      onSkipAndGenerate={() => {
                        if (message.isContentAgentQuestionChoice) {
                          const idx = mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgentQuestionChoice);
                          // Skip to rationale message (idx + 2 to skip the clarification message)
                          if (idx >= 0) addNextMockMessageRef.current(idx + 2);
                        }
                      }}
                      onGenerateContent={() => {
                        if (message.isContentAgentClarification) {
                          setContentGenerated(true);
                          // Find the index of the clarification message in the mock messages
                          const clarificationIndex = mockMessagesDefinitionRef.current.findIndex(msg => msg.isContentAgentClarification);
                          if (clarificationIndex >= 0) {
                            // Continue the flow from the next message after clarification
                            addNextMockMessageRef.current(clarificationIndex + 1);
                          }
                        }
                      }}
                      showGenerateContentCTA={
                        index === messages.length - 1 &&
                        message.isContentAgentClarification &&
                        !contentGenerated
                      }
                      showQuestionChoiceCTAs={
                        index === messages.length - 1 &&
                        message.isContentAgentQuestionChoice &&
                        !contentGenerated
                      }
                      showApproveContentCTA={
                        index === messages.length - 1 &&
                        message.isContentAgent &&
                        !contentApproved
                      }
                      onApproveContent={handleApproveContent}
                      showApproveSegmentsCTA={
                        index === messages.length - 1 &&
                        message.agentName === 'Segment agent' &&
                        message.content.includes('<table') &&
                        !segmentsApproved
                      }
                      onApproveSegments={handleApproveSegments}
                      onUpdateContent={handleUpdateContent}
                      onDiscardChanges={handleDiscardChanges}
                      updatedContent={message.updatedContent}
                      onAnimationComplete={message.onAnimationComplete}
                      promptTemplateExists={promptTemplateExists}
                      isThinkingState={message.isThinkingState}
                      thinkingDuration={message.thinkingDuration}
                      thinkingLabel={message.thinkingLabel}
                      reasoningSteps={message.reasoningSteps}
                      artifact={message.artifact}
                      onDownloadArtifact={() => {}}
                      onPreviewArtifact={handleOpenArtifactPreview}
                    />
                    </>
                  )}
                  </div>
                ))}
                {/* Suggested follow-up prompts after the first output — tapping any starts thread 2 */}
                {showSuggestions && !isGeneratingOutput && messages.length > 0 && (
                  <div className="w-full flex flex-col items-start gap-[8px] py-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                    {(dynamicSuggestions ?? script.suggestedPrompts).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleSendMessage(p)}
                        className="group flex w-fit max-w-full items-start gap-[10px] text-left rounded-[10px] border border-[var(--color-line)] bg-card px-[12px] py-[8px] hover:bg-[var(--color-surface-0)] hover:border-[var(--color-line-strong)] transition-colors"
                      >
                        <CornerDownRight className="size-[16px] text-[var(--color-grey)] shrink-0 mt-[1px]" strokeWidth={1.75} />
                        <span className="text-[13px] leading-[18px] text-[var(--color-slate)]" style={{ fontFamily: 'Manrope, sans-serif' }}>{p}</span>
                      </button>
                    ))}
                  </div>
                )}
                {/* Loader is shown as a floating pill above the input (both views) — see below. */}
                <div ref={messagesEndRef} />
                </div>
                {/* Discovery banners — rotating "what you can do" strip, resting at
                    the bottom of the empty-state page. The greeting/composer above
                    uses my-auto to stay centred; this sits below it with a bottom
                    gap. Content lives in DiscoveryBanners.tsx. */}
                {messages.length === 0 && !isGeneratingOutput && !approvalCard && (
                  <div className="w-full flex justify-center pt-[32px] pb-[24px]">
                    <DiscoveryBanners className="w-full" onActivate={handleDiscoveryBanner} />
                  </div>
                )}
              </div>
            </div>

            {/* Vertical line-nav for jumping between conversation turns. Shown in
                expanded view regardless of whether L1 is collapsed or expanded,
                and hidden only while the artifact preview is open (no room beside
                the split-view). */}
            {isExpanded && !showArtifactPreview && navItems.length > 0 && (
              <LineNav items={navItems} containerRef={chatContainerRef} />
            )}


            {(messages.length > 0 || approvalCard) && (
              <div className={cn(
                "relative flex-shrink-0",
                // Match the messages scroll area's horizontal padding so the input
                // lines up with the conversation (28px expanded, 16px widget).
                isExpanded ? "px-[28px]" : "px-[16px] pt-[8px] pb-[16px]"
              )}>
                {/* Feedback popover / success toast — pinned to the chat's right edge,
                    on the line just above the input field (not over its face). */}
                {feedbackNudgeVisible && (
                  <div className="absolute right-[24px] bottom-full mb-[28px] z-40 flex justify-end max-w-[calc(100%-48px)]">
                    {showFeedbackToast ? (
                      <div className="feedback-nudge-in inline-flex items-center gap-[8px] rounded-full border border-[var(--color-line)] bg-card px-[14px] py-[8px] shadow-[0px_8px_20px_-6px_oklch(0.21_0.034_263.436_/_0.22)]">
                        <CheckCircle2 className="size-[16px] text-[var(--color-success)] shrink-0" />
                        <span className="text-[13px] text-[var(--color-ink)] whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                          Feedback sent successfully. Thank you
                        </span>
                      </div>
                    ) : (
                      <div className="feedback-nudge-in inline-flex items-center gap-[10px] rounded-[12px] border border-[var(--color-line)] bg-card px-[16px] py-[10px] shadow-[0px_8px_24px_-6px_oklch(0.21_0.034_263.436_/_0.22)]">
                        <span className="text-[14px] text-[var(--color-ink)] whitespace-nowrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                          Was your Cori experience helpful?
                        </span>
                        <button
                          type="button"
                          onClick={() => setFeedbackModal('up')}
                          aria-label="Helpful"
                          className="flex items-center justify-center p-[6px] rounded-md text-[var(--color-grey)] hover:bg-[color-mix(in_oklab,var(--color-success)_10%,transparent)] hover:text-success transition-colors"
                        >
                          <ThumbsUp className="size-[16px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedbackModal('down')}
                          aria-label="Not helpful"
                          className="flex items-center justify-center p-[6px] rounded-md text-[var(--color-grey)] hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <ThumbsDown className="size-[16px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFeedbackPrompt(false)}
                          aria-label="Dismiss"
                          className="flex items-center justify-center p-[6px] rounded-md text-[var(--color-grey)] hover:bg-[var(--color-surface-1)] transition-colors"
                        >
                          <X className="size-[16px]" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {/* Cori's follow-up Questions card, in line with the input field */}
                {/* A question the host needs answered first — same spot, same width
                    as the app push flow's own Questions card. */}
                {approvalCard && (
                  <div className={cn("flex w-full justify-center", isExpanded ? "pb-2" : "pb-3")}>
                    <div className={cn(isExpanded ? "w-full max-w-[768px]" : "w-full")}>{approvalCard}</div>
                  </div>
                )}
                {dockedQuestions && (
                  <div className={cn("flex w-full justify-center", isExpanded ? "pb-2" : "pb-3")}>
                    <div className={cn(isExpanded ? "w-full max-w-[768px]" : "w-full")}>
                      <PushFlowCardView key={`${dockedQuestions.stage}`} card={dockedQuestions} onEvent={handlePushFlowEvent} />
                    </div>
                  </div>
                )}
                {/* Centered container for chat input - 768px width as per Figma */}
                <div className={cn(
                  "flex items-center justify-center w-full bg-transparent outline-none",
                  isExpanded ? "pb-2 pt-0" : ""
                )}>
                  <div className={cn(
                    "relative",
                    isExpanded ? "w-full max-w-[768px]" : "w-full"
                  )}>
                    {/* Floating "still loading" pill, centered just above the input (both views) */}
                    {isGeneratingOutput && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[10px] z-20">
                        <GeneratingLoader pill labels={conversationVariant === 'campaigns' && pushFlowRef.current.active ? coriLoaderLabels ?? undefined : undefined} />
                      </div>
                    )}

                    {/* Scroll-to-latest — centered, floating 16px above the input
                        (Claude-style). Anchored to the input so the gap is exact. */}
                    {showScrollButton && !isGeneratingOutput && !feedbackNudgeVisible && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={scrollToBottom}
                              size="icon"
                              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[16px] h-9 w-9 rounded-full shadow-lg z-30 bg-card border-[1.5px] hover:bg-surface-0"
                              style={{ borderColor: 'var(--color-line-input)' }}
                              aria-label="Scroll to latest"
                            >
                              <ArrowDown className="h-4 w-4 text-slate" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                            <p>Scroll to latest</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    <ChatInput
                      onSend={handleSendMessage}
                      isMockAgentChatActive={isMockAgentChatActive}
                      shimmer={inputShimmer || isGeneratingOutput}
                      // "Edit" on a plan card → follow-up composer with a reply chip.
                      replyContext={deepResearchEditTitle}
                      onClearReplyContext={() => setDeepResearchEditTitle(null)}
                      onStopMockConversation={() => stopMockConversation({ userInitiated: true })}
                      isQuestionnaireActive={(() => {
                        const lastMessage = messages[messages.length - 1];
                        
                        // If the last message is a content agent response, input should be enabled
                        if (lastMessage?.isContentAgent) {
                          return false; // Content agent response phase - input enabled
                        }
                        
                        // Check if we're currently in the clarification phase (questionnaire form)
                        if (lastMessage?.isContentAgentClarification) {
                          return true; // Currently filling out questionnaire - input disabled
                        }
                        
                        // Check if we're in rationale phase (creative proposal)
                        if (lastMessage?.isContentAgentRationale) {
                          // Rationale phase is a response phase, not an input phase
                          // User should be able to type messages during creative proposals
                          return false; // Input enabled during rationale phase
                        }
                        
                        // All other cases - input enabled
                        return false;
                      })()}
                      selectedContextChip={null}
                      placeholder={deepResearchEditTitle ? "Follow up with questions or adjustments" : "Write a message"}
                      agents={allAgents.map((a) => ({ id: a.id, name: a.name, avatarSrc: a.avatarSrc }))}
                      selectedAgentChip={composerAgent}
                      onSelectAgentChip={handleComposerAgentChip}
                      onDeepResearchChange={handleComposerDeepResearchChange}
                      onCreateAgentFromComposer={() => setComposerCreateOpen(true)}
                    />
                    {/* Footer disclaimer — active chat only (hidden on empty-state carousel). */}
                    {!isExpanded && (
                      <div className="flex flex-col items-center gap-1 mt-2">
                        <p
                          className="text-[12px] text-[var(--color-grey)] text-center"
                          style={{ fontFamily: "Manrope, sans-serif", fontWeight: 400 }}
                        >
                          Cori can make mistakes. Please double check responses
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Persistent card footer — active chat only (hidden on empty-state carousel). */}
            {isExpanded && messages.length > 0 && (
              <div className="flex flex-col items-center justify-center gap-1 py-[8px] w-full shrink-0">
                <p
                  className="text-[12px] text-[var(--color-grey)] text-center w-full max-w-[768px] px-[28px]"
                  style={{ fontFamily: "Manrope, sans-serif", fontWeight: 400 }}
                >
                  Cori can make mistakes. Please double check responses
                </p>
              </div>
            )}
          </div>
          {/* Artifact — WIDGET view only: full-bleed take-over of the floating window.
              (Expanded view renders the artifact as a top-level third column below.) */}
          {/* COMMENTED OUT (kept for later): widget-view artifact take-over. */}
          {false && !isExpanded && showArtifactPreview && (
            <div className="relative z-10 shrink-0 h-full w-full">
              <ArtifactPreview
                onClose={handleCloseArtifactPreview}
                bare
              />
            </div>
          )}
          </div>
          </ChatCardBeam>
          </div>
          </div>
          {/* Artifact — EXPANDED view: opens as a top-level third column,
              so the layout reads LHS | chat | artifact (Claude-style).
              Drag the left handle to resize; releases snap to 42 / 50 / 60%. */}
          {isExpanded && showArtifactPreview && (
            <div
              className={cn(
                // Not shrink-0: when the LHS expands and space tightens, the artifact
                // shrinks (down to its min) so the chat keeps its minimum width.
                // ml-auto pins the panel to the right edge: once the chat column is
                // hidden, the artifact stays right-anchored and its width grows toward
                // the LEFT (no snap-to-left flicker, no rightward growth).
                "relative z-10 ml-auto h-full bg-card",
                // The left border is a column divider: at full width there is no
                // chat column beside it, so it reads as a stray line down the page.
                artifactFullExpanded
                  ? "min-w-0"
                  : "min-w-[360px] border-l border-[var(--color-line)]",
                artifactClosing
                  ? "opacity-0 transition-all duration-300 ease-in-out"
                  : "animate-in slide-in-from-right-8 fade-in duration-300",
                // Smoothly grow/shrink the panel width when toggling expand (leftward)
                // or when the LHS reflows — but not mid-drag, where width tracks the cursor.
                !artifactResizing && !artifactClosing && "transition-[width] duration-300 ease-in-out"
              )}
              style={{ width: artifactClosing ? 0 : artifactFullExpanded ? '100%' : `${artifactWidth}%` }}
            >
              {/* Drag handle straddling the divider — hidden while full screen */}
              {!artifactFullExpanded && (
                <div
                  onMouseDown={startArtifactResize}
                  className="group/resize absolute left-0 top-0 z-20 h-full w-[10px] -ml-[5px] flex items-center justify-center cursor-col-resize"
                  aria-label="Resize artifact"
                  role="separator"
                >
                  <div className={cn(
                    "h-[36px] w-[3px] rounded-full bg-[var(--color-line-strong)] transition-opacity",
                    artifactResizing ? "opacity-100" : "opacity-0 group-hover/resize:opacity-100"
                  )} />
                </div>
              )}
              <ArtifactPreview
                onClose={handleCloseArtifactPreview}
                onToggleExpand={() => setArtifactFullExpanded((v) => !v)}
                isExpanded={artifactFullExpanded}
                hideExpandToggle={artifactFromReports}
                bare
                doc={activeArtifact?.kind === 'deepResearch' ? activeArtifact.doc : undefined}
                onSchedule={
                  activeArtifact?.kind === 'deepResearch'
                    ? () => openScheduleFromDoc(activeArtifact.doc)
                    : undefined
                }
              />
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Transparent overlay during artifact resize — captures the pointer so
          nothing underneath (charts, iframes) interferes with the drag. */}
      {artifactResizing && <div className="fixed inset-0 z-[200] cursor-col-resize" />}
    </>
  );
};

export default ChatInterface;

// Greeting shimmer plays its gradient sweep only ONCE per browser session.
// After the first sweep (or on any later mount in the same session) it renders
// as plain static text so it doesn't re-shimmer every time you hit the empty state.
const GREETING_SHIMMER_KEY = 'greeting-shimmer-played';

function GreetingShimmer({ text, small = false }: { text: string; small?: boolean }) {
  const [play, setPlay] = useState(() => {
    try { return sessionStorage.getItem(GREETING_SHIMMER_KEY) !== '1'; } catch { return true; }
  });

  useEffect(() => {
    if (!play) return;
    // Let one sweep run (~2s), then lock it static for the rest of the session.
    const t = setTimeout(() => {
      try { sessionStorage.setItem(GREETING_SHIMMER_KEY, '1'); } catch { /* ignore */ }
      setPlay(false);
    }, 2600);
    return () => clearTimeout(t);
  }, [play]);

  // A step-specific question reads longer than "Good afternoon, Amit" — sized
  // down so it still lands on one line at the docked panel's width.
  const cls = small
    ? 'font-semibold text-[18px] leading-[24px] text-center tracking-[0.3px] whitespace-nowrap'
    : 'font-semibold text-[24px] leading-[30px] text-center tracking-[0.42px] whitespace-nowrap';
  const fontStyle: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' };

  if (!play) {
    return <p className={cls} style={{ ...fontStyle, color: 'var(--color-slate)' }}>{text}</p>;
  }

  return (
    <GradientShimmer
      as="p"
      className={cls}
      style={fontStyle}
      baseColor="var(--color-slate)"
      gradient={[
        { position: 0.2, color: 'var(--color-royal)' },  /* shimmer-blue */
        { position: 0.4, color: 'var(--color-pink)' },  /* shimmer-pink */
        { position: 0.6, color: 'var(--color-orange)' },  /* shimmer-orange */
        { position: 0.8, color: 'var(--color-steel)' },  /* shimmer-teal */
      ]}
      duration={2}
      pauseBetween={99999}
    >
      {text}
    </GradientShimmer>
  );
}

type ChatCardBeamProps = {
  enabled: boolean;
  active: boolean;
  children: React.ReactNode;
};

/** border-beam md — rotating inner edge shimmer (not pulse-inner breathe). */
function ChatCardBeam({ enabled, active, children }: ChatCardBeamProps) {
  const beamRef = useRef<HTMLDivElement>(null);
  const [beamId, setBeamId] = useState<string | null>(null);

  // Read the generated beam id once; the wrapper is always rendered so that
  // toggling `enabled` (widget ⇄ full screen) never changes the element type
  // above the conversation — otherwise React remounts every message and the
  // typing animations replay. We only inject the beam CSS / activate when enabled.
  useLayoutEffect(() => {
    const id = beamRef.current?.getAttribute('data-beam') ?? null;
    if (id) setBeamId(id);
  }, []);

  return (
    <>
      {enabled && beamId ? <style>{welcomeCardBeamStyleBlock(beamId)}</style> : null}
      <BorderBeam
        ref={beamRef}
        size="md"
        theme="light"
        colorVariant="colorful"
        staticColors={true}
        borderRadius={0}
        strength={0.72}
        brightness={1.55}
        saturation={1.85}
        duration={3.2}
        active={enabled && active}
        className="welcome-card-beam flex flex-1 min-h-0 min-w-0"
      >
        {children}
      </BorderBeam>
    </>
  );
}
