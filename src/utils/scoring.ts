import type { ResearchCase, IntuitionAnswerRecord } from '../types/game';

const CASE1_CORRECT: Record<string, string> = {
  q_risk_impression: 'q1_youth',
  q_majority_impression: 'q2_adult',
  q_elderly_share: 'q3_minority',
};

const CASE2_CORRECT: Record<string, string> = {
  q_dui_media: 'media_dui_heavy',
  q_dui_enforcement: 'unlicensed_enforce_more',
  q_dui_framing: 'framing_diverse',
};

export function getCaseCorrectAnswers(researchCase: ResearchCase): Record<string, string> {
  if (researchCase.topic?.correctAnswers) {
    return researchCase.topic.correctAnswers;
  }
  if (researchCase.id === 'unlicensed_vs_dui') {
    return CASE2_CORRECT;
  }
  return CASE1_CORRECT;
}

export function evaluateIntuitionRecord(
  researchCase: ResearchCase,
  record: IntuitionAnswerRecord | null | undefined
): { correct: number; total: number } {
  const questions = researchCase.intuitionQuestions ?? [];
  const total = questions.length;
  if (!record || total === 0) {
    return { correct: 0, total };
  }
  const correctMap = getCaseCorrectAnswers(researchCase);
  let correct = 0;
  for (const q of questions) {
    if (record.answers[q.id] && record.answers[q.id] === correctMap[q.id]) {
      correct += 1;
    }
  }
  return { correct, total };
}
