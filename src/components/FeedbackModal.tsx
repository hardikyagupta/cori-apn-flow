import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DsButton } from '@/components/ui/ds-button';

export type FeedbackSentiment = 'up' | 'down';

interface FeedbackModalProps {
  sentiment: FeedbackSentiment;
  onClose: () => void;
  onSubmit: (data: { sentiment: FeedbackSentiment; tags: string[]; details: string }) => void;
}

const MANROPE = { fontFamily: 'Manrope, sans-serif' } as const;

const CONFIG = {
  up: {
    title: 'Share feedback',
    subtitle: '',
    chips: ['Solved my task', 'Followed my instructions', 'Good output quality', 'Fast and efficient', 'Useful insights', 'Other'],
    detailsLabel: '',
    detailsRequired: false,
    placeholder: 'Share details (optional)',
    footer: 'Your feedback helps improve Zeno.',
    submit: 'Submit',
  },
  down: {
    title: 'What do you feel is wrong?',
    subtitle: 'Your feedback helps us improve future results.',
    chips: ['Incorrect or incomplete', 'Not what I asked for', 'Style or tone', 'Too generic', 'Other'],
    detailsLabel: 'Please provide details',
    detailsRequired: true,
    placeholder: 'What could be improved about this response?',
    footer: '',
    submit: 'Send feedback',
  },
} as const;

const FeedbackModal: React.FC<FeedbackModalProps> = ({ sentiment, onClose, onSubmit }) => {
  const cfg = CONFIG[sentiment];
  const [tags, setTags] = useState<string[]>([]);
  const [details, setDetails] = useState('');

  const toggle = (c: string) =>
    setTags((prev) => (prev.includes(c) ? prev.filter((t) => t !== c) : [...prev, c]));

  const canSubmit = tags.length > 0 || details.trim().length > 0;

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/30 p-[16px]"
      onClick={onClose}
      style={MANROPE}
    >
      <div
        className="w-full max-w-[520px] max-h-full overflow-y-auto bg-card rounded-[16px] shadow-[0px_20px_48px_-12px_oklch(0.21_0.034_263.436_/_0.28)] p-[20px] flex flex-col gap-[16px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <h2 className="text-[18px] font-semibold leading-[24px] text-[var(--color-ink)]">{cfg.title}</h2>
            {cfg.subtitle && <p className="text-[13px] leading-[18px] text-[var(--color-grey)]">{cfg.subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex items-center justify-center p-[6px] rounded-[8px] shrink-0 hover:bg-[var(--color-surface-1)] transition-colors"
          >
            <X className="size-[18px] text-[var(--color-grey)]" />
          </button>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-[8px]">
          {cfg.chips.map((c) => {
            const sel = tags.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                // Both states carry the same 1px border — dropping it on select
                // used to shrink the chip, re-wrap the row, and resize/jerk the
                // centered modal.
                className={cn(
                  'inline-flex items-center gap-[6px] rounded-full border px-[12px] py-[6px] text-[14px] leading-[20px] transition-colors',
                  sel
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-[var(--color-line)] bg-card text-[var(--color-ink)] hover:bg-[var(--color-surface-0)]'
                )}
              >
                {/* Always render a 14px icon (Plus ↔ Check) so the chip width never shifts */}
                {sel
                  ? <Check className="size-[14px] text-white shrink-0" />
                  : <Plus className="size-[14px] text-[var(--color-grey)] shrink-0" />}
                {c}
              </button>
            );
          })}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-[6px]">
          {cfg.detailsLabel && (
            <label className="text-[13px] font-medium text-[var(--color-ink)]">
              {cfg.detailsLabel}
              {cfg.detailsRequired && <span className="text-[var(--color-danger)]"> *</span>}
            </label>
          )}
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={cfg.placeholder}
            rows={4}
            className="w-full resize-none rounded-[10px] border border-[var(--color-line)] bg-card px-[12px] py-[10px] text-[14px] leading-[20px] text-[var(--color-ink)] placeholder:text-[var(--color-grey-soft)] focus:outline-none focus:ring-1 focus:ring-[var(--color-royal)]"
          />
        </div>

        {cfg.footer && <p className="text-[12px] text-[var(--color-grey)]">{cfg.footer}</p>}

        {/* Submit */}
        <DsButton
          className="w-full"
          disabled={!canSubmit}
          onClick={() => onSubmit({ sentiment, tags, details })}
        >
          {cfg.submit}
        </DsButton>
      </div>
    </div>
  );
};

export default FeedbackModal;
