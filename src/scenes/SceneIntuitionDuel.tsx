import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { HelpCircle, ArrowRight, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { ResearchCase, IntuitionAnswerRecord } from '../types/game';

gsap.registerPlugin(useGSAP);

interface Props {
  researchCase: ResearchCase;
  initialRecord?: IntuitionAnswerRecord | null;
  initialDraft?: { answers?: Record<string, string>; confidenceLevel?: 1 | 2 | 3 | null } | null;
  onDraftChange?: (draft: { answers: Record<string, string>; confidenceLevel: 1 | 2 | 3 | null }) => void;
  onSubmit: (record: IntuitionAnswerRecord) => void;
}

export function SceneIntuitionDuel({ researchCase, initialRecord, initialDraft, onDraftChange, onSubmit }: Props) {
  const questions = researchCase.intuitionQuestions || [];
  const boardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!boardRef.current) return;
      gsap.fromTo(
        boardRef.current.querySelectorAll('.gsap-q-card'),
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }
      );
    },
    { scope: boardRef, dependencies: [researchCase.id] }
  );

  const [answers, setAnswers] = useState<Record<string, string>>(
    initialRecord?.answers ?? initialDraft?.answers ?? {}
  );
  const [confidenceLevel, setConfidenceLevel] = useState<1 | 2 | 3 | null>(
    initialRecord?.confidenceLevel ?? initialDraft?.confidenceLevel ?? null
  );

  const isAllAnswered = questions.length > 0 && questions.every(q => answers[q.id]) && confidenceLevel !== null;
  const unansweredCount = questions.filter(q => !answers[q.id]).length;

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => {
      const next = { ...prev, [questionId]: optionId };
      onDraftChange?.({ answers: next, confidenceLevel });
      return next;
    });
  };

  const handleConfidence = (level: 1 | 2 | 3) => {
    setConfidenceLevel(level);
    onDraftChange?.({ answers, confidenceLevel: level });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllAnswered || confidenceLevel === null) return;
    onSubmit({ answers, confidenceLevel });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center p-4 md:p-8 pb-24"
    >

      <div ref={boardRef} className="relative z-10 w-full max-w-3xl mt-20 sm:mt-16 mb-6 md:mt-14">
        <div className="bg-[#fcf8e3] border-4 border-[#8c734b] p-5 md:p-8 shadow-[8px_8px_0_0_rgba(0,0,0,0.85)] rounded-sm text-zinc-900 space-y-6">
          
          {/* Header */}
          <div className="border-b-2 border-[#8c734b] pb-4">
            <h2 className="text-2xl md:text-3xl font-black font-serif text-zinc-950 flex items-center gap-2.5">
              <Zap className="text-[#8d2e25]" size={30} />
              <span>你原本是怎麼想的？</span>
            </h2>

            <p className="text-sm md:text-base text-zinc-700 mt-2 leading-relaxed font-sans">
              先不用查資料，憑印象回答這 {questions.length} 題。接著讀 {researchCase.articles.length} 篇新聞，再猜猜數字，看看和官方資料差多少。
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {questions.map((q, idx) => {
                const selectedOptId = answers[q.id];

                return (
                  <div
                    key={q.id}
                    className="gsap-q-card bg-[#f4ebd0] p-4 md:p-6 border-2 border-[#c5b596] rounded space-y-3 shadow-inner"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-[#e9ddbc] text-zinc-800 text-sm font-normal rounded">
                        Q{idx + 1} ｜ {q.tag}
                      </span>
                    </div>

                    <h3 className="text-lg md:text-xl font-semibold text-zinc-950 leading-relaxed">
                      {q.prompt}
                    </h3>

                    {q.plainNote && (
                      <p className="bg-[#fcf8e8] border-l-4 border-[#8c734b] px-3.5 py-2 text-xs md:text-sm text-zinc-700 leading-relaxed">
                        {q.plainNote}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {q.options.map(opt => {
                        const isSelected = selectedOptId === opt.id;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelect(q.id, opt.id)}
                            aria-pressed={isSelected}
                            className={`p-3.5 border-2 rounded transition-all cursor-pointer flex items-center justify-center gap-2 text-base font-medium ${
                              isSelected
                                ? 'bg-yellow-300 border-zinc-950 text-zinc-950 shadow-[3px_3px_0_0_#000] -translate-x-0.5 -translate-y-0.5 ring-2 ring-red-700'
                                : 'bg-white hover:bg-amber-50 active:translate-x-0.5 active:translate-y-0.5 border-zinc-400 text-zinc-800 shadow-sm'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && (
                              <CheckCircle2 size={18} className="text-[#8d2e25] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confidence Selector */}
            <div className="bg-white p-4 border-2 border-[#c5b596] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs md:text-sm shadow-xs">
              <div className="flex items-center gap-2 font-black text-zinc-900">
                <HelpCircle size={18} className="text-[#8d2e25] shrink-0" />
                <span>你對剛才的答案有多大把握？</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { level: 1 as const, label: '不太確定' },
                  { level: 2 as const, label: '有點把握' },
                  { level: 3 as const, label: '很有把握' }
                ].map(c => (
                  <button
                    key={c.level}
                    type="button"
                    onClick={() => handleConfidence(c.level)}
                    className={`px-3 py-1.5 rounded font-mono text-xs font-bold border transition-colors cursor-pointer active:scale-95 ${
                      confidenceLevel === c.level
                        ? 'bg-zinc-900 text-yellow-300 border-zinc-900 shadow-sm'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-2 border-t-2 border-[#8c734b] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-700 font-mono font-bold flex items-center gap-1.5">
                <ShieldAlert size={16} className={isAllAnswered ? 'text-green-700' : 'text-amber-700'} />
                <span>
                  {isAllAnswered
                    ? '都答完了，可以讀新聞了'
                    : unansweredCount > 0
                      ? `尚有 ${unansweredCount} 題未作答${confidenceLevel === null ? '，也請選一下有多大把握' : ''}`
                      : '請選一下你對答案有多大把握'}
                </span>
              </div>

              <button
                type="submit"
                disabled={!isAllAnswered}
                className={`w-full sm:w-auto px-8 py-3.5 text-base md:text-lg font-black rounded border-2 border-black flex items-center justify-center gap-2 transition-all min-h-[48px] ${
                  isAllAnswered
                    ? 'bg-yellow-300 hover:bg-yellow-400 text-black shadow-[4px_4px_0_0_#000] cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000]'
                    : 'bg-zinc-300 text-zinc-500 cursor-not-allowed border-zinc-400 shadow-none'
                }`}
              >
                <span>答好了，來讀新聞</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
