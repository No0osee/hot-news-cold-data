import { useState, useRef, useEffect } from 'react';
import type { PointerEvent } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { TopicSeries } from '../types/game';

gsap.registerPlugin(useGSAP);

const format = (n: number) => n.toLocaleString('zh-TW', { maximumFractionDigits: 2 });
const niceCeil = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return 1;
  if (n <= 4) return Math.ceil(n);
  const pow = 10 ** Math.floor(Math.log10(n));
  const norm10 = (n / pow) * 10;
  const factor10 = [10, 12, 16, 20, 25, 32, 40, 50, 60, 80, 100].find(f => norm10 <= f) ?? 100;
  return Math.round((factor10 * pow) / 10);
};
const getYAxisTicks = (max: number) => {
  const isFiveStep = max % 5 === 0 && (max % 4 !== 0 || String(max).startsWith('5') || String(max).startsWith('25'));
  const steps = isFiveStep ? 5 : max % 4 === 0 ? 4 : max % 3 === 0 ? 3 : 2;
  return Array.from({ length: steps + 1 }, (_, k) => (max * k) / steps);
};
const truncate = (text: string, maxChars: number) => text.length > maxChars ? `${text.slice(0, Math.max(1, maxChars - 1))}…` : text;

export function TopicPredictionChart({
  series,
  initialRevealed = false,
  initialGuessesData,
  onDraftChange,
  onReveal,
}: {
  series: TopicSeries;
  initialRevealed?: boolean;
  initialGuessesData?: (number | null)[];
  onDraftChange?: (draft: { guesses: (number | null)[]; revealed: boolean }) => void;
  onReveal: () => void;
}) {
  const slider = series.predictionControl === 'slider';
  const defaultGuesses = () => series.points.map((p, i) => i === 0 && (series.kind === 'line' || series.knownFirst) ? p.value : null);
  const [guesses, setGuesses] = useState<(number | null)[]>(() =>
    initialGuessesData && initialGuessesData.length === series.points.length
      ? initialGuessesData
      : defaultGuesses()
  );
  const [revealed, setRevealed] = useState(initialRevealed);
  const rootWrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(760);

  useGSAP(
    () => {
      if (!revealed) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(
        '.gsap-official-bar',
        { scaleY: 0, transformOrigin: '50% 100%' },
        { scaleY: 1, duration: 0.55, stagger: 0.055, ease: 'back.out(1.5)' },
        0
      )
        .fromTo(
          '.gsap-official-label',
          { y: 8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.055 },
          0.18
        )
        .fromTo(
          '.gsap-official-line',
          { opacity: 0 },
          { opacity: 1, duration: 0.5 },
          0
        )
        .fromTo(
          '.gsap-official-dot',
          { scale: 0, transformOrigin: '50% 50%' },
          { scale: 1, duration: 0.4, stagger: 0.045, ease: 'back.out(2.2)' },
          0.08
        )
        .fromTo(
          '.gsap-gap-area',
          { opacity: 0 },
          { opacity: 1, duration: 0.6 },
          0.15
        )
        .fromTo(
          '.gsap-check-row',
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.03 },
          0.12
        );
    },
    { scope: rootWrapRef, dependencies: [revealed] }
  );
  useEffect(() => {
    const node = chartRef.current;
    if (!node) return;
    const observer = new ResizeObserver(entries => setChartWidth(Math.max(240, entries[0].contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);
  const maximum = series.predictionMaximum ?? (series.unit === '%' ? 100 : Math.ceil(Math.max(...series.points.map(p => p.value)) * 1.3 / 10) * 10);
  // 針對折線圖：若玩家設定了最後一年（或任一年份），揭曉時或繪製折線時可線性補齊未填的中間年份
  const interpolatedGuesses = (() => {
    if (series.kind !== 'line') return guesses;
    const result = [...guesses];
    let lastKnownIdx = 0;
    for (let i = 1; i < result.length; i++) {
      if (result[i] !== null) {
        const startVal = result[lastKnownIdx]!;
        const endVal = result[i]!;
        const span = i - lastKnownIdx;
        for (let k = lastKnownIdx + 1; k < i; k++) {
          result[k] = Math.round((startVal + ((endVal - startVal) * (k - lastKnownIdx)) / span) * 100) / 100;
        }
        lastKnownIdx = i;
      }
    }
    return result;
  })();

  const effectiveGuesses = series.kind === 'line' ? interpolatedGuesses : guesses;
  const displayMaximum = revealed && series.unit !== '%'
    ? Math.min(maximum, niceCeil(Math.max(...series.points.map(p => p.value), ...effectiveGuesses.map(n => n ?? 0)) * 1.15))
    : maximum;
  const unitLabel = series.unit === '對' ? '對（離婚對數）' : series.unit;
  const yTicks = getYAxisTicks(displayMaximum);
  const left = Math.max(38, format(displayMaximum).length * 7 + 14), right = chartWidth - 20, top = 35, bottom = 275;
  const slotWidth = (right - left) / series.points.length;
  const x = (i: number) => left + (right - left) * (i + 0.5) / series.points.length;
  const y = (n: number) => bottom - (bottom - top) * Math.max(0, Math.min(displayMaximum, n)) / displayMaximum;
  const distribution = series.unit === '%' && series.kind === 'bar';
  const binary = distribution && series.points.length === 2;
  const autoRemainder = distribution && series.points.length >= 3;
  const remainderIndex = series.points.length - 1;
  const total = guesses.reduce<number>((sum, n) => sum + (n ?? 0), 0);
  const inRange = guesses.every(n => n === null || (Number.isFinite(n) && n >= 0 && n <= maximum));
  const complete = (series.kind === 'line' ? guesses.at(-1) !== null : guesses.every(n => n !== null)) && inRange && (!distribution || Math.abs(total - 100) <= 0.1);
  const pending = series.points.filter((_, i) => guesses[i] === null && (series.kind !== 'line' || i === series.points.length - 1) && (!autoRemainder || i !== remainderIndex));
  const setGuess = (i: number, value: number | null) => {
    if (i === 0 && (series.kind === 'line' || series.knownFirst)) return;
    if (autoRemainder) {
      if (i === remainderIndex) return;
      setGuesses(previous => {
        const next = [...previous];
        const otherTotal = previous.slice(0, remainderIndex).reduce<number>((sum, n, index) => sum + (index === i ? 0 : n ?? 0), 0);
        next[i] = value === null || !Number.isFinite(value) ? null : Math.round(Math.max(0, Math.min(100 - otherTotal, value)) * 100) / 100;
        const selected = next.slice(0, remainderIndex);
        next[remainderIndex] = selected.every(n => n !== null)
          ? Math.round((100 - selected.reduce<number>((sum, n) => sum + (n ?? 0), 0)) * 100) / 100
          : null;
        onDraftChange?.({ guesses: next, revealed });
        return next;
      });
      return;
    }
    setGuesses(previous => {
      const next = previous.map((n, index) => index === i ? value : binary ? value === null ? null : 100 - value : n);
      onDraftChange?.({ guesses: next, revealed });
      return next;
    });
  };
  const draw = (event: PointerEvent<SVGSVGElement>) => {
    if (revealed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) * chartWidth / rect.width;
    const py = (event.clientY - rect.top) * 325 / rect.height;
    const i = Math.max(0, Math.min(series.points.length - 1, Math.floor((px - left) / (right - left) * series.points.length)));
    setGuess(i, Math.round(Math.max(0, Math.min(maximum, (bottom - py) / (bottom - top) * maximum)) * 100) / 100);
  };
  const sliderPresets = [500, 1500, 5000, 15000, 30000].filter(v => v <= maximum);

  // 建立折線圖兩條線（預測折線 vs 官方折線）之間的塗色差距路徑（支援交叉點自動切分三角形，確保 100% 塗滿不破洞）
  const buildLineGapPath = () => {
    if (series.kind !== 'line' || !revealed) return '';
    const segments: string[] = [];
    for (let i = 0; i < series.points.length - 1; i++) {
      const g0 = effectiveGuesses[i];
      const g1 = effectiveGuesses[i + 1];
      if (g0 === null || g0 === undefined || g1 === null || g1 === undefined) continue;
      const x0 = x(i);
      const x1 = x(i + 1);
      const u0 = y(g0);
      const u1 = y(g1);
      const r0 = y(series.points[i].value);
      const r1 = y(series.points[i + 1].value);

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

  return <div ref={rootWrapRef} className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-xl font-serif font-black">{series.title}</h3>
      {revealed && (
        <button
          type="button"
          onClick={() => {
            const reset = defaultGuesses();
            setRevealed(false);
            setGuesses(reset);
            onDraftChange?.({ guesses: reset, revealed: false });
          }}
          className="px-3 py-1 bg-white hover:bg-amber-50 border border-[#8c734b] rounded text-xs font-bold text-zinc-800 cursor-pointer transition-colors"
        >
          重新預測 ↺
        </button>
      )}
    </div>
    <p className="text-sm text-zinc-700">{revealed ? (series.kind === 'line' ? '橘色虛線是你的預測，藍色實線是資料值，兩線中間塗滿區域為預測與實際資料的差距。' : '橘色是你的預測，藍色是資料值。') : slider ? '左右拖動拉桿、點選下方快速刻度或直接輸入數字，選出你認為一整年發生的件數，再揭曉官方資料。預測不計分。' : series.kind === 'line' ? `第一年已提供。請在下圖 ${series.points.at(-1)!.label} 的位置點一下或拖動，猜猜最後一年的數字（未逐年點畫的中間年份會自動連成趨勢線，也可在下方逐年微調）。預測不計分。` : series.knownFirst ? '平均數已提供作為參考，請預測中位數。預測不計分。' : binary ? '預測其中一類的占比，另一類會自動補足至 100%。預測不計分。' : '在下圖各類別的位置點一下或拖動，畫出你猜的數字；也可以逐項輸入，再揭曉資料。預測不計分。'}</p>
    <p className="text-xs text-zinc-600">預測範圍：0–{format(maximum)} {series.unit}。{autoRemainder ? `先預測前 ${remainderIndex} 項，最後一項會自動補足至 100%；前面各項合計不可超過 100%。` : distribution && '各類合計須為 100%（容許 0.1 個百分點的四捨五入誤差）。'}</p>
    {slider && <div className="bg-[#f4ebd0] border-2 border-[#c5b596] p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="total-prediction-slider" className="block text-sm font-bold">你的預測：全年合計</label>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-700">直接輸入：</span>
          <input
            type="number"
            aria-label="全年合計的數字輸入"
            min="0"
            max={maximum}
            step="1"
            value={guesses[0] ?? ''}
            disabled={revealed}
            placeholder="輸入件數"
            onChange={e => setGuess(0, e.target.value === '' ? null : Math.max(0, Math.min(maximum, Number(e.target.value))))}
            className="w-28 bg-white border-2 border-zinc-700 px-2.5 py-1 text-base font-mono font-bold text-zinc-950 rounded disabled:bg-zinc-100"
          />
          <span className="text-sm font-bold">{series.unit}</span>
        </div>
      </div>
      <output htmlFor="total-prediction-slider" aria-live="polite" className="block text-center text-3xl md:text-4xl font-mono font-black text-amber-800">
        {guesses[0] === null ? '尚未選擇' : `${format(guesses[0])} ${series.unit}`}
      </output>
      <input id="total-prediction-slider" type="range" aria-label="全年合計的預測拉桿" min="0" max={maximum} step="1" value={guesses[0] ?? 0} disabled={revealed}
        aria-valuetext={guesses[0] === null ? '尚未選擇預測件數' : `${format(guesses[0])} ${series.unit}`}
        onPointerDown={e => { if (!revealed) setGuess(0, Number(e.currentTarget.value)); }}
        onKeyDown={e => { if (!revealed && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) setGuess(0, Number(e.currentTarget.value)); }}
        onChange={e => setGuess(0, Number(e.target.value))}
        className="block w-full h-10 accent-amber-700 cursor-pointer disabled:cursor-default" />
      <div className="flex justify-between text-xs font-mono text-zinc-600"><span>0 {series.unit}</span><span>{format(maximum)} {series.unit}</span></div>
      {!revealed && sliderPresets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-zinc-600 font-bold">快速選擇刻度：</span>
          {sliderPresets.map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => setGuess(0, preset)}
              className={`px-2.5 py-1 text-xs font-mono font-bold border rounded cursor-pointer transition-colors ${
                guesses[0] === preset
                  ? 'bg-zinc-900 text-yellow-300 border-zinc-900'
                  : 'bg-white text-zinc-800 border-[#8c734b] hover:bg-amber-100'
              }`}
            >
              {format(preset)} {series.unit}
            </button>
          ))}
        </div>
      )}
    </div>}
    {(!slider || revealed) && <div className="bg-white border-2 border-[#c5b596] rounded p-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1.5 pt-1 pb-2 mb-1 border-b border-zinc-200 text-xs">
        <span className="text-zinc-600 font-medium">
          單位：{unitLabel}{revealed && displayMaximum !== maximum ? '（揭曉後縱軸已依資料重新縮放）' : ''}
        </span>
        <span className="flex flex-wrap items-center gap-3 font-bold">
          <span className="inline-flex items-center gap-1.5 text-amber-800">
            <span className="w-3 h-3 rounded-xs bg-amber-600 inline-block shrink-0" />
            <span>你的預測</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sky-800">
            <span className="w-3 h-3 rounded-xs bg-sky-700 inline-block shrink-0" />
            <span>官方資料</span>
          </span>
          {series.kind === 'line' && revealed && (
            <span className="inline-flex items-center gap-1.5 text-amber-800">
              <span className="w-3 h-3 rounded-xs bg-amber-400/35 border border-amber-600 inline-block shrink-0" />
              <span>預測差距</span>
            </span>
          )}
        </span>
      </div>
      <div ref={chartRef}>
      <svg viewBox={`0 0 ${chartWidth} 325`} className="w-full touch-none" role="img" aria-label={`${series.title}，縱軸從零開始，單位 ${series.unit}`}
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); draw(e); }}
        onPointerMove={e => { if (e.buttons === 1 || e.currentTarget.hasPointerCapture(e.pointerId)) draw(e); }}
        onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId); }}>
        {yTicks.map(tick => <g key={tick}>
          <line x1={left} x2={right} y1={y(tick)} y2={y(tick)} stroke="#e4e4e7" />
          <text x={left - 8} y={y(tick) + 4} textAnchor="end" fontSize="12" fill="#52525b">{format(tick)}</text>
        </g>)}
        <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="#71717a" />
        {revealed && series.kind === 'line' && (
          <path
            className="gsap-gap-area"
            d={buildLineGapPath()}
            fill="rgba(245, 158, 11, 0.25)"
            stroke="none"
          />
        )}
        {series.kind === 'line' && <polyline points={effectiveGuesses.map((n, i) => n === null ? null : `${x(i)},${y(n)}`).filter(Boolean).join(' ')} fill="none" stroke="#b45309" strokeWidth="3" strokeDasharray="5 4" />}
        {revealed && series.kind === 'line' && <polyline className="gsap-official-line" points={series.points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} fill="none" stroke="#0369a1" strokeWidth="3" />}
        {series.points.map((p, i) => {
          const cx = x(i);
          const guessVal = effectiveGuesses[i];
          const isKnownFirstBar = series.kind === 'bar' && i === 0 && Boolean(series.knownFirst);

          if (series.kind === 'bar') {
            const singleBarW = Math.min(34, Math.max(14, slotWidth * 0.42));
            const pairBarW = Math.min(26, Math.max(10, slotWidth * 0.28));
            const barGap = 4;
            const userBarX = revealed ? cx - pairBarW - barGap / 2 : cx - singleBarW / 2;
            const realBarX = cx + barGap / 2;
            const curBarW = revealed ? pairBarW : singleBarW;

            const guessY = guessVal !== null ? y(guessVal) : bottom;
            const guessH = guessVal !== null ? Math.max(3, bottom - guessY) : 0;
            const realY = y(p.value);
            const realH = Math.max(3, bottom - realY);
            const labelsClose = revealed && Math.abs(guessH - realH) < 16 && pairBarW < 24;
            const userTextY = Math.max(
              14,
              bottom - guessH - (labelsClose && guessH >= realH ? 15 : 5)
            );
            const realTextY = Math.max(
              14,
              bottom - realH - (labelsClose && realH > guessH ? 15 : 5)
            );

            return (
              <g key={p.label}>
                {!revealed && !isKnownFirstBar && (
                  <rect
                    x={cx - singleBarW * 0.65}
                    y={top}
                    width={singleBarW * 1.3}
                    height={bottom - top}
                    rx={3}
                    fill="#f4ebd0"
                    opacity={0.32}
                  />
                )}
                {guessVal !== null && (
                  <g>
                    <rect
                      x={userBarX}
                      y={bottom - guessH}
                      width={curBarW}
                      height={guessH}
                      rx={2.5}
                      fill={isKnownFirstBar && !revealed ? '#64748b' : '#d97706'}
                      opacity={0.9}
                    />
                    {!revealed && !isKnownFirstBar && (
                      <circle
                        cx={userBarX + curBarW / 2}
                        cy={bottom - guessH}
                        r={5}
                        fill="#b45309"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    )}
                    <text
                      x={userBarX + curBarW / 2}
                      y={userTextY}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill={isKnownFirstBar && !revealed ? '#334155' : '#92400e'}
                    >
                      {format(guessVal)}
                    </text>
                  </g>
                )}
                {revealed && (
                  <g>
                    <rect
                      className="gsap-official-bar"
                      x={realBarX}
                      y={bottom - realH}
                      width={pairBarW}
                      height={realH}
                      rx={2.5}
                      fill="#0369a1"
                      opacity={0.9}
                    />
                    <text
                      className="gsap-official-label"
                      x={realBarX + pairBarW / 2}
                      y={realTextY}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#075985"
                    >
                      {format(p.value)}
                    </text>
                  </g>
                )}
                <text
                  x={cx}
                  y={bottom + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#52525b"
                >
                  <title>{p.label}</title>
                  {`${i + 1}. ${truncate(p.label, Math.max(2, Math.floor(slotWidth / 13) - 2))}`}
                </text>
              </g>
            );
          }

          return (
            <g key={p.label}>
              {revealed && <circle className="gsap-official-dot" cx={cx} cy={y(p.value)} r="4" fill="#0369a1" />}
              {guessVal !== null && (
                <circle
                  cx={cx}
                  cy={y(guessVal)}
                  r={guesses[i] !== null ? 5 : 3.5}
                  fill={guesses[i] !== null ? '#b45309' : '#ffffff'}
                  stroke={guesses[i] !== null ? '#ffffff' : '#b45309'}
                  strokeWidth={1.5}
                />
              )}
              <text
                x={cx}
                y={bottom + 20 + (chartWidth < 420 && i % 2 ? 16 : 0)}
                textAnchor="middle"
                fontSize="12"
                fill="#52525b"
              >
                <title>{p.label}</title>
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
      </div>
    </div>}
    {!slider && !revealed && <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
      {series.points.map((p, i) => series.kind === 'line' && i > 0 && i < series.points.length - 1 ? null : <label key={p.label} className="flex justify-between items-center gap-2 text-xs sm:text-sm bg-[#f4ebd0] p-2.5 sm:p-3 border border-[#c5b596] min-w-0 overflow-hidden">
        <span className={`font-bold text-zinc-900 min-w-0 ${series.kind === 'line' ? 'whitespace-nowrap' : ''}`}>{series.kind === 'bar' ? `${i + 1}. ` : ''}{p.label}{i === 0 && (series.kind === 'line' || series.knownFirst) ? '（已知）' : ''}</span>
        <span className="flex items-center gap-1.5 shrink-0"><input type="number" aria-label={`${p.label}的預測`} min="0" max={maximum} step="any" value={guesses[i] ?? ''} disabled={revealed}
          readOnly={(autoRemainder && i === remainderIndex) || (i === 0 && (series.kind === 'line' || series.knownFirst))}
          onChange={e => setGuess(i, e.target.value === '' ? null : Number(e.target.value))}
          className="w-20 sm:w-24 max-w-full bg-white border border-zinc-500 px-2 py-1 text-zinc-950 font-mono font-bold text-right rounded disabled:bg-zinc-100" /><span className="whitespace-nowrap text-xs text-zinc-700">{series.unit}</span></span>
      </label>)}
    </div>}
    {!revealed && <div className="flex flex-wrap gap-3 items-center">
      <button
        type="button"
        disabled={!complete}
        onClick={() => {
          setRevealed(true);
          onDraftChange?.({ guesses, revealed: true });
          onReveal();
        }}
        className="bg-yellow-300 border-2 border-black px-6 py-3 font-black shadow-[3px_3px_0_0_#000] cursor-pointer disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
      >
        揭曉官方資料
      </button>
      <button
        type="button"
        onClick={() => {
          const reset = defaultGuesses();
          setGuesses(reset);
          onDraftChange?.({ guesses: reset, revealed: false });
        }}
        className="underline text-sm cursor-pointer"
      >
        {slider ? '重設預測' : '重畫預測'}
      </button>
      <span className="text-sm" aria-live="polite">{!inRange ? '有數字超出預測範圍，請調整後再揭曉。' : pending.length ? `還沒預測：${pending.map(p => p.label).join('、')}。` : distribution ? `目前合計：${format(total)}%${complete ? '，可以揭曉。' : '，請調整為 100%。'}` : '預測完成，可以揭曉。'}</span>
    </div>}
    {revealed && <div className="overflow-x-auto select-text">
      <table className="w-full text-sm border-collapse"><caption className="text-left py-2 font-bold">逐項核對（單位：{series.unit}）</caption>
        <thead><tr className="bg-[#e9ddbc]"><th className="p-2 text-left">年份／類別</th><th>你的預測</th><th>資料值</th></tr></thead>
        <tbody>{series.points.map((p, i) => {
          const isKnownStart = i === 0 && (series.kind === 'line' || series.knownFirst);
          const isInterpolated = series.kind === 'line' && i > 0 && guesses[i] === null && effectiveGuesses[i] !== null;
          return (
            <tr key={p.label} className="gsap-check-row border-b border-[#c5b596]">
              <th className="p-2 text-left font-normal">
                {p.label}
                {p.note && <p className="text-xs text-zinc-600">{p.note}</p>}
              </th>
              <td className={`text-center ${isKnownStart || isInterpolated ? 'text-zinc-500' : 'text-amber-800 font-bold'}`}>
                {isKnownStart
                  ? `${format(p.value)}（已知參考）`
                  : effectiveGuesses[i] === null
                    ? '未預測'
                    : isInterpolated
                      ? `${format(effectiveGuesses[i]!)}（系統補線）`
                      : format(effectiveGuesses[i]!)}
              </td>
              <td className="text-center text-sky-800 font-bold">
                {p.note?.startsWith('原表') ? '—（製圖值 0）' : format(p.value)}
              </td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>}
  </div>;
}
