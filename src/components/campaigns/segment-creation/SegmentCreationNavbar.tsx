import { Filter, X } from "lucide-react";
import sparkle from "/campaign-assets/ic-sparkle.gif";

/**
 * Top bar of the segment creation overlay. Same construction as the campaign
 * creation navbar — icon + name on the left, ASK CO-MARKETER / SAVE / close on
 * the right — matching the Figma segment header (node 5649:44769), which has no
 * step actions because segment creation is a single canvas.
 */
export default function SegmentCreationNavbar({
  segmentName,
  showAiIcon = false,
  onAskCoMarketer,
  onSave,
  onClose,
}: {
  segmentName: string;
  /** After Review segment, once the canvas has the rules — swaps the default glyph. */
  showAiIcon?: boolean;
  onAskCoMarketer?: () => void;
  onSave?: () => void;
  onClose?: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-[#DDE2EE] bg-white px-14">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#E7EDFF]">
          {showAiIcon ? (
            <img
              src="/thinking-loader.gif"
              alt=""
              aria-hidden="true"
              className="pointer-events-none size-[26px] object-contain mix-blend-multiply"
            />
          ) : (
            <Filter className="h-4 w-4 text-[#2F68E5]" strokeWidth={2} />
          )}
        </span>
        <h1 className="truncate font-manrope text-base font-bold leading-[22px] text-[#17173A]">
          {segmentName}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Ask co-marketer — the top-nav CTA verbatim: rotating conic-gradient
            ring (.snake-border), sparkle GIF, h-8 to match Save. */}
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
          onClick={onSave}
          className="dc-btn dc-btn-primary"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close segment creation"
          className="grid h-8 w-8 place-items-center rounded border border-[#DDE2EE] text-[#6F6F8D] transition-colors hover:bg-[#F7F9FC] hover:text-[#17173A]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
