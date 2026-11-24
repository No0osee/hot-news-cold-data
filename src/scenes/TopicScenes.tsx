import { useState, useRef } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Award, ArrowRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { TopicPredictionChart } from '../components/TopicPredictionChart';
import type { ResearchCase, IntuitionAnswerRecord, NewsObservation } from '../types/game';
import { evaluateIntuitionRecord } from '../utils/scoring';

gsap.registerPlugin(useGSAP);

const action = 'bg-yellow-300 hover:bg-yellow-400 border-2 border-black px-6 py-3 font-black shadow-[4px_4px_0_0_#000] cursor-pointer disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500';
const paper = 'bg-[#f4ebd0] p-4 md:p-6 border-2 border-[#c5b596] rounded space-y-3';

function Sheet({ step, title, badge, children }: { step: number; title: string; badge?: ReactNode; children: ReactNode }) {
  const sheetRef = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!sheetRef.current) return;
      gsap.fromTo(
        sheetRef.current.children,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.44, stagger: 0.055, ease: 'power3.out', clearProps: 'transform,opacity' }
      );
    },
    { scope: sheetRef, dependencies: [step, title] }
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen p-4 md:p-8 pt-24 sm:pt-20 pb-24 relative">
      <main ref={sheetRef} className="relative z-10 max-w-4xl mx-auto bg-[#fcf8e3] border-4 border-[#8c734b] rounded-sm p-5 md:p-8 text-zinc-900 shadow-[8px_8px_0_0_rgba(0,0,0,0.85)] space-y-5 select-text">
        <div className="border-b-2 border-[#8c734b] pb-4 space-y-2.5">
          {badge && <div className="flex flex-wrap items-center justify-between gap-2">{badge}</div>}
          <h2 className="text-2xl md:text-3xl font-serif font-black">{title}</h2>
        </div>
        {children}
      </main>
    </motion.div>
  );
}

function Sources({ researchCase }: { researchCase: ResearchCase }) {
  return (
    <div className="space-y-1.5 text-xs md:text-sm">
      {researchCase.topic!.sources.map(s => (
        <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="block underline text-sky-900 break-words font-medium">
          {s.title}
        </a>
      ))}
    </div>
  );
}

export function TopicReading({ researchCase, observation, onSubmit }: {
  researchCase: ResearchCase; observation: NewsObservation;
  onDraftChange?: Dispatch<SetStateAction<NewsObservation>>; onSubmit: (o: NewsObservation) => void;
}) {
  const topic = researchCase.topic!;
  const articles = researchCase.articles;

  return (
    <Sheet step={2} title="讀讀新聞：每篇在說什麼？">
      <div className="space-y-2">
        <h3 className="font-serif text-xl font-black">{researchCase.title}</h3>
        <p className="text-sm leading-relaxed text-zinc-700">
          這裡有 {articles.length} 篇新聞選例，可瀏覽標題或點選連結閱讀新聞原文。
        </p>
        <p className="text-sm font-bold text-[#8d2e25] bg-amber-100/80 px-3 py-2 border-l-4 border-[#8d2e25]">
          思考看看：{topic.readingPrompt}
        </p>
      </div>

      <div className="space-y-3">
        {articles.map((article, index) => (
          <article key={article.id} className={`${paper} !p-4 md:!p-5 bg-[#fdfbf3] !space-y-2`}>
            <div className="flex flex-wrap justify-between items-center gap-3 text-xs font-mono font-bold text-[#8d2e25]">
              <span>剪報 {String(index + 1).padStart(2, '0')} · {article.media} · {article.date}</span>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#8d2e25] hover:text-red-900 font-bold text-xs font-mono"
                aria-label={`看新聞原文：${article.title}`}
              >
                看新聞原文
              </a>
            </div>
            <h4 className="font-serif font-black text-base md:text-lg leading-snug text-zinc-950">
              {article.title}
            </h4>
          </article>
        ))}
      </div>

      <div className="flex justify-end pt-2 border-t-2 border-[#8c734b]">
        <button
          type="button"
          onClick={() =>
            onSubmit({
              ...observation,
              readArticleIds: articles.map(a => a.id),
            })
          }
          className={action}
        >
          來猜數字，再看答案
        </button>
      </div>
    </Sheet>
  );
}

export function TopicTruth({
  researchCase,
  intuitionAnswers,
  initialRevealed = false,
  initialTopicPredictions,
  onTopicPredictionDraftChange,
  next
}: {
  researchCase: ResearchCase;
  intuitionAnswers: IntuitionAnswerRecord | null;
  initialRevealed?: boolean;
  initialTopicPredictions?: Record<string, { guesses: (number | null)[]; revealed: boolean }> | null;
  onTopicPredictionDraftChange?: (seriesTitle: string, draft: { guesses: (number | null)[]; revealed: boolean }) => void;
  next: () => void;
}) {
  const topic = researchCase.topic!;
  const [revealed, setRevealed] = useState<string[]>(() => {
    if (initialRevealed) return topic.series.map(s => s.title);
    if (initialTopicPredictions) {
      return topic.series
        .filter(s => initialTopicPredictions[s.title]?.revealed)
        .map(s => s.title);
    }
    return [];
  });
  const allRevealed = topic.series.every(s => revealed.includes(s.title));

  return (
    <Sheet step={3} title="猜猜數字，看看差多少">
      <p className="text-sm bg-amber-100/70 border-l-4 border-[#8c734b] px-3 py-2 font-medium">{topic.scope}</p>

      {topic.series.map((s, idx) => (
        <section key={s.title} className={paper}>
          {topic.series.length > 1 && (
            <div className="text-xs font-mono font-bold text-[#8d2e25] mb-1">
              圖表 {idx + 1} / {topic.series.length} {revealed.includes(s.title) ? '（已揭曉 ✓）' : '（請先完成預測並揭曉）'}
            </div>
          )}
          <TopicPredictionChart
            series={s}
            initialRevealed={revealed.includes(s.title)}
            initialGuessesData={initialTopicPredictions?.[s.title]?.guesses}
            onDraftChange={draft => {
              onTopicPredictionDraftChange?.(s.title, draft);
              if (!draft.revealed) {
                setRevealed(previous => previous.filter(t => t !== s.title));
              }
            }}
            onReveal={() => setRevealed(previous => [...new Set([...previous, s.title])])}
          />
        </section>
      ))}

      {allRevealed && (
        <>
          {researchCase.id === 'topic-06' && (
            <section className={`${paper} text-center`} aria-label="全年總件數揭曉">
              <p className="font-mono text-sm">2025 年 · 全臺 · 警政署暴力犯罪</p>
              <p className="text-6xl md:text-8xl font-black font-mono text-[#8d2e25]">
                {topic.series[0].points[0].value.toLocaleString('zh-TW')}
                <span className="text-2xl ml-2">件</span>
              </p>
              <p className="font-bold">這是一整年的總件數。和你原先想的差多少？</p>
              <p className="text-sm text-zinc-700">件數比你想的少，也不代表不會遇到危險。</p>
            </section>
          )}
          {topic.supportingSeries && (
            <details className={paper}>
              <summary className="cursor-pointer font-bold">
                想看細節？{topic.series[0].points[0].value.toLocaleString('zh-TW')} 件包含哪些案類？
              </summary>
              <p className="text-sm">這張表列出全年總數包含哪些犯罪類型。</p>
              {topic.supportingSeries.map(s => (
                <table key={s.title} className="w-full text-sm">
                  <caption className="text-left font-bold py-2">{s.title}</caption>
                  <thead>
                    <tr>
                      <th className="text-left">案類</th>
                      <th className="text-right">發生數（件）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.points.map(p => (
                      <tr key={p.label} className="border-t border-[#c5b596]">
                        <td className="py-2">{p.label}</td>
                        <td className="text-right">{p.note?.startsWith('原表') ? '—（製圖值 0）' : p.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </details>
          )}
          <section className={paper}>
            <h3 className="font-serif text-xl font-black">這份資料說了什麼？</h3>
            <p className="leading-relaxed">{topic.finding}</p>
            <h4 className="font-black text-[#8d2e25] pt-2">這份資料還不能告訴我們什麼？</h4>
            <p className="text-sm leading-relaxed">{topic.limitation}</p>
          </section>
          <section className={paper}>
            <h3 className="font-serif text-xl font-black">
              看看剛才在第 1 步的 {researchCase.intuitionQuestions!.length} 題，你怎麼回答
            </h3>
            <p className="text-sm">
              你剛才有多大把握：
              <strong>{['', '不太確定', '有點把握', '很有把握'][intuitionAnswers?.confidenceLevel ?? 0] || '未記錄'}</strong>
              。除了看對錯，也看看答案為什麼是這樣。
            </p>
            <div className="space-y-3 pt-1">
              {researchCase.intuitionQuestions!.map((q, idx) => {
                const chosen = q.options.find(o => o.id === intuitionAnswers?.answers[q.id]);
                const correct = q.options.find(o => o.id === topic.correctAnswers[q.id])!;
                const matched = chosen?.id === correct.id;
                return (
                  <div key={q.id} className={`p-4 rounded border-2 space-y-2 text-sm ${matched ? 'bg-emerald-50/90 border-emerald-600' : 'bg-white border-[#c5b596]'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-zinc-800 text-amber-200 rounded">
                        第 {idx + 1} 題 · {q.tag}
                      </span>
                      {chosen && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${matched ? 'bg-emerald-700 text-white' : 'bg-[#8d2e25] text-white'}`}>
                          {matched ? '✓ 與資料一致' : '✕ 與答案不同'}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-base text-zinc-950">{q.prompt}</h4>
                    <div className="flex flex-wrap gap-2 text-xs md:text-sm pt-0.5">
                      <span className={`px-2.5 py-1 rounded border font-bold ${matched ? 'bg-emerald-100 border-emerald-500 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'}`}>
                        你的回答：{chosen?.label ?? '未記錄'}
                      </span>
                      {!matched && (
                        <span className="px-2.5 py-1 rounded border bg-amber-100 border-[#8c734b] text-zinc-950 font-bold">
                          {q.id === 'q3' ? '屬於過度推論的說法' : '參考答案'}：{correct.label}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-700 leading-relaxed pt-1 border-t border-zinc-200/80">{q.realityFact}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {!allRevealed && (
        <p className="text-sm font-bold text-[#8d2e25]" aria-live="polite">
          請先完成上方{topic.series.length > 1 ? `全部 ${topic.series.length} 張圖表（目前已揭曉 ${revealed.length} / ${topic.series.length} 張）` : '圖表'}的預測並按下「揭曉官方資料」，即可繼續下一步。
        </p>
      )}
      <button type="button" disabled={!allRevealed} onClick={next} className={action}>
        看完數據，再想一想
      </button>
    </Sheet>
  );
}

export function TopicReflection({
  researchCase,
  intuitionAnswers,
  initialReflectionDraft,
  onReflectionDraftChange,
  onCompleteReflection,
  isAllIslandsCompleted,
  onOpenSummary,
  nextIsland,
  onGoNextIsland,
  reset,
  restart,
}: {
  researchCase: ResearchCase;
  intuitionAnswers?: IntuitionAnswerRecord | null;
  observation?: NewsObservation;
  initialReflectionDraft?: { answers?: Record<string, string>; checked?: boolean } | null;
  onReflectionDraftChange?: (draft: { answers: Record<string, string>; checked: boolean }) => void;
  onCompleteReflection?: (score: { correct: number; total: number; answers: Record<string, string> }) => void;
  isAllIslandsCompleted?: boolean;
  onOpenSummary?: () => void;
  nextIsland?: { id: string; title: string } | null;
  onGoNextIsland?: () => void;
  reset: () => void;
  restart: () => void;
}) {
  const topic = researchCase.topic!;
  const [judgments, setJudgments] = useState<Record<string, string>>(
    () => initialReflectionDraft?.answers ?? {}
  );
  const [checked, setChecked] = useState<boolean>(
    () => Boolean(initialReflectionDraft?.checked)
  );

  // Deterministic permutation per topic ID so returning from map keeps the exact statement order
  const [statements] = useState(() => {
    const items = [
      { id: 'supported', text: topic.finding, correct: '資料支持', reason: `這份資料確實顯示了這個結果（統計的是：${topic.scope.replace(/[。.]$/, '')}）。` },
      { id: 'overreach', text: topic.overclaim, correct: '推論過度', reason: topic.limitation },
      { id: 'investigate', text: topic.investigation, correct: '仍需查證', reason: '這是在問另一個問題。這份資料沒有答案，還要找統計對象和計算方式一致的資料來比較。' },
    ];
    const seed = Number(researchCase.id.replace(/\D/g, '')) || 1;
    const shift = seed % items.length;
    return [...items.slice(shift), ...items.slice(0, shift)];
  });

  const tools = [
    ['資料從哪裡來？', '這是原始統計、調查估算，還是別人轉述？圖表裡的數字和原始資料說的是同一件事嗎？'],
    ['資料是哪時候的？', `這題用的是 ${researchCase.period} 的資料。它能說明現在的情況嗎？換一個起始年份，結果會不會不同？`],
    ['不同文章用了同一份資料嗎？', '兩篇文章都引用同一份統計，仍然只有一份資料。先找到原始來源，再比較。'],
    ['它強調了什麼，又少說了什麼？', '標題和圖表讓你注意到什麼？有沒有交代統計了誰、百分比怎麼算，以及哪些事還不知道？'],
  ];

  const answeredCount = statements.filter(s => Boolean(judgments[s.id])).length;
  const count = statements.filter(s => judgments[s.id] === s.correct).length;
  const intuitionEval = evaluateIntuitionRecord(researchCase, intuitionAnswers);

  const handleSelectOption = (statementId: string, label: string) => {
    const next = { ...judgments, [statementId]: label };
    setJudgments(next);
    onReflectionDraftChange?.({ answers: next, checked });
  };

  const handleConfirmCheck = () => {
    setChecked(true);
    onReflectionDraftChange?.({ answers: judgments, checked: true });
    const finalCorrect = statements.filter(s => judgments[s.id] === s.correct).length;
    onCompleteReflection?.({
      correct: finalCorrect,
      total: statements.length,
      answers: judgments,
    });
  };

  return (
    <Sheet
      step={4}
      title="看完之後，你會怎麼判斷？"
      badge={
        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
          checked
            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
            : 'bg-amber-100 text-zinc-800 border-amber-300'
        }`}>
          {checked ? '已完成本島挑戰' : `判讀進度：${answeredCount} / ${statements.length} 題`}
        </span>
      }
    >
      <p className="text-sm text-zinc-700 leading-relaxed">
        看完新聞與官方統計後，請對下面三句話選出合適的判斷並按下<strong>「選好了，看解釋」</strong>。完成後這座島嶼就會正式插旗並計入成果！
      </p>

      <section className={paper}>
        <h3 className="font-serif font-black text-xl">三句話，三種判斷</h3>
        <p className="text-sm leading-relaxed">
          每句話選一個：「資料支持」表示這份資料確實有這個結果；「推論過度」表示把數字解讀成它不能代表的意思；「仍需查證」表示這是另一個問題，要再找資料才知道。
        </p>
        <div className="space-y-4 pt-1">
          {statements.map((s, idx) => {
            const userChoice = judgments[s.id];
            const isItemCorrect = userChoice === s.correct;
            return (
              <fieldset
                key={s.id}
                className={`p-4 rounded border-2 space-y-3 transition-colors ${
                  checked
                    ? isItemCorrect
                      ? 'bg-emerald-50/90 border-emerald-600'
                      : 'bg-amber-50 border-[#8d2e25]'
                    : 'bg-white border-[#c5b596]'
                }`}
              >
                <legend className="sr-only">{s.text}</legend>
                <p className="font-bold text-base text-zinc-950">
                  <span className="font-mono text-xs bg-zinc-800 text-amber-200 px-2 py-0.5 rounded mr-2">
                    句子 {idx + 1}
                  </span>
                  {s.text}
                </p>
                <div className="flex flex-wrap gap-2">
                  {['資料支持', '推論過度', '仍需查證'].map(label => {
                    const isSelected = userChoice === label;
                    const isRightOption = checked && s.correct === label;
                    return (
                      <button
                        type="button"
                        key={label}
                        disabled={checked}
                        aria-pressed={isSelected}
                        onClick={() => handleSelectOption(s.id, label)}
                        className={`border-2 px-3.5 py-2 text-sm font-bold cursor-pointer transition-all rounded ${
                          checked
                            ? isRightOption
                              ? 'bg-emerald-700 text-white border-emerald-900 shadow-xs'
                              : isSelected
                                ? 'bg-rose-100 text-rose-900 border-rose-500 line-through'
                                : 'bg-zinc-100 text-zinc-400 border-zinc-300'
                            : isSelected
                              ? 'bg-yellow-300 border-black text-black shadow-[2px_2px_0_0_#000] -translate-x-0.5 -translate-y-0.5'
                              : 'bg-white hover:bg-amber-50 border-zinc-600 text-zinc-900'
                        }`}
                      >
                        {label}{isRightOption ? ' ✓' : ''}
                      </button>
                    );
                  })}
                </div>
                {checked && (
                  <div className={`p-3 rounded border text-sm leading-relaxed ${isItemCorrect ? 'bg-emerald-100/70 border-emerald-400 text-emerald-950' : 'bg-white border-[#c5b596] text-zinc-900'}`}>
                    <p className="font-bold mb-1">
                      <span className={isItemCorrect ? 'text-emerald-800' : 'text-[#8d2e25]'}>
                        {isItemCorrect ? '✓ 判斷正確' : `✕ 你的選擇「${userChoice}」→ 應為「${s.correct}」`}
                      </span>
                    </p>
                    <p>{s.reason}</p>
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>

        {!checked ? (
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={statements.some(s => !judgments[s.id])}
              onClick={handleConfirmCheck}
              className={action}
            >
              選好了，看解釋
            </button>
          </div>
        ) : (
          <div aria-live="polite" className="p-4 bg-white border-2 border-[#8c734b] rounded flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-black text-lg text-zinc-950">這次答對 {count} / 3 題</p>
              <p className="text-sm text-zinc-700">下次看到類似說法，可以先問：這份資料真的能得出這個結論嗎？</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setChecked(false);
                setJudgments({});
                onReflectionDraftChange?.({ answers: {}, checked: false });
              }}
              className="px-3 py-1.5 border border-zinc-600 rounded bg-amber-50 hover:bg-amber-100 font-bold text-sm cursor-pointer"
            >
              重新練習這三題
            </button>
          </div>
        )}
      </section>

      {/* Completion Feedback Card (Intuition vs Reflection Comparison) */}
      {checked && (
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-5 bg-emerald-50 border-3 border-emerald-700 rounded shadow-[4px_4px_0_0_#064e3b] space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-300 pb-3">
            <div className="flex items-center gap-2.5">
              <Award className="text-emerald-800 shrink-0" size={26} />
              <div>
                <h4 className="font-black text-lg md:text-xl font-serif text-zinc-950">
                  你的學習前後表現對照
                </h4>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-700 text-white text-xs font-mono font-bold">
              反思練習答對 {count} / 3
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-white p-3.5 rounded border border-emerald-300 space-y-1">
              <div className="text-xs font-mono font-bold text-zinc-500">STEP 1 ｜ 讀資料前的直覺作答</div>
              <div className="text-lg font-black text-zinc-900">
                答對 {intuitionEval.correct} / {intuitionEval.total} 題
              </div>
              <div className="text-xs text-zinc-600">
                當時把握度：{intuitionAnswers?.confidenceLevel === 3 ? '很有把握 ★★★' : intuitionAnswers?.confidenceLevel === 2 ? '有點把握 ★★☆' : '不太確定 ★☆☆'}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded border-2 border-emerald-600 space-y-1">
              <div className="text-xs font-mono font-bold text-emerald-800">STEP 4 ｜ 看完新聞與數據後的反思練習</div>
              <div className="text-lg font-black text-emerald-900">
                答對 {count} / {statements.length} 題
              </div>
              <div className="text-xs text-zinc-700">
                {count >= intuitionEval.correct
                  ? '對照統計口徑與限制後，你更清楚哪些推論有根據、哪些仍需查證！'
                  : '可回看上方每句話的解析，區分「資料支持」「推論過度」與「仍需查證」。'}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progressive Disclosure: Source Criticism & Further Question */}
      <details className="bg-white p-4 border-2 border-[#c5b596] rounded">
        <summary className="font-serif font-black text-base md:text-lg cursor-pointer select-none">
          延伸閱讀：查來源的四個問題與資料連結（點此展開）
        </summary>
        <div className="mt-3 pt-3 border-t border-zinc-200 space-y-4">
          <p className="text-xs text-zinc-600">這四個問題來自「來源批判」（Källkritik）：幫你檢查資料怎麼來、能回答什麼。</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {tools.map(([title, prompt]) => (
              <div key={title} className="border-l-4 border-[#8d2e25] pl-3">
                <h4 className="font-bold text-sm">{title}</h4>
                <p className="text-xs md:text-sm mt-1 leading-relaxed text-zinc-700">{prompt}</p>
              </div>
            ))}
          </div>
          <p className="text-sm border-l-4 border-[#8d2e25] pl-3 font-medium">還可以想想：{topic.furtherQuestion}</p>
          <Sources researchCase={researchCase} />
        </div>
      </details>

      {checked && isAllIslandsCompleted && (
        <div className="bg-[#f4ebd0] border-2 border-[#8c734b] rounded p-4 md:p-5 space-y-3">
          <div className="border-b border-[#c5b596] pb-2">
            <h4 className="font-serif font-black text-lg text-zinc-950">
              全部 13 座島嶼皆已完成：三條可以帶走的判讀方法
            </h4>
          </div>
          <ol className="space-y-2.5 text-sm text-zinc-800 list-decimal list-inside leading-relaxed">
            <li>
              <strong>先查分母：</strong>看到件數或人數時，先看各組的母體人數是否相同，換算成每十萬人或占母體比例後再比較。
            </li>
            <li>
              <strong>把同一事件的報導合併：</strong>多篇新聞可能都在追蹤同一樁事件，先區分報導篇數與實際發生的事件數。
            </li>
            <li>
              <strong>分清楚資料支持和仍需查證：</strong>統計資料能說明特定範圍內的整體變化與分布，但單一個案的原因或資料未涵蓋的部分仍需另外查證。
            </li>
          </ol>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="pt-4 border-t-2 border-[#8c734b] flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={reset}
          className="w-full sm:w-auto px-5 py-3 bg-black hover:bg-zinc-800 text-white font-bold text-sm md:text-base rounded border-2 border-black shadow-[4px_4px_0_0_#444] cursor-pointer flex items-center justify-center gap-2 transition-all min-h-[48px]"
        >
          <ArrowLeft size={18} />
          <span>{checked ? '返回 3D 地圖' : '暫時返回地圖（保留進度）'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          {checked && isAllIslandsCompleted && onOpenSummary ? (
            <button
              type="button"
              onClick={onOpenSummary}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm md:text-base rounded border-2 border-black shadow-[4px_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-1.5 transition-all min-h-[48px]"
            >
              <span>查看全島成果</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            checked && nextIsland && onGoNextIsland && (
              <button
                type="button"
                onClick={onGoNextIsland}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm md:text-base rounded border-2 border-black shadow-[4px_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-1.5 transition-all min-h-[48px]"
              >
                <span>下一座島：{nextIsland.title}</span>
                <ArrowRight size={18} />
              </button>
            )
          )}
          <button
            type="button"
            onClick={restart}
            className="w-full sm:w-auto px-5 py-3 bg-yellow-300 hover:bg-yellow-400 text-black font-black text-sm md:text-base rounded border-2 border-black shadow-[4px_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-1.5 transition-all min-h-[48px]"
          >
            <RefreshCw size={16} />
            <span>再次挑戰本島</span>
          </button>
        </div>
      </div>
    </Sheet>
  );
}
