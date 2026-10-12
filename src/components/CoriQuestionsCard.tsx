import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FlowAnswers, FlowQuestion } from "@/data/pushCartFlow";

/**
 * Cori's follow-up question card, in the journey co-marketer's look
 * (CoMarketerQuestionCard): "Cori" eyebrow + close, bold title, outlined options, and
 * a footer with the ∧ 1/N ∨ pager plus Skip / Continue. It adds what the app
 * push conversation needs on top: a free-text "Other" row, questions that only
 * join when an earlier answer calls for them (`showIf`), and a soft fade/slide
 * between questions.
 */
export default function CoriQuestionsCard({
  questions,
  onComplete,
}: {
  questions: FlowQuestion[];
  onComplete: (answers: FlowAnswers) => void;
}) {
  const [answers, setAnswers] = useState<FlowAnswers>({});
  const [index, setIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [other, setOther] = useState("");
  const [done, setDone] = useState(false);
  // Fades the current question out before the next one slides in.
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | null>(null);
  // The body's measured height, so the card eases between questions of
  // different lengths instead of snapping.
  const bodyRef = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setBodyHeight(el.offsetHeight));
    ro.observe(el);
    setBodyHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, [done]);

  const visible = questions.filter((q) => !q.showIf || q.showIf(answers));
  // A conditional question still counts until its controlling answer rules it out.
  const total = Math.max(
    visible.length,
    questions.filter((q) => !q.showIf || q.showIf(answers) || !(q.dependsOn && q.dependsOn in answers)).length
  );
  const question = visible[index];
  const isLast = index >= total - 1 && index >= visible.length - 1;
  const picked = question ? answers[question.id] : undefined;
  const pickedOther = !!picked && !question.options.includes(picked);

  // Re-opening an earlier question shows what was typed in its Other row.
  useEffect(() => {
    setOther(pickedOther && picked ? picked : "");
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  if (done) {
    return (
      <div className="flex w-full items-center gap-2 rounded-2xl border border-[#EBEBF5] bg-white px-4 py-3">
        <Check className="size-4 shrink-0 text-[#00A676]" strokeWidth={2.4} />
        <p className="font-manrope text-[13px] font-semibold text-[#17173A]">
          {visible.length} {visible.length === 1 ? "question" : "questions"} answered
        </p>
      </div>
    );
  }
  if (!question) return null;

  const select = (value: string) => setAnswers((a) => ({ ...a, [question.id]: value }));
  const choice = pickedOther || other.trim() ? other.trim() || picked || null : picked ?? null;
  const canContinue = !!choice;

  const finish = (final: FlowAnswers) => {
    setDone(true);
    onComplete(final);
  };

  /** Records an answer (or a skip), then fades to the next question. */
  const advance = (value: string | null) => {
    if (timer.current) window.clearTimeout(timer.current);
    const next = { ...answers, [question.id]: value };
    // A changed answer can drop a later conditional question — forget its answer.
    const nextVisible = questions.filter((q) => !q.showIf || q.showIf(next));
    for (const q of questions) if (!nextVisible.includes(q)) delete next[q.id];
    setAnswers(next);
    const last = index >= nextVisible.length - 1;
    setLeaving(true);
    timer.current = window.setTimeout(() => {
      setLeaving(false);
      if (last) return finish(next);
      setIndex(index + 1);
      setFurthest((f) => Math.max(f, index + 1));
    }, 180);
  };

  // The close button skips whatever is left rather than blocking the flow.
  const close = () => {
    const final: FlowAnswers = { ...answers };
    for (const q of visible) if (!(q.id in final)) final[q.id] = null;
    finish(final);
  };

  const goTo = (to: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    setLeaving(false);
    setIndex(Math.max(0, Math.min(to, furthest)));
  };

  return (
    <div className="z-20 flex w-full flex-col overflow-hidden rounded-2xl border border-[#EBEBF5] bg-white shadow-[0_4px_16px_rgba(23,23,58,0.08)] [-webkit-text-size-adjust:100%] [text-size-adjust:100%]">
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-4">
        <p className="font-manrope font-bold uppercase tracking-[0.08em] text-[#6F6F8D]" style={{ fontSize: "11px" }}>
          Cori
        </p>
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="grid h-5 w-5 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div
        className="overflow-hidden transition-[height] duration-300 ease-out"
        style={bodyHeight != null ? { height: bodyHeight } : undefined}
      >
        <div ref={bodyRef}>
          <div
            key={question.id}
            className={cn(
              "transition-all duration-200 ease-out",
              leaving ? "-translate-x-2 opacity-0" : "animate-in fade-in slide-in-from-right-3 duration-300"
            )}
          >
            <h3
              className="mt-1 px-4 font-manrope font-bold leading-snug text-[#17173A]"
              style={{ fontSize: "13px" }}
            >
              {question.title}
            </h3>

            <div role="radiogroup" aria-label={question.title} className="flex flex-col gap-1.5 px-4 py-2.5">
              {question.options.map((opt) => {
                const isSelected = picked === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setOther("");
                      select(opt);
                    }}
                    className={cn(
                      "flex items-center rounded-lg border px-3 py-2.5 text-left font-manrope font-semibold transition-colors",
                      isSelected
                        ? "border-[#2F68E5] bg-[#F4F8FF] text-[#143F93]"
                        : "border-[#DDE2EE] text-[#17173A] hover:border-[#B9C4DD] hover:bg-[#F7F7FB]"
                    )}
                    style={{ fontSize: "13px" }}
                  >
                    {opt}
                  </button>
                );
              })}

              {question.otherPlaceholder && (
                <div className="relative">
                  <input
                    type="text"
                    value={other}
                    onChange={(e) => {
                      setOther(e.target.value);
                      if (e.target.value.trim()) select(e.target.value.trim());
                    }}
                    onKeyDown={(e) => e.key === "Enter" && canContinue && advance(choice)}
                    placeholder={question.otherPlaceholder}
                    aria-label={question.otherPlaceholder}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2.5 font-manrope font-semibold outline-none transition-colors placeholder:font-semibold placeholder:text-[#6F6F8D]",
                      question.otherDateTime && "pr-11",
                      other.trim()
                        ? "border-[#2F68E5] bg-[#F4F8FF] text-[#143F93]"
                        : "border-[#DDE2EE] text-[#17173A] focus:border-[#2F68E5]"
                    )}
                    style={{ fontSize: "13px" }}
                  />
                  {question.otherDateTime && (
                    <DateTimeButton
                      onPick={(label) => {
                        setOther(label);
                        select(label);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-[#EBEBF5] px-4 py-3">
        <div className="flex items-center gap-1 font-manrope font-medium text-[#6F6F8D]" style={{ fontSize: "12px" }}>
          <button
            type="button"
            aria-label="Previous question"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
            className="grid h-5 w-5 place-items-center rounded transition-colors hover:bg-[#F3F6FF] disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <span className="tabular-nums">
            {index + 1}/{total}
          </span>
          <button
            type="button"
            aria-label="Next question"
            disabled={index >= furthest}
            onClick={() => goTo(index + 1)}
            className="grid h-5 w-5 place-items-center rounded transition-colors hover:bg-[#F3F6FF] disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => advance(null)} className="dc-btn dc-btn-secondary">
            Skip
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => canContinue && advance(choice)}
            className="dc-btn dc-btn-primary"
          >
            {isLast ? "Done" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Calendar button for the Other row — pick a day and a time, then Apply fills
 *  the field with e.g. "Oct 14, 2026, 6:00 PM". */
function DateTimeButton({ onPick }: { onPick: (label: string) => void }) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<Date | undefined>();
  const [time, setTime] = useState("18:00");

  const apply = () => {
    if (!day) return;
    const [h, m] = time.split(":").map(Number);
    const d = new Date(day);
    d.setHours(h || 0, m || 0, 0, 0);
    onPick(
      d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    );
    setOpen(false);
  };

  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pick a date and time"
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#F3F6FF] hover:text-[#17173A]"
        >
          <CalendarIcon className="size-4" strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto rounded-xl border-[#DDE2EE] p-0">
        <Calendar mode="single" selected={day} onSelect={setDay} disabled={{ before: yesterday }} initialFocus />
        <div className="flex items-center justify-between gap-3 border-t border-[#EBEBF5] px-3 py-3">
          <label className="flex items-center gap-2 font-manrope text-[12px] font-semibold text-[#6F6F8D]">
            Time
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-md border border-[#DDE2EE] px-2 py-1 font-manrope text-[13px] text-[#17173A] outline-none focus:border-[#2F68E5]"
            />
          </label>
          <button type="button" disabled={!day} onClick={apply} className="dc-btn dc-btn-primary">
            Apply
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
