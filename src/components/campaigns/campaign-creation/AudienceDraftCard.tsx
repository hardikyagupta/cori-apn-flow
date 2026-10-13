import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AudienceDraftView } from "@/data/audienceAgentFlow";

/** Parked for now — the "Why for …" line under the numbers. */
const SHOW_WHY = false;

/**
 * The segment Cori has drafted, in the same shape as its audience-cut cards:
 * name and status up top, the rule in a line, the two numbers a marketer
 * decides on, why this cut suits the goal, and the rules behind it tucked under
 * "Rules & signals". Lives in the Cori chat, under the message that built it —
 * a first draft, then the refined one.
 */
export default function AudienceDraftCard({ draft }: { draft: AudienceDraftView }) {
  const [openSignals, setOpenSignals] = useState(false);
  const applied = draft.status === "applied";
  const signals = [
    draft.include,
    ...draft.conditions.map((c) => `${c.attribute} ${c.operator} ${c.value}`),
    ...(draft.refined
      ? [...draft.excludes.map((e) => `Holds back: ${e.text.toLowerCase()}`), "Holds back recent-purchaser exclusions set elsewhere"]
      : []),
  ];

  return (
    <section className="w-full rounded-lg border border-[#DDE2EE] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-manrope text-sm font-bold text-[#17173A]">{draft.name}</h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 font-manrope text-[11px] font-bold",
            applied ? "bg-[#E6F8F0] text-[#0B7A56]" : "bg-[#EEF1F7] text-[#6F6F8D]"
          )}
        >
          {applied ? "Applied" : "Draft"}
        </span>
      </div>
      <p className="mt-1 font-manrope text-xs leading-[18px] text-[#6F6F8D]">{draft.include}</p>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-manrope text-xs text-[#6F6F8D]">
        <span>
          <span className="font-bold text-[#17173A]">{draft.reach.toLocaleString("en-US")}</span> reachable
        </span>
        <span>
          <span className="font-bold text-[#17173A]">{draft.strategy}</span> reach strategy
        </span>
      </div>

      {SHOW_WHY && (
        <p className="mt-2 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
          <span className="font-bold text-[#17173A]">Why for “{draft.goal}”:</span> {draft.why}
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpenSignals((o) => !o)}
        aria-expanded={openSignals}
        className="mt-3 inline-flex items-center gap-1 font-manrope text-[13px] font-semibold text-[#2F68E5]"
      >
        Rules &amp; signals
        <ChevronDown className={cn("size-4 transition-transform", openSignals && "rotate-180")} strokeWidth={2.2} />
      </button>

      {openSignals && (
        <ul className="mt-3 space-y-1 border-t border-[#EEF1F7] pt-3">
          {signals.map((sig) => (
            <li key={sig} className="flex gap-2 font-manrope text-xs leading-[18px] text-[#6F6F8D]">
              <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[#C3CAD9]" />
              {sig}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
