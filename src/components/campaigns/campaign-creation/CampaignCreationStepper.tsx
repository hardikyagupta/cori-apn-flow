import { useEffect, useRef, useState } from "react";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepStatus = "completed" | "active" | "upcoming";

export interface Step {
  id: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Step rail under the navbar. Canonical order is Setup → Content → Audience →
 * Schedule; completed steps are clickable so the user can go back, upcoming
 * ones are not.
 */
function StepDot({ status, icon: Icon }: { status: StepStatus; icon: LucideIcon }) {
  if (status === "upcoming") {
    return (
      <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-[#DDE2EE] bg-white">
        <Icon className="h-2.5 w-2.5 text-[#6F6F8D]" strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-[#00C48C]">
      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
    </span>
  );
}

/** "just now" under a minute, then "N minute(s) ago", then a clock time. */
export function formatLastSaved(savedAt: number, now: number): string {
  const minutes = Math.floor((now - savedAt) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  return new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Dummy autosave — nothing is persisted, but any change to the watched value
 *  flips the header through a brief "Saving" state, then stamps the time. */
export function useAutosave(watched: unknown) {
  const snapshot = JSON.stringify(watched);
  const lastRef = useRef(snapshot);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (snapshot === lastRef.current) return;
    lastRef.current = snapshot;
    setSaving(true);
    const id = window.setTimeout(() => {
      setSaving(false);
      const t = Date.now();
      setLastSavedAt(t);
      setNow(t);
    }, 700);
    return () => window.clearTimeout(id);
  }, [snapshot]);

  return { saving, lastSaved: formatLastSaved(lastSavedAt, now) };
}

export default function CampaignCreationStepper({
  steps,
  activeIndex,
  campaignId,
  lastSaved,
  saving = false,
  onStepSelect,
  reachedIndex = -1,
}: {
  steps: Step[];
  activeIndex: number;
  /** Furthest step already visited — ones ahead of the active step up to here
   *  can be jumped to as well (e.g. an AI-built draft arrives finished). */
  reachedIndex?: number;
  campaignId?: string;
  lastSaved?: string;
  saving?: boolean;
  onStepSelect?: (index: number) => void;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center border-b border-[#DDE2EE] bg-white px-14">
      <div className="flex items-center">
        {steps.map((step, i) => {
          const status: StepStatus =
            i < activeIndex ? "completed" : i === activeIndex ? "active" : "upcoming";
          const canJump = status === "completed" || (i !== activeIndex && i <= reachedIndex);
          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                disabled={!canJump}
                onClick={() => canJump && onStepSelect?.(i)}
                className={cn(
                  "relative flex h-12 items-center gap-1.5",
                  canJump ? "cursor-pointer" : "cursor-default"
                )}
              >
                <StepDot status={status} icon={step.icon} />
                <span
                  className={cn(
                    "font-manrope text-sm font-semibold leading-5 tracking-[0.42px]",
                    status === "upcoming" ? "text-[#6F6F8D]" : "text-[#17173A]"
                  )}
                >
                  {step.label}
                </span>
                {status === "active" && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-t bg-[#00C48C]" />
                )}
              </button>
              {i < steps.length - 1 && <span className="mx-4 h-px w-20 bg-[#DDE2EE]" />}
            </div>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-3 font-manrope text-xs text-[#6F6F8D]">
        {campaignId && <span>ID: {campaignId}</span>}
        {campaignId && lastSaved && <span aria-hidden="true" className="h-4 w-px bg-[#DDE2EE]" />}
        {lastSaved && (
          <span className="flex items-center gap-1.5">
            {saving ? (
              <>
                <span
                  aria-hidden="true"
                  className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-[#00C48C] border-t-transparent"
                />
                Saving
              </>
            ) : (
              <>
                <Check className="h-3 w-3 text-[#00C48C]" strokeWidth={3} />
                Last saved: {lastSaved}
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}