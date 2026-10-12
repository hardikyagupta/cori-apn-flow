/**
 * What someone actually said to a question card, written out as their own turn.
 *
 * These cards used to be read back as prose — one line stitched together from
 * the answers, with whatever was skipped filled in from a guess and printed as
 * though the reader had chosen it. That put words in their mouth: the transcript
 * showed them picking things they never saw.
 *
 * So: the question, then what they said under it, and `No response` where they
 * said nothing. A skip still leaves the flow free to decide — it just has to own
 * the decision in its own turn rather than in theirs.
 */

import type {
  ApprovalQuestion,
  ApprovalAnswers,
} from '@/components/campaigns/campaign-creation/GoalApprovalCard';

export const NO_RESPONSE = 'No response';

/** An option's label without its gloss: the choice was "Digest", not
 *  "Digest — one line per finding, silent when all is well". */
function labelOf(question: ApprovalQuestion, value: string): string {
  const label = question.options.find((o) => o.value === value)?.label ?? value;
  return label.split(/\s+[—–-]\s+/)[0].trim();
}

/** Everything said to one question — picked first, then typed. Empty when the
 *  question was skipped. */
export function answersTo(
  question: ApprovalQuestion,
  answer: { values: string[]; custom: string } | undefined,
): string[] {
  const picked = (answer?.values ?? []).map((v) => labelOf(question, v));
  const typed = (answer?.custom ?? '').trim();
  return [...picked, ...(typed ? [typed] : [])];
}

/** True when nothing at all was given for this question. */
export function wasSkipped(answers: ApprovalAnswers, index: number): boolean {
  const answer = answers[index];
  return !(answer?.values.length || answer?.custom.trim());
}

/**
 * The whole card as a transcript: `> question` and the answer beneath it, one
 * blank line between pairs. The user bubble renders `whitespace-pre-wrap`, so
 * the shape survives the trip.
 */
export function describeApprovalAnswers(
  questions: ApprovalQuestion[],
  answers: ApprovalAnswers,
): string {
  return questions
    .map((question, i) => {
      const said = answersTo(question, answers[i]);
      return `> ${question.q}\n${said.length ? said.join('\n') : NO_RESPONSE}`;
    })
    .join('\n\n');
}
