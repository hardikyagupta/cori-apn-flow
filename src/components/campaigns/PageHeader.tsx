import type { ReactNode } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import sparkle from "/campaign-assets/ic-sparkle-ai.gif";
import CreateWithAINudge from "./CreateWithAINudge";

export interface CtaMenuItem {
  label: string;
  icon: ReactNode;
  onSelect?: () => void;
  /** A second level, shown as a flyout to the left on hover. */
  submenu?: { label: string; icon: ReactNode; disabled?: boolean; onSelect?: () => void }[];
}

/** Title block with the search affordance + primary create CTA. */
export default function PageHeader({
  title = "Campaigns",
  subtitle = "View and manage campaigns",
  ctaLabel = "New campaign",
  showCtaChevron = true,
  showCtaAiIcon = false,
  showAiCta = false,
  showAiNudge = false,
  onCloseAiNudge,
  onCtaClick,
  onAiCtaClick,
  ctaMenu,
}: {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  /** Hides the chevron on the primary CTA (it doesn't open a menu everywhere). */
  showCtaChevron?: boolean;
  /** Leads the primary CTA with an AI sparkle (e.g. Segments' "Create"). */
  showCtaAiIcon?: boolean;
  /** Shows a secondary "Create with AI" button before the primary CTA. */
  showAiCta?: boolean;
  /** Shows the discovery nudge dropped below the Create with AI button. */
  showAiNudge?: boolean;
  onCloseAiNudge?: () => void;
  /** Click handler for the primary CTA (e.g. open the create flow). */
  onCtaClick?: () => void;
  /** Click handler for the secondary "Create with AI" button. */
  onAiCtaClick?: () => void;
  /** Turns the primary CTA into a dropdown of these options. */
  ctaMenu?: CtaMenuItem[];
}) {
  const ctaButton = (
    <button
      onClick={onCtaClick}
      className="dc-btn dc-btn-primary shadow-[0px_5px_5px_rgba(0,0,0,0.05)]"
    >
      {/* The animated AI sparkle asset. It's royal blue, which would vanish
          against this button's royal-blue fill, so it's flattened to white. */}
      {showCtaAiIcon && (
        <img
          src={sparkle}
          alt=""
          className="h-4 w-4 [filter:brightness(0)_invert(1)]"
        />
      )}
      {ctaLabel}
      {showCtaChevron && <ChevronDown className="h-4 w-4" strokeWidth={2} />}
    </button>
  );

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="font-manrope text-[20px] font-bold leading-tight text-[#17173A]">
          {title}
        </h1>
        <p className="mt-1 font-manrope text-[13px] text-[#6F6F8D]">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          aria-label={`Search ${title.toLowerCase()}`}
          className="grid h-[29px] w-[29px] place-items-center rounded-[2px] border border-[#DDE2EE] bg-white text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF]"
        >
          <Search className="h-4 w-4" strokeWidth={1.8} />
        </button>
        {showAiCta && (
          <div className="relative">
            <button
              onClick={onAiCtaClick}
              className="dc-btn dc-btn-secondary"
            >
              <img src={sparkle} alt="" className="h-4 w-4" />
              Create with AI
            </button>
            {showAiNudge && <CreateWithAINudge onClose={() => onCloseAiNudge?.()} />}
          </div>
        )}
        {ctaMenu ? (
          <Popover>
            <PopoverTrigger asChild>{ctaButton}</PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className="w-[220px] rounded-lg border-0 bg-white p-2 shadow-[0px_8px_24px_rgba(23,23,58,0.16)]"
            >
              {ctaMenu.map((item) => (
                <div key={item.label} className="group relative">
                  <button
                    onClick={item.onSelect}
                    className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-left font-manrope text-sm text-[#6F6F8D] transition-colors hover:bg-[#F4F8FF] hover:text-[#17173A] group-hover:bg-[#F4F8FF] group-hover:text-[#17173A]"
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {item.submenu && <ChevronRight className="h-4 w-4" strokeWidth={2} />}
                  </button>
                  {item.submenu && (
                    <div className="invisible absolute right-full top-[-8px] z-10 pr-1 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100">
                      <div
                        role="menu"
                        className="w-[224px] rounded-lg bg-white p-2 shadow-[0px_8px_24px_rgba(23,23,58,0.16)]"
                      >
                        {item.submenu.map((sub) => (
                          <button
                            key={sub.label}
                            role="menuitem"
                            disabled={sub.disabled}
                            onClick={sub.onSelect}
                            className="flex h-10 w-full items-center gap-3 rounded-md px-3 text-left font-manrope text-sm text-[#6F6F8D] transition-colors enabled:hover:bg-[#F4F8FF] enabled:hover:text-[#17173A] disabled:cursor-default disabled:opacity-60"
                          >
                            {sub.icon}
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </PopoverContent>
          </Popover>
        ) : (
          ctaButton
        )}
      </div>
    </div>
  );
}
