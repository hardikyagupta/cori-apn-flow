import type { ComponentType, SVGProps } from "react";
import { Sparkles, X } from "lucide-react";
import { DsButton } from "@/components/ui/ds-button";
import CampaignNameField from "./CampaignNameField";
import sparkle from "/campaign-assets/ic-sparkle.gif";

/**
 * Top bar for App Push's step-by-step flow — the original campaign-creation
 * navbar: channel tile + editable campaign name on the left, Ask Cori / Next step / close on the right. The last step's primary button reads
 * Preview. The step strip underneath is CampaignCreationStepper.
 */
export default function PushCampaignNavbar({
  campaignName,
  aiGenerated,
  icon: Icon,
  isLastStep,
  onRenameCampaign,
  onAskCoMarketer,
  onNext,
  onClose,
}: {
  campaignName: string;
  aiGenerated?: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  isLastStep: boolean;
  onRenameCampaign: (name: string) => void;
  onAskCoMarketer: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-[#DDE2EE] bg-white px-14">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[#E7EDFF]">
          <Icon className="h-4 w-4 text-[#2F68E5]" strokeWidth={2} />
        </span>
        <CampaignNameField campaignName={campaignName} onRenameCampaign={onRenameCampaign} />
        {aiGenerated && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#F0E8FF] px-2.5 py-1 font-manrope text-[11px] font-bold text-[#7B5CFA]">
            <Sparkles className="size-3" strokeWidth={2.4} />
            AI-generated
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Ask Cori — the top-nav CTA verbatim: rotating conic-gradient ring
            (.snake-border), sparkle GIF, h-8 to match the buttons beside it. */}
        <button
          type="button"
          onClick={onAskCoMarketer}
          className="relative z-[1] flex h-8 shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-lg bg-white px-3 transition-shadow hover:shadow-sm"
        >
          <span aria-hidden="true" className="snake-border" />
          <img src={sparkle} alt="" className="relative z-[1] h-5 w-5" />
          <span className="relative z-[1] font-manrope text-xs font-semibold tracking-[0.42px] text-ash">
            Ask Cori
          </span>
        </button>
        <DsButton onClick={onNext}>{isLastStep ? "Preview" : "Next step"}</DsButton>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close campaign creation"
          className="grid h-8 w-8 place-items-center rounded-lg border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
