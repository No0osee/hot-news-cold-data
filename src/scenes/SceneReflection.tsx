import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowLeft, ArrowRight, RefreshCw, Compass, HelpCircle, CheckCircle2, XCircle, Target, Award } from 'lucide-react';
import type { ResearchCase, IntuitionAnswerRecord, NewsObservation } from '../types/game';
import { elderlyImpressionLabel } from '../data/impressions';
import { evaluateIntuitionRecord } from '../utils/scoring';

gsap.registerPlugin(useGSAP);

interface Props {
  researchCase: ResearchCase;
  intuitionAnswers: IntuitionAnswerRecord | null;
  observation: NewsObservation;
  initialReflectionDraft?: { answers?: Record<string, string>; checked?: boolean } | null;
  onReflectionDraftChange?: (draft: { answers: Record<string, string>; checked: boolean }) => void;
  onCompleteReflection?: (score: { correct: number; total: number; answers: Record<string, string> }) => void;
  isAllIslandsCompleted?: boolean;
  onOpenSummary?: () => void;
  nextIsland?: { id: string; title: string } | null;
  onGoNextIsland?: () => void;
  reset: () => void;
  restart: () => void;
}

const CASE1_QUESTIONS = [
  {
    id: 's1',
    stage: '第 1 題 ｜ 四篇新聞，就是四場事故？',
    claim: '「在新聞版面上看到四篇高齡車禍報導，就代表現實中一定發生了四起獨立事故！」',
    claimContext: '從報導篇數推論事故件數的常見誤區',
    correctType: 'b',
    options: [
      { type: 'a', label: '對，每篇新聞都必然對應一件不同的事故' },
      { type: 'b', label: '不對，同一件重大事故（如三峽事故）往往會衍生事發、換照檢討等多篇報導' },
      { type: 'c', label: '無法判斷，因為新聞不會記載事故地點與案情' }
    ],
    explanation: '單一重大事故常衍生事故進展、換照檢討與政策回應等多篇報導。在先前的六篇報導示例中，四篇高齡報導其實只涉及兩起事故（其中三篇都是同一件三峽事故）。因此「新聞報導篇數」與「獨立事故件數」必須分開計算。'
  },
  {
    id: 's2',
    stage: '第 2 題 ｜ 改換照制度，就能解決車禍問題？',
    claim: '「重大車禍引發民怨，只要政府把換照年齡降到 70 歲並嚴格體檢，就能解決臺灣主要車禍問題！」',
    claimContext: '常見於重大事故後新聞名嘴與社評的修法訴求',
    correctType: 'a',
    options: [
      { type: 'a', label: '事故登記分布不足以證明換照政策能解決主要車禍問題，還需要政策成效等證據' },
      { type: 'b', label: '論述完全正確，高齡換照是目前解決車禍最主要的靈丹妙藥' },
      { type: 'c', label: '警政署根本沒有高齡事故統計，這是憑空捏造的新聞' }
    ],
    explanation: '高齡組佔本專題三組第一當事者紀錄的 16.2%，描述的是登記分布，並不能直接判定換照政策的成效或重要性。要評估政策能減少多少傷害，還需事故嚴重程度、各年齡層開車的頻率、里程，以及政策實施前後的事故變化等資料。'
  },
  {
    id: 's3',
    stage: '第 3 題 ｜ 幾場事故，能代表所有長輩？',
    claim: '「新聞常報導老人家開車暴衝、踩錯油門撞進超商，這證明高齡駕駛普遍都有這種危險駕駛習慣！」',
    claimContext: '常見於重大車禍報導後的以偏概全直覺',
    correctType: 'a',
    options: [
      { type: 'a', label: '不對，少數新聞個案不能證明整個高齡族群普遍有相同的駕駛習慣' },
      { type: 'b', label: '論述完全正確，既然新聞頻繁報導，就代表絕大多數長輩開車都有暴衝習慣' },
      { type: 'c', label: '說法正確，因為高齡者生理機能退化，日常上路必然全部都會踩錯踏板' }
    ],
    explanation: '鮮明的事故報導可能使個案更容易被想起，但少數新聞個案不足以證明整個高齡族群普遍有相同的駕駛習慣。判斷群體常態仍需相應的整體資料。'
  }
];

const CASE2_QUESTIONS = [
  {
    id: 's1',
    stage: '第 1 題 ｜ 新聞檢索量等於執法取締規模？',
    claim: '「OpView 資料庫中酒駕新聞檢索量是無照的 7.1 倍，證明警察實際取締酒駕的件數也比無照多 7 倍！」',
    claimContext: '將媒體報導聲量直接等同於行政執法件數',
    correctType: 'b',
    options: [
      { type: 'a', label: '對，新聞檢索比例永遠等於警方實際取締比例' },
      { type: 'b', label: '不對，新聞檢索量反映媒體關注度，不能直接推論官方執法取締規模' },
      { type: 'c', label: '無法比較，因為警方從不統計酒駕取締件數' }
    ],
    explanation: '媒體選題受戲劇性與道德譴責焦點影響；官方取締則依行政稽查紀錄。114 年警政署酒駕取締 56,303 件，而公路局道交 21 條四欄無照取締合計達 147,668 件，兩者與新聞聲量方向相反。'
  },
  {
    id: 's2',
    stage: '第 2 題 ｜ 不同機關的取締統計可以直接相加算占比？',
    claim: '「把警政署酒駕 56,303 件跟公路局無照 147,668 件加起來當分母，就能算出全國所有違規中無照占 72.4%！」',
    claimContext: '跨機關、不同統計口徑數值強行合併的誤區',
    correctType: 'a',
    options: [
      { type: 'a', label: '不對，兩者主管機關與統計範圍不同（且公路局四欄非全國無照總數），不可直接相加算母體占比' },
      { type: 'b', label: '完全正確，只要單位都是「件」就能直接相加算出全國比例' },
      { type: 'c', label: '應該把新聞篇數跟取締件數全部加在一起算百分比' }
    ],
    explanation: '警政署酒駕為全國警察機關取締總量，而公路局 147,668 件僅為道交 21 條特定四欄合計（非全國總數），且同一案件可能同時涉酒駕與無照，不能直接相加當成互斥母體。'
  },
  {
    id: 's3',
    stage: '第 3 題 ｜ 無照駕駛都只是未成年青少年？',
    claim: '「既然重大新聞常看到少年無照偷開車釀禍，代表無照駕駛問題只要管好未成年學生就能解決！」',
    claimContext: '由單一高張力個案窄化結構性問題',
    correctType: 'a',
    options: [
      { type: 'a', label: '不對，無照駕駛還包含成年人駕照遭吊扣銷後仍上路、高齡未換照及偏鄉交通缺乏等多元成因' },
      { type: 'b', label: '對，成年人絕對不會發生無照駕駛違規' },
      { type: 'c', label: '只要提高罰鍰金額就不需要檢視駕訓與公共運輸配套' }
    ],
    explanation: '新聞偏好報導吸睛的青少年個案，但實務上無照違規涵蓋駕照吊銷後再犯、逾期未換照與非都會區代步需求，需針對不同成因設計配套。'
  }
];

export function SceneReflection({
  researchCase,
  intuitionAnswers,
  observation,
  initialReflectionDraft,
  onReflectionDraftChange,
  onCompleteReflection,
  isAllIslandsCompleted,
  onOpenSummary,
  nextIsland,
  onGoNextIsland,
  reset,
  restart,
}: Props) {
  const isCase2 = researchCase.id === 'unlicensed_vs_dui';
  const judgmentItems = isCase2 ? CASE2_QUESTIONS : CASE1_QUESTIONS;
  const boardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!boardRef.current) return;
      gsap.fromTo(
        boardRef.current.querySelectorAll('.gsap-reflect-item'),
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.44, stagger: 0.065, ease: 'power3.out', clearProps: 'transform,opacity' }
      );
    },
    { scope: boardRef, dependencies: [researchCase.id] }
  );

  const [userJudgments, setUserJudgments] = useState<Record<string, string>>(
    () => initialReflectionDraft?.answers ?? {}
  );

  const answeredCount = judgmentItems.filter(item => Boolean(userJudgments[item.id])).length;
  const isReflectionCompleted = answeredCount >= judgmentItems.length;
  const correctCount = judgmentItems.filter(item => userJudgments[item.id] === item.correctType).length;
  const allCorrect = correctCount === judgmentItems.length;

  const intuitionEval = evaluateIntuitionRecord(researchCase, intuitionAnswers);

  const handleSelectJudgment = (questionId: string, optionType: string) => {
    const next = { ...userJudgments, [questionId]: optionType };
    setUserJudgments(next);
    const nextAnsweredCount = judgmentItems.filter(item => Boolean(next[item.id])).length;
    const nowComplete = nextAnsweredCount >= judgmentItems.length;
    onReflectionDraftChange?.({ answers: next, checked: nowComplete });

    if (nowComplete) {
      const nextCorrect = judgmentItems.filter(item => next[item.id] === item.correctType).length;
      onCompleteReflection?.({
        correct: nextCorrect,
        total: judgmentItems.length,
        answers: next,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center p-4 md:p-8 pb-24"
    >
      <div ref={boardRef} className="relative z-10 w-full max-w-4xl mt-20 sm:mt-16 mb-6">
        <div className="bg-[#fcf8e3] border-4 border-[#8c734b] p-5 md:p-10 shadow-[8px_8px_0_0_rgba(0,0,0,0.85)] rounded-sm text-zinc-900 space-y-7">
          
          {/* Header */}
          <div className="border-b-2 border-[#8c734b] pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                isReflectionCompleted
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                  : 'bg-amber-100 text-zinc-800 border-amber-300'
              }`}>
                {isReflectionCompleted ? '已完成本島挑戰' : `判讀進度：${answeredCount} / ${judgmentItems.length} 題`}
              </span>
            </div>

            <h2 className="text-2xl md:text-4xl font-black font-serif text-zinc-950 flex items-center gap-3">
              <Compass className="text-[#8d2e25]" size={34} />
              <span>看完之後，哪些說法有根據？</span>
            </h2>

            <p className="text-sm md:text-base text-zinc-700 mt-2 leading-relaxed">
              請完成下方 {judgmentItems.length} 題判讀練習。<strong>全部作答後，這座島嶼就會正式插旗並更新你的識讀成果！</strong>
            </p>
          </div>

          {/* Section: Interactive Post-test */}
          <div className="bg-[#f7f2e4] p-4 md:p-6 border-2 border-[#8c734b] rounded shadow-inner space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8c734b]/40 pb-2">
              <h3 className="text-base md:text-lg font-black font-serif text-zinc-950 flex items-center gap-2">
                <Target className="text-[#8d2e25]" size={20} />
                <span>判讀練習：新聞篇數與事故資料</span>
              </h3>
            </div>

            <p className="text-xs md:text-sm text-zinc-700 leading-relaxed font-sans">
              看看下面三句話。<strong>只靠剛才的新聞和資料，真的能這樣說嗎？</strong>每題選一個答案，就會看到解釋。
            </p>

            <div className="space-y-4">
              {judgmentItems.map((s) => {
                const selected = userJudgments[s.id];
                const isCorrect = selected === s.correctType;

                return (
                  <div
                    key={s.id}
                    className="gsap-reflect-item bg-white p-4 md:p-5 border-2 border-zinc-400 rounded shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 bg-zinc-800 text-yellow-300 text-xs font-mono font-black rounded">
                        {s.stage}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {s.claimContext}
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50/90 border-l-4 border-[#8c734b] text-sm md:text-base font-bold text-zinc-950 font-serif leading-relaxed">
                      {s.claim}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                      {s.options.map(opt => {
                        const isThisSelected = selected === opt.type;
                        let btnStyle = 'bg-zinc-50 hover:bg-amber-50 border-zinc-300 text-zinc-800 shadow-sm';

                        if (selected) {
                          if (opt.type === s.correctType) {
                            btnStyle = 'bg-emerald-100 border-emerald-600 text-emerald-950 font-black ring-2 ring-emerald-500';
                          } else if (isThisSelected) {
                            btnStyle = 'bg-rose-100 border-rose-500 text-rose-950 font-bold';
                          } else {
                            btnStyle = 'opacity-50 bg-zinc-100 border-zinc-200 text-zinc-500';
                          }
                        }

                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => handleSelectJudgment(s.id, opt.type)}
                            className={`p-3 text-xs md:text-sm rounded border-2 transition-all cursor-pointer text-left flex items-start gap-2 ${btnStyle}`}
                          >
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {selected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`p-3.5 rounded border text-xs md:text-sm leading-relaxed space-y-1 ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                            : 'bg-amber-50 border-amber-400 text-amber-950'
                        }`}
                      >
                        <div className="font-black flex items-center gap-1.5">
                          {isCorrect ? (
                            <>
                              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                              <span>✓ 答對了，看看原因</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={16} className="text-rose-700 shrink-0" />
                              <span>再想一想，看看下面的解釋：</span>
                            </>
                          )}
                        </div>
                        <p className="font-sans pt-1 text-zinc-800">
                          {s.explanation}
                        </p>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completion Feedback Card (Intuition vs Reflection Comparison + Next Island Entry) */}
          {isReflectionCompleted ? (
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="p-5 md:p-6 bg-emerald-50 border-3 border-emerald-700 rounded shadow-[4px_4px_0_0_#064e3b] space-y-4"
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
                  {allCorrect ? '判讀全對 ★' : `判讀答對 ${correctCount}/${judgmentItems.length}`}
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
                    {observation?.selectedImpression && ` ｜ 印象：${elderlyImpressionLabel(observation.selectedImpression) ?? ''}`}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded border-2 border-emerald-600 space-y-1">
                  <div className="text-xs font-mono font-bold text-emerald-800">STEP 4 ｜ 看完新聞與數據後的反思練習</div>
                  <div className="text-lg font-black text-emerald-900">
                    答對 {correctCount} / {judgmentItems.length} 題
                  </div>
                  <div className="text-xs text-zinc-700">
                    {correctCount >= intuitionEval.correct
                      ? '讀完新聞脈絡與官方統計口徑後，你更能分辨哪些推論有資料支持！'
                      : '可回頭看看上方題目解析，釐清新聞篇數與統計口徑的界線。'}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* Progressive Disclosure: Deep Research Probing Questions */}
          <details className="bg-white p-4 md:p-5 border-2 border-[#c5b596] rounded">
            <summary className="font-black text-base md:text-lg font-serif text-zinc-950 cursor-pointer select-none flex items-center gap-2">
              <HelpCircle className="text-[#8d2e25] shrink-0" size={20} />
              <span>延伸閱讀：還可以想想這 {researchCase.reflectionPrompts.length} 個研究問題（點此展開）</span>
            </summary>
            <div className="space-y-3 mt-4 pt-3 border-t border-zinc-200">
              {researchCase.reflectionPrompts.map((prompt, idx) => (
                <div key={prompt.id} className="bg-[#fcf8e3] p-3.5 border-l-4 border-[#8d2e25] rounded-r space-y-1.5">
                  <h4 className="font-black text-sm md:text-base text-zinc-950">
                    Q{idx + 1}. {prompt.question}
                  </h4>
                  <p className="text-xs md:text-sm text-zinc-700 leading-relaxed font-serif">
                    <strong>可以這樣想：</strong>{prompt.explanation}
                  </p>
                </div>
              ))}
            </div>
          </details>

          {isReflectionCompleted && isAllIslandsCompleted && (
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

          {/* Action Buttons */}
          <div className="pt-4 border-t-2 border-[#8c734b] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={reset}
              className="w-full sm:w-auto px-5 py-3 bg-black hover:bg-zinc-800 text-white font-bold text-sm md:text-base rounded border-2 border-black shadow-[4px_4px_0_0_#444] cursor-pointer flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <ArrowLeft size={18} />
              <span>{isReflectionCompleted ? '返回 3D 地圖' : '暫時返回地圖（保留進度）'}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              {isReflectionCompleted && isAllIslandsCompleted && onOpenSummary ? (
                <button
                  type="button"
                  onClick={onOpenSummary}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm md:text-base rounded border-2 border-black shadow-[4px_4px_0_0_#000] cursor-pointer flex items-center justify-center gap-1.5 transition-all min-h-[48px]"
                >
                  <span>查看全島成果</span>
                  <ArrowRight size={18} />
                </button>
              ) : (
                isReflectionCompleted && nextIsland && onGoNextIsland && (
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

        </div>
      </div>
    </motion.div>
  );
}
