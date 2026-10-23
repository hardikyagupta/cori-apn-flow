import { Settings, Sparkles, X } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import CampaignNameField from "./CampaignNameField";
import sparkle from "/campaign-assets/ic-sparkle.gif";

/**
 * Top bar of the campaign creation overlay — channel icon + campaign name on
 * the left, settings / Launch / Ask Zeno / close on the right. Structure
 * follows the shared campaign-creation reference; styling is this app's
 * language (Manrope, #2F68E5 primary, #DDE2EE lines).
 */
export default function CampaignCreationNavbar({
  campaignName,
  aiGenerated,
  icon: Icon,
  channelLabel = "Email",
  onRenameCampaign,
  onOpenSettings,
  onLaunch,
  onAskCoMarketer,
  onClose,
  steps,
  activeStepId,
  onSelectStep,
}: {
  campaignName: string;
  /** Flags a campaign the AI drafted end-to-end from a typed goal. */
  aiGenerated?: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Tooltip on the channel icon — the channel this campaign is being built for. */
  channelLabel?: string;
  onRenameCampaign?: (name: string) => void;
  onOpenSettings?: () => void;
  onLaunch?: () => void;
  onAskCoMarketer?: () => void;
  onClose?: () => void;
  /** The accordion's own steps — drives the centered stepper below. */
  steps?: { id: string; label: string }[];
  activeStepId?: string | null;
  onSelectStep?: (id: string) => void;
}) {
  const activeLabel = steps?.find((s) => s.id === activeStepId)?.label;

  return (
    <header className="relative flex h-14 shrink-0 items-center border-b border-[#DDE2EE] bg-white px-14">
      {steps && steps.length > 0 && (
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5">
          {activeLabel && (
            <p className="font-manrope text-xs font-bold text-[#17173A]">{activeLabel}</p>
          )}
          <div className="flex items-center gap-1.5">
            {steps.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => onSelectStep?.(step.id)}
                aria-label={step.label}
                aria-current={step.id === activeStepId}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-colors",
                  step.id === activeStepId
                    ? "bg-[#00C48C]"
                    : "bg-[#DDE2EE] hover:bg-[#C3CAD9]"
                )}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex min-w-0 items-center gap-3">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                tabIndex={0}
                aria-label={channelLabel}
                className="grid h-8 w-8 shrink-0 cursor-default place-items-center rounded bg-[#E7EDFF]"
              >
                <Icon className="h-5 w-5 text-[#2F68E5]" strokeWidth={2} />
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="center"
              sideOffset={8}
              className="overflow-visible rounded-lg border-0 bg-black px-3 py-1.5 text-white shadow-none"
            >
              <p className="font-manrope text-xs leading-[18px]">{channelLabel}</p>
              <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <CampaignNameField campaignName={campaignName} onRenameCampaign={onRenameCampaign} />
        {aiGenerated && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#F0E8FF] px-2.5 py-1 font-manrope text-[11px] font-bold text-[#7B5CFA]">
            <Sparkles className="size-3" strokeWidth={2.4} />
            AI-generated
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Settings"
                className="grid h-8 w-8 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
              >
                <Settings className="h-4 w-4" strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="center"
              sideOffset={8}
              className="overflow-visible rounded-lg border-0 bg-black px-3 py-1.5 text-white shadow-none"
            >
              <p className="font-manrope text-xs leading-[18px]">Settings</p>
              <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <button type="button" onClick={onLaunch} className="dc-btn dc-btn-primary">
          Launch
        </button>
        {/* Ask co-marketer — the top-nav CTA verbatim: rotating conic-gradient
            ring (.snake-border), sparkle GIF, h-8 to match Save/Next step. */}
        <button
          type="button"
          onClick={onAskCoMarketer}
          className="relative z-[1] flex h-8 items-center gap-1.5 overflow-hidden rounded-lg bg-white px-2.5 transition-shadow hover:shadow-sm"
        >
          <span aria-hidden="true" className="snake-border" />
          <img src={sparkle} alt="" className="relative z-[1] h-5 w-5" />
          <span className="relative z-[1] font-manrope text-xs font-semibold tracking-[0.42px] text-ash">
            Ask Zeno
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close campaign creation"
          className="grid h-8 w-8 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}