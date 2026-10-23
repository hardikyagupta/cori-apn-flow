import React from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  X,
  Mail,
  TrendingUp,
  RefreshCw,
  SlidersHorizontal,
  MousePointerClick,
  Rocket,
  BarChart3,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
// Imported (not /public) so Vite content-hashes the URL — the intro GIF then
// busts cache whenever the asset changes.
import personalizeIntroGif from '@/assets/personalize-intro.gif';
import { DsButton } from '@/components/ui/ds-button';

const FONT = { fontFamily: 'Manrope, sans-serif' } as const;

export interface PersonalizeCoMarketerData {
  role: string | null;
  goals: string[];
  metrics: string[];
  aiPreferences: string[];
}

interface PersonalizeCoMarketerModalProps {
  open: boolean;
  onClose: () => void;
  /** Fired on "Save preferences" (final step) with everything picked so far. */
  onComplete: (data: PersonalizeCoMarketerData) => void;
  /** Skip the intro/welcome screen and open straight on the form steps
      (used when editing already-saved preferences). */
  startInSteps?: boolean;
  /** Pre-fill the form with previously saved answers (edit mode). */
  initialData?: PersonalizeCoMarketerData | null;
}

interface StepDef {
  title: string;
  hint?: (data: PersonalizeCoMarketerData) => string;
  options: string[];
  /** Selection cap for goals/metrics ("Select up to 3"); undefined = unlimited. */
  max?: number;
  continueLabel: string;
}

const ROLE_OPTIONS = [
  'CRM marketer',
  'Growth manager',
  'Lifecycle marketer',
  'Marketing ops',
  'Product engagement',
  'Business owner',
  'Analyst',
  'Other',
];

/** Icon shown on each role card (single-select step renders as a card grid). */
const ROLE_ICONS: Record<string, LucideIcon> = {
  'CRM marketer': Mail,
  'Growth manager': TrendingUp,
  'Lifecycle marketer': RefreshCw,
  'Marketing ops': SlidersHorizontal,
  'Product engagement': MousePointerClick,
  'Business owner': Rocket,
  Analyst: BarChart3,
  Other: MoreHorizontal,
};

const GOAL_OPTIONS = [
  'Revenue growth',
  'Campaign performance',
  'Journey health',
  'Retention',
  'Deliverability',
  'Web & in-app engagement',
  'Personalization',
  'Funnel conversion',
];

const METRIC_OPTIONS = [
  'Revenue',
  'Conversions',
  'Open rate',
  'CTR',
  'Delivered',
  'Drop-offs',
  'Repeat purchases',
  'Active users',
  'Churn risk',
];

const AI_PREFERENCE_OPTIONS = [
  'Show me what needs attention',
  'Recommend what to do next',
  'Explain why performance changed',
  'Help me create campaigns',
  'Help me optimize journeys',
  'Alert me when something breaks',
];

/** Capped multi-select hint — invites up front, then reflects the live count
    (no redundant "3" repeated): "Pick up to 3" → "2 of 3 selected". */
const capHint = (count: number, max: number) =>
  count === 0 ? `Pick up to ${max}` : `${count} of ${max} selected`;

const STEPS: StepDef[] = [
  { title: 'What best describes your role?', options: ROLE_OPTIONS, continueLabel: 'Continue' },
  {
    title: 'What are you trying to improve right now?',
    hint: (d) => capHint(d.goals.length, 3),
    options: GOAL_OPTIONS,
    max: 3,
    continueLabel: 'Continue',
  },
  {
    title: 'Which metrics do you track most often?',
    hint: (d) => capHint(d.metrics.length, 3),
    options: METRIC_OPTIONS,
    max: 3,
    continueLabel: 'Continue',
  },
  {
    title: 'How should Zeno help you?',
    hint: () => 'Select all that apply',
    options: AI_PREFERENCE_OPTIONS,
    continueLabel: 'Save preferences',
  },
];

const EMPTY_DATA: PersonalizeCoMarketerData = { role: null, goals: [], metrics: [], aiPreferences: [] };

/**
 * Selection indicator with shape semantics:
 *  - multi-select steps → square checkbox with a checkmark when picked
 *  - single-select (role) → round radio with an inner dot when picked
 * The glyph scales in so selecting an option feels responsive.
 */
function OptionIndicator({ selected, multi }: { selected: boolean; multi: boolean }) {
  return (
    <span
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center border-[1.5px] transition-colors',
        multi ? 'rounded-[5px]' : 'rounded-full',
        selected ? 'border-[#2F68E5] bg-[#2F68E5]' : 'border-[#DDE2EE] bg-transparent'
      )}
    >
      {selected &&
        (multi ? (
          <Check className="size-[12px] text-white motion-safe:animate-in motion-safe:zoom-in-50" strokeWidth={3} />
        ) : (
          <span className="size-[7px] rounded-full bg-white motion-safe:animate-in motion-safe:zoom-in-50" />
        ))}
    </span>
  );
}

function OptionButton({
  label,
  selected,
  multi,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  multi: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-[10px] rounded-[8px] border px-[16px] py-[14px] text-left transition-colors motion-safe:active:scale-[0.99]',
        selected
          ? 'border-[1.5px] border-[#2F68E5] bg-[#F0F5FF]'
          : 'border-[#DDE2EE] bg-white hover:bg-[#F7F9FC]',
        disabled && !selected && 'cursor-not-allowed opacity-50 hover:bg-white'
      )}
    >
      <OptionIndicator selected={selected} multi={multi} />
      <span
        className={cn('flex-1 text-[13px] text-[#17173A]', selected ? 'font-semibold' : 'font-medium')}
        style={FONT}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * Role card — single-select identity picker rendered as a tile: an icon badge,
 * the role label, and a radio in the top-right corner (matches the onboarding
 * card pattern). Selected = blue border + tint + filled radio.
 */
function RoleCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = ROLE_ICONS[label] ?? MoreHorizontal;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex h-full w-full flex-col overflow-hidden rounded-[12px] border text-left transition-colors motion-safe:active:scale-[0.99]',
        selected ? 'border-[1.5px] border-[#2F68E5]' : 'border-[#DDE2EE] hover:border-[#C3D2F2]'
      )}
    >
      {/* Top — icon centered, radio in the top-right corner (per Figma) */}
      <div
        className={cn(
          'relative flex flex-1 items-center justify-center px-[16px] py-[22px] transition-colors',
          selected ? 'bg-[#F0F5FF]' : 'bg-white'
        )}
      >
        <span
          className={cn(
            'absolute right-[10px] top-[10px] flex size-[18px] items-center justify-center rounded-full border-[1.5px] transition-colors',
            selected ? 'border-[#2F68E5] bg-[#2F68E5]' : 'border-[#DDE2EE] bg-transparent'
          )}
        >
          {selected && (
            <span className="size-[7px] rounded-full bg-white motion-safe:animate-in motion-safe:zoom-in-50" />
          )}
        </span>
        {/* Icon stays a single neutral grey in every state — selection is shown
            by the card border, radio, and footer tint, not the icon color. */}
        <span className="flex size-[46px] items-center justify-center rounded-[12px] bg-[#EEF1F8] text-[#5B6B8F]">
          <Icon className="size-[24px]" strokeWidth={2} />
        </span>
      </div>
      {/* Footer — label strip */}
      <div
        className={cn(
          'w-full border-t px-[14px] py-[11px] transition-colors',
          selected ? 'border-[#CFE0FF] bg-[#E9F0FF]' : 'border-[#EDEFF4] bg-[#F6F8FB]'
        )}
      >
        <span
          className={cn(
            'block text-center text-[13px] leading-[17px] text-[#17173A]',
            selected ? 'font-semibold' : 'font-medium'
          )}
          style={FONT}
        >
          {label}
        </span>
      </div>
    </button>
  );
}

/**
 * 4-step "Personalize Co-Marketer" onboarding modal (Figma node 5442:3829).
 * Skippable at any step; only the final step persists via onComplete.
 */
const PersonalizeCoMarketerModal: React.FC<PersonalizeCoMarketerModalProps> = ({
  open,
  onClose,
  onComplete,
  startInSteps = false,
  initialData = null,
}) => {
  // `started` gates the intro/welcome screen in front of the stepper — the flow
  // opens on a single "what this is" page, then reveals the steps on Get started.
  // In edit mode (startInSteps) we skip the intro and pre-fill saved answers.
  const [started, setStarted] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [data, setData] = React.useState<PersonalizeCoMarketerData>(EMPTY_DATA);

  React.useEffect(() => {
    if (open) {
      setStarted(startInSteps);
      setStepIndex(0);
      setData(initialData ?? EMPTY_DATA);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- reset only on open transition

  // The modal unmounts while closed (`if (!open) return null` below), so the
  // card/backdrop replay their CSS enter animation every time it reopens.

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isRoleStep = stepIndex === 0;
  const isLastStep = stepIndex === STEPS.length - 1;
  const isMultiStep = !isRoleStep; // role = single-select radio; the rest = multi-select checkbox
  const gridSize = isLastStep ? 1 : 2;

  const toggleMulti = (list: string[], value: string, max?: number): string[] => {
    if (list.includes(value)) return list.filter((v) => v !== value);
    if (max !== undefined && list.length >= max) return list;
    return [...list, value];
  };

  const handleSelect = (option: string) => {
    setData((prev) => {
      if (isRoleStep) return { ...prev, role: prev.role === option ? null : option };
      if (stepIndex === 1) return { ...prev, goals: toggleMulti(prev.goals, option, step.max) };
      if (stepIndex === 2) return { ...prev, metrics: toggleMulti(prev.metrics, option, step.max) };
      return { ...prev, aiPreferences: toggleMulti(prev.aiPreferences, option, step.max) };
    });
  };

  const isSelected = (option: string) => {
    if (isRoleStep) return data.role === option;
    if (stepIndex === 1) return data.goals.includes(option);
    if (stepIndex === 2) return data.metrics.includes(option);
    return data.aiPreferences.includes(option);
  };

  const isAtCap = (option: string) => {
    if (!step.max || isSelected(option)) return false;
    if (stepIndex === 1) return data.goals.length >= step.max;
    if (stepIndex === 2) return data.metrics.length >= step.max;
    return false;
  };

  // Each step needs at least one pick before you can move on — "Skip for now"
  // is the deliberate way out, not an empty Continue.
  const isStepValid = () => {
    if (isRoleStep) return data.role !== null;
    if (stepIndex === 1) return data.goals.length > 0;
    if (stepIndex === 2) return data.metrics.length > 0;
    return data.aiPreferences.length > 0;
  };
  const canContinue = isStepValid();

  const handleContinue = () => {
    if (!canContinue) return;
    if (isLastStep) {
      onComplete(data);
      return;
    }
    setStepIndex((i) => i + 1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[16px]">
      <div className="personalize-backdrop-in absolute inset-0 bg-[rgba(23,23,58,0.45)]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'personalize-card-in relative flex w-full flex-col overflow-hidden rounded-[18px] bg-white shadow-[0px_20px_40px_0px_rgba(23,23,58,0.18)]',
          // Intro is a stacked GIF + copy card (narrower); the stepper stays wide
          // for the 4-col role grid. Padding is applied per-branch below.
          started ? 'max-w-[880px] gap-[28px] px-[44px] pb-[36px] pt-[40px]' : 'max-w-[560px]'
        )}
      >
        {/* Close — dark translucent chip over the GIF on the intro, light chip on
            the white stepper background. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={cn(
            'absolute right-[16px] top-[16px] z-[1] flex size-[32px] items-center justify-center rounded-full transition-colors',
            started
              ? 'rounded-[8px] text-[#9097AD] hover:bg-[#F2F4F9] hover:text-[#17173A]'
              : 'bg-[rgba(23,23,58,0.35)] text-white backdrop-blur-sm hover:bg-[rgba(23,23,58,0.55)]'
          )}
        >
          <X className="size-[18px]" strokeWidth={2} />
        </button>

        {!started ? (
          /* Intro / welcome — states the purpose once, up front, before the
             stepper starts. Stacked per Figma: a full-bleed GIF banner on top,
             then the copy, then the two CTAs. */
          <div key="intro" className="personalize-step-in flex w-full flex-col">
            {/* GIF banner — full-bleed to the card's top/side edges, its bottom
                edge masked so it dissolves into the white copy area below. */}
            <div
              className="w-full overflow-hidden bg-[#0B1020]"
              style={{
                maskImage: 'linear-gradient(to bottom, #000 68%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, #000 68%, transparent 100%)',
              }}
            >
              <img
                src={personalizeIntroGif}
                alt=""
                aria-hidden="true"
                className="block h-[212px] w-full object-cover"
              />
            </div>

            {/* Copy + CTAs */}
            <div className="flex flex-col gap-[20px] px-[36px] pb-[32px] pt-[26px]">
              <div className="flex flex-col gap-[10px]">
                <p className="text-[26px] font-semibold leading-[34px] text-[#17173A]" style={FONT}>
                  Help Zeno understand you better
                </p>
                <p className="text-[14px] leading-[22px] text-[#6F6F8D]" style={FONT}>
                  Four quick questions — your role, goals, metrics, and how you like to work —
                  so we can show sharper insights and better next actions.
                </p>
                <p className="mt-[2px] text-[12px] font-medium text-[#9097AD]" style={FONT}>
                  Takes less than a minute · You can update this anytime
                </p>
              </div>

              <div className="flex items-center gap-[10px]">
                <DsButton onClick={() => setStarted(true)}>Get started</DsButton>
                <DsButton variant="tertiary" onClick={onClose}>Maybe later</DsButton>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header — step count + question title. Close X (on the card) sits
                in this header row. */}
            <div className="flex w-full flex-col gap-[4px] pr-[40px]">
              <p className="whitespace-nowrap text-[12px] font-medium text-[#9097AD]" style={FONT}>
                Step {stepIndex + 1} of {STEPS.length}
              </p>
              <p
                key={stepIndex}
                className="personalize-step-in w-full text-[20px] font-semibold leading-[28px] text-[#17173A]"
                style={FONT}
              >
                {step.title}
              </p>
            </div>

            {/* Progress line at the header/body boundary — full-bleed, starts at
                the modal's left edge and fills to the current step's fraction
                (negative margins cancel the card's horizontal padding). */}
            <div className="-mx-[44px] h-[3px] bg-[#E7EAF2]">
              <div
                className="h-full bg-[#2F68E5] transition-[width] duration-300 ease-out"
                style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            {/* Step body — hint + options; re-keyed per step so it fades up on
                advance/back instead of hard-swapping. */}
            <div key={stepIndex} className="personalize-step-in flex w-full flex-col gap-[16px]">
              <p className="w-full text-[13px] text-[#9097AD]" style={FONT}>
                {step.hint ? step.hint(data) : 'Choose one'}
              </p>

              {isRoleStep ? (
                <div className="grid w-full grid-cols-4 gap-[12px]">
                  {step.options.map((option) => (
                    <RoleCard
                      key={option}
                      label={option}
                      selected={isSelected(option)}
                      onClick={() => handleSelect(option)}
                    />
                  ))}
                </div>
              ) : (
                /* 2-col grid so an odd trailing option (e.g. Churn risk) sits in
                   one column at half width instead of stretching full-bleed. */
                <div className={cn('grid w-full gap-[12px]', gridSize === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
                  {step.options.map((option) => (
                    <OptionButton
                      key={option}
                      label={option}
                      multi={isMultiStep}
                      selected={isSelected(option)}
                      disabled={isAtCap(option)}
                      onClick={() => handleSelect(option)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer — "Skip for now" on the left, Back + Continue grouped on
                the right (matches the Figma structure). */}
            <div className="flex w-full items-center justify-between gap-[16px]">
              <DsButton variant="link" onClick={onClose}>Skip for now</DsButton>
              <div className="flex shrink-0 items-center gap-[10px]">
                {!isRoleStep && (
                  <DsButton variant="tertiary" onClick={() => setStepIndex((i) => i - 1)}>Back</DsButton>
                )}
                <DsButton onClick={handleContinue} disabled={!canContinue}>
                  {step.continueLabel}
                </DsButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default PersonalizeCoMarketerModal;
