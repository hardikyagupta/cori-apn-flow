import React, { useState, useRef, KeyboardEvent, CSSProperties, useEffect, useLayoutEffect } from 'react';
import { Command, CommandGroup, CommandItem, CommandEmpty, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ArrowUp, StopCircle, X, Plus, FileVideo, FileAudio, FileText, File as FileIcon, Loader2, Paperclip, CornerDownRight, Atom, ChevronRight, Bot, Globe } from 'lucide-react';
import { marketingAgents, MarketingAgent } from '@/data/agents';
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
}

type AttachmentCategory = 'image' | 'video' | 'audio' | 'document';

interface Attachment {
  id: string;
  name: string;
  size: number;
  category: AttachmentCategory;
  /** Object URL for image previews (revoked on remove). */
  previewUrl?: string;
  status: 'uploading' | 'done';
}

const CATEGORY_LABEL: Record<AttachmentCategory, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  document: 'Document',
};

const getAttachmentCategory = (file: File): AttachmentCategory => {
  const t = file.type;
  if (t.startsWith('image/')) return 'image';
  if (t.startsWith('video/')) return 'video';
  if (t.startsWith('audio/')) return 'audio';
  return 'document';
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/** Royal blue — seasonal trends / suggested-prompt context chips only. */
const promptChipClass =
  "border border-[var(--color-royal)] shadow-[0px_0px_0px_2px_oklch(0.554_0.199_263.043_/_0.1)]";
const promptChipBg =
  "linear-gradient(180deg, var(--color-background) 0%, oklch(1 0 0 / 0) 100%), linear-gradient(180deg, var(--color-royal-pale) 0%, oklch(0.894 0.051 266.995 / 0.6) 100%)";
const promptChipText = "text-[var(--color-royal)]";

/** Deep-research mode chips — neutral, matching the default starter chips
 * (fig-chip): flat white surface, line-strong hairline, ink text. */
const deepResearchChipClass = "border border-[var(--color-line-strong)]";
const deepResearchChipBg =
  "linear-gradient(180deg, var(--color-white) 0%, var(--color-white) 100%)";
const deepResearchChipText = "text-[var(--color-ink)]";

/** Neutral grey — custom-agent chips. Deliberately colorless (no hue tint) so
 * it reads as a quiet system chip rather than a colored category pill. */
const agentChipClass = "border border-[var(--color-line-input)]";
const agentChipBg =
  "linear-gradient(180deg, var(--color-surface-1) 0%, var(--color-surface-1) 100%)";
const agentChipText = "text-[var(--color-slate)]";

// Icon + tint used for the non-image (doc/video/audio) attachment cards.
const getDocVisual = (category: AttachmentCategory) => {
  switch (category) {
    case 'video':
      return { Icon: FileVideo, className: 'bg-orange text-white' };
    case 'audio':
      return { Icon: FileAudio, className: 'bg-[var(--color-royal)] text-white' };
    case 'document':
      return { Icon: FileText, className: 'bg-[var(--color-surface-1)] text-[var(--color-charcoal)]' };
    default:
      return { Icon: FileIcon, className: 'bg-[var(--color-surface-1)] text-[var(--color-charcoal)]' };
  }
};

const agents: Agent[] = [
  { id: "co-marketer", name: "Zeno" },
  { id: "content-agent", name: "Content Agent" },
  { id: "segment-agent", name: "Segment Agent" },
  { id: "scheduler-agent", name: "Scheduler Agent" },
  { id: "insight-agent", name: "Insight Agent" },
];

interface ChatInputProps {
  onSend?: (message: string) => void;
  isMockAgentChatActive?: boolean;
  onStopMockConversation?: () => void;
  isQuestionnaireActive?: boolean;
  selectedContextChip?: string | null;
  onClearSelectedContextChip?: () => void;
  /** Fired when the user picks "Deep research" from the "+" popover. */
  onDeepResearch?: () => void;
  /** Fired whenever deep-research mode toggles on/off (popover pick / chip dismiss). */
  onDeepResearchChange?: (active: boolean) => void;
  /** Reply context shown as a banner above the field (e.g. a plan being edited). */
  replyContext?: string | null;
  /** Clears the reply-context banner. */
  onClearReplyContext?: () => void;
  /** Drives the input shimmer AND the disabled "generating" state (set by
   *  parent on every send / while generating). */
  shimmer?: boolean;
  /** Purely cosmetic border/inner shimmer — no disabled state, no placeholder
   *  swap, field stays fully usable. Used for a brief "ready" flourish (e.g.
   *  the AI Dashboard hero composer on page load) rather than an actual
   *  generating state. */
  borderShimmer?: boolean;
  /** Fired with the live textarea value on every change (typing, clear-on-send). */
  onInputValueChange?: (value: string) => void;
  /** Textarea placeholder. Defaults to the empty-state greeting prompt. */
  placeholder?: string;
  /**
   * Which shape the field takes at rest — this is the one universal input used
   * across the app (homepage + docked co-marketer), driven by this variant:
   *  - 'expanded' (default): the roomy homepage composer — textarea on its own
   *    full-width row with the actions on the row below (16px radius).
   *  - 'linear': the compact single-row pill (48px radius) that only grows to
   *    the expanded shape once the text wraps to multiple lines or a chip is set.
   */
  layout?: 'expanded' | 'linear';
  /** Custom agents offered under the "+" → "Add to agent" submenu. When omitted
   *  or empty, the submenu still appears with just "Create a new agent". */
  agents?: Array<{ id: string; name: string; avatarSrc?: string }>;
  /** Controlled selected-agent chip (shows in the field). */
  selectedAgentChip?: { id: string; name: string; avatarSrc?: string } | null;
  /** Fires when the chip is set (agent picked) or cleared (chip's × clicked). */
  onSelectAgentChip?: (agent: { id: string; name: string; avatarSrc?: string } | null) => void;
  /** Fires when "Create a new agent" is picked from the "+" → "Add to agent" submenu. */
  onCreateAgentFromComposer?: () => void;
  /** Pre-fills the composer with a suggested prompt the user can edit or send. */
  initialValue?: string;
  /** Seeds deep-research mode ON at mount (used when an entry point — e.g. a
   *  discovery banner — opens the composer straight into deep research).
   *  Remount (change the `key`) to re-apply. */
  initialDeepResearch?: boolean;
  /** Opens the "+" menu with the Custom-agents L2 flyout expanded at mount, so
   *  an entry point can drop the user straight into agent selection. Remount
   *  (change the `key`) to re-apply. */
  initialAgentMenuOpen?: boolean;
  /** Hides the "+" attach/agent/deep-research button — a bare placeholder + send
   *  field for minimal composer placements (e.g. the AI Dashboard hero input).
   *  Defaults to true (shown) everywhere else. */
  showAddButton?: boolean;
  /** Fixed 12px corners at rest instead of the 'linear' layout's full pill, and
   *  the placeholder vertically centered against the send button rather than
   *  top-aligned. Only affects the single-row resting state — once the field
   *  grows past one line it already switches to the two-row `expanded` shape.
   *  Defaults to false (pill), matching existing 'linear' usage. */
  flat?: boolean;
  /** Small animated icon shown before the placeholder text while the field is
   *  empty (e.g. the AI Dashboard hero composer's "Ask anything" prompt).
   *  Only rendered in the resting flat single-row pill (flat && !expanded). */
  placeholderIcon?: string;
  /** Fired the first time the field gains focus. Lets a parent settle any
   *  "ready" flourish (e.g. the hero composer's border shimmer) exactly when
   *  the user starts interacting rather than on a timer. */
  onFieldFocus?: () => void;
}

// Temporary feature flag to disable @-agent mention dropdown
const ALLOW_AGENT_MENTION = false;

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isMockAgentChatActive,
  onStopMockConversation,
  isQuestionnaireActive = false,
  selectedContextChip = null,
  onClearSelectedContextChip,
  onDeepResearch,
  onDeepResearchChange,
  replyContext = null,
  onClearReplyContext,
  shimmer = false,
  onInputValueChange,
  placeholder = "How can I help you today?",
  layout = 'expanded',
  agents,
  selectedAgentChip = null,
  onSelectAgentChip,
  onCreateAgentFromComposer,
  initialValue = "",
  initialDeepResearch = false,
  initialAgentMenuOpen = false,
  showAddButton = true,
  flat = false,
  placeholderIcon,
  borderShimmer = false,
  onFieldFocus,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [showMentionList, setShowMentionList] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(initialAgentMenuOpen);
  // "Custom agents" L2 flyout — opens to the right of its row on hover.
  const [agentSubOpen, setAgentSubOpen] = useState(initialAgentMenuOpen);
  const agentSubTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentMenuEnabled = agents !== undefined || !!onCreateAgentFromComposer;
  const openAgentSub = () => {
    if (agentSubTimer.current) clearTimeout(agentSubTimer.current);
    setAgentSubOpen(true);
  };
  // Small grace period so moving from the row across the gap into the flyout
  // doesn't dismiss it.
  const closeAgentSubSoon = () => {
    if (agentSubTimer.current) clearTimeout(agentSubTimer.current);
    agentSubTimer.current = setTimeout(() => setAgentSubOpen(false), 140);
  };
  // Viewport-aware placement for the flyout — it opens near the bottom-left of
  // the screen while a response streams, so the naive "always right, always
  // aligned to the row's top" placement can run off-screen and get clipped.
  const agentSubRowRef = useRef<HTMLDivElement>(null);
  const agentSubFlyoutRef = useRef<HTMLDivElement>(null);
  const [agentSubFlyoutPos, setAgentSubFlyoutPos] = useState<{ side: 'left' | 'right'; top: number }>({ side: 'right', top: -4 });
  useLayoutEffect(() => {
    if (!agentSubOpen) return;
    const row = agentSubRowRef.current;
    const flyout = agentSubFlyoutRef.current;
    if (!row || !flyout) return;
    const margin = 8;
    const rowRect = row.getBoundingClientRect();
    const flyoutRect = flyout.getBoundingClientRect();
    const side: 'left' | 'right' =
      rowRect.right + 4 + flyoutRect.width + margin > window.innerWidth ? 'left' : 'right';
    let top = -4;
    const overflowBottom = rowRect.top + flyoutRect.height + margin - window.innerHeight;
    if (overflowBottom > 0) {
      top = Math.max(-4 - overflowBottom, -(rowRect.top - margin));
    }
    setAgentSubFlyoutPos({ side, top });
  }, [agentSubOpen]);
  const [deepResearchActive, setDeepResearchActive] = useState(initialDeepResearch);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionSearch, setMentionSearch] = useState("");
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  // Files/photos attached to the current message (shown above the textarea).
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const newItems: Attachment[] = files.map((file, i) => {
      const category = getAttachmentCategory(file);
      return {
        id: `${Date.now()}-${i}-${file.name}`,
        name: file.name,
        size: file.size,
        category,
        previewUrl: category === 'image' ? URL.createObjectURL(file) : undefined,
        status: 'uploading',
      };
    });
    setAttachments((prev) => [...prev, ...newItems]);
    // Simulate an upload completing (swap "Uploading …" → "Type · Size").
    newItems.forEach((item) => {
      setTimeout(() => {
        setAttachments((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, status: 'done' } : a))
        );
      }, 1500);
    });
    // Allow re-selecting the same file later.
    event.target.value = '';
  };

  const attachmentsScrollRef = useRef<HTMLDivElement>(null);
  // Whether content is clipped on each side → drives the edge fade overlays.
  const [attFade, setAttFade] = useState({ left: false, right: false });
  const updateAttFade = () => {
    const el = attachmentsScrollRef.current;
    if (!el) return;
    setAttFade({
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
    });
  };
  useEffect(() => {
    updateAttFade();
  }, [attachments]);

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const found = prev.find((a) => a.id === id);
      if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  };
  // True once the textarea wraps past one line — drives the container's grow +
  // radius change (mirrors the chip-expanded state).
  const [isMultiline, setIsMultiline] = useState(false);
  // True when content exceeds the 4-line cap (drives the bottom fade overlay).
  const [isScrollable, setIsScrollable] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Placeholder icon (e.g. thinking-loader.gif) keeps looping as a quiet
  // "ready" affordance and only freezes once the user focuses the field —
  // captured onto a canvas and swapped in as a static image so it doesn't
  // animate forever after the user has started interacting.
  const placeholderIconImgRef = useRef<HTMLImageElement>(null);
  const [frozenPlaceholderIconSrc, setFrozenPlaceholderIconSrc] = useState<string | null>(null);
  const freezePlaceholderIcon = () => {
    if (!placeholderIcon || frozenPlaceholderIconSrc) return;
    const img = placeholderIconImgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 26;
    canvas.height = img.naturalHeight || 26;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    setFrozenPlaceholderIconSrc(canvas.toDataURL());
  };

  // First focus settles the "ready" flourish: freeze the looping placeholder
  // icon and let the parent drop the border shimmer.
  const handleFieldFocus = () => {
    freezePlaceholderIcon();
    onFieldFocus?.();
  };
  const measurementRef = useRef<HTMLSpanElement>(null);
  // Measured height of a single empty line (content + padding). The textarea's
  // padding makes this ~30px, not the bare 22px line-height, so we can't compare
  // against a hard-coded constant — we capture the real resting height once and
  // treat "multiline" as growth clearly beyond it. (A too-low constant made the
  // field read as multiline at rest, forcing the tall expanded layout.)
  const singleLineHeightRef = useRef<number | null>(null);

  // Auto-grow the textarea: reset to content height, capped at 4 lines (88px),
  // then scroll. Reads `el.value` (always live) rather than state so it's safe to
  // call from a ResizeObserver too. Recaptures the single-line baseline whenever
  // the field is empty, so a stale measurement can't leave a wrong baseline.
  const resizeTextarea = () => {
    const el = inputRef.current;
    if (!el) return;
    const MAX_H = 88; // 4 lines × 22px line-height
    el.style.height = 'auto';
    const full = el.scrollHeight;
    if (!el.value) singleLineHeightRef.current = full;
    const next = Math.min(full, MAX_H);
    el.style.height = `${next}px`;
    const scrollable = full > MAX_H;
    el.style.overflowY = scrollable ? 'auto' : 'hidden';
    // Multiline once the content grows more than half a line past the baseline
    // (i.e. it has actually wrapped), so a single resting line stays compact.
    const baseline = singleLineHeightRef.current ?? 30;
    setIsMultiline(full > baseline + 11);
    setIsScrollable(scrollable);
  };

  // Recompute on every value change (typing, paste, clear-after-send).
  useEffect(() => {
    resizeTextarea();
  }, [inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recompute when the field's width changes — critical in the docked chat, whose
  // slide-in animation grows the panel from 0 → full width. Without this the
  // height measured mid-animation would stick (leaving a too-tall empty field).
  // Guarded on width so our own height writes don't loop the observer.
  useEffect(() => {
    const el = inputRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let lastWidth = el.clientWidth;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      if (Math.abs(w - lastWidth) > 0.5) {
        lastWidth = w;
        resizeTextarea();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    onInputValueChange?.(inputValue);
  }, [inputValue, onInputValueChange]);

  // Deep research and custom-agent chips are mutually exclusive: selecting an
  // agent clears deep research. The reverse (picking deep research clears any
  // agent chip) is handled inline where deep research is selected. We must NOT
  // force the custom-agents flyout closed while deep research is active — doing
  // so made the agent list unreachable, so a user who'd picked deep research
  // could never switch to an agent ("last pick wins" was broken).
  useEffect(() => {
    if (selectedAgentChip && deepResearchActive) {
      setDeepResearchActive(false);
      onDeepResearchChange?.(false);
    }
  }, [selectedAgentChip, deepResearchActive, onDeepResearchChange]);

  const calculatePopoverPosition = (atIndex: number) => {
    if (!ALLOW_AGENT_MENTION) return {};
    if (!inputRef.current || !measurementRef.current) return {};
    const textBeforeAt = inputValue.slice(0, atIndex);
    measurementRef.current.textContent = textBeforeAt;
    const textWidth = measurementRef.current.offsetWidth;
    const inputRect = inputRef.current.getBoundingClientRect();
    const inputStyle = window.getComputedStyle(inputRef.current);
    const inputPaddingLeft = parseFloat(inputStyle.paddingLeft || '0');
    const popoverTop = inputRect.top;
    const popoverLeft = inputRect.left + inputPaddingLeft + textWidth;
    return {
      position: 'fixed',
      top: `${popoverTop}px`,
      left: `${popoverLeft}px`,
      transform: 'translateY(-100%) translateY(-8px)',
      width: '192px',
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!ALLOW_AGENT_MENTION) {
      setShowMentionList(false);
      setInputValue(e.target.value);
      setCursorPosition(e.target.selectionStart || 0);
      return;
    }
    const newValue = e.target.value;
    const currentCursorPos = e.target.selectionStart || 0;
    setInputValue(newValue);
    setCursorPosition(currentCursorPos);

    const atIndex = newValue.lastIndexOf('@', currentCursorPos - 1);
    let shouldShow = false;

    if (atIndex !== -1) {
        const charAfterAt = newValue.charAt(atIndex + 1);
        const isStart = atIndex === 0;
        const isPrecededBySpace = atIndex > 0 && /\s/.test(newValue.charAt(atIndex - 1));
        const isFollowedByNonSpace = charAfterAt && !/\s/.test(charAfterAt);
        const isAtCursor = atIndex === currentCursorPos - 1;

        if (isAtCursor && (charAfterAt === '' || !/\s/.test(charAfterAt))) {
             const searchText = newValue.slice(atIndex + 1, currentCursorPos);
             if (!searchText.includes(' ')) {
                 setMentionSearch(searchText);
                 shouldShow = true;
             }
        }
    }
    
    // Disable mention list if flag is off
    const finalShow = ALLOW_AGENT_MENTION && shouldShow;
    setShowMentionList(finalShow);
  };

  const insertMention = (agent: MarketingAgent) => {
    console.log('Inserting mention:', agent.name);
    const mentionText = `@${agent.name}`;
    const beforeCursor = inputValue.slice(0, cursorPosition);
    const atSymbolIndex = beforeCursor.lastIndexOf('@');
    
    if (atSymbolIndex === -1) return;

    const textBeforeMention = inputValue.slice(0, atSymbolIndex);
    const textAfterCursor = inputValue.slice(cursorPosition);
    const spaceNeeded = textAfterCursor.length === 0 || !/^\s/.test(textAfterCursor);
    
    const newValue = `${textBeforeMention}${mentionText}${spaceNeeded ? ' ' : ''}${textAfterCursor}`;
    setInputValue(newValue);
    setShowMentionList(false);

    const newCursorPos = textBeforeMention.length + mentionText.length + (spaceNeeded ? 1 : 0);
    
    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  const handleClickOutside = () => {
    setShowMentionList(false);
  };

  // Filtered agents (only used if mentions are enabled)
  const agentsForMention = marketingAgents.filter(agent => agent.id !== "co-marketer");
  const filteredAgents = agentsForMention.filter(agent =>
    agent.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    // Enter sends; Shift+Enter inserts a newline (modern multiline input).
    if (e.key === 'Enter' && !e.shiftKey && !showMentionList && inputValue.trim()) {
      e.preventDefault();
      if (onSend) {
        onSend(inputValue.trim());
      }
      setInputValue('');
      setAttachments([]);
    } else if (e.key === 'Escape' && showMentionList) {
      setShowMentionList(false);
    }
  };

  const handleSendClick = () => {
    if (inputValue.trim() && onSend) {
      onSend(inputValue.trim());
      setInputValue('');
      setAttachments([]);
      inputRef.current?.focus();
    }
  };

  const handleStopClick = () => {
    if (onStopMockConversation) {
      onStopMockConversation();
    }
  };

  const handleMentionKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter') {
      return;
    }
  };

  // If mentions disabled, never render popover
  if (!ALLOW_AGENT_MENTION) {
    const hasText = inputValue.trim().length > 0;
    // Button is active (blue) by default; while output is generating (input shimmering)
    // it switches to the disabled/grey state with the Figma square icon.
    const isLoading = !!isMockAgentChatActive || shimmer;
    const isActive = !isLoading;
    // Resting shape is the roomy homepage composer by default ('expanded'):
    // textarea on its own row with the actions below. The 'linear' variant starts
    // as a compact single-row pill and only expands once the text wraps to
    // multiple lines or a context chip is selected.
    const expanded = layout === 'expanded' || isMultiline || !!selectedContextChip || !!replyContext;
    return (
      <div className="relative w-full">
        {/* Outer container — height grows smoothly when chip appears */}
        <div
          className={cn(
            "relative overflow-hidden w-full border-[0.5px] border-[var(--color-line-input)] min-h-[56px] pt-[12px] pr-[12px] pb-[12px] pl-[12px] transition-[border-radius,gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            // Pill at 56px in the default single-line state (border-box absorbs the
            // 0.5px borders so it's exactly 56px). Once the field grows past one
            // line — or a context chip is selected — it relaxes to a 16px radius
            // and grows to fit (textarea handles the height, capped at 4 lines).
            expanded ? "rounded-[18px]" : flat ? "rounded-[12px]" : "rounded-[48px]",
            "drop-shadow-[0px_1px_1px_oklch(0.21_0.034_263.436_/_0.05)]",
            "focus-within:ring-1 focus-within:ring-[var(--color-royal)] transition-shadow",
            // Disabled (questionnaire) OR generating: greyish fill + not-allowed across the field
            (isQuestionnaireActive || isLoading) ? "bg-[var(--color-surface-1)] cursor-not-allowed" : "bg-card"
          )}
        >
          {/* Shimmer layers — active while a response is being generated (mock
              flow) and briefly after every send. Inner sheen sweeps inside,
              border ring shimmers around the edge. */}
          {(isMockAgentChatActive || shimmer) && (
            <>
              <span aria-hidden="true" className="input-inner-shimmer" />
              <span aria-hidden="true" className="input-border-shimmer" />
            </>
          )}
          {/* Cosmetic-only border shimmer — no inner sheen, field stays
              interactive (not the disabled "generating" treatment above). */}
          {!isMockAgentChatActive && !shimmer && borderShimmer && (
            <span aria-hidden="true" className="input-border-shimmer" />
          )}
          {/* Hidden file picker driven by the "+" → "Add files or photos" menu item. */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
            className="hidden"
            onChange={handleFilesSelected}
          />

          {/* Attachments — always render above the text. Image files show as square
              thumbnails; docs/video/audio show as a row card (icon + name + type·size). */}
          {attachments.length > 0 && (
            <div className="relative z-10 mb-[10px]">
              {/* Edge fades — appear only when the row is clipped on that side. */}
              {attFade.left && (
                <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-[24px] bg-gradient-to-r from-white to-transparent" />
              )}
              {attFade.right && (
                <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-[24px] bg-gradient-to-l from-white to-transparent" />
              )}
              <div
                ref={attachmentsScrollRef}
                onScroll={updateAttFade}
                className="attachments-scroll flex flex-nowrap gap-[8px] overflow-x-auto"
              >
              {attachments.map((a) => {
                if (a.category === 'image' && a.previewUrl) {
                  return (
                    <div
                      key={a.id}
                      className="group relative w-[64px] h-[64px] rounded-[12px] overflow-hidden border border-[var(--color-line-input)] shrink-0"
                    >
                      <img src={a.previewUrl} alt={a.name} className="w-full h-full object-cover" />
                      {a.status === 'uploading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label={`Remove ${a.name}`}
                            onClick={() => removeAttachment(a.id)}
                            className="absolute top-[3px] right-[3px] flex items-center justify-center w-[18px] h-[18px] rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="w-[12px] h-[12px]" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" className="border-0 bg-foreground text-background">
                          Remove file
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                }
                const { Icon, className: iconClass } = getDocVisual(a.category);
                return (
                  <div
                    key={a.id}
                    className="group relative flex items-center gap-[10px] rounded-[12px] border border-[var(--color-line-input)] bg-card pl-[10px] pr-[12px] py-[8px] shrink-0"
                  >
                    <div className={cn("flex items-center justify-center w-[40px] h-[40px] rounded-[8px] shrink-0", iconClass)}>
                      <Icon className="w-[20px] h-[20px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[var(--color-ink)] truncate max-w-[220px]">
                        {a.name}
                      </p>
                      <p className="text-[12px] text-[var(--color-grey)]">
                        {a.status === 'uploading'
                          ? 'Uploading …'
                          : `${CATEGORY_LABEL[a.category]} · ${formatFileSize(a.size)}`}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Remove ${a.name}`}
                          onClick={() => removeAttachment(a.id)}
                          className="flex items-center justify-center w-[20px] h-[20px] rounded-full text-[var(--color-grey)] opacity-0 transition-opacity hover:bg-[oklch(0_0_0_/_0.06)] group-hover:opacity-100 shrink-0"
                        >
                          <X className="w-[14px] h-[14px]" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="start" className="border-0 bg-foreground text-background">
                        Remove file
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* Reply-context chip — shown above the field when following up on a
              deep-research plan ("Edit"). Per Figma it's a full-bleed chalk bar
              flush to the composer's top/side edges (the negative margins cancel
              the container's 12px padding; the rounded container clips it), with
              its own 16/12 inner padding. Not a divider. Its X clears the context. */}
          {replyContext && (
            <div className="relative z-10 -mx-[12px] -mt-[12px] mb-[12px] flex items-center justify-between gap-[8px] bg-[var(--color-surface-1)] px-[16px] py-[12px]">
              <span
                className="flex min-w-0 items-center gap-[6px] text-[13px] leading-[18px] text-[var(--color-grey)]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                <CornerDownRight className="h-[14px] w-[14px] shrink-0" />
                <span className="truncate">{replyContext}</span>
              </span>
              <button
                type="button"
                onClick={onClearReplyContext}
                aria-label="Clear reply context"
                className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-[var(--color-grey)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)] hover:text-[var(--color-ink)]"
              >
                <X className="h-[14px] w-[14px]" />
              </button>
            </div>
          )}

          {/* Flex-wrap row: textarea + chip + send. Compact single row by default;
              when `expanded`, the textarea takes the full width (basis-full) so it
              wraps everything else (chip, send) to a row below — text reaches the
              right edge and the send button sits bottom-right (ChatGPT-style). */}
          <div className={cn("relative z-10 flex flex-wrap items-center gap-x-[8px] transition-[gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]", expanded ? "gap-y-[18px]" : "gap-y-[10px]")}>
            {/* Auto-growing textarea — grows from 1 to 4 lines, then scrolls.
                Sits on top (row 1) when expanded; otherwise shares the row. */}
            <div
              className={cn(
                "relative min-w-0",
                expanded
                  ? "order-1 basis-full w-full"
                  : // Flat resting pill: fixed 32px box, flex-centered — matches the
                    // send button's own 32px box exactly regardless of the
                    // textarea's own (font-metric-dependent) content height.
                    cn("order-2 flex-1", flat && "flex h-[32px] items-center gap-[6px]")
              )}
            >
              {/* Placeholder icon — kept animating continuously (e.g. the
                  thinking-loader GIF) as a quiet "ask me anything" affordance.
                  Hidden once there's text or the field is busy generating. */}
              {placeholderIcon && flat && !expanded && !inputValue && !isLoading && (
                <img
                  ref={placeholderIconImgRef}
                  src={frozenPlaceholderIconSrc ?? placeholderIcon}
                  alt=""
                  aria-hidden="true"
                  crossOrigin="anonymous"
                  className="w-[26px] h-[26px] shrink-0 pointer-events-none"
                />
              )}
              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleFieldFocus}
                placeholder={isLoading ? "Generating response…" : placeholder}
                disabled={isQuestionnaireActive || isLoading}
                className={cn(
                  "chat-input-scroll block w-full min-w-0 resize-none bg-transparent border-0 p-0 pl-[8px] text-[14px] leading-[22px] text-foreground placeholder:text-[var(--color-grey)] focus:outline-none disabled:cursor-not-allowed",
                  // Resting flat pill centers the placeholder against the send
                  // button instead of top-anchoring it (which the shared 8px
                  // top-pad does for the roomy 'expanded'/'linear' shapes).
                  flat && !expanded ? "pt-0" : "pt-[8px]",
                  // Sharing the row with the placeholder icon — let it size to
                  // the remaining space instead of the full pill width.
                  placeholderIcon && flat && !expanded && "flex-1"
                )}
                style={{ fontFamily: "Manrope, sans-serif", fontWeight: 500, maxHeight: "88px" }}
                autoComplete="off"
              />
              {/* Bottom fade — appears once content scrolls past the 4-line cap */}
              {isScrollable && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[22px] bg-gradient-to-t from-white to-transparent"
                />
              )}
            </div>

            {/* + button — opens a popover with two actions: add photos & files,
                and the deep research agent. Left edge by default, bottom-left
                when expanded. Matches the 32×32 send-button size. Omitted
                entirely for minimal composer placements (showAddButton=false). */}
            {showAddButton && (
            <Popover
              open={showAddMenu}
              onOpenChange={(o) => {
                setShowAddMenu(o);
                if (!o) setAgentSubOpen(false);
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Add photos, files, or start deep research"
                  disabled={isQuestionnaireActive || isLoading}
                  className={cn(
                    "flex items-center justify-center w-[32px] h-[32px] rounded-[8px] shrink-0 transition-colors",
                    (isQuestionnaireActive || isLoading)
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[oklch(0_0_0_/_0.06)]",
                    showAddMenu && "bg-[oklch(0_0_0_/_0.06)]",
                    expanded ? "order-2" : "order-1"
                  )}
                >
                  <Plus className="w-[20px] h-[20px] text-[var(--color-charcoal)]" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-[248px] p-[4px] rounded-[12px]"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMenu(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-[10px] w-full rounded-[8px] px-[10px] py-[8px] text-left text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)]"
                >
                  <Paperclip className="w-[18px] h-[18px] text-[var(--color-charcoal)] shrink-0" />
                  Add photos and files
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMenu(false);
                    // Picking Deep research swaps out any custom-agent chip — the
                    // two modes are mutually exclusive, but both stay clickable;
                    // whichever is picked last wins and clears the other.
                    onSelectAgentChip?.(null);
                    setDeepResearchActive(true);
                    onDeepResearch?.();
                    onDeepResearchChange?.(true);
                  }}
                  className="flex items-center gap-[10px] w-full rounded-[8px] px-[10px] py-[8px] text-left text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)]"
                >
                  <Atom className="w-[18px] h-[18px] shrink-0 text-[var(--color-charcoal)]" strokeWidth={1.75} />
                  Deep research
                </button>
                {agentMenuEnabled && (
                  // "Custom agents" row + L2 flyout. The flyout is a descendant so
                  // hovering it keeps the row "entered"; the timeout bridges the gap.
                  <div
                    ref={agentSubRowRef}
                    className="relative"
                    onMouseEnter={openAgentSub}
                    onMouseLeave={closeAgentSubSoon}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (agentSubOpen) setAgentSubOpen(false);
                        else openAgentSub();
                      }}
                      className={cn(
                        "flex items-center gap-[10px] w-full rounded-[8px] px-[10px] py-[8px] text-left text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)]",
                        agentSubOpen && "bg-[oklch(0_0_0_/_0.06)]"
                      )}
                    >
                      <Bot className="w-[18px] h-[18px] text-[var(--color-charcoal)] shrink-0" strokeWidth={1.75} />
                      <span className="flex-1">Custom agents</span>
                      <ChevronRight className="w-[16px] h-[16px] text-[var(--color-grey)] shrink-0" />
                    </button>

                    {agentSubOpen && (
                      <div
                        ref={agentSubFlyoutRef}
                        onMouseEnter={openAgentSub}
                        onMouseLeave={closeAgentSubSoon}
                        style={{ top: `${agentSubFlyoutPos.top}px` }}
                        className={cn(
                          "absolute z-50 w-[236px] p-[4px] rounded-[12px] border border-border bg-popover shadow-[0px_8px_20px_0px_oklch(0_0_0_/_0.12)] animate-in fade-in-0 zoom-in-95",
                          agentSubFlyoutPos.side === 'right'
                            ? "left-full ml-[4px] slide-in-from-left-1"
                            : "right-full mr-[4px] slide-in-from-right-1"
                        )}
                      >
                        <div className="flex flex-col max-h-[220px] overflow-y-auto hover-scroll">
                          {(agents ?? []).map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => {
                                setDeepResearchActive(false);
                                onDeepResearchChange?.(false);
                                onSelectAgentChip?.(a);
                                setAgentSubOpen(false);
                                setShowAddMenu(false);
                              }}
                              className="flex items-center gap-[10px] w-full rounded-[8px] px-[10px] py-[8px] text-left text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)]"
                            >
                              {a.avatarSrc ? (
                                <img src={a.avatarSrc} alt="" className="w-[16px] h-[16px] shrink-0 rounded-full object-cover" />
                              ) : (
                                <Bot className="w-[16px] h-[16px] text-[var(--color-charcoal)] shrink-0" strokeWidth={1.75} />
                              )}
                              <span className="truncate">{a.name}</span>
                            </button>
                          ))}
                          {(agents ?? []).length === 0 && (
                            <p className="px-[10px] py-[8px] text-[13px] text-[var(--color-grey-soft)]">No agents yet</p>
                          )}
                        </div>
                        <div className="my-[4px] h-px bg-[var(--color-line)]" />
                        <button
                          type="button"
                          onClick={() => {
                            // Creating an agent supersedes deep research too —
                            // clear it so the two modes stay mutually exclusive.
                            setDeepResearchActive(false);
                            onDeepResearchChange?.(false);
                            setAgentSubOpen(false);
                            setShowAddMenu(false);
                            onCreateAgentFromComposer?.();
                          }}
                          className="flex items-center gap-[10px] w-full rounded-[8px] px-[10px] py-[8px] text-left text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)]"
                        >
                          <Plus className="w-[16px] h-[16px] text-[var(--color-charcoal)] shrink-0" />
                          Create a new agent
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </PopoverContent>
            </Popover>
            )}

            {/* Deep research chip — sits between the + button and the context
                chip once "Deep research" is picked from the + popover. */}
            {deepResearchActive && (
              <button
                type="button"
                onClick={() => {
                  setDeepResearchActive(false);
                  onDeepResearchChange?.(false);
                }}
                className={cn(
                  "order-3 inline-flex items-center gap-[4px] rounded-[4px] px-[6px] py-[4px] whitespace-nowrap composer-chip-enter",
                  deepResearchChipClass
                )}
                style={{ backgroundImage: deepResearchChipBg }}
              >
                <Atom className={cn("w-[14px] h-[14px] shrink-0", deepResearchChipText)} strokeWidth={1.75} />
                <span
                  className={cn("text-[12px] leading-[16px]", deepResearchChipText)}
                  style={{ fontFamily: "Manrope, sans-serif", fontWeight: 400 }}
                >
                  Deep research
                </span>
                <X className={cn("w-[14px] h-[14px] shrink-0", deepResearchChipText)} />
              </button>
            )}

            {/* Selected agent chip — set from the "+" → "Add to agent" submenu.
                The × is always visible; the tooltip repeats the agent name. */}
            {selectedAgentChip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "order-3 group inline-flex items-center gap-[4px] rounded-[4px] px-[6px] py-[4px] whitespace-nowrap composer-chip-enter",
                      agentChipClass
                    )}
                    style={{ backgroundImage: agentChipBg }}
                  >
                    {selectedAgentChip.avatarSrc ? (
                      <img src={selectedAgentChip.avatarSrc} alt="" className="w-[14px] h-[14px] shrink-0 rounded-full object-cover" />
                    ) : (
                      <Globe className={cn("w-[14px] h-[14px] shrink-0", agentChipText)} strokeWidth={1.75} />
                    )}
                    <span
                      className={cn("max-w-[140px] truncate text-[12px] leading-[16px]", agentChipText)}
                      style={{ fontFamily: "Manrope, sans-serif", fontWeight: 400 }}
                    >
                      {selectedAgentChip.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectAgentChip?.(null)}
                      aria-label={`Remove ${selectedAgentChip.name}`}
                      className="inline-flex items-center justify-center shrink-0"
                    >
                      <X className={cn("w-[14px] h-[14px]", agentChipText)} />
                    </button>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]"
                  style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
                >
                  {selectedAgentChip.name}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Context chip — bottom-left when selected (after the + button) */}
            {selectedContextChip && (
              <button
                type="button"
                onClick={onClearSelectedContextChip}
                className={cn(
                  "order-4 inline-flex items-center gap-[4px] rounded-[4px] px-[6px] py-[4px] whitespace-nowrap composer-chip-enter",
                  deepResearchActive ? deepResearchChipClass : promptChipClass
                )}
                style={{
                  backgroundImage: deepResearchActive ? deepResearchChipBg : promptChipBg,
                }}
              >
                <span
                  className={cn(
                    "text-[12px] leading-[16px]",
                    deepResearchActive ? deepResearchChipText : promptChipText
                  )}
                  style={{ fontFamily: "Manrope, sans-serif", fontWeight: 400 }}
                >
                  {selectedContextChip}
                </span>
                <X
                  className={cn(
                    "w-[14px] h-[14px] shrink-0",
                    deepResearchActive ? deepResearchChipText : promptChipText
                  )}
                />
              </button>
            )}

            {/* Send button — far right (always last in the row). While a response
                is generating it becomes the stop button (Figma node 16318:13144). */}
            <div className="order-5 flex shrink-0 ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={isLoading ? handleStopClick : handleSendClick}
                    disabled={isQuestionnaireActive}
                    className={cn(
                      // Fixed 32×32 in every state so the field height never changes
                      // (default field height = 56px: 32px button + 2×12px padding).
                      "relative flex items-center justify-center overflow-hidden rounded-[6px] w-[32px] h-[32px] shrink-0 transition-all duration-200",
                      isActive
                        ? "border-[0.75px] border-[var(--color-royal-strong)] shadow-[0px_1px_0px_0px_oklch(0_0_0_/_0.02)]"
                        : "border-0",
                      // The field itself is not-allowed while generating, but the stop
                      // button stays live — restore the pointer on it.
                      isLoading && "cursor-pointer hover:brightness-95",
                      isQuestionnaireActive && "opacity-50 cursor-not-allowed"
                    )}
                    style={{
                      background: isActive
                        ? "linear-gradient(180deg, oklch(1 0 0 / 0) 0%, oklch(1 0 0 / 0.24) 100%), linear-gradient(90deg, var(--color-royal) 0%, var(--color-royal) 100%)"
                        : "linear-gradient(90deg, oklch(0 0 0 / 0.08) 0%, oklch(0 0 0 / 0.08) 100%), linear-gradient(180deg, oklch(1 0 0 / 0) 0%, oklch(1 0 0 / 0.24) 100%)",
                    }}
                    aria-label={isLoading ? "Stop Zeno response" : "Send message"}
                  >
                    {/* Inner highlight for active state */}
                    {isActive && (
                      <span
                        className="absolute inset-0 rounded-[6px] pointer-events-none"
                        style={{ boxShadow: "inset 0px 1px 1px 0px oklch(1 0 0 / 0.25)" }}
                      />
                    )}
                    {isLoading ? (
                      /* Generating — grey rounded square (stop) per Figma (node 16318:13144) */
                      <span className="block w-3 h-3 rounded-[4px] bg-[var(--color-grey)] relative z-10" />
                    ) : (
                      <ArrowUp className="w-4 h-4 text-white relative z-10" />
                    )}
                  </button>
                </TooltipTrigger>
                {isLoading && (
                  <TooltipContent
                    side="top"
                    className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]"
                    style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
                  >
                    Stop Zeno response
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <span 
        ref={measurementRef} 
        aria-hidden="true" 
        style={{
          position: 'absolute',
          visibility: 'hidden',
          height: 'auto',
          width: 'auto',
          whiteSpace: 'pre',
          fontSize: inputRef.current ? window.getComputedStyle(inputRef.current).fontSize : 'inherit',
          fontFamily: inputRef.current ? window.getComputedStyle(inputRef.current).fontFamily : 'inherit',
          fontWeight: inputRef.current ? window.getComputedStyle(inputRef.current).fontWeight : 'inherit',
          fontStyle: inputRef.current ? window.getComputedStyle(inputRef.current).fontStyle : 'inherit',
          letterSpacing: inputRef.current ? window.getComputedStyle(inputRef.current).letterSpacing : 'inherit',
          textTransform: (inputRef.current ? window.getComputedStyle(inputRef.current).textTransform : 'inherit') as CSSProperties['textTransform'],
        }}
      />
      <Popover open={showMentionList} onOpenChange={setShowMentionList}>
        <PopoverTrigger asChild>
          <input
            ref={inputRef as unknown as React.Ref<HTMLInputElement>}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !showMentionList && !e.shiftKey && inputValue.trim()) {
                e.preventDefault();
                handleSendClick();
              }
            }}
            placeholder="Type your message or use '@' to mention an agent..."
            disabled={isQuestionnaireActive}
            className={cn(
              "w-full h-[56px] pl-4 pr-0 pt-3 pb-3 rounded-lg border border-[var(--color-line-input)] dark:border-input-border dark:bg-input focus:outline-none focus:ring-1 focus:ring-[var(--color-royal)] dark:focus:ring-ring transition-shadow text-sm placeholder:text-[var(--color-grey)] dark:placeholder:text-foreground-muted dark:text-foreground shadow-[0px_1px_2px_0px_oklch(0.21_0.034_263.436_/_0.05)]",
              isQuestionnaireActive && "cursor-not-allowed opacity-50 bg-muted"
            )}
            autoComplete="off"
          />
        </PopoverTrigger>
        {showMentionList && filteredAgents.length > 0 && (
          <PopoverContent 
            className="w-48 p-0"
            side="top"
            align="start"
            alignOffset={-5}
            onEscapeKeyDown={() => setShowMentionList(false)}
            onOpenAutoFocus={(e) => e.preventDefault()}
            ref={popoverRef}
          >
            <Command>
              <CommandList>
                <CommandEmpty>No agent found.</CommandEmpty>
                <CommandGroup>
                  {filteredAgents.map((agent) => {
                    const Icon = agent.icon;
                    return (
                      <CommandItem
                        key={agent.id}
                        onSelect={() => { 
                          console.log('Selected:', agent.name);
                          insertMention(agent); 
                        }}
                        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent"
                        value={agent.name}
                      >
                        <Avatar className={cn("h-5 w-5 flex items-center justify-center text-xs", (Icon && !agent.avatarSrc) ? agent.colorClass : 'bg-transparent')}>
                          {/* Priority: avatarSrc (SVG) > Icon (Lucide) > initials fallback */}
                          {agent.avatarSrc ? (
                            <>
                              <AvatarImage src={agent.avatarSrc} alt={agent.name} className="h-full w-full object-cover" />
                              <AvatarFallback>{agent.initials}</AvatarFallback>
                            </>
                          ) : Icon ? (
                            <Icon className="h-3 w-3" />
                          ) : (
                            <AvatarFallback>{agent.initials}</AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm">{agent.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        )}
      </Popover>
      <button 
        type="button"
        onClick={isMockAgentChatActive ? handleStopClick : handleSendClick}
        disabled={isQuestionnaireActive || (!isMockAgentChatActive && !inputValue.trim())}
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg w-8 h-8 flex items-center justify-center transition-colors",
          isMockAgentChatActive 
            ? "text-[var(--color-grey)] dark:text-foreground-muted hover:text-cobalt-blue dark:hover:text-accent" 
            : inputValue.trim() 
              ? "bg-[var(--color-navy-deep)] text-white hover:bg-[var(--color-navy-deepest)]" 
              : "bg-surface-2 text-grey-soft cursor-not-allowed",
          isQuestionnaireActive && "opacity-50 cursor-not-allowed"
        )}
        aria-label={isMockAgentChatActive ? "Stop conversation" : "Send message"}
      >
        {isMockAgentChatActive ? <StopCircle className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
      </button>
    </div>
  );
};

export default ChatInput;
