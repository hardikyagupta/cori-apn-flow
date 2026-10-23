import React, { useState, useRef, useEffect } from 'react';
import { Plus, MoreHorizontal, Search, PanelLeftClose, ArrowRightToLine, Settings, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import ChatActionsMenu from './ChatActionsMenu';
import DeleteChatDialog from './DeleteChatDialog';
import SearchChatsModal from './SearchChatsModal';

// Chats menu icon (Phosphor "chats" glyph). Uses currentColor so it inherits
// the same charcoal tint as the other menu icons.
export const ChatsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 256" fill="currentColor" className={className} aria-hidden="true">
    <path d="M232.07,186.76a80,80,0,0,0-62.5-114.17A80,80,0,1,0,23.93,138.76l-7.27,24.71a16,16,0,0,0,19.87,19.87l24.71-7.27a80.39,80.39,0,0,0,25.18,7.35,80,80,0,0,0,108.34,40.65l24.71,7.27a16,16,0,0,0,19.87-19.86ZM62,159.5a8.28,8.28,0,0,0-2.26.32L32,168l8.17-27.76a8,8,0,0,0-.63-6,64,64,0,1,1,26.26,26.26A8,8,0,0,0,62,159.5Zm153.79,28.73L224,216l-27.76-8.17a8,8,0,0,0-6,.63,64.05,64.05,0,0,1-85.87-24.88A79.93,79.93,0,0,0,174.7,89.71a64,64,0,0,1,41.75,92.48A8,8,0,0,0,215.82,188.23Z" />
  </svg>
);

// Bookmark menu icon (Phosphor "bookmark-simple" glyph) — matches the ChatsIcon
// family/weight so the two menu icons read as one set. Uses currentColor.
export const BookmarkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 256" fill="currentColor" className={className} aria-hidden="true">
    <path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Zm0,177.57-51.77-32.35a8,8,0,0,0-8.48,0L72,209.57V48H184Z" />
  </svg>
);

// Reports menu icon (Phosphor "chart-bar" glyph) — same family/weight as the
// Chats/Bookmarks glyphs so all menu icons read as one set. Uses currentColor.
export const ReportsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 256" fill="currentColor" className={className} aria-hidden="true">
    <path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z" />
  </svg>
);

// Scheduler menu icon (Phosphor "calendar-check" glyph) — same family/weight as
// the other menu glyphs so all icons read as one set. Uses currentColor.
export const SchedulerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 256" fill="currentColor" className={className} aria-hidden="true">
    <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48Zm136,160H48V96H208V208Zm-30.34-90.34a8,8,0,0,1,0,11.31l-40,40a8,8,0,0,1-11.32,0l-20-20a8,8,0,0,1,11.32-11.31L132,152l34.34-34.35A8,8,0,0,1,177.66,117.66Z" />
  </svg>
);

// Custom agents menu icon (Phosphor "robot" glyph) — same family/weight as the
// Chats/Bookmarks/Reports glyphs so all menu icons read as one set. currentColor.
export const CustomAgentsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 256" fill="currentColor" className={className} aria-hidden="true">
    <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16ZM104,140a12,12,0,1,1-12-12A12,12,0,0,1,104,140Zm72,0a12,12,0,1,1-12-12A12,12,0,0,1,176,140Zm-8,52a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,192ZM16,120a8,8,0,0,1,8,8v24a8,8,0,0,1-16,0V128A8,8,0,0,1,16,120Zm232,0a8,8,0,0,1,8,8v24a8,8,0,0,1-16,0V128A8,8,0,0,1,248,120Z" />
  </svg>
);

export interface LhsChatItem {
  id: string;
  title: string;
  time: string;
  /** Who started the chat. Defaults to the signed-in user in the history list. */
  owner?: string;
  /** Absolute ISO timestamp. When absent, it's derived from `time`. */
  timestamp?: string;
  /** Set when this chat was started from a custom agent's page. */
  agentId?: string;
}

/** Menu-action keys that can be highlighted as the current destination. */
export type LhsNavKey = 'new-chat' | 'chats' | 'custom-agents' | 'reports' | 'scheduler' | 'bookmarks';

interface LhsSidebarProps {
  collapsed?: boolean;
  chats?: LhsChatItem[];
  /** Which menu action is the page currently on — gets the 8% black row highlight. */
  activeNav?: LhsNavKey | null;
  activeChatId?: string | null;
  // Chat that is currently generating output — shows a live "active" indicator.
  busyChatId?: string | null;
  // Chat with a deep research still running — shows a persistent spinner until done.
  researchingChatId?: string | null;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onOpenCustomAgents?: () => void;
  onOpenChats?: () => void;
  onOpenBookmarks?: () => void;
  onOpenReports?: () => void;
  onOpenScheduler?: () => void;
  onOpenSettings?: () => void;
  // Collapse/expand the sidebar. The header toggle collapses; when collapsed the
  // logo doubles as the expand button.
  onToggleCollapse?: () => void;
}

// `owner` is the byline shown in the chats history; rows that omit it are
// attributed to the signed-in user (see CURRENT_USER_NAME in lib/chatMeta).
export const defaultChats: LhsChatItem[] = [
  { id: '1', title: 'Animate thumbs feedback', time: '1h' },
  { id: '2', title: 'Add follow-up questions scenario for onboarding edge cases', time: '2h', owner: 'Dani Bristow' },
  { id: '3', title: 'Create reusable workflow skill', time: '2h' },
  { id: '4', title: 'Check record workflow feature and validate the export pipeline end to end', time: '2h', owner: 'Jane Guo' },
  { id: '5', title: 'Inspect shimmer component', time: '16h', owner: 'Priya Nair' },
  { id: '6', title: 'Add teaser type icons', time: '2d' },
  { id: '7', title: 'Inspect shimmer loading skeleton across all breakpoints', time: '2d', owner: 'Marcus Lee' },
  { id: '8', title: 'Name shimmer border component', time: '6d', owner: 'Dani Bristow' },
  { id: '9', title: 'Access Figma MCP', time: '1w' },
  { id: '10', title: 'Refactor sidebar layout and the collapse transition behaviour', time: '1w', owner: 'Rahul Menon' },
  { id: '11', title: 'Update color palette tokens', time: '1w', owner: 'Sofia Almeida' },
  { id: '12', title: 'Fix scroll overflow in chat list', time: '2w' },
  { id: '13', title: 'Design new onboarding flow', time: '2w', owner: 'Jane Guo' },
  { id: '14', title: 'Integrate MCP server tools', time: '2w', owner: 'Marcus Lee' },
  { id: '15', title: 'Build prompt chaining demo', time: '3w' },
  { id: '16', title: 'Export design tokens to CSS custom properties for the whole system', time: '3w', owner: 'Sofia Almeida' },
  { id: '17', title: 'Review Claude API rate limits', time: '1mo', owner: 'Rahul Menon' },
  { id: '18', title: 'Optimize token usage in chains', time: '1mo' },
  { id: '19', title: 'Write tests for agent hooks', time: '1mo', owner: 'Priya Nair' },
  { id: '20', title: 'Ship Zeno v1', time: '1mo', owner: 'Dani Bristow' },
];

// 40×40 slot that centers an icon. Matches the collapsed rail's inner width
// (64 − 2×12px padding = 40px) so each menu button becomes a perfect 40×40 square
// when collapsed, the icon sits dead-center, and it never moves when expanded.
// The icon's left edge lands at 24px — the shared start line for every label.
const ICON_SLOT = 'flex items-center justify-center w-[40px] h-[40px] shrink-0';

// Small dark tooltip shown to the right of an icon (only rendered when collapsed)
const RailTooltip: React.FC<{ label: string }> = ({ label }) => (
  <span
    className="pointer-events-none absolute left-full ml-[10px] top-1/2 -translate-y-1/2 z-[100] whitespace-nowrap rounded-[6px] bg-foreground px-[8px] py-[4px] text-[12px] leading-[16px] text-background opacity-0 translate-x-[-4px] transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0"
    style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
  >
    {label}
  </span>
);

const LhsSidebar: React.FC<LhsSidebarProps> = ({
  collapsed = false,
  chats = defaultChats,
  activeNav = null,
  activeChatId = '1',
  busyChatId = null,
  researchingChatId = null,
  onSelectChat,
  onNewChat,
  onOpenCustomAgents,
  onOpenChats,
  onOpenBookmarks,
  onOpenReports,
  onOpenScheduler,
  onOpenSettings,
  onToggleCollapse,
}) => {
  const [chatsOpen] = useState(true);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local (prototype) state for per-chat actions: rename overrides, deletions,
  // bookmarks, which row's menu is open, and the inline-rename editing state.
  const [titleOverrides, setTitleOverrides] = useState<Record<string, string>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  const startRename = (id: string, current: string) => {
    setMenuOpenId(null);
    setRenamingId(id);
    setRenameValue(current);
  };
  const commitRename = () => {
    if (renamingId) {
      const next = renameValue.trim();
      if (next) setTitleOverrides((prev) => ({ ...prev, [renamingId]: next }));
    }
    setRenamingId(null);
  };
  const cancelRename = () => setRenamingId(null);
  const toggleBookmark = (id: string) =>
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  // Delete goes through a confirmation dialog first.
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const requestDelete = (id: string, title: string) => {
    setMenuOpenId(null);
    setDeleteTarget({ id, title });
  };
  const confirmDelete = () => {
    if (deleteTarget) setDeletedIds((prev) => new Set(prev).add(deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.classList.add('is-scrolling');
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      el.classList.remove('is-scrolling');
    }, 800);
  };

  const menuActions = [
    // New chat's plus sits in a light-blue pill (Figma), so it renders specially.
    // Search now lives in the header (next to the collapse toggle), not here.
    { key: 'new-chat', label: 'New chat', icon: Plus, onClick: onNewChat, isNewChat: true },
    { key: 'chats', label: 'Chats', icon: ChatsIcon, onClick: onOpenChats },
    { key: 'custom-agents', label: 'Agents', icon: CustomAgentsIcon, onClick: onOpenCustomAgents },
    { key: 'reports', label: 'Reports', icon: ReportsIcon, onClick: onOpenReports },
    { key: 'scheduler', label: 'Scheduled', icon: SchedulerIcon, onClick: onOpenScheduler },
    { key: 'bookmarks', label: 'Bookmarks', icon: BookmarkIcon, onClick: onOpenBookmarks },
  ];

  // Labels self-clip via max-width (so the root can be overflow-visible for tooltips)
  // and fade out. Icons live in fixed slots and never move, so there is no jump.
  const labelCls = 'overflow-hidden whitespace-nowrap';
  const labelStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    maxWidth: collapsed ? 0 : 200,
    opacity: collapsed ? 0 : 1,
    transition: 'max-width 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease',
    ...extra,
  });

  return (
    <div
      // When collapsed, the whole rail is a click target that expands the sidebar
      // (Claude-style). Interactive children (logo, menu rows, settings) stop
      // propagation so they keep their own actions instead of expanding.
      onClick={collapsed ? onToggleCollapse : undefined}
      className={cn(
        'group/lhs atmo-glass relative z-30 flex flex-col items-start h-full bg-sidebar-background flex-shrink-0 border-r border-[var(--color-line)]',
        // overflow-visible when collapsed lets the rail tooltips escape the 64px width
        collapsed ? 'overflow-visible cursor-col-resize' : 'overflow-hidden'
      )}
      style={{ width: collapsed ? 64 : 288, transition: 'width 300ms cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      {/* Header — logo + wordmark + collapse toggle. The logo circle sits in the
          centered icon slot; when collapsed it doubles as the expand button
          (logo fades to a panel-open icon on hover). The wordmark clips/fades. */}
      <div className="flex items-center px-[12px] h-[56px] w-full shrink-0">
        <button
          type="button"
          onClick={collapsed ? (e) => { e.stopPropagation(); onToggleCollapse?.(); } : undefined}
          aria-label={collapsed ? 'Expand sidebar' : 'Zeno'}
          className={cn(
            'group relative flex items-center justify-center w-[40px] h-[40px] shrink-0 rounded-[8px]',
            'cursor-default'
          )}
        >
          {/* Hover highlight is a centered 32×32 box (smaller than the 40px hit area). */}
          {collapsed && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[32px] rounded-[8px] transition-colors group-hover:bg-[oklch(0_0_0_/_0.06)]" />
          )}
          <span
            className={cn(
              'relative flex items-center justify-center rounded-full overflow-hidden size-[24px] bg-[var(--color-plum)] transition-opacity duration-150',
              // Hovering ANYWHERE in the collapsed rail reveals the expand hint.
              collapsed && 'group-hover/lhs:opacity-0'
            )}
          >
            <img
              src="/co-marketer-logo.gif"
              alt="Zeno"
              className="size-full object-cover"
            />
          </span>
          {collapsed && (
            <>
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover/lhs:opacity-100">
                <ArrowRightToLine className="size-[16px] text-[var(--color-slate)]" />
              </span>
              <RailTooltip label="Expand sidebar" />
            </>
          )}
        </button>

        <span
          className={cn('flex-1 min-w-0 font-bold text-[16px] leading-[20px] text-[var(--color-ink)]', labelCls)}
          style={labelStyle({ fontFamily: 'Manrope, sans-serif' })}
        >
          Zeno
        </span>

        {!collapsed && (
          <div className="flex items-center gap-[2px] shrink-0">
            {/* Search — opens the same modal as the old menu item */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(true)}
                  aria-label="Search"
                  className="flex items-center justify-center p-[8px] rounded-[8px] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors shrink-0"
                >
                  <Search className="size-[16px] text-[var(--color-slate)]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                Search
              </TooltipContent>
            </Tooltip>
            {/* Collapse toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  aria-label="Collapse sidebar"
                  className="flex items-center justify-center p-[8px] rounded-[8px] hover:bg-[oklch(0_0_0_/_0.06)] transition-colors shrink-0"
                >
                  <PanelLeftClose className="size-[16px] text-[var(--color-slate)]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-0 bg-foreground text-background text-[12px] leading-[16px] px-[8px] py-[4px]" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
                Collapse sidebar
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Menu actions — icons centered in 40-wide slots (aligned with the logo),
          32px-tall rows. */}
      <div className="flex flex-col gap-[4px] items-start w-full px-[12px] pt-[8px] shrink-0">
        {menuActions.map(({ key, label, icon: Icon, onClick, isNewChat }) => {
          const isActive = activeNav === key;
          return (
          <button
            key={key}
            type="button"
            onClick={collapsed ? (e) => { e.stopPropagation(); onClick?.(); } : onClick}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group relative flex h-[32px] items-center w-full rounded-[8px] transition-colors',
              // Expanded: full-width row highlight. Collapsed: the highlight lives on
              // the inner 32×32 box instead (see icon slot), so the button itself has none.
              collapsed
                ? 'cursor-default'
                : isActive
                  ? 'bg-[oklch(0_0_0_/_0.08)]'
                  : 'hover:bg-[oklch(0_0_0_/_0.06)]'
            )}
          >
            <span
              className={cn(
                'flex items-center justify-center shrink-0 transition-colors',
                collapsed
                  ? cn(
                      'size-[32px] mx-auto rounded-[8px]',
                      isActive ? 'bg-[oklch(0_0_0_/_0.08)]' : 'group-hover:bg-[oklch(0_0_0_/_0.06)]',
                    )
                  : 'w-[40px] h-[32px]'
              )}
            >
              {isNewChat ? (
                <span className="flex items-center justify-center rounded-full bg-[oklch(0_0_0_/_0.08)] p-[5px] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.15] group-hover:-rotate-6">
                  <Plus className="size-[12px] text-[var(--color-charcoal)]" strokeWidth={2.5} />
                </span>
              ) : (
                <Icon className="size-[18px] text-[var(--color-charcoal)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.15] group-hover:-rotate-6" />
              )}
            </span>
            <span
              className={cn('text-[13px] text-[var(--color-charcoal)]', labelCls)}
              style={labelStyle({ fontFamily: 'Manrope, sans-serif', fontWeight: isActive ? 500 : 400 })}
            >
              {label}
            </span>
            {collapsed && <RailTooltip label={label} />}
          </button>
          );
        })}
      </div>

      {/* Chats section header + list — fades/clips away when collapsed */}
      <div
        className={cn(
          'flex flex-col flex-1 min-h-0 w-full transition-opacity duration-150',
          collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 delay-100'
        )}
      >
        {/* Section header */}
        <div className="flex gap-[8px] items-center pl-[24px] py-[8px] w-full shrink-0 mt-[8px]">
          <span
            className="text-[12px] leading-[16px] text-[var(--color-grey)] tracking-[0.035px] whitespace-nowrap"
            style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}
          >
            Recents
          </span>
        </div>

        {/* Scrollable chat list */}
        {chatsOpen && (
          <div ref={scrollRef} onScroll={handleScroll} className="chat-scroll flex-1 min-h-0 overflow-y-auto w-full px-[12px] pb-[8px]">
            <div className="flex flex-col gap-[2px] items-start w-full">
              {chats.filter((chat) => !deletedIds.has(chat.id)).map((chat) => {
                const isActive = chat.id === activeChatId;
                const isResearching = chat.id === researchingChatId;
                const isBusy = chat.id === busyChatId && !isResearching;
                const isRenaming = chat.id === renamingId;
                const isMenuOpen = chat.id === menuOpenId;
                const title = titleOverrides[chat.id] ?? chat.title;
                return (
                  <div
                    key={chat.id}
                    className={cn(
                      'group relative flex gap-[8px] h-[34px] items-center pr-[8px] w-full rounded-[10px] overflow-hidden transition-colors',
                      isRenaming
                        ? 'pl-[12px] bg-[var(--color-surface-0)] ring-2 ring-inset ring-[var(--color-royal)]'
                        : cn('pl-[12px]', isActive ? 'bg-[oklch(0_0_0_/_0.12)]' : 'hover:bg-[oklch(0_0_0_/_0.06)]')
                    )}
                  >
                    {isRenaming ? (
                      <input
                        ref={renameInputRef}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          else if (e.key === 'Escape') cancelRename();
                        }}
                        onBlur={commitRename}
                        className="flex-1 min-w-0 bg-transparent border-0 p-0 text-[13px] text-[var(--color-charcoal)] focus:outline-none"
                        style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelectChat?.(chat.id)}
                          className="flex-1 min-w-0 text-left text-[13px] text-[var(--color-charcoal)] whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: isActive ? 500 : 400 }}
                        >
                          {title}
                        </button>
                        {/* Right slot: deep-research spinner while a research is
                            running, otherwise the live "generating" dot; the
                            three-dot menu takes over on hover / when open. */}
                        {isResearching && (
                          <Loader2
                            className="size-[14px] shrink-0 mr-[4px] animate-spin text-[var(--color-royal)] group-hover:hidden"
                            aria-label="Deep research running"
                          />
                        )}
                        {isBusy && (
                          <span className="relative flex size-[8px] shrink-0 mr-[4px]" aria-label="Generating">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-royal)] opacity-75" />
                            <span className="relative inline-flex size-[8px] rounded-full bg-[var(--color-royal)]" />
                          </span>
                        )}
                        <ChatActionsMenu
                          open={isMenuOpen}
                          onOpenChange={(o) => setMenuOpenId(o ? chat.id : null)}
                          align="start"
                          side="bottom"
                          isBookmarked={bookmarkedIds.has(chat.id)}
                          onRename={() => startRename(chat.id, title)}
                          onBookmark={() => toggleBookmark(chat.id)}
                          onDelete={() => requestDelete(chat.id, title)}
                          trigger={
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              aria-label="Chat options"
                              className={cn(
                                'items-center justify-center size-[24px] rounded-[6px] text-[var(--color-charcoal)] hover:bg-[oklch(0_0_0_/_0.1)] data-[state=open]:bg-[oklch(0_0_0_/_0.1)] shrink-0',
                                isMenuOpen ? 'flex' : 'hidden group-hover:flex'
                              )}
                            >
                              <MoreHorizontal className="size-[16px]" />
                            </button>
                          }
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer — pinned to the bottom of the rail. Matches the menu-row
          layout so the icon aligns with the logo/menu icons at 24px. Opens
          Settings, whose rail carries the brand wiki alongside theme, report
          customization and profile. */}
      <div className="mt-auto flex w-full flex-col px-[12px] pb-[12px] pt-[8px] shrink-0">
        <button
          type="button"
          onClick={collapsed ? (e) => { e.stopPropagation(); onOpenSettings?.(); } : onOpenSettings}
          aria-label="Settings"
          className={cn(
            'group relative flex h-[32px] items-center w-full rounded-[8px] transition-colors',
            collapsed ? 'cursor-default' : 'hover:bg-[oklch(0_0_0_/_0.06)]'
          )}
        >
          <span
            className={cn(
              'flex items-center justify-center shrink-0 transition-colors',
              collapsed
                ? 'size-[32px] mx-auto rounded-[8px] group-hover:bg-[oklch(0_0_0_/_0.06)]'
                : 'w-[40px] h-[32px]'
            )}
          >
            <Settings className="size-[18px] text-[var(--color-charcoal)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.15] group-hover:-rotate-6" />
          </span>
          <span
            className={cn('text-[13px] text-[var(--color-charcoal)]', labelCls)}
            style={labelStyle({ fontFamily: 'Manrope, sans-serif', fontWeight: 400 })}
          >
            Settings
          </span>
          {collapsed && <RailTooltip label="Settings" />}
        </button>
      </div>

      <DeleteChatDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        chatName={deleteTarget?.title}
        onConfirm={confirmDelete}
      />

      <SearchChatsModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        chats={chats}
        onSelectChat={(id) => {
          onSelectChat?.(id);
          setSearchModalOpen(false);
        }}
        onNewChat={onNewChat}
      />

    </div>
  );
};

export default LhsSidebar;
