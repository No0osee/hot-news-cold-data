import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { IntuitionAnswerRecord } from '../types/game';

gsap.registerPlugin(useGSAP);

interface Props {
  intuitionAnswers: IntuitionAnswerRecord | null;
  className?: string;
}

interface SliceData {
  label: string;
  value: number;
  displayValue: string;
  percentage: number;
  color: string;
  isHighlight?: boolean;
}

interface TopicData {
  id: string;
  tabLabel: string;
  headline: string;
  questionPrompt: string;
  centerTop: string;
  centerMiddle: string;
  centerBottom: string;
  officialFactLabel: string;
  paragraphs: [string, string];
  slices: SliceData[];
}

export function IntuitionFactDonutChart({ intuitionAnswers, className = '' }: Props) {
  const [activeTopicIdx, setActiveTopicIdx] = useState<number>(0);
  const [hoveredSliceIdx, setHoveredSliceIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(
        '.gsap-risk-bar',
        { scaleX: 0, transformOrigin: '0% 50%' },
        { scaleX: 1, duration: 0.55, stagger: 0.08, ease: 'back.out(1.4)' },
        0
      )
        .fromTo(
          '.gsap-donut-slice',
          { scale: 0.72, opacity: 0, svgOrigin: '195 140' },
          { scale: 1, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'back.out(1.75)' },
          0
        )
        .fromTo(
          '.gsap-donut-center',
          { scale: 0.85, opacity: 0, svgOrigin: '195 140' },
          { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' },
          0.1
        );
    },
    { scope: containerRef, dependencies: [activeTopicIdx] }
  );

  // 事故筆數與人口取自官方資料；每十萬人數值由本專題計算。
  const topics: TopicData[] = [
    {
      id: 'risk',
      tabLabel: '① 每十萬戶籍人口登記筆數',
      headline: '青年組每十萬戶籍人口登記筆數最高，約為高齡組的 3.07 倍',
      questionPrompt: '如果用 2025 年警政署傷亡事故逐案資料，除以同年戶政司各年齡層戶籍人口，你猜哪一組「每十萬人第一當事者登記筆數」最高？',
      centerTop: '每十萬戶籍人口',
      centerMiddle: '4,093 筆',
      centerBottom: '青年組登記筆數最高',
      officialFactLabel: '18–24 歲青年（每十萬戶籍人口約 4,093 筆）',
      paragraphs: [
        '本專題用 2025 年警政署 A1/A2 逐案資料及同年年底戶籍人口計算：18–24 歲每十萬人約 4,093 筆，65 歲以上約 1,332 筆，兩組相差約 3.07 倍。比較限於這三個年齡組。',
        '本項指標為各年齡層每十萬戶籍人口之第一當事者登記事故筆數，客觀呈現官方登記事故在各年齡人口規模下的相對分佈。'
      ],
      slices: [
        { label: '青年 (18-24)', value: 4093, displayValue: '4,093 筆', percentage: 56.1, color: '#1d4ed8', isHighlight: true },
        { label: '青壯年 (25-64)', value: 1874, displayValue: '1,874 筆', percentage: 25.7, color: '#0284c7' },
        { label: '高齡 (65+)', value: 1332, displayValue: '1,332 筆', percentage: 18.2, color: '#0f766e' }
      ]
    },
    {
      id: 'majority',
      tabLabel: '② 三大年齡組登記總量（件數大宗）',
      headline: '青壯年佔三大年齡組第一當事者登記總量近七成',
      questionPrompt: '依照你的直覺印象，在 18 歲以上三大年齡組（青年、青壯年、高齡）中，哪一個年齡層發生的「事故登記總件數最多」？',
      centerTop: '三大年齡組登記總量',
      centerMiddle: '25.9 萬筆',
      centerBottom: '青壯年佔 67.2%',
      officialFactLabel: '25–64 歲青壯年（258,966 筆，佔三大組 67.2%）',
      paragraphs: [
        '本專題篩選的警政署 2025 年逐案紀錄中，25–64 歲青壯年第一當事者登記為 258,966 筆，佔三大年齡組總量的 67.2%（近七成）。此筆數不能直接用來判定個人駕駛風險。',
        '相對地，高齡組（16.2%）與青年組（16.6%）各僅佔約一成六。客觀數據清楚提醒：當公眾焦點常被高齡暴衝等特殊個案吸引時，在三大年齡組的登記事故中，件數的絕對大宗依然是青壯年用路群體。'
      ],
      slices: [
        { label: '青壯年 (25-64)', value: 258966, displayValue: '25.9 萬筆 (67.2%)', percentage: 67.2, color: '#1e3a8a', isHighlight: true },
        { label: '青年 (18-24)', value: 63972, displayValue: '6.4 萬筆 (16.6%)', percentage: 16.6, color: '#2563eb' },
        { label: '高齡 (65+)', value: 62222, displayValue: '6.2 萬筆 (16.2%)', percentage: 16.2, color: '#38bdf8' }
      ]
    },
    {
      id: 'salience',
      tabLabel: '③ 高齡組登記占比',
      headline: '三大年齡組中高齡第一當事者僅佔 16.2%，青壯年佔 67.2%',
      questionPrompt: '在經常看見「高齡暴衝、高齡換照」等熱門新聞後，你直覺認為高齡駕駛在官方三大年齡組傷亡事故中，實際佔了多少比例？',
      centerTop: '高齡事故佔比',
      centerMiddle: '僅 16.2%',
      centerBottom: '非事故件數主力',
      officialFactLabel: '高齡僅佔 16.2%（青壯年佔 67.2% 為大宗）',
      paragraphs: [
        '在警政署 114 年三大年齡組傷亡事故登記中，高齡第一當事者為 62,222 筆（佔 16.2%）；青年為 63,972 筆（佔 16.6%）；青壯年則高達 258,966 筆（佔 67.2%）。高齡者並非登記事故件數的主力。',
        '重大死傷事故（如車輛失控衝撞）往往因畫面鮮明、後果嚴重而引發社會高度關注與連續追蹤；但若回到全年度的整體傷亡事故紀錄，高齡駕駛僅占約一成六，提醒我們在關注個別重大事故之外，也需同時對照整體母體數據。'
      ],
      slices: [
        { label: '青壯年 (25-64)', value: 258966, displayValue: '25.9 萬筆 (67.2%)', percentage: 67.2, color: '#1e3a8a' },
        { label: '青年 (18-24)', value: 63972, displayValue: '6.4 萬筆 (16.6%)', percentage: 16.6, color: '#2563eb' },
        { label: '高齡 (65+)', value: 62222, displayValue: '6.2 萬筆 (16.2%)', percentage: 16.2, color: '#8d2e25', isHighlight: true }
      ]
    }
  ];

  const currentTopic = topics[activeTopicIdx];

  // 取得玩家在 Step 1 的直覺回答標籤
  const getPlayerIntuitionLabel = (topicIdx: number): string => {
    if (!intuitionAnswers) return '未作答';
    const qIds = ['q_risk_impression', 'q_majority_impression', 'q_elderly_share'];
    const qId = qIds[topicIdx];
    const userChoiceId = intuitionAnswers.answers[qId] || (topicIdx === 2 ? intuitionAnswers.answers['q_media_salience'] : undefined);
    if (!userChoiceId) return '未作答';

    if (topicIdx === 2) {
      if (userChoiceId === 'q3_minority' || userChoiceId.includes('minority')) return '約一成至二成 (10%–20%)';
      if (userChoiceId === 'q3_middle' || userChoiceId.includes('middle')) return '約三到四成 (30%–40%)';
      if (userChoiceId === 'q3_majority' || userChoiceId.includes('majority')) return '約五成至六成 (50%–60%)';
      if (userChoiceId.includes('adult')) return '25–64 歲';
      if (userChoiceId.includes('youth')) return '18–24 歲';
      if (userChoiceId.includes('elderly')) return '65 歲以上';
    }

    if (userChoiceId.includes('elderly')) return '65 歲以上';
    if (userChoiceId.includes('youth')) return '18–24 歲';
    if (userChoiceId.includes('adult')) return '25–64 歲';
    return '未作答';
  };

  const playerAnswer = getPlayerIntuitionLabel(activeTopicIdx);

  // 判斷玩家在指定維度是否答對
  const checkTopicCorrect = (topicIdx: number): boolean => {
    if (!intuitionAnswers) return false;
    const qIds = ['q_risk_impression', 'q_majority_impression', 'q_elderly_share'];
    const qId = qIds[topicIdx];
    const userChoiceId = intuitionAnswers.answers[qId] || (topicIdx === 2 ? intuitionAnswers.answers['q_media_salience'] : undefined);
    if (!userChoiceId) return false;

    if (topicIdx === 0) return userChoiceId.includes('youth');
    if (topicIdx === 1) return userChoiceId.includes('adult');
    if (topicIdx === 2) {
      if (userChoiceId === 'q3_minority' || userChoiceId.includes('minority')) return true;
      if (userChoiceId.includes('adult')) return true;
      return false;
    }
    return false;
  };

  const isCorrect = checkTopicCorrect(activeTopicIdx);

  // SVG Donut 幾何常數（擴大 SVG 畫布至 390x280，CX=195 居中，半徑微縮，讓引導線與標籤 100% 容納於 SVG 內絕不外溢）
  const CX = 195;
  const CY = 140;
  const R_OUTER = 86;
  const R_INNER = 52;

  // 計算圓弧路徑 (SVG Path)
  const slicePaths = useMemo(() => {
    const total = currentTopic.slices.reduce((sum, s) => sum + s.percentage, 0);
    
    // 以純函數方式計算切片起訖角度
    const sliceAngles = currentTopic.slices.reduce<Array<{ startAngle: number; endAngle: number; angleSpan: number }>>((acc, slice) => {
      const prevEnd = acc.length > 0 ? acc[acc.length - 1].endAngle : -Math.PI / 2;
      const angleSpan = (slice.percentage / total) * (Math.PI * 2);
      acc.push({
        startAngle: prevEnd,
        endAngle: prevEnd + angleSpan,
        angleSpan
      });
      return acc;
    }, []);

    return currentTopic.slices.map((slice, sIdx) => {
      const { startAngle, endAngle, angleSpan } = sliceAngles[sIdx];

      const midAngle = (startAngle + endAngle) / 2;
      const isHovered = hoveredSliceIdx === sIdx;

      // 偏移外凸微動態
      const offset = isHovered ? 5 : 0;
      const offsetX = offset * Math.cos(midAngle);
      const offsetY = offset * Math.sin(midAngle);

      const x1 = CX + offsetX + R_OUTER * Math.cos(startAngle);
      const y1 = CY + offsetY + R_OUTER * Math.sin(startAngle);
      const x2 = CX + offsetX + R_OUTER * Math.cos(endAngle);
      const y2 = CY + offsetY + R_OUTER * Math.sin(endAngle);

      const x3 = CX + offsetX + R_INNER * Math.cos(endAngle);
      const y3 = CY + offsetY + R_INNER * Math.sin(endAngle);
      const x4 = CX + offsetX + R_INNER * Math.cos(startAngle);
      const y4 = CY + offsetY + R_INNER * Math.sin(startAngle);

      const largeArcFlag = angleSpan > Math.PI ? 1 : 0;

      const pathData = `
        M ${x1} ${y1}
        A ${R_OUTER} ${R_OUTER} 0 ${largeArcFlag} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${R_INNER} ${R_INNER} 0 ${largeArcFlag} 0 ${x4} ${y4}
        Z
      `;

      // 放射引導標籤線坐標（精準控制拐折長度，保證標籤文字留在畫布內）
      const labelLineStartR = R_OUTER + 3;
      const labelLineElbowR = R_OUTER + 15;
      const lx1 = CX + labelLineStartR * Math.cos(midAngle);
      const ly1 = CY + labelLineStartR * Math.sin(midAngle);
      const lx2 = CX + labelLineElbowR * Math.cos(midAngle);
      const ly2 = CY + labelLineElbowR * Math.sin(midAngle);
      const isRightSide = Math.cos(midAngle) >= 0;
      const lx3 = isRightSide ? lx2 + 10 : lx2 - 10;

      return {
        pathData,
        slice,
        midAngle,
        isRightSide,
        leaderLine: { x1: lx1, y1: ly1, x2: lx2, y2: ly2, x3: lx3, y3: ly2 }
      };
    });
  }, [currentTopic, hoveredSliceIdx]);

  return (
    <div ref={containerRef} className={`bg-[#fcf8e3] border-4 border-[#8c734b] p-6 md:p-8 rounded shadow-[6px_6px_0_0_rgba(0,0,0,0.85)] text-zinc-900 ${className}`}>
      
      {/* 頂部維度切換列 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#8c734b] pb-4 mb-6">
        <div>
          <h3 className="text-xl md:text-2xl font-black font-serif text-zinc-950 mt-1.5">
            官方資料對照：三個角度看同一份統計
          </h3>
        </div>

        {/* 3 個切換標籤 */}
        <div className="flex flex-wrap gap-1.5 bg-zinc-200/80 p-1 rounded-lg border border-zinc-400">
          {topics.map((t, idx) => {
            const isActive = activeTopicIdx === idx;
            const tabCorrect = checkTopicCorrect(idx);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTopicIdx(idx);
                  setHoveredSliceIdx(null);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-zinc-900 text-yellow-300 shadow-sm'
                    : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/60'
                }`}
              >
                <span>{t.tabLabel}</span>
                {intuitionAnswers && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black ${
                      tabCorrect
                        ? isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800 border border-emerald-400'
                        : isActive ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                    title={tabCorrect ? '第 1 步回答與資料一致' : '第 1 步回答與資料不同'}
                  >
                    {tabCorrect ? '✓ 一致' : '✕ 對照'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 左右分割版面（完全仿照參考範例圖 2） */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* 左側：比率用長條圖（比率不能加總成整體）；件數占比才用圓環圖 */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[360px] select-none">
            {currentTopic.id === 'risk' ? (
              <svg viewBox="0 0 390 280" className="w-full h-auto" role="img" aria-label="三個年齡組每十萬戶籍人口第一當事者登記筆數長條圖，橫軸從零開始">
                {[0, 1000, 2000, 3000, 4000, 5000].map(tick => {
                  const x = 110 + (tick / 5000) * 250;
                  return (
                    <g key={tick}>
                      <line x1={x} x2={x} y1={30} y2={240} stroke="#e4d7b5" strokeDasharray={tick === 0 ? undefined : '3 3'} />
                      <text x={x} y={258} textAnchor="middle" className="font-mono text-[10px] fill-zinc-500">{tick.toLocaleString()}</text>
                    </g>
                  );
                })}
                <text x={360} y={274} textAnchor="end" className="font-sans text-[10px] fill-zinc-500">每十萬戶籍人口登記筆數</text>
                {currentTopic.slices.map((slice, idx) => {
                  const y = 48 + idx * 66;
                  const width = (slice.value / 5000) * 250;
                  return (
                    <g key={slice.label}>
                      <text x={102} y={y + 20} textAnchor="end" className="font-sans text-[12px] font-bold fill-zinc-800">{slice.label}</text>
                      <rect className="gsap-risk-bar" x={110} y={y} width={width} height={32} fill={slice.color} rx={2} />
                      <text x={110 + width + 6} y={y + 21} className="font-mono text-[12px] font-black fill-zinc-900">{slice.displayValue}</text>
                    </g>
                  );
                })}
              </svg>
            ) : (
            <svg
              viewBox="0 0 390 280"
              className="w-full h-auto drop-shadow-sm overflow-hidden"
            >
              {/* 環形漸層背景圈 */}
              <circle
                cx={CX}
                cy={CY}
                r={R_OUTER + 2}
                fill="none"
                stroke="#e4d7b5"
                strokeWidth={1}
                strokeDasharray="3 3"
              />

              {/* 圓環切片 */}
              {slicePaths.map((item, idx) => (
                <g
                  key={`${currentTopic.id}-slice-${idx}`}
                  onMouseEnter={() => setHoveredSliceIdx(idx)}
                  onMouseLeave={() => setHoveredSliceIdx(null)}
                  className="gsap-donut-slice cursor-pointer transition-transform duration-200"
                >
                  <path
                    d={item.pathData}
                    fill={item.slice.color}
                    stroke="#ffffff"
                    strokeWidth={2.5}
                    className="hover:brightness-110 transition-all duration-150"
                  />

                  {/* 放射引線 */}
                  <polyline
                    points={`${item.leaderLine.x1},${item.leaderLine.y1} ${item.leaderLine.x2},${item.leaderLine.y2} ${item.leaderLine.x3},${item.leaderLine.y3}`}
                    fill="none"
                    stroke="#71717a"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                  />

                  {/* 外側標籤文字 */}
                  <text
                    x={item.leaderLine.x3 + (item.isRightSide ? 4 : -4)}
                    y={item.leaderLine.y3 + 4}
                    textAnchor={item.isRightSide ? 'start' : 'end'}
                    className="font-sans text-[11px] font-bold fill-zinc-800 pointer-events-none"
                  >
                    {item.slice.label}
                  </text>
                </g>
              ))}

              {/* 圓環中心圓形白底 */}
              <circle
                className="gsap-donut-center shadow-inner"
                cx={CX}
                cy={CY}
                r={R_INNER - 2}
                fill="#fcf8e3"
                stroke="#c5b596"
                strokeWidth={2}
              />

              {/* 中心核心文字數據 */}
              <text
                x={CX}
                y={CY - 13}
                textAnchor="middle"
                className="font-mono text-[10px] font-bold fill-zinc-500 uppercase tracking-widest"
              >
                {currentTopic.centerTop}
              </text>
              <text
                x={CX}
                y={CY + 8}
                textAnchor="middle"
                className="font-serif text-[20px] font-black fill-zinc-950"
              >
                {currentTopic.centerMiddle}
              </text>
              <text
                x={CX}
                y={CY + 22}
                textAnchor="middle"
                className="font-sans text-[10px] font-black fill-[#8d2e25]"
              >
                {currentTopic.centerBottom}
              </text>
            </svg>
            )}
          </div>

          {/* 圖例說明 */}
          <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs font-mono">
            {currentTopic.slices.map((s, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredSliceIdx(idx)}
                onMouseLeave={() => setHoveredSliceIdx(null)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  hoveredSliceIdx === idx ? 'bg-amber-100 ring-1 ring-amber-400' : ''
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-zinc-700 font-bold">{s.label}:</span>
                <span className="font-mono text-zinc-950 font-black">{s.displayValue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 右側：精簡故事敘事（Headline + 直覺對照膠囊 + 2段深度精練文字） */}
        <div className="lg:col-span-7 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTopic.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* 大標題 */}
              <h4 className="text-xl md:text-2xl font-black font-serif text-zinc-950 leading-tight">
                {currentTopic.headline}
              </h4>

              {/* 直覺 vs 真相對照膠囊列（明確區分答對與答錯色彩與標章） */}
              <div className="space-y-2 pt-1 pb-1">
                {/* 答對 / 答錯 狀態指示徽章 */}
                <div className="flex flex-wrap items-center gap-2">
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700 text-white text-xs font-black rounded-full shadow-sm">
                      <CheckCircle2 size={14} className="text-emerald-200" />
                      <span>✓ 你在第 1 步的選擇與資料一致</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#8d2e25] text-white text-xs font-black rounded-full shadow-sm">
                      <AlertTriangle size={14} className="text-amber-300" />
                      <span>✕ 你在第 1 步的選擇與資料不同</span>
                    </span>
                  )}
                  {activeTopicIdx === 0 && (
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded border border-amber-400">
                      本專題計算：每十萬戶籍人口第一當事者登記筆數
                    </span>
                  )}
                </div>

                {/* 膠囊對比框 */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* 玩家直覺框：答對為綠色，答錯為紅橘色 */}
                  <div
                    className={`px-3 py-1.5 border-2 rounded text-xs flex items-center gap-1.5 shadow-sm transition-colors ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                        : 'bg-rose-50 border-rose-400 text-rose-950'
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle size={15} className="text-rose-600 shrink-0" />
                    )}
                    <span className={`font-mono font-bold ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                      第 1 步選擇：
                    </span>
                    <strong className="font-black text-sm">{playerAnswer}</strong>
                  </div>

                  {/* 官方真相框 */}
                  <div
                    className={`px-3 py-1.5 border-2 rounded text-xs flex items-center gap-1.5 shadow-sm transition-colors ${
                      isCorrect
                        ? 'bg-emerald-100/90 border-emerald-600 text-emerald-950'
                        : 'bg-amber-100 border-[#8c734b] text-[#8d2e25]'
                    }`}
                  >
                    <span className={`font-mono font-bold ${isCorrect ? 'text-emerald-800' : 'text-[#8d2e25]'}`}>
                      官方統計：
                    </span>
                    <strong className={`font-black text-sm ${isCorrect ? 'text-emerald-950' : 'text-[#8d2e25]'}`}>
                      {currentTopic.officialFactLabel}
                    </strong>
                  </div>
                </div>
              </div>

              {/* 兩段精練俐落的文字敘事 */}
              <div className="space-y-3 text-sm md:text-[15px] text-zinc-900 leading-relaxed font-sans font-medium">
                <p className="bg-white p-4 rounded border border-[#c5b596] shadow-xs">
                  {currentTopic.paragraphs[0]}
                </p>
                <p className="bg-white p-4 rounded border border-[#c5b596] shadow-xs">
                  {currentTopic.paragraphs[1]}
                </p>
              </div>

              {/* 角度切換快速導覽列 */}
              <div className="pt-1 flex items-center justify-between text-xs text-zinc-600">
                <span>目前檢視：第 {activeTopicIdx + 1} / {topics.length} 個統計角度</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTopicIdx((activeTopicIdx + 1) % topics.length);
                    setHoveredSliceIdx(null);
                  }}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 border border-[#8c734b] rounded font-bold text-zinc-900 transition-colors cursor-pointer"
                >
                  {activeTopicIdx < topics.length - 1
                    ? `看下一個角度：${topics[activeTopicIdx + 1].tabLabel}`
                    : `回到第一個角度：${topics[0].tabLabel} ↺`}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
