import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { User, ThumbsUp, ThumbsDown, Copy, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { playCopyCue } from '@/lib/playCue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DocArtifactCard, { DocArtifact } from './DocArtifactCard';
import AgentArtifactCard from './AgentArtifactCard';
import type { AgentArtifactCardData } from '@/data/conversations';
import SetupApplyCard, { type SetupApplyCardData } from '@/components/campaigns/campaign-creation/SetupApplyCard';
import { FindingsReviewList } from '@/components/campaigns/campaign-creation/FindingCard';
import type { Finding } from '@/components/campaigns/campaign-creation/previewFindings.data';
import ExperimentCard, { type ExperimentCardData, type TestBranchConfig } from '@/components/ExperimentCard';
import NodeOptimizationInsightCard, { type NodeInsightCardData, type NodeInsightResponse } from '@/components/NodeOptimizationInsightCard';
import JourneyOptimizationProposalCard, { type JourneyProposalCardData } from '@/components/JourneyOptimizationProposalCard';
import PushFlowCardView from '@/components/PushFlowCards';
import type { PushFlowCard, PushFlowEvent } from '@/data/pushCartFlow';
import AudienceTestQuestionCard, { type AudienceTestCardData } from '@/components/AudienceTestQuestionCard';
import type { InsightCardContext } from '@/types/insightCard';
import type { QuestionRecapEntry } from '@/components/campaigns/CoMarketerQuestionCard';
import { ContentAgentResponse } from './ContentAgentResponse';
import { ContentAgentClarification } from './ContentAgentClarification';
import { ContentAgentQuestionChoice } from './ContentAgentQuestionChoice';
import { FlowExecutionProgress } from './FlowExecutionProgress';
import { ContentAgentSegmentAccordions } from './ContentAgentSegmentAccordions';
import { SchedulerAgentCampaignAccordions } from './SchedulerAgentCampaignAccordions';
import { SegmentAgentRationale } from './SegmentAgentRationale';
import { ContentAgentRationale } from './ContentAgentRationale';
import { ExecutiveSummaryContentAccordion } from './ExecutiveSummaryContentAccordion';
import {
  MetricCards,
  MetricCardsSkeleton,
  PublishedVsDeliveredChart,
  RatesChart,
  ChartSkeleton,
} from './CampaignPerformanceDashboard';
import { ThinkingState } from './ThinkingState';

// Loading indicator component with Cursor-style processing dots
const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-center py-2">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
            style={{
              animation: 'cursorDots 1.4s infinite ease-in-out',
              animationDelay: `${i * 0.16}s`,
              animationFillMode: 'both'
            }}
          />
        ))}
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes cursorDots {
            0%, 80%, 100% {
              transform: scale(0.6);
              opacity: 0.4;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `
      }} />
    </div>
  );
};

// Simple inline thinking loader for tables (no avatar/section)
const SimpleThinkingLoader: React.FC = () => {
  console.log("🎨 SIMPLE THINKING LOADER FOR TABLE CONTENT");
  
  return (
    <div className="flex items-center gap-2 py-1 px-2 w-fit">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1 h-1 bg-muted-foreground rounded-full"
            style={{
              animation: 'simpleDots 1.4s infinite ease-in-out',
              animationDelay: `${i * 0.16}s`,
              animationFillMode: 'both'
            }}
          />
        ))}
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes simpleDots {
            0%, 80%, 100% {
              transform: scale(0.6);
              opacity: 0.4;
            }
            40% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `
      }} />
    </div>
  );
};

// Segment Agent Thinking indicator with animated infinity icon (for rationale content)
const SegmentAgentThinking: React.FC = () => {
  console.log("🎨🎨🎨 SEGMENT AGENT THINKING COMPONENT IS RENDERING! 🎨🎨🎨");
  console.log("This will appear BEFORE the 'To keep messaging razor-focused...' content");
  
  // Auto-scroll when component mounts
  React.useEffect(() => {
    console.log("🎨 SegmentAgentThinking component mounted - scrolling to keep content visible");
    // Dispatch scroll event to parent container instead of window scrolling
    window.dispatchEvent(new CustomEvent('chatScrollToBottom'));
    
    // Extra prominent logging
    console.log("🚨🚨🚨 THINKING ANIMATION SHOULD BE VISIBLE NOW! 🚨🚨🚨");
  }, []);
  
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-card rounded-lg border border-line shadow-sm w-fit h-8">
      <div className="text-xs text-muted-foreground font-['Manrope'] font-medium">
        Segment Agent thinking
      </div>
      <div className="flex items-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="12" 
          height="12" 
          fill="currentColor" 
          viewBox="0 0 256 256"
          className="text-muted-foreground"
          style={{
            animation: 'infinityRotate 1.5s ease-in-out infinite'
          }}
        >
          <path d="M248,128a56,56,0,0,1-95.6,39.6l-.33-.35L92.12,99.55a40,40,0,1,0,0,56.9l8.52-9.62a8,8,0,1,1,12,10.61l-8.69,9.81-.33.35a56,56,0,1,1,0-79.2l.33.35,59.95,67.7a40,40,0,1,0,0-56.9l-8.52,9.62a8,8,0,1,1-12-10.61l8.69-9.81.33-.35A56,56,0,0,1,248,128Z"></path>
        </svg>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes infinityRotate {
            0% {
              transform: rotate(0deg) scale(1);
              opacity: 0.7;
            }
            50% {
              transform: rotate(180deg) scale(1);
              opacity: 1;
            }
            100% {
              transform: rotate(360deg) scale(1);
              opacity: 0.7;
            }
          }
        `
      }} />
    </div>
  );
};

// Enhanced tokenization for ChatGPT-style table streaming
const tokenizeText = (text: string): string[] => {
  if (!text) return [];

  // Check if content contains a table - use different tokenization strategy
  if (text.includes('<table')) {
    return tokenizeTableContent(text);
  }

  // Regular content tokenization (existing logic for non-table content)
  const tokens: string[] = [];
  let currentToken = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '\n') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push('\n');
      continue;
    }
    
    if (char === ' ') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(' ');
      continue;
    }
    
    if (/[.!?,:;]/.test(char)) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(char);
      continue;
    }
    
    if (char === '<') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      let tagEnd = i;
      while (tagEnd < text.length && text[tagEnd] !== '>') {
        tagEnd++;
      }
      if (tagEnd < text.length) {
        tokens.push(text.substring(i, tagEnd + 1));
        i = tagEnd;
        continue;
      }
    }
    
    currentToken += char;
  }
  
  if (currentToken) {
    tokens.push(currentToken);
  }
  
  return tokens.filter(token => token.length > 0);
};

// Basic tokenization helper to avoid recursion
const basicTokenize = (text: string): string[] => {
  const tokens: string[] = [];
  let currentToken = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '\n') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push('\n');
      continue;
    }
    
    if (char === ' ') {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(' ');
      continue;
    }
    
    if (/[.!?,:;]/.test(char)) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = '';
      }
      tokens.push(char);
      continue;
    }
    
    currentToken += char;
  }
  
  if (currentToken) {
    tokens.push(currentToken);
  }
  
  return tokens.filter(token => token.length > 0);
};

// NEW: Table-specific tokenization for ChatGPT-style row-by-row streaming
const tokenizeTableContent = (text: string): string[] => {
  const tokens: string[] = [];
  
  // Split content: before table, table, after table
  const tableRegex = /(.*?)(<table[\s\S]*?<\/table>)(.*)/;
  const match = text.match(tableRegex);
  
  if (!match) {
    // Fallback to regular tokenization (non-table content)
    const tokens: string[] = [];
    let currentToken = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '\n') {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
        tokens.push('\n');
        continue;
      }
      
      if (char === ' ') {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
        tokens.push(' ');
        continue;
      }
      
      if (/[.!?,:;]/.test(char)) {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
        tokens.push(char);
        continue;
      }
      
      currentToken += char;
    }
    
    if (currentToken) {
      tokens.push(currentToken);
    }
    
    return tokens.filter(token => token.length > 0);
  }
  
  const [, beforeTable, tableContent, afterTable] = match;
  
  // Add content before table (if any) - use basic tokenization to avoid recursion
  if (beforeTable.trim()) {
    const beforeTokens = basicTokenize(beforeTable);
    tokens.push(...beforeTokens);
  }
  
  // Parse table into row-by-row tokens
  const tableTokens = parseTableForStreaming(tableContent);
  tokens.push(...tableTokens);
  
  // Add content after table (if any) - use basic tokenization to avoid recursion
  if (afterTable.trim()) {
    const afterTokens = basicTokenize(afterTable);
    tokens.push(...afterTokens);
  }
  
  return tokens;
};

// Parse table into streamable row chunks for ChatGPT-like experience
const parseTableForStreaming = (tableHtml: string): string[] => {
  const tokens: string[] = [];
  
  // Extract table structure components
  const tableOpenMatch = tableHtml.match(/^<table[^>]*>/);
  const theadMatch = tableHtml.match(/<thead[\s\S]*?<\/thead>/);
  const tbodyOpenMatch = tableHtml.match(/<tbody[^>]*>/);
  const tbodyCloseMatch = tableHtml.match(/<\/tbody>/);
  const tableCloseMatch = tableHtml.match(/<\/table>$/);
  
  // Start with table opening
  if (tableOpenMatch) {
    tokens.push(tableOpenMatch[0]);
  }
  
  // Add table header as one chunk (appears first, faster)
  if (theadMatch) {
    tokens.push('TABLE_SECTION_BREAK'); // Special marker for longer pause
    tokens.push(theadMatch[0]);
  }
  
  // Add tbody opening
  if (tbodyOpenMatch) {
    tokens.push('TABLE_SECTION_BREAK'); // Pause between header and body
    tokens.push(tbodyOpenMatch[0]);
  }
  
  // Extract and add individual body rows
  const bodyContent = tableHtml.match(/<tbody[\s\S]*?<\/tbody>/);
  if (bodyContent) {
    const rowMatches = bodyContent[0].match(/<tr[\s\S]*?<\/tr>/g);
    if (rowMatches) {
      rowMatches.forEach((row, index) => {
        if (index > 0) {
          tokens.push('TABLE_ROW_BREAK'); // Small pause between rows
        }
        tokens.push(row);
      });
    }
  }
  
  // Add closing tags
  if (tbodyCloseMatch) {
    tokens.push(tbodyCloseMatch[0]);
  }
  if (tableCloseMatch) {
    tokens.push(tableCloseMatch[0]);
  }
  
  return tokens;
};

interface ChatMessageProps {
  isAI: boolean;
  content: string;
  agentName?: string;
  avatarSrc?: string; // SVG avatar source
  avatarIcon?: React.ElementType;
  avatarBgClass?: string;
  animate?: boolean;
  animationSpeed?: number;
  onAnimationComplete?: () => void;
  messageId?: string;
  isLastMessage?: boolean;
  /** Hide the copy/thumbs feedback row (e.g. a lead-in line above a doc). */
  hideFeedback?: boolean;
  showExecuteFlowCTA?: boolean;
  onExecuteFlow?: () => void;
  isContentAgent?: boolean;
  isContentAgentClarification?: boolean;
  isContentAgentQuestionChoice?: boolean;
  onAnswerQuestions?: () => void;
  onSkipAndGenerate?: () => void;
  showQuestionChoiceCTAs?: boolean;
  onGenerateContent?: () => void;
  showGenerateContentCTA?: boolean;
  showApproveContentCTA?: boolean;
  onApproveContent?: () => void;
  showApproveSegmentsCTA?: boolean;
  onApproveSegments?: () => void;
  isFlowExecutionProgress?: boolean;
  onFlowExecutionComplete?: () => void;
  isPlanMode?: boolean;
  isSegmentAccordion?: boolean;
  isSchedulerAccordion?: boolean;
  isSegmentAgentRationale?: boolean;
  isContentAgentRationale?: boolean;
  isExecutiveSummaryWithContent?: boolean;
  onContinueSegment?: () => void;
  onRefineThis?: () => void;
  onUpdateContent?: (updatedContent: any) => void; // New prop for update action
  onDiscardChanges?: () => void; // New prop for discard action
  updatedContent?: any; // New prop to pass updated content
  promptTemplateExists?: boolean; // New prop for prompt template existence toggle
  // Thinking state specific
  isThinkingState?: boolean;
  thinkingDuration?: number;
  /** See ThinkingState's own doc — replaces "Thinking..." for a
   *  longer-running action. */
  thinkingLabel?: string;
  reasoningSteps?: string[];
  // Doc-like artifact
  artifact?: DocArtifact;
  onDownloadArtifact?: () => void;
  onPreviewArtifact?: () => void;
  // Inline campaign performance dashboard (cards + charts)
  showPerformanceDashboard?: boolean;
  // Lightweight per-message graphics (used by follow-up answers for visual parity)
  statCards?: { label: string; value: string; sub?: string }[];
  miniChart?: 'delivery' | 'rates';
  // Agent-handed artifact card (segment / journey), revealed after streaming
  agentArtifactCard?: AgentArtifactCardData;
  onAgentArtifactAction?: () => void;
  setupApplyCard?: SetupApplyCardData;
  setupApplyApplied?: boolean;
  /** Which cut is already plotted, when the card carries audience cohorts. */
  appliedCohortId?: string;
  onSetupApply?: (cohortId?: string) => void;
  /** Co-marketer audit findings — the same cards the preview screen's review
   *  rail shows, dropped into this message instead. */
  findings?: Finding[];
  onAskFinding?: (finding: Finding) => void;
  /** Journey Optimization Agent's own proposal/results card — the
   *  conversational Q&A + experiment summary/results, shown once a node
   *  insight has been "explored" (see nodeInsightCard below) or the
   *  bottom-bar "Optimize journey" pill ran a whole-journey scan. */
  experimentCard?: ExperimentCardData;
  /** Called with the winning run's new wait time (hours) when "Create
   *  version and apply" is tapped on the experiment card — creates a real
   *  Journey Version from the change and makes it live. Omitted outside the
   *  journey builder (e.g. the campaign co-marketer), where the card has
   *  nothing to apply to. */
  onCreateTest?: (config: TestBranchConfig, anchorStepId?: string) => void;
  onUpdateTestSplit?: (variantPercent: number) => void;
  onPostTestDecision?: (decision: "make-main" | "keep-existing" | "test-another") => void;
  /** The Journey Optimization Agent's node-level finding — shown first when
   *  a marketer asks about one specific node, before any experiment setup. */
  nodeInsightCard?: NodeInsightCardData;
  /** Called when "Explore this optimization" is tapped on the insight card —
   *  hands off into the conversational experiment flow for that same node. */
  onRespondNodeInsight?: (response: NodeInsightResponse, data: NodeInsightCardData, recap: QuestionRecapEntry[]) => void;
  /** The goal-first conversation's canvas-preview card — see
   *  JourneyOptimizationProposalCard's own doc. Its question is answered by
   *  typing (see JourneyBuilder's handleCoMarketerBeforeSend), not a button
   *  on the card itself. */
  journeyProposalCard?: JourneyProposalCardData;
  /** The goal-first conversation's audience-percentage question. */
  audienceTestCard?: AudienceTestCardData;
  onRespondAudienceTest?: (percent: number) => void;
  /** "Yes, merge as main journey" — a standalone prominent CTA rather than a
   *  CoMarketerQuestionCard (there's only one action, not a set of options).
   *  `mergeTestCtaDone` freezes it into its answered state. */
  mergeTestCta?: boolean;
  mergeTestCtaDone?: boolean;
  onMergeTestJourney?: () => void;
  /** One button per answer to this message's question — see
   *  ChatMessageData's own doc (ChatInterface.tsx). */
  replyOptions?: { label: string; value: string }[];
  replyOptionsSelectedValue?: string;
  onSelectReplyOption?: (value: string) => void;
  // Feedback actions — open the matching feedback modal
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  // Layout: widget (minimized) view is narrow, so the user bubble gets more width.
  isExpanded?: boolean;
  insightCard?: InsightCardContext;
  questionRecap?: QuestionRecapEntry[];
  /** Zeno's App Push cart flow — a Questions / draft / brief card under the text. */
  pushFlowCard?: PushFlowCard;
  onPushFlowEvent?: (event: PushFlowEvent) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  isAI,
  content,
  agentName,
  avatarSrc,
  avatarIcon: AvatarIconComponent,
  avatarBgClass,
  animate = true,
  animationSpeed = 50, // Base speed for token streaming (not used for regular tokens)
  onAnimationComplete,
  messageId,
  isExpanded = true,
  isLastMessage,
  hideFeedback = false,
  showExecuteFlowCTA,
  onExecuteFlow,
  isContentAgent = false,
  isContentAgentClarification = false,
  isContentAgentQuestionChoice = false,
  onAnswerQuestions,
  onSkipAndGenerate,
  showQuestionChoiceCTAs,
  onGenerateContent,
  showGenerateContentCTA,
  showApproveContentCTA,
  onApproveContent,
  showApproveSegmentsCTA,
  onApproveSegments,
  isFlowExecutionProgress = false,
  onFlowExecutionComplete,
  isPlanMode = false,
  isSegmentAccordion = false,
  isSchedulerAccordion = false,
  isSegmentAgentRationale = false,
  isContentAgentRationale = false,
  isExecutiveSummaryWithContent = false,
  onContinueSegment,
  onRefineThis,
  onUpdateContent,
  onDiscardChanges,
  updatedContent,
  promptTemplateExists = true,
  isThinkingState = false,
  thinkingDuration = 3,
  thinkingLabel,
  reasoningSteps,
  artifact,
  onDownloadArtifact,
  onPreviewArtifact,
  showPerformanceDashboard = false,
  statCards,
  miniChart,
  agentArtifactCard,
  onAgentArtifactAction,
  setupApplyCard,
  setupApplyApplied,
  onSetupApply,
  appliedCohortId,
  findings,
  onAskFinding,
  experimentCard,
  onCreateTest,
  onUpdateTestSplit,
  onPostTestDecision,
  nodeInsightCard,
  onRespondNodeInsight,
  journeyProposalCard,
  audienceTestCard,
  onRespondAudienceTest,
  mergeTestCta,
  mergeTestCtaDone,
  onMergeTestJourney,
  replyOptions,
  replyOptionsSelectedValue,
  onSelectReplyOption,
  onThumbsUp,
  onThumbsDown,
  insightCard,
  questionRecap,
  pushFlowCard,
  onPushFlowEvent,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimationDone, setIsAnimationDone] = useState(false);
  // Inline dashboard: cards reveal during streaming; charts after stream completes
  const [dashboardCardsReady, setDashboardCardsReady] = useState(false);
  const [dashboardChartsReady, setDashboardChartsReady] = useState(false);
  const [isFlowExecuting, setIsFlowExecuting] = useState(false);
  const [isContentApproving, setIsContentApproving] = useState(false);
  const [isSegmentsApproving, setIsSegmentsApproving] = useState(false);
  const [isContentGenerating, setIsContentGenerating] = useState(false);
  const [isAnsweringQuestions, setIsAnsweringQuestions] = useState(false);
  const [isSkippingToGenerate, setIsSkippingToGenerate] = useState(false);
  const animationTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dynamicAvatarSrc, setDynamicAvatarSrc] = useState<string | null>("/avatarGIF.gif");
  
  // Enhanced animation states for instant "pop" token streaming
  const [isLoading, setIsLoading] = useState(false);
  // chanhdai-style copy button: swap Copy → Check on click, revert after a beat.
  const [copied, setCopied] = useState(false);
  const [copyTipOpen, setCopyTipOpen] = useState(false); // controls the "Copied" nudge
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [textOpacity, setTextOpacity] = useState(0);
  const [textBlur, setTextBlur] = useState(1.5);
  
  // Segment Agent thinking state
  const [isSegmentAgentThinking, setIsSegmentAgentThinking] = useState(false);
  
  // State for content changes
  const [hasContentChanges, setHasContentChanges] = useState(false);
  const [isUpdatingContent, setIsUpdatingContent] = useState(false);
  const contentUpdateHandlersRef = useRef<{
    handleUpdate: () => void;
    handleDiscard: () => void;
  } | null>(null);

  // Initialize the update handlers ref
  useEffect(() => {
    if (!contentUpdateHandlersRef.current) {
      contentUpdateHandlersRef.current = {
        handleUpdate: () => {},
        handleDiscard: () => {}
      };
    }
  }, []);

  useEffect(() => {
    console.log("🚀 ChatMessage useEffect triggered:", { 
      agentName, 
      isAI, 
      animate, 
      content: content?.substring(0, 100) + "...",
      isSegmentAccordion,
      hasTable: content?.includes('<table'),
      isThinkingState
    });
    
    // Skip all animation logic for thinking state messages
    if (isThinkingState) {
      return;
    }
    
    setIsAnimationDone(false);
    setIsLoading(false);
    setIsTextVisible(false);
    setTextOpacity(0);
    setTextBlur(1.5);
    setIsSegmentAgentThinking(false);
    
    if (animationTimeoutIdRef.current) {
      clearTimeout(animationTimeoutIdRef.current);
      animationTimeoutIdRef.current = null;
    }

    // ===================================================================
    // ENHANCED ANIMATION CONTROL LOGIC
    // ===================================================================
    // We skip the typing animation under four conditions:
    // 1. For user messages (!isAI)
    // 2. When animate prop is explicitly set to false
    // 3. For messages containing HTML tables (to avoid slow character-by-character
    //    rendering of large HTML structures like tables which takes too long and
    //    provides poor UX)
    // 4. For segment accordion messages (since they render as components, not text)
    //
    // If adding more animation exceptions, add them here rather than creating
    // new props or flags in message definitions.
    // ===================================================================
    // Special handling: Allow Segment agent messages to proceed to animation even if they contain tables
    const isSegmentAgent = agentName === "Segment agent" || isSegmentAgentRationale;
    const hasTable = content && content.includes('<table');
    const skipAnimation = !isAI || !animate || (hasTable && !isSegmentAgent) || isSegmentAccordion;
    
    console.log("🔍 Animation Check:", { 
      agentName, 
      isSegmentAgent, 
      isSegmentAgentRationale,
      isAI, 
      animate, 
      hasTable, 
      isSegmentAccordion, 
      skipAnimation 
    });
    
    if (skipAnimation) {
      console.log("❌ SKIPPING animation for:", agentName);
      // For segment accordions, don't set displayedText since we render a component
      if (isSegmentAccordion) {
        setDisplayedText('');
      } else {
        setDisplayedText(content || '');
      }
      setIsAnimationDone(true);
      setIsTextVisible(true);
      setTextOpacity(1);
      setTextBlur(0);
      onAnimationComplete?.();
      return;
    }

    if (!content) {
        setDisplayedText('');
        setIsAnimationDone(true);
        setIsTextVisible(true);
        setTextOpacity(1);
        setTextBlur(0);
        onAnimationComplete?.();
        return;
    }

    // Tokenize content for natural streaming
    const tokens = tokenizeText(content);
    setDisplayedText('');

    if (tokens.length === 0) {
        onAnimationComplete?.();
        return;
    }

    // Use the already declared isSegmentAgent variable
    console.log("✅ PROCEEDING with animation for:", agentName, "isSegmentAgent:", isSegmentAgent, "isSegmentAgentRationale:", isSegmentAgentRationale);
    console.log("ChatMessage Debug:", { agentName, isSegmentAgent, isSegmentAgentRationale, content: content.substring(0, 50) + "..." });

    if (isSegmentAgent) {
      // Phase 1: Show Segment Agent Thinking (2000ms) - thinking period
      const hasTable = content && content.includes('<table');
      console.log("🤔 Starting Segment Agent Thinking animation...", 
        isSegmentAgentRationale ? "(for Rationale component)" : hasTable ? "(for Table content)" : "(for regular content)");
      console.log("Content type check:", { hasTable, isSegmentAgentRationale, contentLength: content?.length });
      
      // Clear any existing text content and states
      setDisplayedText('');
      setIsTextVisible(false);
      setIsLoading(false);
      setTextOpacity(0);
      
      // Immediate scroll to keep content visible
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('chatScrollToBottom'));
      }, 100);
      
      // Show Cursor-style processing dots (400ms) - brief loading
      setIsLoading(true);
      
      animationTimeoutIdRef.current = setTimeout(() => {
        console.log("✅ Loading complete, showing content...");
        setIsLoading(false);
        setIsTextVisible(true);
        
        // Start blur/fade-in effect (60ms) - ultra-fast for instant "pop" streaming
        let fadeProgress = 0;
        const fadeInterval = setInterval(() => {
          fadeProgress += 0.33; // 3 steps over 60ms for instant animation
          if (fadeProgress >= 1) {
            fadeProgress = 1;
            clearInterval(fadeInterval);
          }
          
          // Quick ease-in-out curve for instant appearance
          const easedProgress = 0.5 * (1 - Math.cos(fadeProgress * Math.PI));
          setTextOpacity(easedProgress);
          setTextBlur(1.5 * (1 - easedProgress)); // Minimal blur for instant effect
        }, 20);

        // Start instant token streaming immediately
        setTimeout(() => {
          let displayedTokens = '';
          
          const streamToken = (tokenIndex: number) => {
            const currentToken = tokens[tokenIndex];
            
            // Detect special table tokens for enhanced delays FIRST
            const isTableSectionBreak = currentToken === 'TABLE_SECTION_BREAK';
            const isTableRowBreak = currentToken === 'TABLE_ROW_BREAK';
            
            // Skip timing marker tokens - they are only for delays, not display
            if (isTableSectionBreak) {
              // Skip rendering section breaks, just add delay
              const baseDelay = 200 + Math.random() * 100; // 200-300ms pause between table sections
              setTimeout(() => {
                streamToken(tokenIndex + 1);
              }, baseDelay);
              return; // Skip to next token without displaying
            } else if (isTableRowBreak) {
              // Skip rendering row breaks, just add delay  
              const baseDelay = 50 + Math.random() * 50; // 50-100ms pause between table rows
              setTimeout(() => {
                streamToken(tokenIndex + 1);
              }, baseDelay);
              return; // Skip to next token without displaying
            }
            
            // Add entire token instantly - NO character-by-character animation
            // Each token (word, punctuation, space) appears as a complete chunk
            displayedTokens += currentToken;
            setDisplayedText(displayedTokens);

              // Enhanced auto-scroll: scroll to keep new content visible as it streams
              if (currentToken.includes('\n') || tokenIndex % 3 === 0) {
                setTimeout(() => {
                  // Dispatch scroll event to parent container
                  window.dispatchEvent(new CustomEvent('chatScrollToBottom'));
                }, 50);
              }

              if (tokenIndex < tokens.length - 1) {
                // ChatGPT-style pause detection based on token types
                const isParagraphBreak = currentToken === '\n';
                const isPunctuation = /^[.!?]$/.test(currentToken);
                const isMinorPunctuation = /^[,:;]$/.test(currentToken);
                
                // Generate human-like randomness (5-15ms for natural feel)
                const randomDelay = 5 + Math.random() * 10;
                
                // Set delays for ChatGPT-style streaming with table support
                let baseDelay;
                if (isParagraphBreak) {
                  // Paragraph breaks (\n) get longer pauses (200-300ms)
                  baseDelay = 200 + Math.random() * 100;
                } else if (isPunctuation) {
                  // Sentence-ending punctuation (.!?) gets slight extra pause
                  baseDelay = 25 + randomDelay;
                } else if (isMinorPunctuation) {
                  // Minor punctuation (,:;) gets minimal pause
                  baseDelay = 15 + randomDelay;
                } else {
                  // Regular tokens (words, spaces, table elements) use base speed + randomness
                  baseDelay = randomDelay; // Fast streaming for smooth flow
                }
                
                const delay = Math.max(5, baseDelay); // Minimum 5ms for instant streaming
                
                animationTimeoutIdRef.current = setTimeout(() => {
                  streamToken(tokenIndex + 1);
                }, delay);
              } else {
                animationTimeoutIdRef.current = null;
                setIsAnimationDone(true);
                // Final scroll to ensure we're at the bottom when animation completes
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('chatScrollToBottom'));
                }, 100);
                onAnimationComplete?.();
              }
            };

            streamToken(0);
          }, 10); // Start streaming 10ms into fade-in for instant flow
          
        }, 400); // Loading indicator duration for segment agent
      
    } else {
      // Regular flow for non-segment agents
      // Phase 1: Show Cursor-style processing dots (600ms) - visible loading period
      setIsLoading(true);
      
      animationTimeoutIdRef.current = setTimeout(() => {
        setIsLoading(false);
        setIsTextVisible(true);
        
        // Phase 2: Start blur/fade-in effect (60ms) - ultra-fast for instant "pop" streaming
        let fadeProgress = 0;
        const fadeInterval = setInterval(() => {
          fadeProgress += 0.33; // 3 steps over 60ms for instant animation
          if (fadeProgress >= 1) {
            fadeProgress = 1;
            clearInterval(fadeInterval);
          }
          
          // Quick ease-in-out curve for instant appearance
          const easedProgress = 0.5 * (1 - Math.cos(fadeProgress * Math.PI));
          setTextOpacity(easedProgress);
          setTextBlur(1.5 * (1 - easedProgress)); // Minimal blur for instant effect
        }, 20);

        // Phase 3: Start instant token streaming immediately
        setTimeout(() => {
          let displayedTokens = '';
          
          const streamToken = (tokenIndex: number) => {
            // Add entire token instantly - NO character-by-character animation
            // Each token (word, punctuation, space) appears as a complete chunk
            displayedTokens += tokens[tokenIndex];
            setDisplayedText(displayedTokens);

            // Enhanced auto-scroll: scroll to keep new content visible as it streams
            if (tokens[tokenIndex].includes('\n') || tokenIndex % 3 === 0) {
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('chatScrollToBottom'));
              }, 50);
            }

            if (tokenIndex < tokens.length - 1) {
              // ChatGPT-style pause detection based on token types
              const currentToken = tokens[tokenIndex];
              
              // Detect special table tokens for enhanced delays
              const isTableSectionBreak = currentToken === 'TABLE_SECTION_BREAK';
              const isTableRowBreak = currentToken === 'TABLE_ROW_BREAK';
              const isParagraphBreak = currentToken === '\n';
              const isPunctuation = /^[.!?]$/.test(currentToken);
              const isMinorPunctuation = /^[,:;]$/.test(currentToken);
              
              // Generate human-like randomness (5-15ms for natural feel)
              const randomDelay = 5 + Math.random() * 10;
              
              // Set delays for ChatGPT-style streaming with table support
              let baseDelay;
              if (isTableSectionBreak) {
                // Skip rendering section breaks, just add delay
                baseDelay = 200 + Math.random() * 100; // 200-300ms pause between table sections
                setTimeout(() => {
                  streamToken(tokenIndex + 1);
                }, baseDelay);
                return; // Skip to next token without displaying
              } else if (isTableRowBreak) {
                // Skip rendering row breaks, just add delay  
                baseDelay = 50 + Math.random() * 50; // 50-100ms pause between table rows
                setTimeout(() => {
                  streamToken(tokenIndex + 1);
                }, baseDelay);
                return; // Skip to next token without displaying
              } else if (isParagraphBreak) {
                // Paragraph breaks (\n) get longer pauses (200-300ms)
                baseDelay = 200 + Math.random() * 100;
              } else if (isPunctuation) {
                // Sentence-ending punctuation (.!?) gets slight extra pause
                baseDelay = 25 + randomDelay;
              } else if (isMinorPunctuation) {
                // Minor punctuation (,:;) gets minimal pause
                baseDelay = 15 + randomDelay;
              } else {
                // Regular tokens (words, spaces, table elements) use base speed + randomness
                baseDelay = randomDelay; // Fast streaming for smooth flow
              }
              
              const delay = Math.max(5, baseDelay); // Minimum 5ms for instant streaming
              
              animationTimeoutIdRef.current = setTimeout(() => {
                streamToken(tokenIndex + 1);
              }, delay);
            } else {
              animationTimeoutIdRef.current = null;
              setIsAnimationDone(true);
              // Final scroll to ensure we're at the bottom when animation completes
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('chatScrollToBottom'));
              }, 100);
              onAnimationComplete?.();
            }
          };

          streamToken(0);
        }, 10); // Start streaming 10ms into fade-in for instant flow
        
      }, 600); // Loading indicator duration - Cursor-style processing time
    }

    return () => {
      if (animationTimeoutIdRef.current) {
        clearTimeout(animationTimeoutIdRef.current);
        animationTimeoutIdRef.current = null;
      }
    };
  }, [content, isAI, animationSpeed, onAnimationComplete, animate, isThinkingState]);

  useEffect(() => {
    let playTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let pauseTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const GIF_ASSUMED_DURATION = 10000; // 10 seconds for the GIF to play
    const STATIC_FRAME_HOLD_DURATION = 10000;  // 10 seconds to show the static first frame
    const STATIC_FRAME_SRC = "/gif1frameavatar.png"; // Path to your static first frame

    const cycleGif = () => {
      const now = Date.now();
      // Show and restart animated GIF
      setDynamicAvatarSrc(`/avatarGIF.gif?t=${now}`);

      // After assumed duration, switch to static frame
      playTimeoutId = setTimeout(() => {
        setDynamicAvatarSrc(STATIC_FRAME_SRC);

        // After the hold period, schedule to show and play animated GIF again
        pauseTimeoutId = setTimeout(() => {
          cycleGif();
        }, STATIC_FRAME_HOLD_DURATION);
      }, GIF_ASSUMED_DURATION);
    };

    // Only use GIF cycling logic if no avatarSrc prop is provided and no AvatarIconComponent
    if (isAI && !avatarSrc && !AvatarIconComponent) {
      cycleGif(); // Start the cycle
    } else {
      // If the conditions for looping are not met, ensure the dynamicAvatarSrc is set to the default static GIF path.
      // This handles cases where the component might re-render with different props and should stop looping.
      if (dynamicAvatarSrc !== "/avatarGIF.gif") { 
         setDynamicAvatarSrc("/avatarGIF.gif"); // Reset to static non-timestamped default animated GIF
      }
    }

    return () => { 
      clearTimeout(playTimeoutId);
      clearTimeout(pauseTimeoutId);
    };
  }, [isAI, AvatarIconComponent, content]);

  // Auto-approve content in autonomous mode
  useEffect(() => {
    if (isPlanMode && isContentAgent && isAnimationDone && showApproveContentCTA && onApproveContent) {
      // Small delay to ensure the UI is fully rendered before auto-continuing
      const autoApproveTimeout = setTimeout(() => {
        onApproveContent();
      }, 1000); // 1 second delay for better UX

      return () => clearTimeout(autoApproveTimeout);
    }
  }, [isPlanMode, isContentAgent, isAnimationDone, showApproveContentCTA, onApproveContent]);

  // Cards: skeleton → real once streaming starts (2nd slot in layout)
  useEffect(() => {
    if (!showPerformanceDashboard || !isTextVisible) {
      setDashboardCardsReady(false);
      return;
    }
    const revealTimeout = setTimeout(() => {
      setDashboardCardsReady(true);
    }, 600);

    return () => clearTimeout(revealTimeout);
  }, [showPerformanceDashboard, isTextVisible]);

  // Charts: skeleton during late stream, real when animation completes
  useEffect(() => {
    if (!showPerformanceDashboard) {
      setDashboardChartsReady(false);
      return;
    }
    if (!isAnimationDone) {
      setDashboardChartsReady(false);
      return;
    }
    const revealTimeout = setTimeout(() => {
      setDashboardChartsReady(true);
      window.dispatchEvent(new CustomEvent('chatScrollToBottom'));
    }, 800);

    return () => clearTimeout(revealTimeout);
  }, [showPerformanceDashboard, isAnimationDone]);

  // Handle content change tracking
  const handleContentChanged = (hasChanges: boolean) => {
    setHasContentChanges(hasChanges);
  };

  // Handle update content action
  const handleUpdateContent = async () => {
    if (contentUpdateHandlersRef.current) {
      setIsUpdatingContent(true);
      contentUpdateHandlersRef.current.handleUpdate();
      
      // Call the parent's update handler
      if (onUpdateContent) {
        onUpdateContent({});
      }
      
      // Reset states
      setHasContentChanges(false);
      setIsUpdatingContent(false);
    }
  };

  // Handle discard changes action  
  const handleDiscardChanges = () => {
    if (contentUpdateHandlersRef.current) {
      contentUpdateHandlersRef.current.handleDiscard();
      setHasContentChanges(false);
    }
  };

  // Function to generate full text content for segment accordions
  const generateSegmentAccordionCopyText = () => {
    const segmentData = [
      {
        id: "premium-perfume",
        name: "Premium Perfume Enthusiasts",
        email: {
          subject: "VIP Access: Love's Luxury Collection"
        },
        appPush: {
          title: "Luxury Awaits 💎",
          message: "VIP Valentine's collection - exclusively for you",
          cta: "Shop VIP Collection"
        },
        whatsapp: {
          header: "💎 VIP Valentine's Collection 💎",
          body: "Exclusive access to our most luxurious fragrances. Limited edition Valentine's collection available only to our VIP members.",
          footer: "Premium experience guaranteed ✨",
          cta1: "Shop VIP Collection",
          cta2: "Browse Luxury"
        }
      },
      {
        id: "recent-browsers",
        name: "Recent Beauty Browsers",
        email: {
          subject: "First Love: Special Valentine's Offer"
        },
        appPush: {
          title: "Special Offer Inside 💕",
          message: "Your perfect Valentine's fragrance awaits",
          cta: "Claim Offer"
        },
        whatsapp: {
          header: "💕 Your Perfect Scent Awaits 💕",
          body: "We noticed you've been exploring our fragrance collection. Here's a special Valentine's offer just for you - find your signature scent today!",
          footer: "Limited time offer ends soon! ⏰",
          cta1: "Shop Now",
          cta2: "Browse Collection"
        }
      },
      {
        id: "loyal-shoppers",
        name: "Loyal Beauty Shoppers",
        email: {
          subject: "Members-Only Valentine's Bundle"
        },
        appPush: {
          title: "Members Only 🌟",
          message: "Exclusive Valentine's bundle just for you",
          cta: "View Bundle"
        },
        whatsapp: {
          header: "🌟 Members-Only Valentine's Bundle 🌟",
          body: "Thank you for being a valued customer! Enjoy exclusive access to our curated Valentine's bundle with special member pricing.",
          footer: "Your loyalty is appreciated 💖",
          cta1: "View Bundle",
          cta2: "Member Benefits"
        }
      },
      {
        id: "high-intent",
        name: "High Intent New Customers",
        email: {
          subject: "Love at First Scent: 20% Off"
        },
        appPush: {
          title: "20% Off Valentine's 💘",
          message: "Limited time - your favorites at special prices",
          cta: "Shop Now"
        },
        whatsapp: {
          header: "💘 20% Off Valentine's Collection 💘",
          body: "Ready to find your perfect Valentine's fragrance? Enjoy 20% off our entire collection - from classic romance to modern allure.",
          footer: "Offer ends February 14th! 📅",
          cta1: "Shop 20% Off",
          cta2: "View Collection"
        }
      },
      {
        id: "welcome-premium",
        name: "Welcome Premium Segment",
        email: {
          subject: "Your Perfect Valentine's Match"
        },
        appPush: {
          title: "Perfect Match Found 💖",
          message: "Personalized Valentine's recommendations ready",
          cta: "See Matches"
        },
        whatsapp: {
          header: "💖 Your Perfect Valentine's Match 💖",
          body: "Welcome to our premium fragrance family! Based on your preferences, we've curated personalized Valentine's recommendations just for you.",
          footer: "Discover your signature scent journey 🌹",
          cta1: "See My Matches",
          cta2: "Take Quiz"
        }
      }
    ];

    let copyText = "I've created communication templates for your Valentine's Day perfume campaign across all segments:\n\n";
    
    segmentData.forEach((segment, index) => {
      copyText += `Segment ${index + 1}: ${segment.name}\n\n`;
      
      copyText += `Email\n`;
      copyText += `Subject: ${segment.email.subject}\n\n`;
      
      copyText += `App Push\n`;
      copyText += `Title: ${segment.appPush.title}\n`;
      copyText += `Message: ${segment.appPush.message}\n`;
      copyText += `CTA: ${segment.appPush.cta}\n\n`;
      
      copyText += `WhatsApp\n`;
      copyText += `Header: ${segment.whatsapp.header}\n`;
      copyText += `Body: ${segment.whatsapp.body}\n`;
      copyText += `Footer: ${segment.whatsapp.footer}\n`;
      copyText += `CTA 1: ${segment.whatsapp.cta1}\n`;
      copyText += `CTA 2: ${segment.whatsapp.cta2}\n\n`;
      
      if (index < segmentData.length - 1) {
        copyText += "---\n\n";
      }
    });

    return copyText;
  };

  // Function to handle copy action
  const handleCopy = async () => {
    try {
      let textToCopy = '';
      
      if (isSegmentAccordion) {
        textToCopy = generateSegmentAccordionCopyText();
      } else {
        textToCopy = content;
      }
      
      await navigator.clipboard.writeText(textToCopy);
      playCopyCue(); // confirmation blip
      setCopied(true);
      setCopyTipOpen(true); // nudge the "Copied" tooltip open
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
        setCopyTipOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  // Clear the copy-reset timer if the message unmounts mid-animation.
  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  if (!isAI) {
    if (questionRecap && questionRecap.length > 0) {
      // Recaps a CoMarketerQuestionCard's answer(s) as the user's own turn
      // — bold question, plain answer, one row per question — instead of a
      // single joined string, so what was just picked stays legible once
      // the thread scrolls past the question card itself.
      return (
        <div className="flex justify-end w-full py-2">
          <div
            className={cn(
              "w-fit space-y-2 rounded-[16px] border border-[var(--color-line)] bg-card p-3",
              isExpanded ? "max-w-[60%]" : "max-w-[85%]"
            )}
          >
            {questionRecap.map((qa, i) => (
              <div key={i}>
                <p className="font-manrope text-[12px] font-bold leading-snug text-[var(--color-ink)]">{qa.title}</p>
                <p className="mt-0.5 font-manrope text-[11.5px] text-[#6F6F8D]">{qa.answer}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (insightCard) {
      return (
        <div className="flex justify-end w-full py-2">
          {/* Insight context card — mirrors the dashboard's tinted section panel
              wrapping a white card (Figma node 5556:6251): #F9FAFB panel + header,
              enclosing a #DCDCDC 0.25px white card with teal/red category badges. */}
          <div
            className={cn(
              "w-fit flex flex-col gap-[6px] rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-[6px]",
              isExpanded ? "max-w-[60%]" : "max-w-[85%]"
            )}
          >
            <div className="flex items-center pl-[10px]">
              <p className="flex-1 font-manrope text-[14px] font-bold text-[#17173A]">{insightCard.sectionLabel}</p>
            </div>
            <div className="flex flex-col gap-1.5 rounded-[8px] border-[0.25px] border-[#DCDCDC] bg-white/50 p-[12px]">
              <div className="flex flex-wrap gap-1.5">
                {insightCard.badges.map((badge) => (
                  <span
                    key={badge}
                    className={cn(
                      "w-fit rounded-[11px] px-2 py-1 font-manrope text-[10px] font-semibold uppercase tracking-wide",
                      insightCard.badgeTone === "red"
                        ? "bg-[#FFE9DA] text-[#F05C5C]"
                        : "bg-[#E8F8F4] text-[#00A68C]"
                    )}
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <p className="font-manrope text-[13px] font-semibold text-[#17173A]">{insightCard.title}</p>
              <p className="font-manrope text-[11px] text-[#6F6F8D]">{insightCard.sub}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-end w-full py-2">
        <div className={`bg-card border border-[var(--color-line)] rounded-[12px] p-[12px] w-fit ${isExpanded ? 'max-w-[60%]' : 'max-w-[85%]'}`}>
          <p className="text-[var(--color-ink)] text-sm font-medium leading-[24px] font-['Manrope']">
            {displayedText}
          </p>
        </div>
      </div>
    );
  }


  const iconContainerBgClass = avatarBgClass ? avatarBgClass.split(' ').find(cls => cls.startsWith('bg-')) : 'bg-surface-2';
  const iconFileClass = avatarBgClass ? avatarBgClass.split(' ').find(cls => cls.startsWith('text-')) : 'text-slate';

  // Render ThinkingState component if this is a thinking state message
  if (isThinkingState) {
    console.log("🤔 Rendering ThinkingState component", { thinkingDuration, reasoningSteps: reasoningSteps?.length });
    return (
      <ThinkingState
        thinkingDuration={thinkingDuration}
        reasoningSteps={reasoningSteps}
        onComplete={onAnimationComplete}
        {...(thinkingLabel ? { label: thinkingLabel } : {})}
      />
    );
  }

  // Check if we should show thinking animation above the agent component
  const isSegmentAgent = agentName === "Segment agent" || isSegmentAgentRationale;

  // Split streaming HTML into intro (before cards) and the rest (after cards)
  const splitIntroFromRest = (html: string): { introHtml: string; restHtml: string } => {
    if (!html) return { introHtml: '', restHtml: '' };
    const splitPatterns = ['\n\n<strong>', '\n\n', '<strong>'];
    let splitAt = -1;
    for (const pat of splitPatterns) {
      const idx = html.indexOf(pat);
      if (idx !== -1 && (splitAt === -1 || idx < splitAt)) splitAt = idx;
    }
    if (splitAt === -1) return { introHtml: html, restHtml: '' };
    return {
      introHtml: html.slice(0, splitAt).trim(),
      restHtml: html.slice(splitAt).trim(),
    };
  };

  // Helper function to split HTML content into individual blocks for separate py-2 wrapping
  const splitIntoBlocks = (html: string): string[] => {
    if (!html) return [];
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const blocks: string[] = [];
    const nodes = Array.from(tempDiv.childNodes);
    
    nodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // It's an HTML element (strong, table, ul, etc.)
        const element = node as Element;
        // Wrap tables in a container div for border-radius support
        if (element.tagName.toLowerCase() === 'table') {
          blocks.push(`<div class="table-wrapper">${element.outerHTML}</div>`);
        } else {
          blocks.push(element.outerHTML);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        // It's a text node - split by double line breaks and create paragraphs
        const text = node.textContent || '';
        const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p);
        paragraphs.forEach(para => {
          if (para) {
            blocks.push(`<p>${para}</p>`);
          }
        });
      }
    });
    
    // If no blocks created, return original as single block
    if (blocks.length === 0 && html.trim()) {
      return [html];
    }
    
    return blocks;
  };

  return (
    <div className="w-full">
      <Card className="p-0 w-full dark:bg-transparent dark:shadow-none rounded-none bg-transparent border-0 shadow-none">
        {/* Segment Accordion - Highest Priority */}
        {isSegmentAccordion ? (
          <div className="py-2">
            <ContentAgentSegmentAccordions />
          </div>
        ) :
        /* Scheduler Accordion */
        isSchedulerAccordion ? (
          <div className="py-2">
            <SchedulerAgentCampaignAccordions />
          </div>
        ) :
        /* Segment Agent Rationale */
        isSegmentAgentRationale ? (
          isAnimationDone ? (
            <div className="py-2">
              <SegmentAgentRationale onContinue={onContinueSegment || (() => {})} />
            </div>
          ) : isLoading ? (
            <LoadingIndicator />
          ) : null
        ) :
        /* Content Agent Rationale */
        isContentAgentRationale && isAnimationDone ? (
          <div className="py-2">
            <ContentAgentRationale onContinue={onContinueSegment || (() => {})} onRefineThis={onRefineThis || (() => {})} />
          </div>
        ) :
        /* Content Agent Question Choice */
        isContentAgentQuestionChoice && isAnimationDone ? (
          <div className="py-2">
            <ContentAgentQuestionChoice />
          </div>
        ) :
        /* Other Component Conditions */
        isContentAgentClarification && isAnimationDone ? (
          <div className="py-2">
            <ContentAgentClarification 
              onGenerateContent={onGenerateContent || (() => {})} 
              promptTemplateExists={promptTemplateExists}
            />
          </div>
        ) : isContentAgent && isAnimationDone ? (
          <div className="py-2">
            <ContentAgentResponse 
              isPlanMode={isPlanMode}
              onContentChanged={handleContentChanged}
              onUpdateContent={onUpdateContent}
              onDiscardChanges={onDiscardChanges}
              updateHandlers={contentUpdateHandlersRef.current}
              updatedContent={updatedContent}
            />
          </div>
        ) : isFlowExecutionProgress && isAnimationDone ? (
          <div className="py-2">
            <FlowExecutionProgress onComplete={onFlowExecutionComplete} />
          </div>
        ) : 
        /* Default Text Content */
        (() => {
          console.log("🔍 RENDER STATE:", { 
            isSegmentAgentThinking, 
            isLoading, 
            displayedText: !!displayedText, 
            isTextVisible,
            agentName 
          });
          
          // UPDATED PRIORITY ORDER: Loading > Text Content (thinking is now shown above component)
          if (isLoading) {
            console.log("🔄 RENDERING LOADING INDICATOR (PRIORITY 1)");
            return <LoadingIndicator />;
          }
          
          // Show text content if NOT loading and content is available
          if (!isLoading && (displayedText || isTextVisible)) {
            console.log("📝 RENDERING TEXT CONTENT (PRIORITY 2)");
            
            // Split content into individual blocks
            const contentBlocks = splitIntoBlocks(displayedText);
            const { introHtml, restHtml } = showPerformanceDashboard
              ? splitIntroFromRest(displayedText)
              : { introHtml: contentBlocks[0] ?? '', restHtml: contentBlocks.slice(1).join('') };
            const introBlock = introHtml || undefined;
            const restBlocks = showPerformanceDashboard
              ? splitIntoBlocks(restHtml)
              : contentBlocks.slice(1);
            const showCardsSlot = showPerformanceDashboard && isTextVisible && introHtml.length > 20;
            const showChartsSlot = showPerformanceDashboard && isTextVisible && (restHtml.length > 0 || isAnimationDone);

            const renderContentBlock = (block: string, index: number) => (
              <div
                key={index}
                className="py-2 text-[var(--color-ink)] leading-[22px] font-['Manrope'] font-normal whitespace-pre-line transition-all duration-50 ease-out"
                style={{
                  opacity: textOpacity,
                  filter: `blur(${textBlur}px)`,
                  transform: `translateY(${(1 - textOpacity) * 0.5}px)`,
                  willChange: 'opacity, filter, transform'
                }}
                dangerouslySetInnerHTML={{ __html: block }}
              />
            );

            return (
              <div className="text-sm">
                {/* 1. Intro text streams first */}
                {introBlock && renderContentBlock(introBlock, 0)}

                {/* 2. Metric cards — visible during streaming (skeleton → real) */}
                {showCardsSlot && (
                  <div className="py-2">
                    {dashboardCardsReady ? <MetricCards /> : <MetricCardsSkeleton />}
                  </div>
                )}

                {/* 3. Remaining text continues streaming below cards */}
                {restBlocks.map((block, index) => renderContentBlock(block, index + 1))}

                {/* 4. Charts after the text (skeleton while streaming, real when done) */}
                {showChartsSlot && (
                  <div className="py-2 flex flex-col gap-[12px]">
                    {dashboardChartsReady ? (
                      <>
                        <PublishedVsDeliveredChart />
                        <RatesChart />
                      </>
                    ) : (
                      <>
                        <ChartSkeleton />
                        <ChartSkeleton />
                      </>
                    )}
                  </div>
                )}
                {/* Per-message stat tiles — same card style as the opening recap,
                    so follow-up answers stay visually consistent (revealed after stream) */}
                {statCards && statCards.length > 0 && isAnimationDone && (
                  <div className="py-2 grid grid-cols-2 sm:grid-cols-3 gap-[8px] font-['Manrope'] transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-1">
                    {statCards.map((c) => (
                      <div
                        key={c.label}
                        className="border border-[var(--color-line)] bg-card rounded-[8px] px-[12px] py-[10px] flex flex-col gap-[2px]"
                      >
                        <span className="text-[11px] text-[var(--color-grey)] font-medium">{c.label}</span>
                        <span className="text-[20px] font-bold text-[var(--color-ink)] leading-tight">{c.value}</span>
                        {c.sub && <span className="text-[10px] text-[var(--color-grey-soft)]">{c.sub}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {/* Optional relevant chart, reusing the dashboard charts */}
                {miniChart && isAnimationDone && (
                  <div className="py-2 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-1">
                    {miniChart === 'delivery' ? <PublishedVsDeliveredChart /> : <RatesChart />}
                  </div>
                )}
                {/* Agent-handed artifact card (segment / journey) — after the answer streams */}
                {agentArtifactCard && isAnimationDone && (
                  <div className="py-2 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-1">
                    <AgentArtifactCard card={agentArtifactCard} onAction={onAgentArtifactAction} />
                  </div>
                )}
                {setupApplyCard && isAnimationDone && (
                  <div className="py-2 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-1">
                    <SetupApplyCard
                      card={setupApplyCard}
                      applied={setupApplyApplied}
                      appliedCohortId={appliedCohortId}
                      onApply={onSetupApply}
                    />
                  </div>
                )}
                {findings && findings.length > 0 && isAnimationDone && (
                  <div className="py-2 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-1">
                    <FindingsReviewList findings={findings} onAsk={(f) => onAskFinding?.(f)} />
                  </div>
                )}
                {nodeInsightCard && isAnimationDone && (
                  <div className="py-2 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-1">
                    <NodeOptimizationInsightCard data={nodeInsightCard} onRespond={onRespondNodeInsight} />
                  </div>
                )}
                {journeyProposalCard && isAnimationDone && (
                  <div className="py-2 duration-500 delay-500 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
                    <JourneyOptimizationProposalCard data={journeyProposalCard} />
                  </div>
                )}
                {audienceTestCard && isAnimationDone && (
                  // A deliberate beat before this shows up — the agent's own
                  // text just finished typing, so the question card
                  // following right on its heels read as instant/jarring
                  // rather than the agent "then" asking it.
                  <div className="py-2 duration-500 delay-500 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
                    <AudienceTestQuestionCard data={audienceTestCard} onSubmit={onRespondAudienceTest} />
                  </div>
                )}
                {pushFlowCard && onPushFlowEvent && isAnimationDone && (
                  <div className="py-2 duration-500 delay-300 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
                    <PushFlowCardView card={pushFlowCard} onEvent={onPushFlowEvent} />
                  </div>
                )}
                {mergeTestCta && isAnimationDone && (
                  <div className="py-2 duration-500 delay-500 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
                    <button
                      type="button"
                      disabled={mergeTestCtaDone}
                      onClick={onMergeTestJourney}
                      className="dc-btn dc-btn-primary disabled:cursor-default disabled:opacity-60"
                    >
                      {mergeTestCtaDone ? "Merged as main journey" : "Yes, merge as main journey"}
                    </button>
                  </div>
                )}
                {replyOptions && replyOptions.length > 0 && isAnimationDone && (
                  <div className="py-2 duration-500 delay-500 ease-out animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex flex-wrap gap-2">
                    {replyOptions.map((opt, index) => {
                      const selected = replyOptionsSelectedValue === opt.value;
                      const answered = !!replyOptionsSelectedValue;
                      // The first option is the expected/main path (e.g.
                      // "Continue with this goal", "Test this optimization")
                      // and reads as the primary CTA until something's
                      // picked — after that, whichever one was actually
                      // picked takes over the primary styling instead.
                      const isPrimary = answered ? selected : index === 0;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={answered}
                          onClick={() => onSelectReplyOption?.(opt.value)}
                          className={cn(
                            "dc-btn",
                            isPrimary ? "dc-btn-primary" : "dc-btn-secondary",
                            "disabled:cursor-default",
                            answered && !selected && "opacity-50",
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {experimentCard && isAnimationDone && (
                  <div className="py-2 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-1">
                    <ExperimentCard
                      card={experimentCard}
                      onCreateTest={(config) => onCreateTest?.(config, experimentCard.anchorStepId)}
                      onUpdateSplit={onUpdateTestSplit}
                      onPostTestDecision={onPostTestDecision}
                    />
                  </div>
                )}
                {/* Executive Summary Content Accordion - only shown for executive summary messages */}
                {isExecutiveSummaryWithContent && (
                  <div className="py-2">
                    <ExecutiveSummaryContentAccordion />
                  </div>
                )}
                {/* Doc-like artifact card — revealed only after the text finishes streaming */}
                {/* COMMENTED OUT (kept for later): in-chat artifact card is hidden. */}
                {false && artifact && isAnimationDone && (
                  <div className="py-2 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-1">
                    <DocArtifactCard
                      artifact={artifact}
                      onDownload={onDownloadArtifact}
                      onPreview={onPreviewArtifact}
                    />
                  </div>
                )}
              </div>
            );
          }
          
          console.log("❌ RENDERING NULL - no conditions met");
          return null;
        })()}
            
        {/* Feedback icons at bottom-left of AI content (ChatGPT style) - only show after animation completes */}
            {isAnimationDone && !hideFeedback && (
              <div className="flex justify-start w-full mt-3 pt-3 border-t border-[var(--color-line)] dark:border-[var(--color-charcoal)]">
                <div className="flex items-center gap-1 text-grey-soft">
                  <TooltipProvider delayDuration={200}>
                    {/* Copy — first position */}
                    <Tooltip open={copyTipOpen} onOpenChange={(o) => { if (!copied) setCopyTipOpen(o); }}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 h-auto rounded-md hover:text-muted-foreground hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
                          onClick={handleCopy}
                          aria-label={copied ? 'Copied' : 'Copy'}
                        >
                          {/* chanhdai copy interaction: Copy fades/scales out, Check in */}
                          <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
                            <Copy
                              className={cn(
                                'absolute h-3.5 w-3.5 transition-all duration-200 ease-out',
                                copied ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
                              )}
                            />
                            <Check
                              className={cn(
                                'absolute h-3.5 w-3.5 text-success transition-all duration-200 ease-out',
                                copied ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                              )}
                            />
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="border-0 bg-foreground px-[8px] py-[4px] text-background"
                        style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
                      >
                        {/* "Copy" ↔ "Copied!" using the same scale/fade transition */}
                        <span className="relative grid h-[16px] place-items-center text-[12px] leading-[16px]">
                          <span
                            className={cn(
                              'col-start-1 row-start-1 transition-all duration-200 ease-out',
                              copied ? 'scale-50 opacity-0' : 'scale-100 opacity-100'
                            )}
                          >
                            Copy
                          </span>
                          <span
                            className={cn(
                              'col-start-1 row-start-1 transition-all duration-200 ease-out',
                              copied ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                            )}
                          >
                            Copied!
                          </span>
                        </span>
                      </TooltipContent>
                    </Tooltip>
                    {/* Thumbs up */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={onThumbsUp} className="p-2 h-auto rounded-md hover:text-success hover:bg-[color-mix(in_oklab,var(--color-success)_10%,transparent)] focus-visible:ring-0 focus-visible:ring-offset-0" aria-label="Good response">
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="border-0 bg-foreground px-[8px] py-[4px] text-background text-[12px] leading-[16px]"
                        style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
                      >
                        Good response
                      </TooltipContent>
                    </Tooltip>
                    {/* Thumbs down */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={onThumbsDown} className="p-2 h-auto rounded-md hover:text-destructive hover:bg-destructive/10 focus-visible:ring-0 focus-visible:ring-offset-0" aria-label="Bad response">
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="border-0 bg-foreground px-[8px] py-[4px] text-background text-[12px] leading-[16px]"
                        style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
                      >
                        Bad response
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
        
            {isAnimationDone && (
              <div className="flex items-center justify-between w-full mt-2 pr-1">
                <div>
                  {/* Show GENERATE CONTENT for ContentAgentClarification messages */}
                  {showGenerateContentCTA && !isContentGenerating && (
                    <div className="flex items-center rounded-[4px] shadow-md">
                      <Button
                        onClick={() => {
                          setIsContentGenerating(true);
                          onGenerateContent?.();
                        }}
                        className="bg-[var(--color-navy-deep)] text-white hover:bg-[var(--color-navy-deepest)] font-normal text-xs uppercase px-3.5 py-1.5 rounded-[4px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }}
                      >
                        Generate Content
                      </Button>
                    </div>
                  )}
                  
                  {/* Show Question Choice CTAs for ContentAgentQuestionChoice messages */}
                  {showQuestionChoiceCTAs && !isAnsweringQuestions && !isSkippingToGenerate && (
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => {
                          setIsAnsweringQuestions(true);
                          onAnswerQuestions?.();
                        }}
                        className="bg-[var(--color-navy)] hover:bg-[var(--color-navy-deep)] text-white font-medium px-4 py-2 rounded-md text-sm transition-colors uppercase"
                      >
                        Answer Questions
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setIsSkippingToGenerate(true);
                          onSkipAndGenerate?.();
                        }}
                        variant="outline"
                        className="border-[var(--color-navy)] text-[var(--color-navy)] bg-card hover:bg-[var(--color-navy)]/15 hover:text-[var(--color-navy)] hover:border-[var(--color-navy)] dark:border-[var(--color-navy)] dark:text-[var(--color-navy)] dark:hover:bg-[var(--color-navy)]/15 dark:hover:text-[var(--color-navy)] font-medium px-4 py-2 rounded-md text-sm transition-colors uppercase"
                      >
                        Skip And Generate
                      </Button>
                    </div>
                  )}
                  
                  {/* Show UPDATE AND CONTINUE + DISCARD CHANGES when content has changed */}
                  {!isContentAgentClarification && showApproveContentCTA && !isContentApproving && !isPlanMode && hasContentChanges && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleDiscardChanges}
                        variant="outline"
                        className="border-input bg-background hover:bg-muted hover:text-foreground font-normal text-xs uppercase px-3.5 py-1.5 rounded-[4px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }}
                      >
                        Discard Changes
                      </Button>
                      <Button
                        onClick={handleUpdateContent}
                        disabled={isUpdatingContent}
                        className="bg-cobalt-blue text-white font-normal text-xs uppercase px-3.5 py-1.5 rounded-[4px] hover:bg-[var(--color-navy-deep)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }}
                      >
                        {isUpdatingContent ? 'Updating...' : 'Update and Continue'}
                      </Button>
                    </div>
                  )}
                  
                  {/* Show APPROVE CONTENT when no changes */}
                  {!isContentAgentClarification && showApproveContentCTA && !isContentApproving && !isPlanMode && !hasContentChanges && (
                    <div className="flex items-center rounded-[4px] shadow-md">
                      <Button
                        onClick={() => {
                          setIsContentApproving(true);
                          onApproveContent?.();
                        }}
                        className="bg-cobalt-blue text-white font-normal text-xs uppercase px-3.5 py-1.5 rounded-[4px] hover:bg-[var(--color-navy-deep)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }} 
                      >
                        Approve content
                      </Button>
                    </div>
                  )}

                  {/* Show APPROVE SEGMENTS for segment agent table */}
                  {showApproveSegmentsCTA && !isSegmentsApproving && !isPlanMode && (
                    <div className="flex items-center rounded-[4px] shadow-md">
                      <Button
                        onClick={() => {
                          setIsSegmentsApproving(true);
                          onApproveSegments?.();
                        }}
                        className="bg-cobalt-blue text-white font-normal text-xs uppercase px-3.5 py-1.5 rounded-[4px] hover:bg-[var(--color-navy-deep)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }} 
                      >
                        Approve segments
                      </Button>
                    </div>
                  )}
                  
                  {showExecuteFlowCTA && !isFlowExecuting && (
                    <div className="flex items-center rounded-[4px] shadow-md">
                      <Button
                        onClick={() => {
                          setIsFlowExecuting(true);
                          onExecuteFlow?.();
                        }}
                        className="bg-cobalt-blue text-white font-normal text-xs uppercase px-3.5 py-1.5 rounded-l-[4px] rounded-r-none hover:bg-[var(--color-navy-deep)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{ letterSpacing: '0.42px', lineHeight: 'normal' }} 
                      >
                        Execute flow
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-label="More options"
                            className="bg-cobalt-blue text-white p-1.5 rounded-r-[4px] rounded-l-none border-l border-white/30 hover:bg-[var(--color-navy-deep)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="start" 
                          className="w-[300px] bg-popover border border-[var(--color-line-input)] dark:border-border rounded-[4px] p-0 shadow-lg"
                        >
                          <DropdownMenuItem
                            onSelect={() => {}}
                            className="flex items-center h-[50px] px-[15px] cursor-pointer text-xs font-normal text-[var(--color-ink)] dark:text-popover-foreground focus:bg-[var(--color-royal-pale-soft)] dark:focus:bg-accent focus:text-[var(--color-ink)] dark:focus:text-accent-foreground data-[highlighted]:bg-[var(--color-royal-pale-soft)] dark:data-[highlighted]:bg-accent data-[highlighted]:text-[var(--color-ink)] dark:data-[highlighted]:text-accent-foreground rounded-none"
                          >
                            Create content template(s)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {}}
                            className="flex items-center h-[50px] px-[15px] cursor-pointer text-xs font-normal text-[var(--color-ink)] dark:text-popover-foreground focus:bg-[var(--color-royal-pale-soft)] dark:focus:bg-accent focus:text-[var(--color-ink)] dark:focus:text-accent-foreground data-[highlighted]:bg-[var(--color-royal-pale-soft)] dark:data-[highlighted]:bg-accent data-[highlighted]:text-[var(--color-ink)] dark:data-[highlighted]:text-accent-foreground rounded-none"
                          >
                            Create segment(s) only
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  
                </div>
              </div>
            )}
      </Card>
    </div>
  );
}

export default ChatMessage;
