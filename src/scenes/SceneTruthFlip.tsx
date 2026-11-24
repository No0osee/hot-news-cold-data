import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Scale, FileText, Info } from 'lucide-react';
import type { ResearchCase, IntuitionAnswerRecord, NewsObservation } from '../types/game';
import { YouDrawItChart } from '../components/YouDrawItChart';
import { IntuitionFactDonutChart } from '../components/IntuitionFactDonutChart';

gsap.registerPlugin(useGSAP);

interface Props {
  researchCase: ResearchCase;
  intuitionAnswers: IntuitionAnswerRecord | null;
  observation: NewsObservation;
  initialRevealed?: boolean;
  initialPredictionDraft?: { values: [number, number, number]; touched: number[]; revealed: boolean } | null;
  onPredictionDraftChange?: (draft: { values: [number, number, number]; touched: number[]; revealed: boolean }) => void;
  next: () => void;
}

export function SceneTruthFlip({
  researchCase,
  intuitionAnswers,
  observation,
  initialRevealed = false,
  initialPredictionDraft,
  onPredictionDraftChange,
  next
}: Props) {
  const [activeTab, setActiveTab] = useState<'duel' | 'data' | 'sources'>('duel');
  const [hasRevealedChart, setHasRevealedChart] = useState(
    initialRevealed || Boolean(initialPredictionDraft?.revealed)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      gsap.fromTo(
        '.gsap-truth-panel > *',
        { y: 14, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.38,
          stagger: 0.05,
          ease: 'power2.out',
          overwrite: 'auto',
          clearProps: 'transform,opacity',
        }
      );
    },
    { scope: containerRef, dependencies: [activeTab] }
  );

  const questions = researchCase.intuitionQuestions || [];
  const categories = researchCase.categories;
  const isCase2 = researchCase.id === 'unlicensed_vs_dui';

  const totalOfficial = categories.reduce((sum, c) => sum + c.officialCount, 0);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center p-4 md:p-8 pb-24"
    >

      <div className="relative z-10 w-full max-w-4xl mt-20 sm:mt-16 mb-6">
        <div className="gsap-truth-panel bg-[#fcf8e3] border-4 border-[#8c734b] p-5 md:p-8 shadow-[8px_8px_0_0_rgba(0,0,0,0.85)] rounded-sm text-zinc-900 space-y-5">
          
          {/* Top Header */}
          <div className="border-b-2 border-[#8c734b] pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="text-xs font-mono text-zinc-600">
                資料範圍：{researchCase.region} ｜ {researchCase.period}
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-black font-serif text-zinc-950 flex items-center gap-2.5">
              <Scale className="text-[#8d2e25]" size={30} />
              <span>你的印象，和數據差多少？</span>
            </h2>

            <p className="text-sm text-zinc-700 mt-1.5 leading-relaxed font-sans">
              先預測各年齡層每十萬名戶籍人口的「第一當事者」登記筆數，再核對警方傷亡事故資料。
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap border-b-2 border-zinc-800 font-mono text-xs md:text-sm gap-1 pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('duel')}
              className={`w-full sm:w-auto text-left sm:text-center px-3.5 py-2 font-bold cursor-pointer transition-all rounded sm:rounded-t sm:rounded-b-none ${
                activeTab === 'duel'
                  ? 'bg-zinc-900 text-yellow-300 border-t-2 border-x-2 border-zinc-900 shadow-xs'
                  : 'bg-zinc-200 hover:bg-zinc-300 active:bg-zinc-400 text-zinc-800'
              }`}
            >
              ① 猜猜看，再看答案
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('data')}
              className={`w-full sm:w-auto text-left sm:text-center px-3.5 py-2 font-bold cursor-pointer transition-all rounded sm:rounded-t sm:rounded-b-none ${
                activeTab === 'data'
                  ? 'bg-zinc-900 text-yellow-300 border-t-2 border-x-2 border-zinc-900 shadow-xs'
                  : 'bg-zinc-200 hover:bg-zinc-300 active:bg-zinc-400 text-zinc-800'
              }`}
            >
              ② 看詳細數字
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sources')}
              className={`w-full sm:w-auto text-left sm:text-center px-3.5 py-2 font-bold cursor-pointer transition-all rounded sm:rounded-t sm:rounded-b-none ${
                activeTab === 'sources'
                  ? 'bg-zinc-900 text-yellow-300 border-t-2 border-x-2 border-zinc-900 shadow-xs'
                  : 'bg-zinc-200 hover:bg-zinc-300 active:bg-zinc-400 text-zinc-800'
              }`}
            >
              ③ 資料怎麼來、怎麼算
            </button>
          </div>

          {/* Tab 1: Intuition Duel Verdict Cards */}
          <div className={activeTab === 'duel' ? 'space-y-6' : 'hidden'}>
              {!isCase2 && (
                <YouDrawItChart
                  className="mb-2"
                  observation={observation}
                  initialRevealed={hasRevealedChart}
                  initialValues={initialPredictionDraft?.values}
                  initialTouched={initialPredictionDraft?.touched}
                  onDraftChange={onPredictionDraftChange}
                  onReveal={() => setHasRevealedChart(true)}
                  onReset={() => setHasRevealedChart(false)}
                />
              )}

              {!isCase2 ? (
                hasRevealedChart ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <IntuitionFactDonutChart
                      intuitionAnswers={intuitionAnswers}
                      className="mt-4"
                    />
                  </motion.div>
                ) : (
                  <div className="p-5 bg-amber-50/70 border-2 border-dashed border-[#8c734b]/60 rounded-sm text-center text-xs md:text-sm text-zinc-600 space-y-1.5">
                    <span className="font-mono font-bold text-[#8d2e25] text-sm block">
                      完成預測後顯示官方資料對照
                    </span>
                    <p className="max-w-md mx-auto text-zinc-700">
                      請先在上方圖表拖曳圓點或填寫數字，再點擊<strong>「猜好了，看數據」</strong>。
                    </p>
                  </div>
                )
              ) : (
                <div className="space-y-5">
                  <div className="bg-amber-100 border-l-4 border-amber-600 p-4 text-xs md:text-sm text-zinc-800 flex items-start gap-2.5">
                    <Info size={20} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>作答題目逐項對照：</strong>
                      <span>看看你一開始怎麼回答，再讀讀資料給出的答案和解釋。</span>
                    </div>
                  </div>

                  {questions.map((q, idx) => {
                    const userChoiceId = intuitionAnswers?.answers[q.id];
                    const userChoice = q.options.find(opt => opt.id === userChoiceId);

                    return (
                      <div
                        key={q.id}
                        className="bg-white border-2 border-zinc-400 p-5 rounded shadow-sm space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                          <span className="px-2.5 py-0.5 bg-zinc-800 text-yellow-300 text-xs font-mono font-bold rounded">
                            題目 {idx + 1} ｜ {q.tag}
                          </span>
                          <span className="text-xs font-mono text-zinc-500 font-bold">
                            {userChoice ? '已記錄作答' : '未作答'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-zinc-900">
                          {q.prompt}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-zinc-100 p-3.5 border border-zinc-300 rounded space-y-1">
                            <div className="text-xs font-mono font-black text-zinc-500">
                              〔 你剛才的回答 〕
                            </div>
                            <div className="text-sm md:text-base font-black text-zinc-900 flex items-center gap-2">
                              <span>{userChoice?.label || '（未選擇）'}</span>
                            </div>
                          </div>

                          <div className="bg-amber-50/80 p-3.5 border-2 border-[#8c734b] rounded space-y-1 shadow-sm">
                            <div className="text-xs font-mono font-black text-[#8d2e25] flex items-center justify-between">
                              <span>〔 資料怎麼說 〕</span>
                              <span className="bg-[#8d2e25] text-white px-1.5 py-0.2 rounded text-[10px]">資料核對</span>
                            </div>
                            <div className="text-sm font-bold text-zinc-950 leading-relaxed">
                              {q.realityFact}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          

          {/* Tab 2: Comparison Data */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="p-4 bg-zinc-900 text-yellow-300 border-2 border-black text-center space-y-1 rounded">
                <div className="text-lg md:text-xl font-black font-serif tracking-wider">
                  {isCase2
                    ? '【酒駕與無照：新聞檢索量與官方取締數值分別呈現】'
                    : '【2025 年傷亡事故：三組第一當事者紀錄】'}
                </div>
              </div>

              {isCase2 ? (
                <div className="space-y-6">
                  <div className="bg-amber-50 border-2 border-amber-500 p-4 rounded text-xs md:text-sm text-zinc-800 space-y-1.5 leading-relaxed">
                    <strong className="text-amber-900 font-bold block">重要口徑說明與限制：</strong>
                    <p>
                      OpView 數據為特定關鍵詞之檢索量，酒駕檢索量約為無照之 7.1 倍；而官方執法資料中，警政署取締酒駕全年為 56,303 件，公路局第 21 條特定四欄合計為 147,668 件。
                      兩者機關不同、法規定義不同、統計口徑不同，<strong>不得相加計算違規比例，亦無法由此推論個人肇事風險</strong>。
                    </p>
                  </div>

                  <div className="bg-white p-5 border-2 border-zinc-400 rounded space-y-4">
                    <div className="border-b border-zinc-200 pb-2 flex justify-between items-center">
                      <h3 className="font-black text-base md:text-lg text-zinc-950 flex items-center gap-2">
                        <FileText size={18} className="text-[#8d2e25]" />
                        <span>一、OpView 新聞資料庫檢索量（2024/08/01–2025/08/21）</span>
                      </h3>
                      <span className="text-xs font-mono text-zinc-500 font-bold">總檢索量：247,339 則</span>
                    </div>

                    <p className="text-xs text-zinc-600">
                      來源：<code>無照.酒駕_來源_20240801_20250821.xlsx</code> 工作表「多主題來源」。未留存完整去重與媒體清單，不能視為全臺所有新聞或社群情緒。
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="p-4 border rounded bg-red-50/50 border-red-300 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-900">酒後駕車 (DUI)</span>
                          <span className="text-xs font-mono px-2 py-0.5 bg-red-700 text-white rounded">佔檢索量 87.6%</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-red-900">216,691 則</div>
                        <p className="text-xs text-zinc-600">特定關鍵詞檢索結果中，酒駕檢索量為無照駕駛的 7.1 倍。</p>
                      </div>

                      <div className="p-4 border rounded bg-blue-50/50 border-blue-300 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-900">無照駕駛 (Unlicensed)</span>
                          <span className="text-xs font-mono px-2 py-0.5 bg-blue-800 text-white rounded">佔檢索量 12.4%</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-blue-900">30,648 則</div>
                        <p className="text-xs text-zinc-600">新聞能見度明顯低於酒後駕車。</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 border-2 border-zinc-400 rounded space-y-4">
                    <div className="border-b border-zinc-200 pb-2 flex justify-between items-center">
                      <h3 className="font-black text-base md:text-lg text-zinc-950 flex items-center gap-2">
                        <Scale size={18} className="text-[#31546b]" />
                        <span>二、114 年官方選定取締數值（分別展示）</span>
                      </h3>
                      <span className="text-xs font-mono text-zinc-500 font-bold">不同機關口徑</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="p-4 border rounded bg-zinc-50 border-zinc-300 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-900">警政署：警察機關取締酒駕</span>
                          <span className="text-xs font-mono px-2 py-0.5 bg-zinc-700 text-white rounded">警政署統計</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-zinc-900">56,303 件</div>
                        <p className="text-xs text-zinc-600">
                          依《道路交通管理處罰條例》第35條等取締及拒測之全年警察機關取締總件數。
                        </p>
                      </div>

                      <div className="p-4 border rounded bg-zinc-50 border-zinc-300 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-900">公路局：道交第21條取締四欄合計</span>
                          <span className="text-xs font-mono px-2 py-0.5 bg-zinc-700 text-white rounded">公路局統計</span>
                        </div>
                        <div className="text-2xl font-black font-mono text-zinc-900">147,668 件</div>
                        <p className="text-xs text-zinc-600">
                          算法：機車男 91,890＋機車女 10,431＋汽車男 42,947＋汽車女 2,400 之合計。<strong>此非全國無照駕駛取締總數</strong>。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-amber-50 border-2 border-[#8c734b] p-4 rounded text-xs md:text-sm text-zinc-800 space-y-1 leading-relaxed">
                    <strong className="text-zinc-950 font-bold block">這三個年齡層，各有多少筆紀錄？</strong>
                    <p>
                      在本專題篩選的三大年齡組第一當事者紀錄中，25–64 歲青壯年為 258,966 筆（佔 67.2%）；高齡組為 62,222 筆（佔 16.2%），青年組為 63,972 筆（佔 16.6%）。這些數據描述限定口徑下的登記分布，不能直接推論個人駕駛風險或政策效果。
                    </p>
                  </div>

                  <div className="space-y-4">
                    {categories.map(cat => {
                      const officialPct = Math.round((cat.officialCount / totalOfficial) * 1000) / 10;

                      return (
                        <div key={cat.id} className="bg-white p-5 border-2 border-zinc-400 rounded space-y-3">
                          <div className="flex flex-wrap justify-between items-center border-b border-zinc-200 pb-2 gap-2">
                            <span className="font-black text-lg flex items-center gap-2">
                              <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span>{cat.label}</span>
                            </span>
                            <span className="text-xs font-mono text-zinc-600 font-bold">2025 年 A1+A2</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs md:text-sm pt-1">
                            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded">
                              <span className="text-zinc-600 font-bold block text-xs">列為「第一當事者」的駕駛紀錄：</span>
                              <div className="text-base md:text-lg font-black font-mono text-blue-900 mt-1">
                                {cat.officialCount.toLocaleString()} 筆
                              </div>
                              <span className="text-[11px] text-zinc-500 font-mono">佔三組登記事故 {officialPct}%</span>
                            </div>

                            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded">
                              <span className="text-zinc-600 font-bold block text-xs">114 年底戶籍人口（戶政司）：</span>
                              <div className="text-base md:text-lg font-black font-mono text-amber-900 mt-1">
                                {cat.population ? `${cat.population.toLocaleString()} 人` : '—'}
                              </div>
                              <span className="text-[11px] text-zinc-500 font-mono">這個年齡層在全臺的戶籍人口</span>
                            </div>

                            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded">
                              <span className="text-zinc-600 font-bold block text-xs">換算成同年齡每十萬名居民有幾筆：</span>
                              <div className="text-base md:text-lg font-black font-mono text-emerald-900 mt-1">
                                {cat.ratePer100k ? `${cat.ratePer100k.toLocaleString()} 筆` : '—'}
                              </div>
                              <span className="text-[11px] text-emerald-700 font-mono font-bold">
                                {cat.id === 'youth' ? '三大年齡組中最高' : cat.id === 'elderly' ? '約為青年組之 33%' : '總筆數最多的是這一組'}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-zinc-600 pt-1">
                            {cat.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Sources Table */}
          {activeTab === 'sources' && (
            <div className="space-y-5">
              <div className="overflow-x-auto border-2 border-zinc-700 rounded bg-white">
                <table className="w-full text-left text-xs md:text-sm border-collapse">
                  <caption className="p-3 bg-zinc-800 text-white font-bold text-left font-mono">
                    資料怎麼來？我們怎麼算？
                  </caption>
                  <thead className="bg-zinc-100 border-b border-zinc-300 font-bold text-zinc-700">
                    <tr>
                      <th className="p-3">年齡分類</th>
                      <th className="p-3">傷亡事故筆數</th>
                      <th className="p-3">114 年底戶籍人口</th>
                      <th className="p-3">同年齡每十萬名居民有幾筆（本專題換算）</th>
                      <th className="p-3">算了哪些紀錄？要注意什麼？</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 font-mono text-xs">
                    {categories.map(cat => {
                      const officialPct = Math.round((cat.officialCount / totalOfficial) * 1000) / 10;
                      return (
                        <tr key={cat.id} className="hover:bg-amber-50">
                          <td className="p-3 font-bold font-sans">{cat.label}</td>
                          <td className="p-3 text-blue-900 font-bold">{cat.officialCount.toLocaleString()} 筆 ({officialPct}%)</td>
                          <td className="p-3 text-amber-900 font-bold">{cat.population ? `${cat.population.toLocaleString()} 人` : '—'}</td>
                          <td className="p-3 text-emerald-900 font-bold">{cat.ratePer100k ? `${cat.ratePer100k.toLocaleString()} 筆` : '—'}</td>
                          <td className="p-3 text-zinc-700 font-sans">{cat.description}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-zinc-700 bg-[#f4ebd0] p-4 rounded border border-[#c5b596] space-y-2 leading-relaxed">
                <div>
                  <strong>閱讀材料：</strong>
                  <span>{researchCase.newsSampleMeta.source}。{researchCase.newsSampleMeta.notes}</span>
                </div>
                <div>
                  <strong>官方統計來源：</strong>
                  <span>{researchCase.officialDataMeta.source}。</span>
                  {!isCase2 && <a className="ml-1 font-bold text-[#8d2e25] underline" href="https://data.gov.tw/dataset/177136" target="_blank" rel="noopener noreferrer">開啟官方資料集頁</a>}
                </div>
                {!isCase2 && <div><strong>重算方式：</strong>開啟 114 年 A1 與 A2 逐案 CSV，取「當事者順位」為 1、年齡 18 歲以上、車種非「人」且非空白，再按 18–24、25–64、65 歲以上分組。沒有車種或年齡者不納入。</div>}
                <div>
                  <strong>看數字時要注意：</strong>
                  <span>{researchCase.officialDataMeta.notes}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Proceed Bar */}
          <div className="pt-4 border-t-2 border-[#8c734b] flex flex-col sm:flex-row sm:items-center justify-end gap-3">
            {!isCase2 && !hasRevealedChart && (
              <p className="text-xs text-zinc-700 font-bold sm:mr-auto">請先完成上方預測並按「猜好了，看數據」，才能進入下一步。</p>
            )}
            <button
              type="button"
              onClick={next}
              disabled={!isCase2 && !hasRevealedChart}
              className="w-full sm:w-auto px-8 py-3.5 text-base md:text-lg font-black rounded border-2 border-black shadow-[4px_4px_0_0_#000] bg-yellow-300 hover:bg-yellow-400 text-black flex items-center justify-center gap-2 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all min-h-[48px] disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0 disabled:border-zinc-400"
            >
              <span>看完數據，再想一想</span>
              <ArrowRight size={20} />
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
