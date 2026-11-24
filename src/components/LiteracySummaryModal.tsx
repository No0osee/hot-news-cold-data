import { useEffect, useState } from 'react';
import { Compass, Flag, BarChart3, CheckCircle2, Sparkles, X, HelpCircle, RotateCcw, AlertTriangle, TrendingUp } from 'lucide-react';
import { islandZones } from '../data/islandZones';

export interface CaseCalibrationStat {
  confidenceLevel: 1 | 2 | 3;
  intuitionCorrect: number;
  intuitionTotal: number;
  reflectionCorrect?: number;
  reflectionTotal?: number;
}

interface LiteracySummaryModalProps {
  open: boolean;
  onClose: () => void;
  completedCaseIds: string[];
  caseStats: Record<string, CaseCalibrationStat>;
  onSelectZone: (zoneId: string) => void;
  onResetAllProgress?: () => void;
}

export function LiteracySummaryModal({
  open,
  onClose,
  completedCaseIds,
  caseStats,
  onSelectZone,
  onResetAllProgress,
}: LiteracySummaryModalProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmingReset(false);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;

  const completedCount = completedCaseIds.length;
  // Only evaluate completed or recorded islands
  const statsEntries = Object.entries(caseStats);
  const recordedCount = statsEntries.length;

  // 1. Step 1 Intuition Accuracy
  const totalIntuitionCorrect = statsEntries.reduce((acc, [, s]) => acc + s.intuitionCorrect, 0);
  const totalIntuitionQuestions = statsEntries.reduce((acc, [, s]) => acc + s.intuitionTotal, 0);
  const intuitionAccuracy =
    totalIntuitionQuestions > 0 ? Math.round((totalIntuitionCorrect / totalIntuitionQuestions) * 100) : null;

  // 2. Step 4 Reflection Practice Accuracy (Post-learning)
  const completedStatsEntries = statsEntries.filter(([id, s]) => completedCaseIds.includes(id) && (s.reflectionTotal ?? 0) > 0);
  const totalReflectionCorrect = completedStatsEntries.reduce((acc, [, s]) => acc + (s.reflectionCorrect ?? 0), 0);
  const totalReflectionQuestions = completedStatsEntries.reduce((acc, [, s]) => acc + (s.reflectionTotal ?? 0), 0);
  const reflectionAccuracy =
    totalReflectionQuestions > 0 ? Math.round((totalReflectionCorrect / totalReflectionQuestions) * 100) : null;

  // 3. Confidence Calibration Score (0 - 100)
  // Expected accuracy for confidence 1 = 33.3%, 2 = 66.7%, 3 = 100%
  const calibrationScore =
    recordedCount > 0
      ? Math.round(
          statsEntries.reduce((acc, [, s]) => {
            const actualRatio = s.intuitionTotal > 0 ? s.intuitionCorrect / s.intuitionTotal : 0;
            const expectedRatio = s.confidenceLevel / 3;
            const closeness = 1 - Math.min(1, Math.abs(actualRatio - expectedRatio));
            return acc + closeness * 100;
          }, 0) / recordedCount
        )
      : null;

  // 4. Domain Exploration Progress (Separated from Literacy Performance)
  const calcDomainProgress = (groupName: '國旅交通' | '社會安全' | '生活') => {
    const zones = islandZones.filter(z => z.group === groupName);
    const done = zones.filter(z => completedCaseIds.includes(z.id)).length;
    return {
      done,
      total: zones.length,
      pct: zones.length > 0 ? Math.round((done / zones.length) * 100) : 0,
    };
  };

  const trafficProg = calcDomainProgress('國旅交通');
  const safetyProg = calcDomainProgress('社會安全');
  const lifeProg = calcDomainProgress('生活');

  // Confidence Breakdown (Level 1, 2, 3)
  const confidenceBuckets = ([3, 2, 1] as const).map(lvl => {
    const matching = statsEntries.filter(([, s]) => s.confidenceLevel === lvl);
    const qTotal = matching.reduce((sum, [, s]) => sum + s.intuitionTotal, 0);
    const qRight = matching.reduce((sum, [, s]) => sum + s.intuitionCorrect, 0);
    const acc = qTotal > 0 ? Math.round((qRight / qTotal) * 100) : null;
    const expectedPct = Math.round((lvl / 3) * 100);
    return {
      level: lvl,
      label: lvl === 3 ? '很有把握 ★★★' : lvl === 2 ? '有點把握 ★★☆' : '不太確定 ★☆☆',
      expectedPct,
      casesCount: matching.length,
      accuracy: acc,
    };
  });

  const getDiagnosticMessage = () => {
    if (completedCount === 0 && recordedCount === 0) {
      return '尚未完成島嶼挑戰。任選一座島嶼完成 4 關卡（包含第 4 關反思判讀題），該島將會升起專屬立體旗幟並記錄你的學習前後表現！';
    }
    if (reflectionAccuracy !== null && intuitionAccuracy !== null && reflectionAccuracy > intuitionAccuracy) {
      return `在讀完新聞脈絡與官方統計口徑後，你的判讀準確率從第一關直覺作答的 ${intuitionAccuracy}% 提升至第四關反思練習的 ${reflectionAccuracy}%（+${reflectionAccuracy - intuitionAccuracy}%）！這顯示對照分母與統計定義能有效修正新聞帶來的直覺偏差。`;
    }
    const highConfBucket = confidenceBuckets.find(b => b.level === 3);
    if (highConfBucket && highConfBucket.casesCount > 0 && (highConfBucket.accuracy ?? 0) < 55) {
      return '你在部分議題選了「很有把握」，但第一印象卻與官方統計存在落差。這正印證了「可得性捷思」——高曝光的焦點新聞容易讓人高估特定事件的普遍程度。';
    }
    return '透過「先猜測 → 讀新聞 → 對照官方數據 → 反思判讀」，你已親身體驗新聞個案與整體統計的差異。繼續探索更多島嶼，累積更完整的識讀紀錄！';
  };

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-sm"
      style={{ zIndex: 95 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="literacy-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#fcf8e8] border-4 border-[#8c734b] rounded-md shadow-[10px_10px_0_0_rgba(0,0,0,0.85)] text-zinc-900 p-5 md:p-7 space-y-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b-2 border-[#8c734b] pb-4">
          <div className="space-y-1.5">
            <h2
              id="literacy-modal-title"
              className="text-2xl md:text-3xl font-serif font-black text-zinc-950 flex items-center gap-2.5"
            >
              <Compass className="text-[#8d2e25] shrink-0" size={30} />
              <span>全島成果總覽</span>
            </h2>
            <p className="text-xs md:text-sm text-zinc-700">
              對照 {islandZones.length} 座島嶼的探索紀錄，以及閱讀資料前後的作答變化。
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="關閉全島成果"
            className="w-9 h-9 rounded-full border-2 border-[#8c734b] bg-[#f4ebd4] hover:bg-amber-200 text-zinc-900 font-black flex items-center justify-center cursor-pointer shrink-0 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-[#f4ebd0] border-2 border-[#8c734b] rounded p-4 space-y-2.5">
          <h3 className="font-serif font-black text-base text-zinc-950">
            三條可以帶走的判讀方法
          </h3>
          <ol className="space-y-1.5 text-xs md:text-sm text-zinc-800 list-decimal list-inside leading-relaxed">
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

        {/* Low Sample Notice when completedCount < 3 */}
        {completedCount < 3 && (
          <div className="bg-amber-100/90 border-2 border-amber-600 rounded p-3.5 flex items-start gap-2.5 text-xs md:text-sm text-amber-950">
            <AlertTriangle size={18} className="text-[#8d2e25] shrink-0 mt-0.5" />
            <div>
              <strong>資料樣本提示：</strong>
              目前僅完成 <strong>{completedCount}</strong> 座島嶼（已記錄 {recordedCount} 島直覺作答）。由於完成島嶼數較少，下方的準確率與「把握度校準力」僅供初步參考；建議完成至少 3 座以上島嶼以觀察更穩定的趨勢。
            </div>
          </div>
        )}

        {/* Two Separated Columns: Left = Question Performance (Pre vs Post + Calibration), Right = Exploration Progress */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          
          {/* Left Column (7 cols): Question Performance & Learning Growth */}
          <div className="md:col-span-7 bg-[#f7f1df] border-2 border-[#bca888] rounded p-4 md:p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between border-b border-[#d5c5a8] pb-2">
              <span className="font-serif font-black text-base text-zinc-950 flex items-center gap-1.5">
                <TrendingUp size={18} className="text-[#8d2e25]" />
                一、答題識讀表現（學習前後對照）
              </span>
              <span className="text-[11px] font-mono font-bold text-zinc-600">
                獨立於探索比例計算
              </span>
            </div>

            {/* Pre vs Post Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border-2 border-[#c5b596] rounded p-3">
                <div className="text-[11px] font-bold text-zinc-600">STEP 1 直覺作答準確率</div>
                <div className="text-2xl font-black font-mono text-amber-700 mt-1">
                  {intuitionAccuracy !== null ? `${intuitionAccuracy}%` : '--'}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {totalIntuitionQuestions > 0
                    ? `答對 ${totalIntuitionCorrect} / ${totalIntuitionQuestions} 題（讀新聞前）`
                    : '尚未作答第一關'}
                </div>
              </div>

              <div className="bg-white border-2 border-emerald-700 rounded p-3">
                <div className="text-[11px] font-bold text-emerald-900">STEP 4 反思練習準確率</div>
                <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
                  {reflectionAccuracy !== null ? `${reflectionAccuracy}%` : '--'}
                </div>
                <div className="text-[11px] text-zinc-600 mt-0.5">
                  {totalReflectionQuestions > 0
                    ? `答對 ${totalReflectionCorrect} / ${totalReflectionQuestions} 題（讀數據後）`
                    : '完成第四關判讀題後計算'}
                </div>
              </div>

              <div className="bg-white border-2 border-sky-700 rounded p-3">
                <div className="text-[11px] font-bold text-sky-900">把握度校準力</div>
                <div className="text-2xl font-black font-mono text-sky-800 mt-1">
                  {calibrationScore !== null ? `${calibrationScore}%` : '--'}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  {recordedCount > 0 ? `依 ${recordedCount} 島自評把握度計算` : '尚未記錄把握度'}
                </div>
              </div>
            </div>

            {/* Clear Explanation of Confidence Calibration */}
            <div className="bg-white border border-[#c5b596] rounded p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-serif font-black text-sm text-zinc-900 flex items-center gap-1.5">
                  <BarChart3 size={15} className="text-[#8d2e25]" />
                  <span>什麼是「把握度校準力」？各把握度實際答對率</span>
                </h3>
              </div>
              <p className="text-xs text-zinc-700 leading-relaxed bg-[#fcf8e8] p-2.5 rounded border border-[#e5dca5]">
                <HelpCircle size={13} className="inline mr-1 text-[#8d2e25] -mt-0.5" />
                <strong>計算與意義：</strong>比較你在第一關自評的把握程度（不太確定預期 33%、有點把握預期 67%、很有把握預期 100%）與實際直覺答對率的接近程度（<code>100% - |實際答對率 - 預期答對率|</code>）。分數越高，代表你越清楚自己「哪些是真的知道、哪些只是受新聞印象影響」。
              </p>

              <div className="space-y-2 pt-1">
                {confidenceBuckets.map(b => (
                  <div key={b.level} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-800">
                        {b.label} <span className="text-zinc-500 font-normal">（預期約 {b.expectedPct}%）</span>
                      </span>
                      <span className="font-mono text-zinc-700">
                        {b.casesCount > 0
                          ? `選用 ${b.casesCount} 島 · 實際答對 ${b.accuracy}%`
                          : '尚未選用此把握度'}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${b.accuracy ?? 0}%`,
                          backgroundColor:
                            b.level === 3 ? '#d97706' : b.level === 2 ? '#0284c7' : '#2a6f52',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Diagnostic Note */}
            <div className="bg-amber-50/90 border-l-4 border-[#8d2e25] border-y border-r border-amber-300 rounded-r p-3 text-xs md:text-sm text-zinc-800 leading-relaxed">
              <strong className="text-[#8d2e25] font-serif">學習回饋診斷：</strong>
              {getDiagnosticMessage()}
            </div>
          </div>

          {/* Right Column (5 cols): Island Exploration Completion Rate (Separated from Literacy Score) */}
          <div className="md:col-span-5 bg-[#f7f1df] border-2 border-[#bca888] rounded p-4 md:p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1 border-b border-[#d5c5a8] pb-2">
              <div className="flex items-center justify-between">
                <span className="font-serif font-black text-base text-zinc-950 flex items-center gap-1.5">
                  <Sparkles size={17} className="text-amber-700" />
                  二、島嶼探索完成率
                </span>
                <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-400">
                  已完成 {completedCount} / {islandZones.length} 島
                </span>
              </div>
              <p className="text-[11px] text-zinc-600">
                僅統計已完成第四關反思題並插旗的島嶼數量，不計入識讀能力分數。
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div className="bg-white border-2 border-[#c5b596] rounded p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>全島嶼總探索進度</span>
                <span className="font-mono text-emerald-800">
                  {Math.round((completedCount / islandZones.length) * 100)}%（{completedCount} / {islandZones.length}）
                </span>
              </div>
              <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden border border-zinc-300">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.round((completedCount / islandZones.length) * 100)}%` }}
                />
              </div>
            </div>

            {/* 3 Domain Exploration Bars */}
            <div className="bg-white border-2 border-[#c5b596] rounded p-3.5 space-y-3 flex-1 flex flex-col justify-center">
              <div className="text-xs font-bold text-zinc-700 border-b border-zinc-200 pb-1.5">
                三大議題領域探索分布
              </div>
              {[
                { label: '國旅交通議題', prog: trafficProg, color: '#c84b31' },
                { label: '社會安全議題', prog: safetyProg, color: '#2b5b84' },
                { label: '民生生活議題', prog: lifeProg, color: '#2a6f52' },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800">{item.label}</span>
                    <span className="font-mono font-bold text-zinc-700">
                      {item.prog.done} / {item.prog.total} 島 ({item.prog.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.prog.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-zinc-600 bg-white/80 p-2.5 rounded border border-[#d5c5a8] leading-relaxed">
              <strong>提示：</strong>剛進入第四關尚未插旗；完成第四關的反思判讀題後，該島才會升起旗幟並計入完成數，且重玩同一座島不會重複累計。
            </div>
          </div>
        </div>

        {/* Bottom Section: 14 Taiwan Data Islands Progress Grid */}
        <div className="space-y-2.5 pt-2 border-t-2 border-[#8c734b]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-serif font-black text-base md:text-lg text-zinc-950 flex items-center gap-2">
              <Flag size={18} className="text-[#8d2e25]" />
              <span>台灣 {islandZones.length} 座數據島嶼解鎖圖鑑（點擊可直接飛往該島）</span>
            </h3>
            <span className="text-xs text-zinc-600">
              顯示各島「第一關直覺作答」與「第四關反思練習」結果
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
            {islandZones.map(z => {
              const isDone = completedCaseIds.includes(z.id);
              const stat = caseStats[z.id];
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => {
                    onSelectZone(z.id);
                    onClose();
                  }}
                  className={`p-2.5 rounded border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    isDone
                      ? 'bg-emerald-50/90 border-emerald-700 hover:bg-emerald-100 shadow-xs'
                      : 'bg-white/90 border-[#c5b596] hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: z.groupColor }}
                    >
                      {z.group === '國旅交通' ? '交通' : z.group === '社會安全' ? '安全' : '生活'}
                    </span>
                    {isDone && (
                      <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                    )}
                  </div>

                  <div className="font-serif font-black text-xs text-zinc-950 truncate">
                    {z.shortName}
                  </div>

                  <div className="text-[10px] font-mono text-zinc-600 leading-tight space-y-0.5">
                    {stat ? (
                      <>
                        <div>直覺 {stat.intuitionCorrect}/{stat.intuitionTotal}</div>
                        {stat.reflectionTotal ? (
                          <div className="text-emerald-800 font-bold">
                            反思 {stat.reflectionCorrect}/{stat.reflectionTotal}
                          </div>
                        ) : (
                          <div className="text-amber-800">尚未完成反思</div>
                        )}
                      </>
                    ) : isDone ? (
                      <div>✓ 已插旗點亮</div>
                    ) : (
                      <div>點擊前往挑戰</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer: Reset Progress with Confirmation */}
        {onResetAllProgress && (
          <div className="pt-3 border-t border-[#c5b596] flex flex-wrap items-center justify-end gap-3">
            {!confirmingReset ? (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className="px-3 py-1.5 rounded border border-rose-400 bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw size={13} />
                <span>重設全部進度</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 bg-rose-50 border border-rose-400 px-3 py-1.5 rounded">
                <span className="text-xs font-bold text-rose-950">確定清除所有島嶼進度與紀錄？</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetAllProgress();
                    setConfirmingReset(false);
                  }}
                  className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white text-xs font-black rounded cursor-pointer"
                >
                  確定重設
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingReset(false)}
                  className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 text-xs font-bold rounded cursor-pointer"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
