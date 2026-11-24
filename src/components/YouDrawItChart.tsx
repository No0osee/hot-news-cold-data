import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, CheckCircle2, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import type { NewsObservation } from '../types/game';
import { elderlyImpressionLabel } from '../data/impressions';

interface Props {
  onComplete?: (drawnValues: { youth: number; adult: number; elderly: number }) => void;
  onReveal?: () => void;
  onReset?: () => void;
  observation?: NewsObservation;
  initialRevealed?: boolean;
  initialValues?: [number, number, number];
  initialTouched?: number[];
  onDraftChange?: (draft: { values: [number, number, number]; touched: number[]; revealed: boolean }) => void;
  className?: string;
}

// 真實官方數據（114 年警政署 A1+A2 統計：每十萬人口傷亡事故筆數）
const REAL_DATA = {
  youth: 4092.6,   // 18-24 歲；2025 年第一當事者筆數／同年年底戶籍人口 × 100,000
  adult: 1873.9,   // 25-64 歲
  elderly: 1331.5  // 65 歲以上
};

// 繪圖座標常數
const WIDTH = 600;
const HEIGHT = 360;
const PADDING = { top: 45, right: 50, bottom: 65, left: 75 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

const Y_MAX = 10000;
const DEFAULT_CHART_MAX = 6000;
const Y_MIN = 0;

// X 軸三個節點的 X 座標
const X_POINTS = [
  PADDING.left + PLOT_WIDTH * 0.16, // 18-24 歲 (青年)
  PADDING.left + PLOT_WIDTH * 0.50, // 25-64 歲 (青壯年)
  PADDING.left + PLOT_WIDTH * 0.84  // 65 歲以上 (高齡)
];

const CATEGORIES = [
  { id: 'youth', label: '18–24 歲', sublabel: '青年族群', real: REAL_DATA.youth },
  { id: 'adult', label: '25–64 歲', sublabel: '青壯年族群', real: REAL_DATA.adult },
  { id: 'elderly', label: '65 歲以上', sublabel: '高齡族群', real: REAL_DATA.elderly }
];

export function YouDrawItChart({
  onComplete,
  onReveal,
  onReset,
  observation,
  initialRevealed = false,
  initialValues,
  initialTouched,
  onDraftChange,
  className = '',
}: Props) {
  const userImpressionLabel = elderlyImpressionLabel(observation?.selectedImpression);

  // 玩家繪製的數值：預設從平緩的 1800 開始，給玩家起始參考
  const [userValues, setUserValues] = useState<[number, number, number]>(
    initialValues ?? [1800, 1800, 1800]
  );
  const [touched, setTouched] = useState<number[]>(
    initialRevealed ? [0, 1, 2] : (initialTouched ?? [])
  );
  const [hasInteracted, setHasInteracted] = useState(
    initialRevealed || (initialTouched ? initialTouched.length > 0 : false)
  );
  const [warningNotice, setWarningNotice] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(initialRevealed);
  const [activeDraggingIdx, setActiveDraggingIdx] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const pending = CATEGORIES.filter((_, i) => !touched.includes(i));

  const chartMax = Math.max(
    DEFAULT_CHART_MAX,
    Math.ceil(Math.max(...userValues.filter(n => Number.isFinite(n))) / 2000) * 2000
  );
  const yTicks = chartMax <= 6000
    ? [0, 1500, 3000, 4500, 6000]
    : [0, 2000, 4000, 6000, 8000, 10000];

  const valueToY = useCallback((val: number): number => {
    const clamped = Math.max(Y_MIN, Math.min(chartMax, val));
    return PADDING.top + PLOT_HEIGHT * (1 - clamped / chartMax);
  }, [chartMax]);

  const yToValue = useCallback((y: number): number => {
    const ratio = 1 - (y - PADDING.top) / PLOT_HEIGHT;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    return Math.round(clampedRatio * chartMax);
  }, [chartMax]);

  // 計算特定觸控／滑鼠位置對應的 X 節點與 Y 數值
  const updatePointFromPointer = useCallback((clientX: number, clientY: number, forceIdx?: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;

    const svgX = (clientX - rect.left) * scaleX;
    const svgY = (clientY - rect.top) * scaleY;
    const val = yToValue(svgY);

    let targetIdx: number = forceIdx ?? 0;
    if (forceIdx === undefined) {
      let minDistance = Infinity;
      targetIdx = 0;
      X_POINTS.forEach((px, i) => {
        const d = Math.abs(px - svgX);
        if (d < minDistance) {
          minDistance = d;
          targetIdx = i;
        }
      });
    }

    setUserValues(prev => {
      const next: [number, number, number] = [...prev];
      next[targetIdx] = val;
      const nextTouched = [...new Set([...touched, targetIdx])];
      onDraftChange?.({ values: next, touched: nextTouched, revealed: isRevealed });
      return next;
    });
    setHasInteracted(true);
    setTouched(previous => [...new Set([...previous, targetIdx])]);
    setWarningNotice(null);
  }, [yToValue, touched, isRevealed, onDraftChange]);

  const handlePointerDown = (e: React.PointerEvent<SVGElement>, forceIdx?: number) => {
    if (isRevealed) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    if (forceIdx !== undefined) {
      setActiveDraggingIdx(forceIdx);
    }
    updatePointFromPointer(e.clientX, e.clientY, forceIdx);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGElement>) => {
    if (isRevealed) return;
    if (e.buttons === 1 || activeDraggingIdx !== null) {
      updatePointFromPointer(e.clientX, e.clientY, activeDraggingIdx ?? undefined);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGElement>) => {
    if (isRevealed) return;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore pointer capture release error if already released
    }
    setActiveDraggingIdx(null);
  };

  const handleComplete = () => {
    if (!hasInteracted && touched.length === 0) {
      setWarningNotice('請先在圖表上拖動圓點（或在下方欄位調整數字），畫出你的直覺預測；若認為三組都接近 1,800 筆，可點下方「直接以目前數字揭曉」。');
      return;
    }
    setTouched([0, 1, 2]);
    setWarningNotice(null);
    setIsRevealed(true);
    onDraftChange?.({ values: userValues, touched: [0, 1, 2], revealed: true });
    onReveal?.();
    if (onComplete) {
      onComplete({
        youth: userValues[0],
        adult: userValues[1],
        elderly: userValues[2]
      });
    }
  };

  const handleForceRevealWithDefaults = () => {
    setHasInteracted(true);
    setTouched([0, 1, 2]);
    setWarningNotice(null);
    setIsRevealed(true);
    onDraftChange?.({ values: userValues, touched: [0, 1, 2], revealed: true });
    onReveal?.();
    if (onComplete) {
      onComplete({
        youth: userValues[0],
        adult: userValues[1],
        elderly: userValues[2]
      });
    }
  };

  const handleReset = () => {
    onReset?.();
    setIsRevealed(false);
    setUserValues([1800, 1800, 1800]);
    setHasInteracted(false);
    setTouched([]);
    setWarningNotice(null);
    onDraftChange?.({ values: [1800, 1800, 1800], touched: [], revealed: false });
  };

  const getUserPath = () => {
    const p0 = `${X_POINTS[0]},${valueToY(userValues[0])}`;
    const p1 = `${X_POINTS[1]},${valueToY(userValues[1])}`;
    const p2 = `${X_POINTS[2]},${valueToY(userValues[2])}`;
    return `M ${p0} L ${p1} L ${p2}`;
  };

  const getRealPath = () => {
    const p0 = `${X_POINTS[0]},${valueToY(REAL_DATA.youth)}`;
    const p1 = `${X_POINTS[1]},${valueToY(REAL_DATA.adult)}`;
    const p2 = `${X_POINTS[2]},${valueToY(REAL_DATA.elderly)}`;
    return `M ${p0} L ${p1} L ${p2}`;
  };

  const getGapPath = () => {
    const reals = [REAL_DATA.youth, REAL_DATA.adult, REAL_DATA.elderly];
    const segments: string[] = [];
    for (let i = 0; i < 2; i++) {
      const x0 = X_POINTS[i];
      const x1 = X_POINTS[i + 1];
      const u0 = valueToY(userValues[i]);
      const u1 = valueToY(userValues[i + 1]);
      const r0 = valueToY(reals[i]);
      const r1 = valueToY(reals[i + 1]);

      const d0 = u0 - r0;
      const d1 = u1 - r1;
      if (d0 * d1 < 0) {
        const t = d0 / (d0 - d1);
        const xc = x0 + t * (x1 - x0);
        const yc = u0 + t * (u1 - u0);
        segments.push(`M ${x0},${u0} L ${xc},${yc} L ${x0},${r0} Z`);
        segments.push(`M ${xc},${yc} L ${x1},${u1} L ${x1},${r1} Z`);
      } else {
        segments.push(`M ${x0},${u0} L ${x1},${u1} L ${x1},${r1} L ${x0},${r0} Z`);
      }
    }
    return segments.join(' ');
  };

  const userYouth = userValues[0];
  const userAdult = userValues[1];
  const userElderly = userValues[2];
  const guessedElderlyHighest = userElderly > userYouth && userElderly > userAdult;
  const guessedYouthHighest = userYouth > userElderly && userYouth > userAdult;

  return (
    <div className={`bg-white border-4 border-[#8c734b] p-4 md:p-7 rounded shadow-[6px_6px_0_0_rgba(0,0,0,0.85)] text-zinc-900 ${className}`}>
      
      {/* 標題與說明 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#8c734b] pb-3 mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-500">
              同年齡每十萬名居民的事故紀錄筆數
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black font-serif text-zinc-950 mt-1">
            考慮人口多寡後，你猜哪組紀錄最多？
          </h3>
        </div>

        {isRevealed && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-400 rounded text-xs font-bold text-zinc-800 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw size={14} />
            <span>重新畫一次</span>
          </button>
        )}
      </div>

      <p className="text-xs md:text-sm text-zinc-600 mb-4 leading-relaxed">
        先把各組的駕駛紀錄筆數除以同年齡戶籍人口，再換算成每十萬人有幾筆。
        <strong>請用滑鼠或手指在圖表上拖曳三個圓點</strong>，或在下方輸入你猜的數字，再點擊「猜好了，看數據」。
      </p>

      {/* 互動圖表容器 */}
      <div className="relative border-2 border-zinc-800 rounded bg-[#fdfbf7] p-2 select-none">
        {/* SVG 圖表 */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto cursor-crosshair touch-none"
          onPointerDown={e => handlePointerDown(e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          {yTicks.map(val => {
            const y = valueToY(val);
            return (
              <g key={val}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={WIDTH - PADDING.right}
                  y2={y}
                  stroke={val === 0 ? '#18181b' : '#e4e4e7'}
                  strokeWidth={val === 0 ? 2 : 1}
                  strokeDasharray={val === 0 ? undefined : '4 4'}
                />
                <text
                  x={PADDING.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="font-mono text-[11px] fill-zinc-500 font-bold"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            );
          })}

          <text
            x={PADDING.left}
            y={24}
            textAnchor="start"
            className="font-mono text-[11px] fill-zinc-600 font-black"
          >
            ↑ 紀錄筆數（每十萬名居民）
          </text>

          {X_POINTS.map((px, i) => (
            <g key={CATEGORIES[i].id}>
              <line
                x1={px}
                y1={PADDING.top}
                x2={px}
                y2={HEIGHT - PADDING.bottom}
                stroke="#f4f4f5"
                strokeWidth={36}
                opacity={0.7}
              />
              <line
                x1={px}
                y1={PADDING.top}
                x2={px}
                y2={HEIGHT - PADDING.bottom}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
              <text
                x={px}
                y={HEIGHT - PADDING.bottom + 20}
                textAnchor="middle"
                className="font-sans font-black text-[13px] fill-zinc-900"
              >
                {CATEGORIES[i].label}
              </text>
              <text
                x={px}
                y={HEIGHT - PADDING.bottom + 36}
                textAnchor="middle"
                className="font-sans text-[11px] fill-zinc-500 font-medium"
              >
                {CATEGORIES[i].sublabel}
              </text>
            </g>
          ))}

          {/* 1. 玩家繪製的折線 */}
          <path
            d={getUserPath()}
            fill="none"
            stroke="#d97706"
            strokeWidth={3.5}
            strokeDasharray={isRevealed ? '6 5' : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-colors duration-300"
          />

          {/* 玩家折線的錨點 */}
          {X_POINTS.map((px, i) => {
            const py = valueToY(userValues[i]);
            const realVal = CATEGORIES[i].real;
            const realPy = valueToY(realVal);
            const putUserLabelAbove = !isRevealed || userValues[i] >= realVal;
            const rawOffsetY = putUserLabelAbove ? py - 14 : py + 28;
            const minBadgeY = PADDING.top + 16;
            const maxBadgeY = HEIGHT - PADDING.bottom - 4;
            let userLabelOffsetY = Math.max(minBadgeY, Math.min(maxBadgeY, rawOffsetY));
            if (isRevealed) {
              const rawRealY = userValues[i] < realVal ? realPy - 16 : realPy + 28;
              const clampedRealY = Math.max(minBadgeY, Math.min(maxBadgeY, rawRealY));
              if (Math.abs(userLabelOffsetY - clampedRealY) < 20) {
                userLabelOffsetY = putUserLabelAbove
                  ? Math.max(minBadgeY, clampedRealY - 22)
                  : Math.min(maxBadgeY, clampedRealY + 22);
              }
            }
            return (
              <g
                key={`user-dot-${CATEGORIES[i].id}`}
                className="cursor-ns-resize"
                onPointerDown={e => {
                  e.stopPropagation();
                  handlePointerDown(e, i);
                }}
              >
                <circle cx={px} cy={py} r={28} fill="transparent" />
                <circle
                  cx={px}
                  cy={py}
                  r={isRevealed ? 6 : activeDraggingIdx === i ? 10 : 8}
                  fill="#d97706"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  className="shadow-md transition-all"
                />
                <g transform={`translate(${px}, ${userLabelOffsetY})`}>
                  <rect
                    x={-34}
                    y={-18}
                    width={68}
                    height={18}
                    rx={3}
                    fill="#78350f"
                    opacity={0.95}
                  />
                  <text
                    x={0}
                    y={-5}
                    textAnchor="middle"
                    className="font-mono text-[10px] fill-yellow-300 font-black"
                  >
                    {isRevealed ? `預測 ${userValues[i]}` : userValues[i]}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 2. 官方真實數據折線（按下揭曉後顯示） */}
          {isRevealed && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <motion.path
                d={getGapPath()}
                fill="rgba(245, 158, 11, 0.25)"
                stroke="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              />
              <motion.path
                d={getRealPath()}
                fill="none"
                stroke="#0369a1"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              {X_POINTS.map((px, i) => {
                const realVal = CATEGORIES[i].real;
                const py = valueToY(realVal);
                const putRealLabelAbove = userValues[i] < realVal;
                const rawRealY = putRealLabelAbove ? py - 16 : py + 28;
                const realLabelOffsetY = Math.max(
                  PADDING.top + 16,
                  Math.min(HEIGHT - PADDING.bottom - 4, rawRealY)
                );

                return (
                  <g key={`real-dot-${CATEGORIES[i].id}`}>
                    <circle
                      cx={px}
                      cy={py}
                      r={8}
                      fill="#0369a1"
                      stroke="#ffffff"
                      strokeWidth={3}
                    />
                    <g transform={`translate(${px}, ${realLabelOffsetY})`}>
                      <rect
                        x={-42}
                        y={-18}
                        width={84}
                        height={20}
                        rx={4}
                        fill="#075985"
                      />
                      <text
                        x={0}
                        y={-4}
                        textAnchor="middle"
                        className="font-mono text-[11px] fill-sky-100 font-black"
                      >
                        官方 {Math.round(realVal).toLocaleString()}
                      </text>
                    </g>
                  </g>
                );
              })}
            </motion.g>
          )}
        </svg>

        {/* 圖例說明 */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-3 pb-1 text-xs font-mono font-bold border-t border-zinc-200">
          <div className="flex items-center gap-1.5">
            <span className={`w-3.5 h-1 inline-block bg-amber-600${isRevealed ? ' border-b border-dashed' : ''}`} />
            <span className="text-amber-800">
              {isRevealed ? '你的直覺預測（虛線）' : '你猜的數字（可拖動圓點）'}
            </span>
          </div>

          {isRevealed && (
            <>
              <div className="flex items-center gap-1.5 text-sky-800">
                <span className="w-4 h-1.5 bg-sky-700 inline-block rounded" />
                <span>官方統計（實線）</span>
              </div>

              <div className="flex items-center gap-1.5 text-amber-900">
                <span className="w-3.5 h-2.5 bg-amber-400/50 inline-block border border-amber-600 rounded-xs" />
                <span>預測與資料的差距</span>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-zinc-600">
        三個年齡組不是時間順序；連線只用來比較三組預測。輸入範圍為 0–10,000 筆。
      </p>

      {/* 窄版單欄、寬版三欄預測輸入卡，防止年齡標籤直排或輸入框溢出 */}
      {!isRevealed && (
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
          {CATEGORIES.map((category, i) => (
            <label
              key={category.id}
              className={`p-3 rounded border-2 flex items-center justify-between gap-3 min-w-0 overflow-hidden transition-colors ${
                touched.includes(i) ? 'border-emerald-600 bg-emerald-50/70' : 'border-[#c5b596] bg-[#f4ebd0]/70'
              }`}
            >
              <span className="text-sm font-bold text-zinc-900 whitespace-nowrap shrink-0">
                {category.label}
                <span className="block text-xs font-normal text-zinc-600 whitespace-nowrap">{category.sublabel}</span>
              </span>
              <span className="flex items-center gap-1.5 shrink-0 min-w-0">
                <input
                  type="number"
                  min="0"
                  max={Y_MAX}
                  aria-label={`${category.label}的預測`}
                  value={userValues[i]}
                  onChange={e => {
                    const value = Number(e.target.value);
                    const nextTouched = [...new Set([...touched, i])];
                    setUserValues(previous => {
                      const next: [number, number, number] = [...previous];
                      next[i] = value;
                      onDraftChange?.({ values: next, touched: nextTouched, revealed: isRevealed });
                      return next;
                    });
                    setHasInteracted(true);
                    setTouched(nextTouched);
                    setWarningNotice(null);
                  }}
                  className="w-24 max-w-full border border-zinc-500 px-2 py-1 bg-white rounded font-mono font-bold text-right"
                />
                <span className="text-xs text-zinc-600 whitespace-nowrap">筆</span>
              </span>
            </label>
          ))}
        </div>
      )}

      {/* 按鈕與操作列 */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-zinc-600 font-sans">
          {!isRevealed ? (
            <span className="flex items-center gap-1.5">
              <Sparkles size={15} className="text-amber-600 shrink-0" />
              <span>
                {hasInteracted
                  ? pending.length > 0
                    ? `已調整 ${3 - pending.length} 組（其餘維持預設 1,800 筆），可直接看數據或繼續調整。`
                    : '三組都調整好了，可以按右方按鈕看數據！'
                  : '請拖動上方圓點或修改數字，再按「猜好了，看數據」。'}
              </span>
            </span>
          ) : (
            <span className="text-sky-800 font-bold flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              <span>已顯示官方統計，請對照下方分析</span>
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
          {warningNotice && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="px-3 py-2 bg-amber-100 border-2 border-amber-600 text-amber-950 text-sm rounded shadow-sm text-left max-w-lg space-y-2"
            >
              <p>{warningNotice}</p>
              <button
                type="button"
                onClick={handleForceRevealWithDefaults}
                className="underline font-bold text-[#8d2e25] cursor-pointer text-xs"
              >
                直接以目前數字（1,800 筆）揭曉數據
              </button>
            </motion.div>
          )}

          {!isRevealed ? (
            <button
              type="button"
              onClick={handleComplete}
              disabled={userValues.some(n => !Number.isFinite(n) || n < 0 || n > Y_MAX)}
              className="w-full sm:w-auto px-8 py-3.5 bg-yellow-300 hover:bg-yellow-400 text-black font-black text-sm md:text-base rounded border-2 border-black shadow-[4px_4px_0_0_#000] cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000] transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>猜好了，看數據</span>
              <TrendingUp size={18} />
            </button>
          ) : (
            <div className="text-xs font-mono font-bold bg-sky-100 text-sky-900 px-3 py-1.5 border border-sky-400 rounded">
              官方資料源：內政部警政署 114 年 A1+A2 逐案檔
            </div>
          )}
        </div>
      </div>

      {/* 揭曉後的認知翻轉反思卡 */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 p-4 md:p-5 bg-[#f4ebd0] border-2 border-[#8c734b] rounded space-y-3"
          >
            <div className="flex items-center gap-2 border-b border-[#c5b596] pb-2">
              <AlertTriangle className="text-[#8d2e25] shrink-0" size={20} />
              <h4 className="font-black font-serif text-base md:text-lg text-zinc-950">
                【預測與資料對照】你的預測 vs 官方統計
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs md:text-sm pt-1">
              <div className="p-3 bg-white border border-zinc-300 rounded space-y-1">
                <div className="font-bold text-zinc-600">青年族群 (18–24歲)</div>
                <div className="text-lg font-mono font-black text-sky-800">
                  4,093 筆 <span className="text-xs font-sans text-red-700 font-bold">〔 三組最高 〕</span>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  你的預測：{userValues[0]} 筆
                </div>
              </div>

              <div className="p-3 bg-white border border-zinc-300 rounded space-y-1">
                <div className="font-bold text-zinc-600">青壯年 (25–64歲)</div>
                <div className="text-lg font-mono font-black text-sky-800">
                  1,874 筆 <span className="text-xs font-sans text-zinc-600">〔 總筆數最多 〕</span>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  你的預測：{userValues[1]} 筆
                </div>
              </div>

              <div className="p-3 bg-white border border-zinc-300 rounded space-y-1">
                <div className="font-bold text-zinc-600">高齡族群 (65歲以上)</div>
                <div className="text-lg font-mono font-black text-sky-800">
                  1,332 筆 <span className="text-xs font-sans text-sky-700 font-bold">〔 約為青年的 33% 〕</span>
                </div>
                <div className="text-[11px] text-zinc-500 font-mono">
                  你的預測：{userValues[2]} 筆
                </div>
              </div>
            </div>

            <div className="text-xs md:text-sm text-zinc-800 leading-relaxed pt-1 space-y-2.5">
              <div className="p-3.5 bg-zinc-50 border border-zinc-300 rounded space-y-2">
                <div className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-blue-800" />
                  <span>你猜的數字，和資料差多少？</span>
                </div>

                <p>
                  你預測青年為 <strong>{userYouth}</strong> 筆、青壯年 <strong>{userAdult}</strong> 筆、高齡 <strong>{userElderly}</strong> 筆
                  {guessedElderlyHighest ? '（高齡預測最高）' : guessedYouthHighest ? '（青年預測最高）' : ''}。
                  {userImpressionLabel && (
                    <span className="block mt-1 text-zinc-700 bg-amber-50 p-2 rounded border border-amber-200">
                      你在前一步的新聞閱讀中，記錄印象最深的議題為<strong>「{userImpressionLabel}」</strong>。
                    </span>
                  )}
                </p>

                <p className="text-zinc-700">
                  本專題以警政署 114 年 A1/A2 逐案資料及同年年底戶籍人口自行計算：<strong>青年每十萬人約 4,093 筆、青壯年 1,874 筆、高齡 1,332 筆</strong>，青年組約為高齡組的 3.07 倍。
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
