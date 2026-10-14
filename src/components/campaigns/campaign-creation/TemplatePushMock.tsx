import { cn } from "@/lib/utils";
import imgAndroidPhone from "/campaign-assets/regular-layout/android-phone.png";
import imgPhoneShadow from "/campaign-assets/regular-layout/phone-shadow.svg";
import imgChevron from "/campaign-assets/regular-layout/chevron.svg";
import imgIosNotch from "/campaign-assets/regular-layout/ios-notch.svg";

/**
 * What a saved push template says, so the Content step can draw it on either
 * platform, expanded or collapsed, when the template has no per-platform mock
 * of its own. The media are crops of the template's own thumbnail.
 */
export interface PushCardContent {
  brand: { name: string; logo: string; meta?: string };
  title?: string;
  message?: string;
  /** A countdown chip beside the text. */
  timer?: string;
  /** A row of product images under the text. */
  strip?: string;
  /** A full-width banner under the text. */
  banner?: string;
}

function Logo({ src, size }: { src: string; size: number }) {
  return <img src={src} alt="" className="shrink-0 rounded-[7px] object-cover" style={{ width: size, height: size }} />;
}

function Text({ card, compact }: { card: PushCardContent; compact?: boolean }) {
  if (!card.title && !card.message) return null;
  return (
    <div className="min-w-0 flex-1 break-words text-black">
      {card.title && (
        <p className={cn("font-manrope font-bold leading-[1.25]", compact ? "text-[13px]" : "text-sm")}>{card.title}</p>
      )}
      {card.message && <p className={cn("font-manrope leading-[1.35]", compact ? "text-[11px]" : "text-xs")}>{card.message}</p>}
    </div>
  );
}

function Timer({ value }: { value: string }) {
  return (
    <span className="shrink-0 rounded-md bg-[#FFCF5C] px-2.5 py-1.5 font-manrope text-xs font-bold text-[#17173A]">{value}</span>
  );
}

function Media({ card }: { card: PushCardContent }) {
  if (card.banner) return <img src={card.banner} alt="" className="block w-full object-cover" />;
  if (card.strip) return <img src={card.strip} alt="" className="mx-auto block w-[calc(100%-20px)] rounded-md pb-[10px] pt-1" />;
  return null;
}

function AndroidMock({ card, expanded }: { card: PushCardContent; expanded: boolean }) {
  return (
    <div className="relative h-[654px] w-[348px] shrink-0">
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src={imgAndroidPhone}
          alt=""
          className="pointer-events-none absolute max-w-none"
          style={{ height: "110.76%", left: "-60.38%", top: "-5.68%", width: "220.75%" }}
        />
      </div>
      <span className="absolute left-[16.76px] top-[32.83px] h-[592px] w-[315px] rounded-[10px] bg-[#F4F8FF]" />
      <img src={imgPhoneShadow} alt="" className="absolute left-px top-[654px] h-[39px] w-[320px] max-w-none" />
      <div className="absolute left-[24px] top-[42px] w-[299px] overflow-hidden rounded-[5px] border border-solid border-[#DDE2EE] bg-white shadow-[0_5px_6px_rgba(0,0,0,0.07)]">
        <div className="flex items-center justify-between px-[15px] py-2">
          <div className="flex items-center gap-2">
            <Logo src={card.brand.logo} size={16} />
            <span className="font-manrope text-xs leading-none text-black">
              {card.brand.name}
              {card.brand.meta && <span className="text-[#6F6F8D]"> · {card.brand.meta}</span>}
            </span>
          </div>
          <img src={imgChevron} alt="" className={cn("size-[7px] max-w-none", expanded ? "-rotate-90" : "rotate-90")} />
        </div>
        {(card.title || card.message) && (
          <div className="flex items-center justify-between gap-[10px] border-t border-[#DDE2EE] px-[15px] py-[10px]">
            <Text card={card} />
            {card.timer && <Timer value={card.timer} />}
          </div>
        )}
        {expanded && <Media card={card} />}
      </div>
    </div>
  );
}

function IosMock({ card, expanded }: { card: PushCardContent; expanded: boolean }) {
  return (
    <div className="relative h-[582px] w-[305px] shrink-0">
      <div className="absolute inset-0 overflow-hidden rounded-[32px] border-4 border-solid border-black bg-[#F4F8FF]">
        <img src={imgIosNotch} alt="" className="absolute left-1/2 top-[-4px] h-[17px] w-[106px] max-w-none -translate-x-1/2" />
      </div>
      <div
        className={cn(
          "absolute left-[11.5px] w-[282px] overflow-hidden bg-white",
          expanded ? "top-[27px] rounded-[14px]" : "top-[25px] rounded-[18px]"
        )}
      >
        <div className="flex items-center gap-[10px] p-[10px]">
          <Logo src={card.brand.logo} size={33} />
          {card.title || card.message ? (
            <Text card={card} compact={!expanded} />
          ) : (
            <span className="min-w-0 flex-1 font-manrope text-sm text-black">
              {card.brand.name}
              {card.brand.meta && <span className="text-[#6F6F8D]"> · {card.brand.meta}</span>}
            </span>
          )}
          {card.timer && <Timer value={card.timer} />}
        </div>
        {expanded && <Media card={card} />}
      </div>
    </div>
  );
}

export default function TemplatePushMock({
  card,
  os,
  view,
}: {
  card: PushCardContent;
  os: "android" | "ios";
  view: "expanded" | "collapsed";
}) {
  return os === "android" ? (
    <AndroidMock card={card} expanded={view === "expanded"} />
  ) : (
    <IosMock card={card} expanded={view === "expanded"} />
  );
}
