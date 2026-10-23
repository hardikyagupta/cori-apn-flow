import React from 'react';
import { SquarePen, MessageSquare, Bookmark, CalendarClock, Settings } from 'lucide-react';

interface LhsSidebarCollapsedProps {
  onNewChat?: () => void;
  onOpenChats?: () => void;
  onOpenBookmarks?: () => void;
  onOpenScheduler?: () => void;
  onOpenSettings?: () => void;
}

const LhsSidebarCollapsed: React.FC<LhsSidebarCollapsedProps> = ({
  onNewChat,
  onOpenChats,
  onOpenBookmarks,
  onOpenScheduler,
  onOpenSettings,
}) => {
  const actions = [
    { key: 'new-chat', icon: SquarePen, label: 'New chat', onClick: onNewChat },
    { key: 'chats', icon: MessageSquare, label: 'Chats', onClick: onOpenChats },
    { key: 'bookmarks', icon: Bookmark, label: 'Bookmarks', onClick: onOpenBookmarks },
    { key: 'scheduler', icon: CalendarClock, label: 'Scheduled', onClick: onOpenScheduler },
  ];

  return (
    <div className="flex flex-col items-center w-[64px] h-full bg-sidebar-background pb-[16px] flex-shrink-0">
      {/* Top: logo only — h-56 to align center with RHS header icons */}
      <div className="flex items-center justify-center h-[56px] shrink-0">
        <div className="flex items-center justify-center size-[40px]">
          <div className="flex items-center justify-center rounded-full overflow-hidden shrink-0 size-[24px] bg-[var(--color-plum)]">
            <img
              src="/co-marketer-logo.gif"
              alt="Zeno"
              className="size-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Middle: icon-only menu actions (32x32 squares) */}
      <div className="flex flex-1 flex-col items-center min-h-0 overflow-hidden pt-[20px]">
        <div className="flex flex-col gap-[4px] items-center">
          {actions.map(({ key, icon: Icon, label, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              aria-label={label}
              title={label}
              className="flex items-center justify-center size-[40px] rounded-[8px] hover:bg-[var(--color-surface-1)] transition-colors"
            >
              <Icon className="size-[16px] text-[var(--color-charcoal)] shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Bottom: settings (32x32 square). */}
      <div className="flex items-center justify-center shrink-0">
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Settings"
          className="flex items-center justify-center size-[40px] rounded-[8px] hover:bg-[var(--color-surface-1)] transition-colors"
        >
          <Settings className="size-[18px] text-[var(--color-charcoal)] shrink-0" />
        </button>
      </div>
    </div>
  );
};

export default LhsSidebarCollapsed;
