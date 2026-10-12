import React, { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DsButton } from '@/components/ui/ds-button';

const MANROPE: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' };

export interface ApprovalQuestion {
  q: string;
  type: 'radio' | 'check';
  options: { value: string; label: string }[];
  /** Answering is not required — "none of these" is a real answer, so the
   *  action stays enabled with nothing picked. */
  optional?: boolean;
  /** The opposite end: this one cannot be passed over. Marks the question with
   *  an asterisk, takes Skip away, and holds Continue until it is answered. */
  required?: boolean;
  /** What to say when Continue is pressed on an empty required question.
   *  Name what is missing — "This field is required" tells nobody anything. */
  requiredMessage?: string;
  /** Placeholder for this question's free-text field. Defaults to the
   *  "Something else…" catch-all, which is what a list of options wants; a
   *  question with no options *is* the text field, and needs its own prompt. */
  placeholder?: string;
  /** Seed for the free-text field — for a question that opens with a draft
   *  answer already in it, ready to be corrected. */
  defaultValue?: string;
}

/** One answered question: the option values picked, plus any free text. */
export type ApprovalAnswers = Record<number, { values: string[]; custom: string }>;

const ROLL_MS = 400;
const SLIDE = '360ms cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * Odometer digits — each character that changes rolls up (or down) rather than
 * swapping, so stepping through questions reads as movement.
 */
function RollingDigits({ value }: { value: string }) {
  const prevRef = useRef(value);
  const [oldVal, setOldVal] = useState(value);
  const [newVal, setNewVal] = useState(value);
  const [rolling, setRolling] = useState(false);
  const [shifted, setShifted] = useState(false);
  const [dir, setDir] = useState<'up' | 'down'>('up');

  useEffect(() => {
    if (prevRef.current === value) return;
    const from = prevRef.current;
    prevRef.current = value;
    const fromN = parseInt(from, 10);
    const toN = parseInt(value, 10);
    setDir(Number.isFinite(fromN) && Number.isFinite(toN) && toN < fromN ? 'down' : 'up');
    setOldVal(from);
    setNewVal(value);
    setRolling(true);
    setShifted(false);

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShifted(true));
    });
    const done = setTimeout(() => {
      setRolling(false);
      setOldVal(value);
      setShifted(false);
    }, ROLL_MS);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(done);
    };
  }, [value]);

  const chars = rolling ? newVal : oldVal;

  return (
    <>
      {Array.from({ length: chars.length }, (_, i) => {
        const o = oldVal[i] ?? '';
        const n = chars[i] ?? '';
        if (!rolling || o === n) return <span key={`${i}-${n}`}>{n}</span>;
        const top = dir === 'down' ? n : o;
        const bottom = dir === 'down' ? o : n;
        const restY = dir === 'down' ? '0' : '-1em';
        const startY = dir === 'down' ? '-1em' : '0';
        return (
          <span
            key={`${i}-${o}-${n}-${dir}`}
            style={{ display: 'inline-block', position: 'relative', overflow: 'hidden', height: '1em', lineHeight: '1em', verticalAlign: '-0.05em' }}
          >
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
                transform: `translateY(${shifted ? restY : startY})`,
              }}
            >
              <span style={{ height: '1em', lineHeight: '1em' }}>{top}</span>
              <span style={{ height: '1em', lineHeight: '1em' }}>{bottom}</span>
            </span>
          </span>
        );
      })}
    </>
  );
}

/**
 * Human-in-the-loop approval card. One question at a time: the stack slides
 * vertically as you move between them (the card's height animates to fit) and
 * the step counter rolls like an odometer. Single-choice answers advance to the
 * next question on their own; multi-select waits for Continue. Nothing sends
 * itself — the final answer arms Send and the reader presses it.
 *
 * Sits above the composer in the docked co-marketer chat — the agent asking
 * what it needs before it goes and does the work.
 */
export default function GoalApprovalCard({
  questions,
  title,
  onSubmit,
  onDismiss,
  initialAnswers,
}: {
  questions: ApprovalQuestion[];
  /** Small label above the question, naming who is asking. */
  title?: string;
  onSubmit: (answers: ApprovalAnswers) => void;
  onDismiss: () => void;
  /** Answers to open on — for a card asked again after the work behind it
   *  failed. Being sent back to an empty card is being asked to do it twice. */
  initialAnswers?: ApprovalAnswers;
}) {
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>(() => {
    const seed: Record<number, string[]> = {};
    questions.forEach((_, i) => {
      const given = initialAnswers?.[i]?.values;
      if (given?.length) seed[i] = given;
    });
    return seed;
  });
  const [custom, setCustom] = useState<Record<number, string>>(() => {
    const seed: Record<number, string> = {};
    questions.forEach((question, i) => {
      // What they typed wins over the draft the question opened with.
      const given = initialAnswers?.[i]?.custom;
      if (given) seed[i] = given;
      else if (question.defaultValue) seed[i] = question.defaultValue;
    });
    return seed;
  });

  // Which questions have been found empty. Set by pressing Continue, never
  // before: a question is not wrong for being untouched, and a card that scolds
  // you the moment it opens is a card you stop reading.
  const [invalid, setInvalid] = useState<Record<number, boolean>>({});

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const measured = useRef(false);
  const [viewportH, setViewportH] = useState<number | undefined>(undefined);
  const [trackY, setTrackY] = useState(0);
  const [animate, setAnimate] = useState(false);
  // Until the first question is measured, render only the active one so the
  // card opens at its real height instead of flashing to the full stack.
  const [ready, setReady] = useState(false);

  const last = qi === questions.length - 1;
  const many = questions.length > 1;
  const selected = answers[qi] ?? [];
  const hasAnswer = selected.length > 0 || Boolean(custom[qi]?.trim());
  // The action is always pressable. A disabled button says "no" without saying
  // why; pressing this one answers the question it raises.
  const canAct = true;
  const missing = Boolean(questions[qi]?.required) && !hasAnswer;

  const sync = (withAnim: boolean) => {
    const item = questionRefs.current[qi];
    if (!item) return;
    const reduce = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setViewportH(item.offsetHeight);
    setTrackY(item.offsetTop);
    setAnimate(withAnim && !reduce);
  };

  useLayoutEffect(() => {
    const withAnim = measured.current;
    measured.current = true;
    sync(withAnim);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, answers, custom, invalid]);

  useEffect(() => {
    const id = requestAnimationFrame(() => sync(measured.current));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi]);

  // A mount measurement is only as good as the layout at that moment: hosted in
  // a panel that is still sliding in, or in a chat's empty state that lays out
  // after the card, the question measured zero and the card stayed collapsed
  // with its options clipped. Watching the active question re-syncs whenever it
  // gains its real height.
  useEffect(() => {
    const item = questionRefs.current[qi];
    if (!item || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => sync(measured.current));
    ro.observe(item);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, ready]);

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  const goTo = (next: number) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setQi(Math.min(Math.max(next, 0), questions.length - 1));
  };

  const send = (finalAnswers = answers, finalCustom = custom) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const out: ApprovalAnswers = {};
    questions.forEach((_, i) => {
      out[i] = { values: finalAnswers[i] ?? [], custom: finalCustom[i] ?? '' };
    });
    onSubmit(out);
  };

  const advance = () => {
    if (missing) {
      setInvalid((current) => ({ ...current, [qi]: true }));
      return;
    }
    if (last) send();
    else goTo(qi + 1);
  };

  const toggle = (index: number) => {
    const question = questions[qi];
    const value = question.options[index].value;
    const picked = answers[qi] ?? [];
    const nextPicked = question.type === 'radio'
      ? [value]
      : picked.includes(value)
        ? picked.filter((v) => v !== value)
        : [...picked, value];
    const nextAnswers = { ...answers, [qi]: nextPicked };
    setAnswers(nextAnswers);
    if (nextPicked.length) setInvalid((current) => ({ ...current, [qi]: false }));

    if (question.type !== 'radio') return;
    const nextCustom = { ...custom, [qi]: '' };
    setCustom(nextCustom);
    // A single choice is the whole answer for *this* question, so it moves on
    // to the next by itself. Sending is never automatic: the last answer only
    // arms Send, so the last thing the reader does is press it.
    if (last) return;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(
      () => setQi((current) => Math.min(questions.length - 1, current + 1)),
      480,
    );
  };

  return (
    <div
      className="w-full overflow-hidden rounded-[14px] border border-[var(--color-line-input)] bg-card shadow-[0px_8px_24px_-10px_oklch(0_0_0_/_0.18)]"
      style={{ animation: 'fade-up 380ms cubic-bezier(0.23,1,0.32,1) both' }}
    >
      <div className="relative px-[14px] pt-[12px] pb-[10px]">
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute right-[10px] top-[10px] z-10 flex size-[24px] items-center justify-center rounded-[7px] text-[var(--color-grey)] transition-colors hover:bg-[oklch(0_0_0_/_0.06)] hover:text-[var(--color-ink)]"
        >
          <X className="size-[14px]" />
        </button>

        {title ? (
          <p className="mb-[6px] pr-[26px] text-[11px] font-semibold uppercase tracking-[0.6px] text-[var(--color-grey-soft)]" style={MANROPE}>
            {title}
          </p>
        ) : null}

        <div
          className="overflow-hidden"
          style={{ height: viewportH, transition: animate ? `height ${SLIDE}` : undefined }}
          aria-live="polite"
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 26,
              transform: `translate3d(0, ${-trackY}px, 0)`,
              transition: animate ? `transform ${SLIDE}` : undefined,
              willChange: 'transform',
            }}
          >
            {questions.map((question, qIdx) => {
              const active = qIdx === qi;
              if (!ready && !active) return null;
              const picked = answers[qIdx] ?? [];
              const questionStyle: CSSProperties = {
                opacity: active ? 1 : 0,
                transition: animate ? `opacity ${SLIDE}` : undefined,
                pointerEvents: active ? undefined : 'none',
              };
              return (
                <div
                  key={question.q}
                  ref={(el) => { questionRefs.current[qIdx] = el; }}
                  aria-hidden={active ? undefined : true}
                  style={questionStyle}
                >
                  <div className="pr-[26px] text-[14px] font-semibold leading-[20px] text-[var(--color-ink)]" style={MANROPE}>
                    {question.q}
                    {question.required ? (
                      <span className="text-[var(--btn-error)]" aria-hidden="true">
                        {' '}*
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-[10px] flex flex-col gap-[2px]">
                    {question.options.map((option, i) => {
                      const on = picked.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={on}
                          tabIndex={active ? 0 : -1}
                          onClick={() => { if (active) toggle(i); }}
                          className="flex items-center gap-[8px] rounded-[8px] px-[6px] py-[6px] text-left transition-colors hover:bg-[oklch(0_0_0_/_0.04)]"
                        >
                          <span
                            className={cn(
                              'flex size-[16px] shrink-0 items-center justify-center transition-colors',
                              question.type === 'radio' ? 'rounded-full' : 'rounded-[5px]',
                              on
                                ? 'bg-[var(--color-royal)] text-white'
                                : 'shadow-[inset_0_0_0_1.5px_var(--color-line-strong)] text-transparent',
                            )}
                          >
                            {question.type === 'radio' ? (
                              <span
                                className="size-[6px] rounded-full bg-white transition-transform"
                                style={{ transform: on ? 'scale(1)' : 'scale(0)' }}
                              />
                            ) : (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            )}
                          </span>
                          <span
                            className={cn('text-[13px] leading-[18px] transition-colors', on ? 'text-[var(--color-ink)]' : 'text-[var(--color-slate)]')}
                            style={MANROPE}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                    {/* A question with no options is the text field itself —
                        it gets a real box with room to write in, not the
                        borderless "or something else" line under a list. */}
                    {question.options.length === 0 ? (
                      <textarea
                        value={custom[qIdx] ?? ''}
                        rows={3}
                        tabIndex={active ? 0 : -1}
                        onChange={(event) => {
                          if (!active) return;
                          setCustom((current) => ({ ...current, [qIdx]: event.target.value }));
                          if (event.target.value.trim()) setInvalid((c) => ({ ...c, [qIdx]: false }));
                        }}
                        placeholder={question.placeholder ?? 'Something else…'}
                        aria-label={question.q}
                        aria-invalid={invalid[qIdx] || undefined}
                        className={cn(
                          'w-full resize-none rounded-[9px] border bg-[oklch(1_0_0_/_0.56)] px-[10px] py-[8px] text-[13px] font-medium leading-[1.5] text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-grey-soft)]',
                          invalid[qIdx]
                            ? 'border-[var(--btn-error)]'
                            : 'border-[var(--color-line-input)] focus:border-[var(--color-royal)]',
                        )}
                        style={MANROPE}
                      />
                    ) : (
                      <label className="flex items-center gap-[8px] rounded-[8px] px-[6px] py-[6px]">
                        <input
                          value={custom[qIdx] ?? ''}
                          tabIndex={active ? 0 : -1}
                          onChange={(event) => {
                            if (!active) return;
                            setCustom((current) => ({ ...current, [qIdx]: event.target.value }));
                            if (question.type === 'radio') setAnswers((current) => ({ ...current, [qIdx]: [] }));
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && canAct) {
                              event.preventDefault();
                              advance();
                            }
                          }}
                          placeholder={question.placeholder ?? 'Something else…'}
                          aria-label="Custom answer"
                          className="min-w-0 flex-1 bg-transparent pl-[24px] text-[13px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-grey-soft)]"
                          style={MANROPE}
                        />
                      </label>
                    )}
                  </div>
                  {invalid[qIdx] ? (
                    <p className="mt-[6px] text-[12px] leading-[17px] text-[var(--btn-error)]" style={MANROPE}>
                      {question.requiredMessage ?? 'This one is needed to carry on'}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer — step nav (only worth showing for more than one question) and
          the pill actions. */}
      <div className="flex items-center justify-between gap-[12px] border-t border-[var(--color-line)] px-[14px] py-[10px]">
        {many ? (
          <div className="flex items-center gap-[4px] text-[var(--color-grey)]">
            <button
              type="button"
              aria-label="Previous question"
              disabled={qi <= 0}
              onClick={() => goTo(qi - 1)}
              className="flex size-[20px] items-center justify-center rounded-[6px] transition-colors enabled:hover:text-[var(--color-ink)] disabled:opacity-30"
            >
              <ChevronUp className="size-[14px]" />
            </button>
            <span className="inline-flex items-center text-[12px] font-medium tabular-nums" style={{ ...MANROPE, letterSpacing: '-0.1px', lineHeight: 1 }}>
              <RollingDigits value={`${qi + 1} / ${questions.length}`} />
            </span>
            <button
              type="button"
              aria-label="Next question"
              disabled={last}
              onClick={() => goTo(qi + 1)}
              className="flex size-[20px] items-center justify-center rounded-[6px] transition-colors enabled:hover:text-[var(--color-ink)] disabled:opacity-30"
            >
              <ChevronDown className="size-[14px]" />
            </button>
          </div>
        ) : <span />}

        <div className="flex items-center gap-[8px]">
          {/* Skipping the last question means "nothing to add here", not
              "abandon the whole thing" — it sends what has been answered. The
              host decides whether that is enough to act on. A required question
              has no Skip at all: showing one and then refusing it is worse than
              not offering it. */}
          {!questions[qi]?.required && (
            <DsButton variant="tertiary" onClick={() => (last ? send() : goTo(qi + 1))}>Skip</DsButton>
          )}
          <DsButton disabled={!canAct} onClick={advance}>{last ? 'Send' : 'Continue'}</DsButton>
        </div>
      </div>
    </div>
  );
}
