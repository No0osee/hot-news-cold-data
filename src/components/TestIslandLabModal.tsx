import { useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface TestIslandLabModalProps {
  open: boolean;
  onClose: () => void;
}

type StageId =
  | 'stage1'
  | 'stage2'
  | 'stage3'
  | 'stage4'
  | 'stage5'
  | 'stage6'
  | 'stage7'
  | 'stage8';

interface DeskActionItem {
  id: string;
  code: string;
  verb: string;
  sub: string;
  ctrDelta: number;
  distortionDelta: number;
  barShift: [number, number, number];
  logLine: string;
}

const DESK_ACTIONS: DeskActionItem[] = [
  {
    id: 'act_audio',
    code: 'OP-01',
    verb: '把行車紀錄器煞車聲拉高 6.4 分貝，片頭循環三次',
    sub: '剪輯台耗時 14.2 分鐘 ｜ 略過同路段離峰畫面',
    ctrDelta: 18.7,
    distortionDelta: 23.4,
    barShift: [-412.6, -285.1, 894.3],
    logLine: '18:41:09 音軌增益 +6.4dB。觀眾腎上腺素指標上升。',
  },
  {
    id: 'act_split',
    code: 'OP-02',
    verb: '將同一場三峽事故拆成早、午、晚三則獨家發稿',
    sub: '標題替換三個動詞 ｜ 隱去案號相同註記',
    ctrDelta: 24.3,
    distortionDelta: 31.8,
    barShift: [-520.4, -390.8, 1240.7],
    logLine: '18:42:51 單一事故裂解為 3.0 篇獨立版面。母體頻率錯覺形成。',
  },
  {
    id: 'act_footnote',
    code: 'OP-03',
    verb: '把戶籍人口分母表縮成 5pt 塞進第 14 版折縫',
    sub: '節省頭版 38.6% 留白 ｜ 僅保留絕對件數粗體字',
    ctrDelta: 11.9,
    distortionDelta: 19.6,
    barShift: [-680.2, 540.5, 480.9],
    logLine: '18:44:12 分母欄移出主視覺。讀者自動以曝光量代換發生率。',
  },
  {
    id: 'act_rawcsv',
    code: 'OP-04',
    verb: '調出警政署 25.9 萬筆青壯年通勤擦撞原始磁帶',
    sub: '畫面平淡無火光 ｜ 廣告主停留秒數下滑',
    ctrDelta: -16.8,
    distortionDelta: -27.9,
    barShift: [510.3, 340.2, -920.5],
    logLine: '18:45:33 載入 258,966 筆日常碰撞紀錄。收視曲線開始下墜。',
  },
  {
    id: 'act_shred',
    code: 'OP-05',
    verb: '把公路局第 21 條四欄定義表塞進碎紙機',
    sub: '直接將警政署與公路局件數相加算出 72.4% 大字標',
    ctrDelta: 29.4,
    distortionDelta: 38.7,
    barShift: [-390.0, -510.4, 1490.2],
    logLine: '18:46:48 跨機關口徑強行合併。統計組分機無人接聽。',
  },
  {
    id: 'act_reset_tape',
    code: 'OP-06',
    verb: '退回晚間頭版鉛字盤，強制對齊每十萬人基準線',
    sub: '撤下 3 則衍生特稿 ｜ 截稿時間透支 19.4 分鐘',
    ctrDelta: -22.1,
    distortionDelta: -41.3,
    barShift: [620.8, 290.4, -1180.6],
    logLine: '18:48:02 鉛字重排完畢。業務部來電詢問為何頭條沒有爆點。',
  },
];

interface CohortSpec {
  id: string;
  code: string;
  label: string;
  officialRate: number;
  officialCount: number;
  officialShare: number;
  popWeightPct: number;
  defaultGuess: number;
}

const COHORTS: CohortSpec[] = [
  {
    id: 'c_youth',
    code: 'GRP-18/24',
    label: '18–24 歲青年組',
    officialRate: 4092.6,
    officialCount: 63972,
    officialShare: 16.6,
    popWeightPct: 8.4,
    defaultGuess: 2140.8,
  },
  {
    id: 'c_adult',
    code: 'GRP-25/64',
    label: '25–64 歲青壯年組',
    officialRate: 1873.9,
    officialCount: 258966,
    officialShare: 67.2,
    popWeightPct: 68.1,
    defaultGuess: 1680.4,
  },
  {
    id: 'c_elder',
    code: 'GRP-65/UP',
    label: '65 歲以上高齡組',
    officialRate: 1331.5,
    officialCount: 62222,
    officialShare: 16.2,
    popWeightPct: 23.5,
    defaultGuess: 3890.7,
  },
];

// 24-Hour Highway Congestion Index Curve for STAGE 05 (Sampling Shutter)
const HOURLY_WAVE: Array<{ hour: string; val: number; tag: string }> = [
  { hour: '00:00', val: 14.2, tag: '離峰順暢' },
  { hour: '02:00', val: 11.8, tag: '深夜淨空' },
  { hour: '04:00', val: 13.5, tag: '早班物流' },
  { hour: '06:00', val: 28.4, tag: '北上車流湧現' },
  { hour: '08:00', val: 76.9, tag: '湖口段早尖峰' },
  { hour: '10:00', val: 94.6, tag: 'SNG連線定點' },
  { hour: '12:00', val: 48.3, tag: '午間緩解' },
  { hour: '14:00', val: 39.1, tag: '主線正常' },
  { hour: '16:00', val: 52.7, tag: '返程湧現' },
  { hour: '18:00', val: 88.4, tag: '埔鹽系統晚尖峰' },
  { hour: '20:00', val: 36.8, tag: '疏運回落' },
  { hour: '22:00', val: 19.3, tag: '恢復常態' },
];

// STAGE 07 GIS: TWD97 TM2 Spatial Grid Zones (Taiwan Cartographic Mesh)
interface GisZoneSpec {
  id: string;
  code: string;
  name: string;
  col: number; // 0..3 grid column
  row: number; // 0..4 grid row
  twdX: number;
  twdY: number;
  rawCases: number; // Absolute annual collision count
  ratePer10k: number; // Collisions per 10,000 residents
  roadDensity: number; // Collisions per 100km of provincial/arterial road
  sngSharePct: number; // TV SNG live dispatch share (%)
}

const GIS_ZONES: GisZoneSpec[] = [
  {
    id: 'gz_tpe',
    code: 'N-01',
    name: '台北盆地核心網格',
    col: 2,
    row: 0,
    twdX: 304812.6,
    twdY: 2771409.3,
    rawCases: 48219,
    ratePer10k: 193.4,
    roadDensity: 412.8,
    sngSharePct: 38.4,
  },
  {
    id: 'gz_ntp',
    code: 'N-02',
    name: '新北環狀走廊網格',
    col: 1,
    row: 0,
    twdX: 296418.2,
    twdY: 2766812.7,
    rawCases: 71842,
    ratePer10k: 177.9,
    roadDensity: 528.4,
    sngSharePct: 24.7,
  },
  {
    id: 'gz_tyn',
    code: 'N-03',
    name: '桃園台一線工業帶',
    col: 0,
    row: 1,
    twdX: 279514.8,
    twdY: 2761904.1,
    rawCases: 49631,
    ratePer10k: 214.6,
    roadDensity: 689.3,
    sngSharePct: 7.2,
  },
  {
    id: 'gz_hsz',
    code: 'N-04',
    name: '竹苗縱貫線科技廊帶',
    col: 1,
    row: 1,
    twdX: 248903.4,
    twdY: 2743819.5,
    rawCases: 23418,
    ratePer10k: 229.8,
    roadDensity: 742.6,
    sngSharePct: 3.1,
  },
  {
    id: 'gz_ila',
    code: 'E-01',
    name: '蘭陽平原台九線網格',
    col: 2,
    row: 1,
    twdX: 326109.7,
    twdY: 2738402.9,
    rawCases: 11284,
    ratePer10k: 248.3,
    roadDensity: 618.9,
    sngSharePct: 2.4,
  },
  {
    id: 'gz_txg',
    code: 'C-01',
    name: '台中盆地放射路網',
    col: 0,
    row: 2,
    twdX: 217842.1,
    twdY: 2671908.4,
    rawCases: 68492,
    ratePer10k: 241.2,
    roadDensity: 641.7,
    sngSharePct: 9.8,
  },
  {
    id: 'gz_chw',
    code: 'C-02',
    name: '彰雲台17線混行帶',
    col: 1,
    row: 2,
    twdX: 198412.5,
    twdY: 2648301.2,
    rawCases: 34819,
    ratePer10k: 264.7,
    roadDensity: 814.2,
    sngSharePct: 1.9,
  },
  {
    id: 'gz_hun',
    code: 'E-02',
    name: '花東縱谷省道走廊',
    col: 2,
    row: 2,
    twdX: 308714.9,
    twdY: 2653910.6,
    rawCases: 12904,
    ratePer10k: 289.4,
    roadDensity: 892.7,
    sngSharePct: 1.4,
  },
  {
    id: 'gz_tnn',
    code: 'S-01',
    name: '嘉南古都放射網格',
    col: 0,
    row: 3,
    twdX: 168924.3,
    twdY: 2543812.8,
    rawCases: 44128,
    ratePer10k: 237.6,
    roadDensity: 763.5,
    sngSharePct: 3.6,
  },
  {
    id: 'gz_khh',
    code: 'S-02',
    name: '高雄港區重車走廊',
    col: 1,
    row: 3,
    twdX: 181409.6,
    twdY: 2504918.2,
    rawCases: 56312,
    ratePer10k: 206.1,
    roadDensity: 694.8,
    sngSharePct: 6.1,
  },
  {
    id: 'gz_pif',
    code: 'S-03',
    name: '屏鵝公路長距離網格',
    col: 1,
    row: 4,
    twdX: 204819.4,
    twdY: 2491204.7,
    rawCases: 19846,
    ratePer10k: 251.9,
    roadDensity: 846.1,
    sngSharePct: 1.4,
  },
];

// STAGE 08 GIS: Micro-Scale Intersection Buffer & Collision Point Cloud
interface GisCollisionPoint {
  id: string;
  x: number; // SVG 0..560
  y: number; // SVG 0..270
  factor: 'geometry' | 'signal' | 'age';
  tag: string;
}

const GIS_COLLISION_POINTS: GisCollisionPoint[] = [
  // Cluster around Left-Turn Offset Deficiency (x: 195, y: 135)
  { id: 'pt01', x: 182, y: 124, factor: 'geometry', tag: '對向左轉視距遮蔽' },
  { id: 'pt02', x: 204, y: 138, factor: 'geometry', tag: '無偏心左轉車道追撞' },
  { id: 'pt03', x: 191, y: 147, factor: 'geometry', tag: '直行車閃避左轉急煞' },
  { id: 'pt04', x: 174, y: 136, factor: 'geometry', tag: '內側車道動線交織' },
  { id: 'pt05', x: 213, y: 129, factor: 'geometry', tag: '左轉待轉區溢流' },
  { id: 'pt06', x: 198, y: 118, factor: 'signal', tag: '早開時相秒差衝突' },
  { id: 'pt07', x: 186, y: 156, factor: 'age', tag: '高齡駕駛反應不及' },
  // Cluster around Unshielded Crosswalk Setback (x: 368, y: 135)
  { id: 'pt08', x: 358, y: 119, factor: 'geometry', tag: '行穿線未退縮A柱死角' },
  { id: 'pt09', x: 374, y: 128, factor: 'geometry', tag: '無庇護島左轉切西瓜' },
  { id: 'pt10', x: 364, y: 146, factor: 'geometry', tag: '轉角曲率半徑過大超速' },
  { id: 'pt11', x: 382, y: 139, factor: 'signal', tag: '人車共相綠燈衝突' },
  { id: 'pt12', x: 351, y: 133, factor: 'geometry', tag: '停止線緊貼行穿線' },
  { id: 'pt13', x: 379, y: 152, factor: 'age', tag: '高齡行人步速落差' },
  // Cluster around North Approach Merge (x: 280, y: 72)
  { id: 'pt14', x: 274, y: 66, factor: 'signal', tag: '多時相號誌黃燈猶豫區' },
  { id: 'pt15', x: 289, y: 78, factor: 'signal', tag: '支線匯入號誌未連鎖' },
  { id: 'pt16', x: 268, y: 82, factor: 'geometry', tag: '車道寬度突縮 0.9m' },
  { id: 'pt17', x: 294, y: 64, factor: 'age', tag: '青年無照超速切入' },
  // Scattered periphery points
  { id: 'pt18', x: 96, y: 131, factor: 'age', tag: '離峰單車擦撞' },
  { id: 'pt19', x: 124, y: 142, factor: 'signal', tag: '閃光黃燈路口未減速' },
  { id: 'pt20', x: 468, y: 127, factor: 'age', tag: '路側臨停開門擦撞' },
  { id: 'pt21', x: 442, y: 144, factor: 'geometry', tag: '路肩寬度不足側撞' },
  { id: 'pt22', x: 282, y: 206, factor: 'signal', tag: '南向周期轉換追撞' },
  { id: 'pt23', x: 269, y: 218, factor: 'geometry', tag: '槽化線引導偏移' },
  { id: 'pt24', x: 312, y: 134, factor: 'geometry', tag: '路口中心導引線缺失' },
];

export function TestIslandLabModal({ open, onClose }: TestIslandLabModalProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const stageWrapRef = useRef<HTMLDivElement | null>(null);

  const [activeStage, setActiveStage] = useState<StageId>('stage1');

  // Physical Hit-Stop & Screen Shake helper
  const [isHitStop, setIsHitStop] = useState<boolean>(false);
  const [flashingMetric, setFlashingMetric] = useState<boolean>(false);

  // Rapid click anti-spam / Easter Egg detector
  const clickTimestampsRef = useRef<number[]>([]);
  const [jammedLockdown, setJammedLockdown] = useState<boolean>(false);
  const [jamMessage, setJamMessage] = useState<string | null>(null);

  // ==========================================================================
  // STAGE 01 STATE: Newsroom Desk Calibration & Hidden Degradation Engine
  // ==========================================================================
  const [ctrValue, setCtrValue] = useState<number>(34.2);
  const [distortionValue, setDistortionValue] = useState<number>(18.6);
  const [displayCtr, setDisplayCtr] = useState<number>(34.2);
  const [displayDistortion, setDisplayDistortion] = useState<number>(18.6);

  const [printedBars, setPrintedBars] = useState<[number, number, number]>([
    2410.5, 1790.2, 2680.4,
  ]);
  const [displayBars, setDisplayBars] = useState<[number, number, number]>([
    2410.5, 1790.2, 2680.4,
  ]);
  const [terminalLog, setTerminalLog] = useState<string>(
    '18:40:00 鉛字排版機待命。警政署 2025 原始磁帶已掛載。'
  );
  const [systemCollapsed, setSystemCollapsed] = useState<boolean>(false);
  const [usedActionCounts, setUsedActionCounts] = useState<Record<string, number>>({});

  // ==========================================================================
  // STAGE 02 STATE: Mechanical Crosshair & High-Tension Spring Reveal
  // ==========================================================================
  const [stage2Guesses, setStage2Guesses] = useState<[number, number, number]>([
    2140.8, 1680.4, 3890.7,
  ]);
  const [stage2DraggingIdx, setStage2DraggingIdx] = useState<number | null>(null);
  const [stage2Committed, setStage2Committed] = useState<boolean>(false);
  const [stage2AnimatedOfficial, setStage2AnimatedOfficial] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  const [stage2ProbeIdx, setStage2ProbeIdx] = useState<number>(2);
  const svgStage2Ref = useRef<SVGSVGElement | null>(null);

  // ==========================================================================
  // STAGE 03 STATE: 100-Cell Lead-Type Matrix & Asymmetric Allocation
  // ==========================================================================
  const [leadCellsElderly, setLeadCellsElderly] = useState<number>(47.3);
  const [leadCellsYouth, setLeadCellsYouth] = useState<number>(19.4);
  const [matrixStamped, setMatrixStamped] = useState<boolean>(false);
  const [inspectedCell, setInspectedCell] = useState<number | null>(null);

  // ==========================================================================
  // STAGE 04 STATE (NEW!): Dual-Axis Slopegraph Tug-of-War (DUI vs Unlicensed)
  // ==========================================================================
  // Left Axis fixed: OpView News Share (DUI 87.6%, Unlicensed 12.4%)
  // Right Axis draggable: Player guess of Enforcement Volume (in 10k cases, max 18.0)
  const [slopeDuiGuess, setSlopeDuiGuess] = useState<number>(15.4); // real is 5.63 (56,303)
  const [slopeUnlicGuess, setSlopeUnlicGuess] = useState<number>(3.8); // real is 14.77 (147,668)
  const [slopeDraggingWhich, setSlopeDraggingWhich] = useState<'dui' | 'unlic' | null>(null);
  const [slopeLocked, setSlopeLocked] = useState<boolean>(false);
  const [slopeAnimDuiReal, setSlopeAnimDuiReal] = useState<number>(0);
  const [slopeAnimUnlicReal, setSlopeAnimUnlicReal] = useState<number>(0);
  const svgSlopeRef = useRef<SVGSVGElement | null>(null);

  // ==========================================================================
  // STAGE 05 STATE (NEW!): Sampling Shutter Window & Y-Axis Truncation Magnifier
  // ==========================================================================
  const [shutterStartIdx, setShutterStartIdx] = useState<number>(3); // index in HOURLY_WAVE (0..11)
  const [shutterSpan, setShutterSpan] = useState<number>(3); // number of points (3, 6, or 12)
  const [truncateYAxis, setTruncateYAxis] = useState<boolean>(true);
  const [shutterLog, setShutterLog] = useState<string>(
    '19:02:11 取景窗鎖定 06:00–10:00 尖峰段。座標軸截斷放大已啟動。'
  );

  // ==========================================================================
  // STAGE 06 STATE (NEW!): Denominator Counterweight Mekko Area Chart
  // ==========================================================================
  // Width percentages for the 3 age groups (must sum to 100)
  const [mekkoWidths, setMekkoWidths] = useState<[number, number, number]>([33.3, 33.3, 33.4]);
  const [mekkoDisplayWidths, setMekkoDisplayWidths] = useState<[number, number, number]>([
    33.3, 33.3, 33.4,
  ]);
  const [mekkoMode, setMekkoMode] = useState<'equal' | 'population' | 'news_bias'>('equal');
  const [mekkoHoverIdx, setMekkoHoverIdx] = useState<number>(1);

  // ==========================================================================
  // STAGE 07 STATE (GIS): TWD97 Spatial Choropleth & SNG Pin Overlay
  // ==========================================================================
  const [gisMetricMode, setGisMetricMode] = useState<'raw' | 'per10k' | 'roadDensity'>('raw');
  const [showSngPins, setShowSngPins] = useState<boolean>(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('gz_ntp');
  const [gisTerminalLog, setGisTerminalLog] = useState<string>(
    '19:11:04 TWD97 二度分帶網格已載入。目前顯示：絕對事故總量圖層。'
  );

  // ==========================================================================
  // STAGE 08 STATE (GIS): Micro-Scale Intersection Buffer & Road Geometry
  // ==========================================================================
  const [bufferOrigin, setBufferOrigin] = useState<{ x: number; y: number }>({ x: 195, y: 135 });
  const [bufferRadiusMeters, setBufferRadiusMeters] = useState<125.4 | 285.0 | 540.8>(125.4);
  const [layerLeftTurnOffset, setLayerLeftTurnOffset] = useState<boolean>(false);
  const [layerRefugeIsland, setLayerRefugeIsland] = useState<boolean>(false);
  const [bufferDragging, setBufferDragging] = useState<boolean>(false);
  const [gisBufferLog, setGisBufferLog] = useState<string>(
    '19:14:28 環域掃描半徑 R=125.4m 鎖定西側缺口。工程向量圖層尚未套疊。'
  );
  const svgGisBufferRef = useRef<SVGSVGElement | null>(null);

  // Trigger 30ms Hit-Stop Freeze + 80ms Screen Shake
  const triggerPhysicalImpact = useCallback((intensity: 'normal' | 'heavy' = 'normal') => {
    setIsHitStop(true);
    window.setTimeout(() => {
      setIsHitStop(false);
      if (!shellRef.current) return;
      const amp = intensity === 'heavy' ? 9 : 4.5;
      gsap.fromTo(
        shellRef.current,
        { x: -amp, y: amp * 0.6 },
        {
          x: 0,
          y: 0,
          duration: 0.085,
          ease: 'rough({ template: none.out, strength: 2, points: 8, taper: out, randomize: true, clamp: false })',
          clearProps: 'transform',
        }
      );
    }, 32);
  }, []);

  // Anti-spam rapid click check (Easter egg state machine)
  const checkRapidClickJam = useCallback((): boolean => {
    const now = performance.now();
    clickTimestampsRef.current = clickTimestampsRef.current.filter(t => now - t < 950);
    clickTimestampsRef.current.push(now);

    if (clickTimestampsRef.current.length >= 6) {
      setJammedLockdown(true);
      setJamMessage('機械保護鎖死 1.4 秒：別再狂敲按鍵了，鉛字滾筒不會因此轉得比較快。');
      triggerPhysicalImpact('heavy');
      window.setTimeout(() => {
        setJammedLockdown(false);
      }, 1400);
      return true;
    }
    return false;
  }, [triggerPhysicalImpact]);

  // Animate Stage 1 numbers with GSAP ticker + scale pop + color flash
  useEffect(() => {
    const proxy = { c: displayCtr, d: displayDistortion };
    setFlashingMetric(true);
    const timer = window.setTimeout(() => setFlashingMetric(false), 260);

    gsap.to(proxy, {
      c: ctrValue,
      d: distortionValue,
      duration: 0.52,
      ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
      onUpdate: () => {
        setDisplayCtr(Math.round(proxy.c * 10) / 10);
        setDisplayDistortion(Math.round(proxy.d * 10) / 10);
      },
    });

    if (shellRef.current) {
      gsap.fromTo(
        shellRef.current.querySelectorAll('.gsap-metric-pop'),
        { scale: 1.22 },
        { scale: 1, duration: 0.38, ease: 'back.out(2.6)', overwrite: 'auto' }
      );
    }
    return () => window.clearTimeout(timer);
  }, [ctrValue, distortionValue]);

  // Animate Stage 1 bars with spring tension
  useEffect(() => {
    const proxy = {
      b0: displayBars[0],
      b1: displayBars[1],
      b2: displayBars[2],
    };
    gsap.to(proxy, {
      b0: printedBars[0],
      b1: printedBars[1],
      b2: printedBars[2],
      duration: 0.58,
      ease: 'back.out(1.85)',
      onUpdate: () => {
        setDisplayBars([
          Math.round(proxy.b0 * 10) / 10,
          Math.round(proxy.b1 * 10) / 10,
          Math.round(proxy.b2 * 10) / 10,
        ]);
      },
    });
  }, [printedBars]);

  // Animate Stage 6 Mekko widths with spring physics
  useEffect(() => {
    const proxy = {
      w0: mekkoDisplayWidths[0],
      w1: mekkoDisplayWidths[1],
      w2: mekkoDisplayWidths[2],
    };
    gsap.to(proxy, {
      w0: mekkoWidths[0],
      w1: mekkoWidths[1],
      w2: mekkoWidths[2],
      duration: 0.62,
      ease: 'back.out(1.9)',
      onUpdate: () => {
        setMekkoDisplayWidths([
          Math.round(proxy.w0 * 10) / 10,
          Math.round(proxy.w1 * 10) / 10,
          Math.round(proxy.w2 * 10) / 10,
        ]);
      },
    });
  }, [mekkoWidths]);

  // Execute a Stage 1 newsroom action
  const handleExecuteDeskAction = (act: DeskActionItem) => {
    if (jammedLockdown || isHitStop) return;
    if (checkRapidClickJam()) return;

    const jitter = ((Object.keys(usedActionCounts).length * 1.7 + act.ctrDelta) % 2.3) - 1.1;
    const nextCtr = Math.max(
      4.2,
      Math.min(99.8, Number((ctrValue + act.ctrDelta + jitter).toFixed(1)))
    );
    const nextDist = Math.max(
      0.0,
      Math.min(100.0, Number((distortionValue + act.distortionDelta - jitter * 0.7).toFixed(1)))
    );

    triggerPhysicalImpact(nextDist >= 95 || nextCtr <= 8 ? 'heavy' : 'normal');

    setCtrValue(nextCtr);
    setDistortionValue(nextDist);
    setPrintedBars(prev => [
      Math.max(320.4, Math.min(4800.0, Number((prev[0] + act.barShift[0]).toFixed(1)))),
      Math.max(320.4, Math.min(4800.0, Number((prev[1] + act.barShift[1]).toFixed(1)))),
      Math.max(320.4, Math.min(4800.0, Number((prev[2] + act.barShift[2]).toFixed(1)))),
    ]);
    setUsedActionCounts(prev => ({ ...prev, [act.id]: (prev[act.id] ?? 0) + 1 }));
    setTerminalLog(act.logLine);

    if (nextDist >= 98.0 || nextCtr <= 6.0) {
      setSystemCollapsed(true);
    }
  };

  const handleRebootDesk = () => {
    triggerPhysicalImpact('heavy');
    setSystemCollapsed(false);
    setJamMessage(null);
    setCtrValue(34.2);
    setDistortionValue(18.6);
    setPrintedBars([2410.5, 1790.2, 2680.4]);
    setUsedActionCounts({});
    setTerminalLog('18:50:00 緊急重啟鉛字盤。母帶讀數歸位。');
  };

  // ==========================================================================
  // STAGE 02 HANDLERS: SVG Mechanical Drag & Commit Slam
  // ==========================================================================
  const S2_W = 680;
  const S2_H = 320;
  const S2_PAD = { top: 38, right: 42, bottom: 54, left: 74 };
  const S2_PLOT_W = S2_W - S2_PAD.left - S2_PAD.right;
  const S2_PLOT_H = S2_H - S2_PAD.top - S2_PAD.bottom;
  const S2_MAX_Y = 4800;

  const s2GetX = (idx: number) => S2_PAD.left + (S2_PLOT_W * (idx + 0.5)) / 3;
  const s2GetY = (val: number) =>
    S2_PAD.top + S2_PLOT_H * (1 - Math.max(0, Math.min(S2_MAX_Y, val)) / S2_MAX_Y);
  const s2YToVal = (svgY: number) => {
    const ratio = 1 - (svgY - S2_PAD.top) / S2_PLOT_H;
    const raw = Math.max(240, Math.min(S2_MAX_Y, ratio * S2_MAX_Y));
    return Math.round(raw * 10) / 10;
  };

  const updateStage2FromPointer = (clientX: number, clientY: number, lockIdx?: number) => {
    if (!svgStage2Ref.current) return;
    const rect = svgStage2Ref.current.getBoundingClientRect();
    const sx = ((clientX - rect.left) * S2_W) / rect.width;
    const sy = ((clientY - rect.top) * S2_H) / rect.height;

    let targetIdx = lockIdx ?? 0;
    if (lockIdx === undefined) {
      let minD = Infinity;
      COHORTS.forEach((_, idx) => {
        const d = Math.abs(s2GetX(idx) - sx);
        if (d < minD) {
          minD = d;
          targetIdx = idx;
        }
      });
    }

    if (stage2Committed) {
      setStage2ProbeIdx(targetIdx);
      return;
    }

    const nextV = s2YToVal(sy);
    setStage2Guesses(prev => {
      const next = [...prev] as [number, number, number];
      next[targetIdx] = nextV;
      return next;
    });
  };

  const handleStage2Commit = () => {
    if (jammedLockdown || isHitStop) return;
    if (checkRapidClickJam()) return;

    triggerPhysicalImpact('heavy');
    setStage2Committed(true);
    setStage2DraggingIdx(null);

    const ticker = { c0: 0, c1: 0, c2: 0 };
    gsap.to(ticker, {
      c0: COHORTS[0].officialRate,
      c1: COHORTS[1].officialRate,
      c2: COHORTS[2].officialRate,
      duration: 0.88,
      ease: 'expo.out',
      onUpdate: () => {
        setStage2AnimatedOfficial([
          Math.round(ticker.c0 * 10) / 10,
          Math.round(ticker.c1 * 10) / 10,
          Math.round(ticker.c2 * 10) / 10,
        ]);
      },
    });
  };

  // ==========================================================================
  // STAGE 03 HANDLERS: Asymmetric Lead-Type Matrix Shift
  // ==========================================================================
  const shiftLeadMatrix = (deltaElderly: number, deltaYouth: number) => {
    if (jammedLockdown || isHitStop) return;
    if (checkRapidClickJam()) return;

    triggerPhysicalImpact('normal');
    setMatrixStamped(false);
    setLeadCellsElderly(prevE => {
      const nextE = Math.max(3.4, Math.min(78.6, Number((prevE + deltaElderly).toFixed(1))));
      return nextE;
    });
    setLeadCellsYouth(prevY => {
      const nextY = Math.max(4.1, Math.min(48.2, Number((prevY + deltaYouth).toFixed(1))));
      return nextY;
    });
  };

  const handleStampLeadMatrix = () => {
    if (jammedLockdown || isHitStop) return;
    if (checkRapidClickJam()) return;
    triggerPhysicalImpact('heavy');
    setMatrixStamped(true);
  };

  // ==========================================================================
  // STAGE 04 HANDLERS: Slopegraph Cable Drag & Lock
  // ==========================================================================
  const S4_W = 640;
  const S4_H = 300;
  const S4_LEFT_X = 150;
  const S4_RIGHT_X = 490;
  const S4_TOP_Y = 38;
  const S4_BOT_Y = 252;
  const S4_PLOT_H = S4_BOT_Y - S4_TOP_Y;

  const s4PctToY = (pct: number) => S4_TOP_Y + S4_PLOT_H * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const s4WanToY = (wan: number) =>
    S4_TOP_Y + S4_PLOT_H * (1 - Math.max(0, Math.min(18.0, wan)) / 18.0);
  const s4YToWan = (svgY: number) => {
    const ratio = 1 - (svgY - S4_TOP_Y) / S4_PLOT_H;
    return Math.round(Math.max(0.8, Math.min(17.6, ratio * 18.0)) * 10) / 10;
  };

  const handleLockSlope = () => {
    if (jammedLockdown || isHitStop) return;
    if (checkRapidClickJam()) return;

    triggerPhysicalImpact('heavy');
    setSlopeLocked(true);
    setSlopeDraggingWhich(null);

    const ticker = { d: 0, u: 0 };
    gsap.to(ticker, {
      d: 5.63,
      u: 14.77,
      duration: 0.85,
      ease: 'expo.out',
      onUpdate: () => {
        setSlopeAnimDuiReal(Math.round(ticker.d * 100) / 100);
        setSlopeAnimUnlicReal(Math.round(ticker.u * 100) / 100);
      },
    });
  };

  // ==========================================================================
  // STAGE 05 HANDLERS: Shutter Window Shift & Span
  // ==========================================================================
  const handleShiftShutter = (nextStart: number, nextSpan = shutterSpan) => {
    if (jammedLockdown || isHitStop) return;
    if (checkRapidClickJam()) return;

    triggerPhysicalImpact('normal');
    const clampedSpan = Math.max(3, Math.min(12, nextSpan));
    const clampedStart = Math.max(0, Math.min(HOURLY_WAVE.length - clampedSpan, nextStart));
    setShutterSpan(clampedSpan);
    setShutterStartIdx(clampedStart);
    const hStart = HOURLY_WAVE[clampedStart].hour;
    const hEnd = HOURLY_WAVE[clampedStart + clampedSpan - 1].hour;
    setShutterLog(
      `19:04:22 快門框切取 ${hStart}–${hEnd}（共 ${clampedSpan * 2} 小時）。局部斜率重算完成。`
    );
  };

  // ==========================================================================
  // STAGE 06 HANDLERS: Mekko Counterweight Presets
  // ==========================================================================
  const handleApplyMekkoPreset = (mode: 'equal' | 'population' | 'news_bias') => {
    if (jammedLockdown || isHitStop) return;
    if (checkRapidClickJam()) return;

    triggerPhysicalImpact('heavy');
    setMekkoMode(mode);
    if (mode === 'equal') {
      setMekkoWidths([33.3, 33.3, 33.4]);
    } else if (mode === 'population') {
      setMekkoWidths([8.4, 68.1, 23.5]);
    } else {
      setMekkoWidths([18.7, 14.2, 67.1]);
    }
  };

  // ==========================================================================
  // STAGE 07 HANDLERS (GIS): Spatial Normalization & SNG Layer
  // ==========================================================================
  const handleSwitchGisMetric = (mode: 'raw' | 'per10k' | 'roadDensity') => {
    if (jammedLockdown || isHitStop) return;
    if (checkRapidClickJam()) return;

    triggerPhysicalImpact('heavy');
    setGisMetricMode(mode);
    if (mode === 'raw') {
      setGisTerminalLog('19:12:08 切換分母：絕對件數。都會高人口網格呈現極端膨脹。');
    } else if (mode === 'per10k') {
      setGisTerminalLog('19:12:34 切換分母：每萬戶籍人口。非都會路網風險浮出水面。');
    } else {
      setGisTerminalLog('19:12:59 切換分母：每百公里省道密度。長距離省道走廊熱區鎖定。');
    }
  };

  const handleSelectGisZone = (zone: GisZoneSpec) => {
    if (jammedLockdown || isHitStop) return;
    if (checkRapidClickJam()) return;

    triggerPhysicalImpact('normal');
    setSelectedZoneId(zone.id);
    setGisTerminalLog(
      `19:13:20 IDENTIFY [${zone.code}] E:${zone.twdX.toFixed(1)} N:${zone.twdY.toFixed(1)}`
    );
  };

  // ==========================================================================
  // STAGE 08 HANDLERS (GIS): Buffer Origin & Infrastructure Overlay
  // ==========================================================================
  const updateBufferOriginFromPointer = (clientX: number, clientY: number) => {
    if (!svgGisBufferRef.current) return;
    const rect = svgGisBufferRef.current.getBoundingClientRect();
    const sx = Math.max(54, Math.min(516, ((clientX - rect.left) * 560) / rect.width));
    const sy = Math.max(38, Math.min(238, ((clientY - rect.top) * 270) / rect.height));
    setBufferOrigin({ x: Math.round(sx * 10) / 10, y: Math.round(sy * 10) / 10 });
  };

  // GSAP Entrance & Stage Transitions
  useGSAP(
    () => {
      if (!open || !shellRef.current) return;
      gsap.fromTo(
        shellRef.current,
        { y: 28, scale: 0.96 },
        { y: 0, scale: 1, duration: 0.42, ease: 'back.out(2.1)', clearProps: 'transform' }
      );
    },
    { dependencies: [open] }
  );

  useGSAP(
    () => {
      if (!open || !stageWrapRef.current) return;
      gsap.fromTo(
        stageWrapRef.current.children,
        { y: 14, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.36,
          stagger: 0.045,
          ease: 'expo.out',
          clearProps: 'transform,opacity',
        }
      );
    },
    { scope: stageWrapRef, dependencies: [activeStage, open] }
  );

  useGSAP(
    () => {
      if (activeStage !== 'stage3' || !stageWrapRef.current) return;
      gsap.fromTo(
        '.brutal-matrix-cell',
        { scale: 0.35, y: -6 },
        {
          scale: 1,
          y: 0,
          duration: 0.44,
          stagger: { amount: 0.38, from: matrixStamped ? 'center' : 'start' },
          ease: 'back.out(2.3)',
          overwrite: 'auto',
          clearProps: 'transform',
        }
      );
    },
    { scope: stageWrapRef, dependencies: [matrixStamped, activeStage] }
  );

  useGSAP(
    () => {
      if (activeStage !== 'stage7' || !stageWrapRef.current) return;
      gsap.fromTo(
        '.gis-zone-symbol',
        { scale: 0.45 },
        {
          scale: 1,
          duration: 0.46,
          stagger: 0.025,
          ease: 'back.out(2.2)',
          overwrite: 'auto',
          transformOrigin: 'center center',
        }
      );
    },
    { scope: stageWrapRef, dependencies: [gisMetricMode, showSngPins, activeStage] }
  );

  useGSAP(
    () => {
      if (activeStage !== 'stage8' || !stageWrapRef.current) return;
      gsap.fromTo(
        '.gis-captured-pt',
        { scale: 1.45 },
        {
          scale: 1,
          duration: 0.34,
          ease: 'back.out(2.4)',
          overwrite: 'auto',
          transformOrigin: 'center center',
        }
      );
    },
    {
      scope: stageWrapRef,
      dependencies: [bufferRadiusMeters, layerLeftTurnOffset, layerRefugeIsland, activeStage],
    }
  );

  if (!open) return null;

  // Information Asymmetry: Compute visual degradation from hidden distortion level
  const isHighStress = distortionValue >= 62.0;
  const isCriticalStress = distortionValue >= 82.0;
  const bgMain = isCriticalStress ? '#18181B' : '#F4F1EA';
  const fgMain = isCriticalStress ? '#F4F1EA' : '#18181B';
  const borderCol = isCriticalStress ? '#F4F1EA' : '#000000';

  const elderCellCount = Math.round(leadCellsElderly);
  const youthCellCount = Math.min(100 - elderCellCount, Math.round(leadCellsYouth));

  // Sliced window for STAGE 05
  const shutterSlice = HOURLY_WAVE.slice(shutterStartIdx, shutterStartIdx + shutterSpan);
  const sliceMin = Math.min(...shutterSlice.map(d => d.val));
  const sliceMax = Math.max(...shutterSlice.map(d => d.val));

  return (
    <div
      className="fixed inset-0 z-[98] flex items-center justify-center p-2 sm:p-4"
      style={{
        backgroundColor: 'rgba(24, 24, 27, 0.92)',
        filter: isHitStop ? 'contrast(1.45) invert(0.08)' : undefined,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="DESK-09 獨立測試島實驗終端"
      onClick={onClose}
    >
      <style>{`
        .brutal-btn {
          border: 2px solid #000000;
          border-radius: 0px;
          box-shadow: 4px 4px 0px #000000;
          transition: transform 60ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 60ms cubic-bezier(0.22, 1, 0.36, 1);
          cursor: pointer;
          user-select: none;
        }
        .brutal-btn:active:not(:disabled) {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px #000000;
        }
        .brutal-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .tabular-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-variant-numeric: tabular-nums;
        }
        .tight-head {
          letter-spacing: -0.03em;
        }
        @keyframes text-tremor {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-0.8px, 0.6px); }
          50% { transform: translate(0.9px, -0.7px); }
          75% { transform: translate(-0.6px, -0.5px); }
          100% { transform: translate(0, 0); }
        }
        .stress-tremor {
          animation: text-tremor 110ms steps(2, end) infinite;
        }
      `}</style>

      <div
        ref={shellRef}
        onClick={e => e.stopPropagation()}
        className={`relative w-full max-w-5xl max-h-[93vh] overflow-y-auto p-4 sm:p-6 space-y-5 ${
          isHighStress && !systemCollapsed ? 'stress-tremor' : ''
        }`}
        style={{
          backgroundColor: bgMain,
          color: fgMain,
          border: `2px solid ${borderCol}`,
          borderRadius: '0px',
          boxShadow: '8px 8px 0px #000000',
          backgroundImage: `radial-gradient(${
            isCriticalStress ? 'rgba(255,85,0,0.16)' : 'rgba(0,0,0,0.08)'
          } 1px, transparent 0)`,
          backgroundSize: isHighStress ? '6px 6px' : '12px 12px',
        }}
      >
        {/* ===================================================================
            TOP SWISS BRUTALIST MASTHEAD
           =================================================================== */}
        <header
          className="pb-4 flex flex-wrap items-start justify-between gap-4"
          style={{ borderBottom: `2px solid ${borderCol}` }}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="tabular-mono text-xs font-black px-2 py-0.5 uppercase"
                style={{ backgroundColor: '#FF5500', color: '#000000', border: '2px solid #000' }}
              >
                TEST ISLAND // DESK-09
              </span>
              <span
                className="tabular-mono text-xs font-bold px-2 py-0.5"
                style={{ border: `2px solid ${borderCol}` }}
              >
                8 INTERACTIVE CHART &amp; GIS ARCHETYPES // ISOLATED SANDBOX
              </span>
            </div>
            <h2 className="tight-head text-2xl sm:text-3xl font-black font-serif uppercase">
              鉛字印刷與冷數據校準終端（八式圖表與 GIS 實驗台）
            </h2>
            <p className="text-xs sm:text-sm font-mono opacity-85">
              高於 62.0 Δ 時版面開始滲出雜訊；突破 98.0 Δ 或截留率跌破 6.0% 觸發停機。
            </p>
          </div>

          {/* ONLY 2 VISIBLE CORE METRICS (Information Asymmetry) */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="px-3 py-1.5"
              style={{
                backgroundColor: flashingMetric ? '#FF5500' : '#18181B',
                color: flashingMetric ? '#000000' : '#F4F1EA',
                border: '2px solid #000000',
                boxShadow: '4px 4px 0px #000000',
              }}
            >
              <div className="tabular-mono text-[10px] uppercase opacity-80">版面截留率 CTR</div>
              <div className="gsap-metric-pop tabular-mono text-lg sm:text-xl font-black">
                {displayCtr.toFixed(1)}%
              </div>
            </div>

            <div
              className="px-3 py-1.5"
              style={{
                backgroundColor: isHighStress ? '#FF5500' : '#F4F1EA',
                color: '#000000',
                border: '2px solid #000000',
                boxShadow: '4px 4px 0px #000000',
              }}
            >
              <div className="tabular-mono text-[10px] uppercase font-bold">母體失真係數 Δ</div>
              <div className="gsap-metric-pop tabular-mono text-lg sm:text-xl font-black">
                {displayDistortion.toFixed(1)}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="brutal-btn px-3.5 py-2 tabular-mono text-xs font-black uppercase"
              style={{ backgroundColor: '#F4F1EA', color: '#000000' }}
            >
              [ 切斷終端 × ]
            </button>
          </div>
        </header>

        {/* Anti-Spam / Jammed Typewriter Banner (Easter Egg State) */}
        {jamMessage && (
          <div
            className="p-2.5 tabular-mono text-xs font-black flex items-center justify-between"
            style={{
              backgroundColor: '#FF5500',
              color: '#000000',
              border: '2px solid #000000',
              boxShadow: '4px 4px 0px #000000',
            }}
          >
            <span>[ HARDWARE INTERRUPT ] {jamMessage}</span>
            <button
              type="button"
              onClick={() => setJamMessage(null)}
              className="underline font-black cursor-pointer ml-3"
            >
              清除故障碼
            </button>
          </div>
        )}

        {/* ===================================================================
            8 STAGE SELECTOR TABS (0px Radius, Brutalist Solid Blocks)
           =================================================================== */}
        <nav
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
          aria-label="測試島八式圖表與GIS實驗關卡切換"
        >
          {[
            {
              id: 'stage1' as const,
              code: 'STAGE 01 // DUAL-BAR DESK',
              title: '雙軌鉛字柱 × 編輯台扭曲',
              desc: '具體編輯動詞即時改變長條高度與失真係數',
            },
            {
              id: 'stage2' as const,
              code: 'STAGE 02 // CROSSHAIR LEVER',
              title: '十字準星盲測 × 閘門壓印',
              desc: '按住垂直游標拖曳比值，壓下閘門滾動開盤',
            },
            {
              id: 'stage3' as const,
              code: 'STAGE 03 // 10×10 MATRIX',
              title: '百格鉛字活版方陣',
              desc: '非對稱鉛塊配置 100 格母體與中心波浪壓印',
            },
            {
              id: 'stage4' as const,
              code: 'STAGE 04 // SLOPE TUG-OF-WAR',
              title: '雙軸斜率拉繩對決圖',
              desc: '拉動右軸執法滑塊，對決左軸 7.1 倍聲量剪刀差',
            },
            {
              id: 'stage5' as const,
              code: 'STAGE 05 // SAMPLING SHUTTER',
              title: '取樣快門裁切 × 截斷放大鏡',
              desc: '滑動時段取景框，實測局部截圖如何製造暴衝曲線',
            },
            {
              id: 'stage6' as const,
              code: 'STAGE 06 // MEKKO COUNTERWEIGHT',
              title: '分母配重不等寬面積圖',
              desc: '切換人口基數寬度權重，看懂率與總量的乘積面積',
            },
            {
              id: 'stage7' as const,
              code: 'STAGE 07 // GIS-CHOROPLETH',
              title: 'TWD97 空間網格分母校準',
              desc: '套疊 SNG 駐點圖層，切換人口與省道密度空間分母',
            },
            {
              id: 'stage8' as const,
              code: 'STAGE 08 // GIS-BUFFER',
              title: '路口環域掃描 × 幾何剖面',
              desc: '拖曳環域半徑 R 掃描碰撞點雲，套疊偏心左轉圖層',
            },
          ].map(tab => {
            const active = activeStage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerPhysicalImpact('normal');
                  setActiveStage(tab.id);
                }}
                className="brutal-btn p-2.5 text-left"
                style={{
                  backgroundColor: active ? '#FF5500' : '#F4F1EA',
                  color: '#000000',
                }}
              >
                <div className="tabular-mono text-[10px] font-black">{tab.code}</div>
                <div className="tight-head text-sm sm:text-base font-black mt-0.5">{tab.title}</div>
                <div className="text-[11px] font-mono opacity-80 mt-0.5 truncate">{tab.desc}</div>
              </button>
            );
          })}
        </nav>

        {/* ===================================================================
            EXTREME STATE OVERLAY: SYSTEM OVERLOAD / CRASH STATE MACHINE
           =================================================================== */}
        {systemCollapsed ? (
          <div
            className="p-6 space-y-4"
            style={{
              backgroundColor: '#18181B',
              color: '#F4F1EA',
              border: '2px solid #FF5500',
              boxShadow: '6px 6px 0px #FF5500',
            }}
          >
            <div className="tabular-mono text-xs font-black px-2 py-0.5 inline-block bg-[#FF5500] text-black">
              FATAL EXCEPTION // 鉛字排版機過載鎖死
            </div>
            <h3 className="tight-head text-2xl sm:text-3xl font-black font-serif">
              {distortionValue >= 98.0
                ? '失真係數突破 98.0 Δ：報社收到三封存證信函，印刷滾筒強制斷電。'
                : '版面截留率跌破 6.0%：廣告商撤單，晚間頭版被業務部直接抽換。'}
            </h3>
            <p className="tabular-mono text-xs sm:text-sm text-zinc-300">
              最終讀數：CTR {displayCtr.toFixed(1)}% ｜ 失真係數 {displayDistortion.toFixed(1)} Δ
            </p>
            <button
              type="button"
              onClick={handleRebootDesk}
              className="brutal-btn px-5 py-2.5 tabular-mono text-sm font-black uppercase"
              style={{ backgroundColor: '#FF5500', color: '#000000' }}
            >
              [ 扳動備用電源閘門 // REBOOT ]
            </button>
          </div>
        ) : (
          <div ref={stageWrapRef} className="space-y-5">
            {/* ===============================================================
                STAGE 01: NEWSROOM DESK CALIBRATION & DEGRADATION ENGINE
               =============================================================== */}
            {activeStage === 'stage1' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Live Brutalist Print Plate Chart */}
                <div
                  className="lg:col-span-7 p-4 space-y-3"
                  style={{
                    backgroundColor: '#F4F1EA',
                    color: '#18181B',
                    border: '2px solid #000000',
                    boxShadow: '4px 4px 0px #000000',
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b-2 border-black">
                    <span className="tabular-mono text-xs font-black uppercase">
                      FIG 01. 左軌頭版印象柱 (橘) vs. 右軌警政署實數柱 (黑)
                    </span>
                    <span className="tabular-mono text-xs font-bold bg-black text-[#F4F1EA] px-2 py-0.5">
                      UNIT: 筆 / 十萬戶籍人口
                    </span>
                  </div>

                  {/* Brutalist SVG Chart (Zero-Overlap Dual-Track Swiss Columns) */}
                  <div className="relative">
                    <svg viewBox="0 0 580 285" className="w-full h-auto select-none">
                      {[0, 1200, 2400, 3600, 4800].map(val => {
                        const y = 38 + 186 * (1 - val / 4800);
                        return (
                          <g key={val}>
                            <text
                              x={8}
                              y={y + 4}
                              textAnchor="start"
                              className="tabular-mono text-[11px] font-black fill-black"
                            >
                              {val.toFixed(0)}
                            </text>
                            <line
                              x1={52}
                              y1={y}
                              x2={564}
                              y2={y}
                              stroke="#000000"
                              strokeWidth={val === 0 ? 2 : 1}
                              strokeDasharray={val === 0 ? undefined : '2 4'}
                            />
                          </g>
                        );
                      })}

                      {COHORTS.map((c, idx) => {
                        const cx = 148 + idx * 162;
                        const laneOffset = 25;
                        const colW = 44;

                        const printedVal = displayBars[idx];
                        const barY = 38 + 186 * (1 - Math.min(4800, printedVal) / 4800);
                        const barH = 224 - barY;

                        const offY = 38 + 186 * (1 - c.officialRate / 4800);
                        const offH = 224 - offY;

                        const leftX = cx - laneOffset;
                        const rightX = cx + laneOffset;

                        return (
                          <g key={c.id}>
                            <rect
                              x={leftX - colW / 2}
                              y={barY}
                              width={colW}
                              height={Math.max(4, barH)}
                              fill="#FF5500"
                              stroke="#000000"
                              strokeWidth={2}
                            />
                            <rect
                              x={leftX - 24}
                              y={Math.max(4, barY - 30)}
                              width={48}
                              height={26}
                              fill="#F4F1EA"
                              stroke="#000000"
                              strokeWidth={1.5}
                            />
                            <text
                              x={leftX}
                              y={Math.max(14, barY - 19)}
                              textAnchor="middle"
                              className="tabular-mono text-[8.5px] font-black fill-black"
                            >
                              版面
                            </text>
                            <text
                              x={leftX}
                              y={Math.max(25, barY - 8)}
                              textAnchor="middle"
                              className="tabular-mono text-[10px] font-black fill-[#FF5500]"
                            >
                              {printedVal.toFixed(1)}
                            </text>

                            <rect
                              x={rightX - colW / 2}
                              y={offY}
                              width={colW}
                              height={Math.max(4, offH)}
                              fill="#18181B"
                              stroke="#000000"
                              strokeWidth={2}
                            />

                            {isHighStress && idx !== 2 && (
                              <rect
                                x={rightX - colW / 2 - 3}
                                y={offY + offH * 0.35}
                                width={colW + 6}
                                height={14}
                                fill="#FF5500"
                                stroke="#000000"
                                strokeWidth={1.5}
                              />
                            )}

                            <rect
                              x={rightX - 24}
                              y={Math.max(4, offY - 30)}
                              width={48}
                              height={26}
                              fill="#000000"
                            />
                            <text
                              x={rightX}
                              y={Math.max(14, offY - 19)}
                              textAnchor="middle"
                              className="tabular-mono text-[8.5px] font-bold fill-[#F4F1EA]"
                            >
                              實數
                            </text>
                            <text
                              x={rightX}
                              y={Math.max(25, offY - 8)}
                              textAnchor="middle"
                              className="tabular-mono text-[10px] font-bold fill-[#FF5500]"
                            >
                              {c.officialRate.toFixed(1)}
                            </text>

                            <text
                              x={cx}
                              y={246}
                              textAnchor="middle"
                              className="tabular-mono text-[11px] font-black fill-black"
                            >
                              {c.code}
                            </text>
                            <text
                              x={cx}
                              y={264}
                              textAnchor="middle"
                              className="text-[11px] font-bold fill-black"
                            >
                              {c.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div
                    className="p-2.5 tabular-mono text-xs font-bold flex items-center justify-between"
                    style={{ backgroundColor: '#18181B', color: '#F4F1EA', border: '2px solid #000' }}
                  >
                    <span>&gt; {terminalLog}</span>
                    <button
                      type="button"
                      onClick={handleRebootDesk}
                      className="underline text-[#FF5500] cursor-pointer ml-2 shrink-0"
                    >
                      重置鉛字
                    </button>
                  </div>
                </div>

                {/* Right Column: Concrete Action Verbs */}
                <div className="lg:col-span-5 space-y-2.5">
                  <div
                    className="p-2.5 tabular-mono text-xs font-black uppercase"
                    style={{ backgroundColor: '#18181B', color: '#F4F1EA', border: '2px solid #000' }}
                  >
                    晚間截稿前操作指令（每項皆改變版面比例與失真度）
                  </div>

                  {DESK_ACTIONS.map(act => {
                    const count = usedActionCounts[act.id] ?? 0;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        disabled={jammedLockdown}
                        onClick={() => handleExecuteDeskAction(act)}
                        className="brutal-btn w-full p-3 text-left block"
                        style={{ backgroundColor: '#F4F1EA', color: '#18181B' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="tabular-mono text-[11px] font-black px-1.5 py-0.2 bg-black text-[#F4F1EA]">
                            {act.code}
                          </span>
                          <span className="tabular-mono text-[11px] font-bold">
                            已執行 {count} 次
                          </span>
                        </div>
                        <div className="tight-head text-sm sm:text-base font-black mt-1">
                          {act.verb}
                        </div>
                        <div className="tabular-mono text-[11px] opacity-75 mt-0.5">{act.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===============================================================
                STAGE 02: MECHANICAL CROSSHAIR & HIGH-TENSION SPRING REVEAL
               =============================================================== */}
            {activeStage === 'stage2' && (
              <div
                className="p-4 sm:p-5 space-y-4"
                style={{
                  backgroundColor: '#F4F1EA',
                  color: '#18181B',
                  border: '2px solid #000000',
                  boxShadow: '4px 4px 0px #000000',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                  <div>
                    <div className="tabular-mono text-xs font-black uppercase">
                      STAGE 02 // 2025 傷亡事故第一當事者每十萬人比率盲測
                    </div>
                    <h3 className="tight-head text-xl font-black font-serif mt-0.5">
                      上下拖動橘色游標設定預測值，壓下閘門核對警政署母帶。
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {!stage2Committed ? (
                      <button
                        type="button"
                        onClick={handleStage2Commit}
                        className="brutal-btn px-4 py-2 tabular-mono text-xs sm:text-sm font-black uppercase"
                        style={{ backgroundColor: '#FF5500', color: '#000000' }}
                      >
                        [ 壓下鉛字排版閘門 // COMMIT ]
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          triggerPhysicalImpact('normal');
                          setStage2Committed(false);
                          setStage2Guesses([2140.8, 1680.4, 3890.7]);
                        }}
                        className="brutal-btn px-4 py-2 tabular-mono text-xs font-black uppercase"
                        style={{ backgroundColor: '#F4F1EA', color: '#000000' }}
                      >
                        [ 退回游標重測 // RESET ]
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="p-2.5 tabular-mono text-xs font-bold flex flex-wrap items-center justify-between gap-2"
                  style={{ backgroundColor: '#18181B', color: '#F4F1EA', border: '2px solid #000' }}
                >
                  <span>
                    游標比值：你設定的高齡組為青年組的{' '}
                    <strong className="text-[#FF5500]">
                      {(stage2Guesses[2] / Math.max(1, stage2Guesses[0])).toFixed(2)} 倍
                    </strong>
                  </span>
                  <span>
                    {stage2DraggingIdx !== null
                      ? `LOCKED: ${COHORTS[stage2DraggingIdx].code} = ${stage2Guesses[
                          stage2DraggingIdx
                        ].toFixed(1)}`
                      : stage2Committed
                        ? '移動滑鼠掃描三組誤差'
                        : '按住圖表游標上下拉動'}
                  </span>
                </div>

                <div className="border-2 border-black bg-[#F4F1EA] p-2 select-none">
                  <svg
                    ref={svgStage2Ref}
                    viewBox={`0 0 ${S2_W} ${S2_H}`}
                    className="w-full h-auto cursor-crosshair touch-none"
                    onPointerDown={e => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      const rect = e.currentTarget.getBoundingClientRect();
                      const sx = ((e.clientX - rect.left) * S2_W) / rect.width;
                      let bestIdx = 0;
                      let bestD = Infinity;
                      COHORTS.forEach((_, idx) => {
                        const d = Math.abs(s2GetX(idx) - sx);
                        if (d < bestD) {
                          bestD = d;
                          bestIdx = idx;
                        }
                      });
                      if (!stage2Committed) {
                        setStage2DraggingIdx(bestIdx);
                        updateStage2FromPointer(e.clientX, e.clientY, bestIdx);
                      } else {
                        updateStage2FromPointer(e.clientX, e.clientY);
                      }
                    }}
                    onPointerMove={e => {
                      if (!stage2Committed && stage2DraggingIdx !== null) {
                        updateStage2FromPointer(e.clientX, e.clientY, stage2DraggingIdx);
                      } else if (stage2Committed) {
                        updateStage2FromPointer(e.clientX, e.clientY);
                      }
                    }}
                    onPointerUp={e => {
                      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      }
                      setStage2DraggingIdx(null);
                    }}
                  >
                    {[0, 1200, 2400, 3600, 4800].map(tick => {
                      const y = s2GetY(tick);
                      return (
                        <g key={tick}>
                          <text
                            x={10}
                            y={y + 4}
                            textAnchor="start"
                            className="tabular-mono text-[11px] font-black fill-black"
                          >
                            {tick.toFixed(0)}
                          </text>
                          <line
                            x1={S2_PAD.left}
                            y1={y}
                            x2={S2_W - S2_PAD.right}
                            y2={y}
                            stroke="#000000"
                            strokeWidth={tick === 0 ? 2 : 1}
                            strokeDasharray={tick === 0 ? undefined : '3 3'}
                          />
                        </g>
                      );
                    })}

                    {stage2DraggingIdx !== null && !stage2Committed && (
                      <g className="pointer-events-none">
                        <line
                          x1={S2_PAD.left}
                          y1={s2GetY(stage2Guesses[stage2DraggingIdx])}
                          x2={S2_W - S2_PAD.right}
                          y2={s2GetY(stage2Guesses[stage2DraggingIdx])}
                          stroke="#FF5500"
                          strokeWidth={2}
                        />
                        <line
                          x1={s2GetX(stage2DraggingIdx)}
                          y1={S2_PAD.top}
                          x2={s2GetX(stage2DraggingIdx)}
                          y2={S2_H - S2_PAD.bottom}
                          stroke="#FF5500"
                          strokeWidth={2}
                        />
                      </g>
                    )}

                    {COHORTS.map((c, idx) => {
                      const cx = s2GetX(idx);
                      const uVal = stage2Guesses[idx];
                      const uY = s2GetY(uVal);
                      const oVal = stage2AnimatedOfficial[idx];
                      const oY = s2GetY(c.officialRate);
                      const isProbed = stage2Committed && stage2ProbeIdx === idx;

                      return (
                        <g key={c.id}>
                          {isProbed && (
                            <rect
                              x={cx - 72}
                              y={S2_PAD.top}
                              width={144}
                              height={S2_PLOT_H}
                              fill="rgba(255, 85, 0, 0.12)"
                            />
                          )}

                          {stage2Committed && (
                            <line
                              x1={cx}
                              y1={uY}
                              x2={cx}
                              y2={oY}
                              stroke="#000000"
                              strokeWidth={2.5}
                              strokeDasharray="4 3"
                            />
                          )}

                          <rect
                            x={stage2Committed ? cx - 48 : cx - 44}
                            y={uY}
                            width={stage2Committed ? 44 : 88}
                            height={Math.max(4, S2_H - S2_PAD.bottom - uY)}
                            fill="#FF5500"
                            stroke="#000000"
                            strokeWidth={2}
                          />
                          <rect
                            x={stage2Committed ? cx - 50 : cx - 46}
                            y={Math.max(4, uY - 22)}
                            width={stage2Committed ? 48 : 92}
                            height={18}
                            fill="#000000"
                          />
                          <text
                            x={stage2Committed ? cx - 26 : cx}
                            y={Math.max(16, uY - 9)}
                            textAnchor="middle"
                            className="tabular-mono text-[10px] font-bold fill-[#F4F1EA]"
                          >
                            {stage2Committed ? uVal.toFixed(1) : `預測 ${uVal.toFixed(1)}`}
                          </text>

                          {stage2Committed && (
                            <g>
                              <rect
                                x={cx + 4}
                                y={oY}
                                width={44}
                                height={Math.max(4, S2_H - S2_PAD.bottom - oY)}
                                fill="#18181B"
                                stroke="#000000"
                                strokeWidth={2}
                              />
                              <rect
                                x={cx + 2}
                                y={Math.max(4, oY - 22)}
                                width={48}
                                height={18}
                                fill="#FF5500"
                                stroke="#000000"
                                strokeWidth={1.5}
                              />
                              <text
                                x={cx + 26}
                                y={Math.max(16, oY - 9)}
                                textAnchor="middle"
                                className="tabular-mono text-[10px] font-black fill-black"
                              >
                                {oVal.toFixed(1)}
                              </text>
                            </g>
                          )}

                          <text
                            x={cx}
                            y={S2_H - S2_PAD.bottom + 20}
                            textAnchor="middle"
                            className="tabular-mono text-[12px] font-black fill-black"
                          >
                            {c.code}
                          </text>
                          <text
                            x={cx}
                            y={S2_H - S2_PAD.bottom + 36}
                            textAnchor="middle"
                            className="text-[11px] font-bold fill-black"
                          >
                            {c.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {stage2Committed && (
                  <div
                    className="p-3.5 tabular-mono text-xs flex flex-wrap items-center justify-between gap-3"
                    style={{ backgroundColor: '#18181B', color: '#F4F1EA', border: '2px solid #000' }}
                  >
                    <div>
                      <span className="text-[#FF5500] font-black">
                        [{COHORTS[stage2ProbeIdx].code} 核對紀錄]
                      </span>{' '}
                      全年登記 {COHORTS[stage2ProbeIdx].officialCount.toLocaleString()} 筆（占三組總和{' '}
                      {COHORTS[stage2ProbeIdx].officialShare.toFixed(1)}%）。
                    </div>
                    <div className="font-black text-[#FF5500]">
                      偏差值：{(stage2Guesses[stage2ProbeIdx] - COHORTS[stage2ProbeIdx].officialRate).toFixed(1)}{' '}
                      筆/十萬人
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===============================================================
                STAGE 03: 100-CELL LEAD-TYPE MATRIX & ASYMMETRIC ALLOCATION
               =============================================================== */}
            {activeStage === 'stage3' && (
              <div
                className="p-4 sm:p-5 space-y-4"
                style={{
                  backgroundColor: '#F4F1EA',
                  color: '#18181B',
                  border: '2px solid #000000',
                  boxShadow: '4px 4px 0px #000000',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                  <div>
                    <div className="tabular-mono text-xs font-black uppercase">
                      STAGE 03 // 10×10 鉛字活版母體方陣（總數 100.0 格）
                    </div>
                    <h3 className="tight-head text-xl font-black font-serif mt-0.5">
                      撥動非對稱鉛字塊配置版面，壓印核對 16.2% / 16.6% / 67.2% 結構。
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleStampLeadMatrix}
                    className="brutal-btn px-4 py-2 tabular-mono text-xs sm:text-sm font-black uppercase"
                    style={{ backgroundColor: '#FF5500', color: '#000000' }}
                  >
                    {matrixStamped ? '[ 已壓印官方母體 // STAMPED ]' : '[ 啟動活版印刷壓印 // STAMP ]'}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  <div className="lg:col-span-6">
                    <div className="grid grid-cols-10 gap-1 p-3 bg-[#18181B] border-2 border-black">
                      {Array.from({ length: 100 }).map((_, idx) => {
                        const isUserElder = idx < elderCellCount;
                        const isUserYouth =
                          idx >= elderCellCount && idx < elderCellCount + youthCellCount;

                        const isRealElder = idx < 16;
                        const isRealYouth = idx >= 16 && idx < 33;

                        let cellBg = '#F4F1EA';
                        let cellFg = '#18181B';
                        if (!matrixStamped) {
                          if (isUserElder) {
                            cellBg = '#FF5500';
                            cellFg = '#000000';
                          } else if (isUserYouth) {
                            cellBg = '#18181B';
                            cellFg = '#F4F1EA';
                          }
                        } else {
                          if (isRealElder) {
                            cellBg = '#FF5500';
                            cellFg = '#000000';
                          } else if (isRealYouth) {
                            cellBg = '#18181B';
                            cellFg = '#FF5500';
                          }
                        }

                        const overGuessed = matrixStamped && isUserElder && !isRealElder;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onMouseEnter={() => setInspectedCell(idx)}
                            onClick={() => {
                              if (!matrixStamped) {
                                triggerPhysicalImpact('normal');
                                setLeadCellsElderly(Number((idx + 1.3).toFixed(1)));
                              }
                            }}
                            className="brutal-matrix-cell aspect-square tabular-mono text-[10px] font-black flex items-center justify-center cursor-pointer"
                            style={{
                              backgroundColor: cellBg,
                              color: cellFg,
                              border: overGuessed ? '2px solid #FF5500' : '1px solid #000000',
                            }}
                          >
                            {overGuessed ? '!' : String(idx).padStart(2, '0')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-6 space-y-3">
                    <div className="p-3 border-2 border-black bg-[#F4F1EA] space-y-2">
                      <div className="tabular-mono text-xs font-black flex justify-between">
                        <span>高齡組鉛字配置 (橘塊)</span>
                        <span>
                          預測 {leadCellsElderly.toFixed(1)}% {matrixStamped ? '｜ 實數 16.2%' : ''}
                        </span>
                      </div>
                      <div className="tabular-mono text-xs font-black flex justify-between">
                        <span>青年組鉛字配置 (黑塊)</span>
                        <span>
                          預測 {leadCellsYouth.toFixed(1)}% {matrixStamped ? '｜ 實數 16.6%' : ''}
                        </span>
                      </div>
                      <div className="tabular-mono text-xs font-black flex justify-between">
                        <span>青壯年通勤底盤 (米白)</span>
                        <span>
                          預測 {Math.max(0, 100 - leadCellsElderly - leadCellsYouth).toFixed(1)}%{' '}
                          {matrixStamped ? '｜ 實數 67.2%' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => shiftLeadMatrix(7.3, -2.1)}
                        className="brutal-btn p-2.5 tabular-mono text-xs font-black text-left"
                        style={{ backgroundColor: '#F4F1EA', color: '#000000' }}
                      >
                        [ 撥入高齡鉛塊 +7.3% ]
                      </button>
                      <button
                        type="button"
                        onClick={() => shiftLeadMatrix(-8.4, 3.2)}
                        className="brutal-btn p-2.5 tabular-mono text-xs font-black text-left"
                        style={{ backgroundColor: '#F4F1EA', color: '#000000' }}
                      >
                        [ 抽走高齡鉛塊 -8.4% ]
                      </button>
                      <button
                        type="button"
                        onClick={() => shiftLeadMatrix(14.7, -4.6)}
                        className="brutal-btn p-2.5 tabular-mono text-xs font-black text-left"
                        style={{ backgroundColor: '#F4F1EA', color: '#000000' }}
                      >
                        [ 傾倒晚間頭條權重 +14.7% ]
                      </button>
                      <button
                        type="button"
                        onClick={() => shiftLeadMatrix(-11.9, 6.8)}
                        className="brutal-btn p-2.5 tabular-mono text-xs font-black text-left"
                        style={{ backgroundColor: '#F4F1EA', color: '#000000' }}
                      >
                        [ 載入普通通勤母體 -11.9% ]
                      </button>
                    </div>

                    <div
                      className="p-3 tabular-mono text-xs font-bold"
                      style={{ backgroundColor: '#18181B', color: '#F4F1EA', border: '2px solid #000' }}
                    >
                      {matrixStamped
                        ? `壓印完成：標示「!」之格位共 ${Math.max(
                            0,
                            elderCellCount - 16
                          )} 格，為多算之高齡版面。`
                        : inspectedCell !== null
                          ? `游標位置：CELL #${String(inspectedCell).padStart(
                              2,
                              '0'
                            )}（點擊格位可直接切齊鉛字邊界）`
                          : '點擊任一鉛字格或上方非對稱按鈕調整配置。'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                STAGE 04 (NEW!): DUAL-AXIS SLOPEGRAPH TUG-OF-WAR
               =============================================================== */}
            {activeStage === 'stage4' && (
              <div
                className="p-4 sm:p-5 space-y-4"
                style={{
                  backgroundColor: '#F4F1EA',
                  color: '#18181B',
                  border: '2px solid #000000',
                  boxShadow: '4px 4px 0px #000000',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                  <div>
                    <div className="tabular-mono text-xs font-black uppercase">
                      STAGE 04 // 雙軸斜率拉繩對決圖（SLOPEGRAPH TUG-OF-WAR）
                    </div>
                    <h3 className="tight-head text-xl font-black font-serif mt-0.5">
                      左軸固定為 OpView 聲量占比；上下拖動右軸滑塊預測官方取締件數（萬件）。
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {!slopeLocked ? (
                      <button
                        type="button"
                        onClick={handleLockSlope}
                        className="brutal-btn px-4 py-2 tabular-mono text-xs sm:text-sm font-black uppercase"
                        style={{ backgroundColor: '#FF5500', color: '#000000' }}
                      >
                        [ 鎖死鋼索張力 // LOCK SLOPE ]
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          triggerPhysicalImpact('normal');
                          setSlopeLocked(false);
                          setSlopeDuiGuess(15.4);
                          setSlopeUnlicGuess(3.8);
                        }}
                        className="brutal-btn px-4 py-2 tabular-mono text-xs font-black uppercase"
                        style={{ backgroundColor: '#F4F1EA', color: '#000000' }}
                      >
                        [ 釋放鋼索重測 // UNLOCK ]
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  {/* Left Interactive Slopegraph SVG */}
                  <div className="lg:col-span-8 border-2 border-black bg-[#F4F1EA] p-2 select-none">
                    <svg
                      ref={svgSlopeRef}
                      viewBox={`0 0 ${S4_W} ${S4_H}`}
                      className="w-full h-auto cursor-ns-resize touch-none"
                      onPointerDown={e => {
                        if (slopeLocked) return;
                        e.currentTarget.setPointerCapture(e.pointerId);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const sy = ((e.clientY - rect.top) * S4_H) / rect.height;
                        const dDui = Math.abs(s4WanToY(slopeDuiGuess) - sy);
                        const dUnlic = Math.abs(s4WanToY(slopeUnlicGuess) - sy);
                        const target = dDui <= dUnlic ? 'dui' : 'unlic';
                        setSlopeDraggingWhich(target);
                        const val = s4YToWan(sy);
                        if (target === 'dui') setSlopeDuiGuess(val);
                        else setSlopeUnlicGuess(val);
                      }}
                      onPointerMove={e => {
                        if (slopeLocked || !slopeDraggingWhich) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const sy = ((e.clientY - rect.top) * S4_H) / rect.height;
                        const val = s4YToWan(sy);
                        if (slopeDraggingWhich === 'dui') setSlopeDuiGuess(val);
                        else setSlopeUnlicGuess(val);
                      }}
                      onPointerUp={e => {
                        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        }
                        setSlopeDraggingWhich(null);
                      }}
                    >
                      {/* Left & Right Vertical Axis Pillars */}
                      <line
                        x1={S4_LEFT_X}
                        y1={S4_TOP_Y}
                        x2={S4_LEFT_X}
                        y2={S4_BOT_Y}
                        stroke="#000000"
                        strokeWidth={3}
                      />
                      <line
                        x1={S4_RIGHT_X}
                        y1={S4_TOP_Y}
                        x2={S4_RIGHT_X}
                        y2={S4_BOT_Y}
                        stroke="#000000"
                        strokeWidth={3}
                      />

                      <text
                        x={S4_LEFT_X}
                        y={22}
                        textAnchor="middle"
                        className="tabular-mono text-[11px] font-black fill-black"
                      >
                        左軸：OpView 聲量占比 (%)
                      </text>
                      <text
                        x={S4_RIGHT_X}
                        y={22}
                        textAnchor="middle"
                        className="tabular-mono text-[11px] font-black fill-black"
                      >
                        右軸：官方取締規模 (萬件)
                      </text>

                      {/* User Guess Slope Cables (Dashed when locked, Solid when dragging) */}
                      <line
                        x1={S4_LEFT_X}
                        y1={s4PctToY(87.6)}
                        x2={S4_RIGHT_X}
                        y2={s4WanToY(slopeDuiGuess)}
                        stroke="#FF5500"
                        strokeWidth={slopeLocked ? 2.5 : 4}
                        strokeDasharray={slopeLocked ? '6 4' : undefined}
                      />
                      <line
                        x1={S4_LEFT_X}
                        y1={s4PctToY(12.4)}
                        x2={S4_RIGHT_X}
                        y2={s4WanToY(slopeUnlicGuess)}
                        stroke="#18181B"
                        strokeWidth={slopeLocked ? 2.5 : 4}
                        strokeDasharray={slopeLocked ? '6 4' : undefined}
                      />

                      {/* Official Revealed Slope Cables (Heavy Scissor Cross) */}
                      {slopeLocked && (
                        <g>
                          <line
                            x1={S4_LEFT_X}
                            y1={s4PctToY(87.6)}
                            x2={S4_RIGHT_X}
                            y2={s4WanToY(slopeAnimDuiReal)}
                            stroke="#FF5500"
                            strokeWidth={4.5}
                          />
                          <line
                            x1={S4_LEFT_X}
                            y1={s4PctToY(12.4)}
                            x2={S4_RIGHT_X}
                            y2={s4WanToY(slopeAnimUnlicReal)}
                            stroke="#000000"
                            strokeWidth={4.5}
                          />
                        </g>
                      )}

                      {/* Left Fixed Nodes */}
                      <rect
                        x={S4_LEFT_X - 118}
                        y={s4PctToY(87.6) - 11}
                        width={112}
                        height={22}
                        fill="#FF5500"
                        stroke="#000000"
                        strokeWidth={2}
                      />
                      <text
                        x={S4_LEFT_X - 62}
                        y={s4PctToY(87.6) + 4}
                        textAnchor="middle"
                        className="tabular-mono text-[10px] font-black fill-black"
                      >
                        酒駕聲量 87.6%
                      </text>

                      <rect
                        x={S4_LEFT_X - 118}
                        y={s4PctToY(12.4) - 11}
                        width={112}
                        height={22}
                        fill="#18181B"
                        stroke="#000000"
                        strokeWidth={2}
                      />
                      <text
                        x={S4_LEFT_X - 62}
                        y={s4PctToY(12.4) + 4}
                        textAnchor="middle"
                        className="tabular-mono text-[10px] font-bold fill-[#F4F1EA]"
                      >
                        無照聲量 12.4%
                      </text>

                      {/* Right Draggable Handles */}
                      <rect
                        x={S4_RIGHT_X + 6}
                        y={s4WanToY(slopeDuiGuess) - 11}
                        width={132}
                        height={22}
                        fill="#FF5500"
                        stroke="#000000"
                        strokeWidth={2}
                      />
                      <text
                        x={S4_RIGHT_X + 72}
                        y={s4WanToY(slopeDuiGuess) + 4}
                        textAnchor="middle"
                        className="tabular-mono text-[10px] font-black fill-black"
                      >
                        預測酒駕 {slopeDuiGuess.toFixed(1)}萬
                      </text>

                      <rect
                        x={S4_RIGHT_X + 6}
                        y={s4WanToY(slopeUnlicGuess) - 11}
                        width={132}
                        height={22}
                        fill="#18181B"
                        stroke="#000000"
                        strokeWidth={2}
                      />
                      <text
                        x={S4_RIGHT_X + 72}
                        y={s4WanToY(slopeUnlicGuess) + 4}
                        textAnchor="middle"
                        className="tabular-mono text-[10px] font-bold fill-[#F4F1EA]"
                      >
                        預測無照 {slopeUnlicGuess.toFixed(1)}萬
                      </text>

                      {/* Official Revealed Right Nodes (Placed on inner side of Right Axis so zero overlap) */}
                      {slopeLocked && (
                        <g>
                          <rect
                            x={S4_RIGHT_X - 126}
                            y={s4WanToY(slopeAnimDuiReal) - 11}
                            width={120}
                            height={22}
                            fill="#000000"
                          />
                          <text
                            x={S4_RIGHT_X - 66}
                            y={s4WanToY(slopeAnimDuiReal) + 4}
                            textAnchor="middle"
                            className="tabular-mono text-[10px] font-black fill-[#FF5500]"
                          >
                            警政署 5.63萬
                          </text>

                          <rect
                            x={S4_RIGHT_X - 126}
                            y={s4WanToY(slopeAnimUnlicReal) - 11}
                            width={120}
                            height={22}
                            fill="#FF5500"
                            stroke="#000000"
                            strokeWidth={1.5}
                          />
                          <text
                            x={S4_RIGHT_X - 66}
                            y={s4WanToY(slopeAnimUnlicReal) + 4}
                            textAnchor="middle"
                            className="tabular-mono text-[10px] font-black fill-black"
                          >
                            公路局 14.77萬
                          </text>
                        </g>
                      )}
                    </svg>
                  </div>

                  {/* Right Mechanical Controls & Readout */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="p-3 border-2 border-black bg-[#18181B] text-[#F4F1EA] space-y-1.5 tabular-mono text-xs">
                      <div className="text-[#FF5500] font-black">SLOPE DIAGNOSTIC // 斜率診斷</div>
                      <div>
                        你設定的右軸差值：{(slopeDuiGuess - slopeUnlicGuess).toFixed(1)} 萬件
                      </div>
                      <div>
                        {slopeLocked
                          ? '實況呈現 X 型剪刀反轉：聲量占 12.4% 的無照，四欄取締達 14.77 萬件。'
                          : '直接在左方圖表上下拖曳右軸滑塊，或點擊下方機械微調。'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerPhysicalImpact('normal');
                          setSlopeLocked(false);
                          setSlopeDuiGuess(v => Math.min(17.4, Number((v + 2.3).toFixed(1))));
                          setSlopeUnlicGuess(v => Math.max(1.2, Number((v - 1.7).toFixed(1))));
                        }}
                        className="brutal-btn w-full p-2.5 tabular-mono text-xs font-black text-left"
                        style={{ backgroundColor: '#F4F1EA', color: '#000000' }}
                      >
                        [ 順應新聞聲量拉高酒駕滑塊 +2.3萬 ]
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerPhysicalImpact('normal');
                          setSlopeLocked(false);
                          setSlopeUnlicGuess(v => Math.min(17.4, Number((v + 3.4).toFixed(1))));
                          setSlopeDuiGuess(v => Math.max(1.2, Number((v - 2.1).toFixed(1))));
                        }}
                        className="brutal-btn w-full p-2.5 tabular-mono text-xs font-black text-left"
                        style={{ backgroundColor: '#F4F1EA', color: '#000000' }}
                      >
                        [ 載入道交21條機車男母體 +3.4萬 ]
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                STAGE 05 (NEW!): SAMPLING SHUTTER & Y-AXIS TRUNCATION MAGNIFIER
               =============================================================== */}
            {activeStage === 'stage5' && (
              <div
                className="p-4 sm:p-5 space-y-4"
                style={{
                  backgroundColor: '#F4F1EA',
                  color: '#18181B',
                  border: '2px solid #000000',
                  boxShadow: '4px 4px 0px #000000',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                  <div>
                    <div className="tabular-mono text-xs font-black uppercase">
                      STAGE 05 // 取樣快門裁切框（SAMPLING SHUTTER &amp; AXIS TRUNCATION）
                    </div>
                    <h3 className="tight-head text-xl font-black font-serif mt-0.5">
                      滑動橘色取景框切取局部時段，觀察右側「截圖放大鏡」如何製造暴衝斜率。
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleShiftShutter(shutterStartIdx, 3)}
                      className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                      style={{
                        backgroundColor: shutterSpan === 3 ? '#FF5500' : '#F4F1EA',
                        color: '#000000',
                      }}
                    >
                      [ 窄角快門 4h ]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftShutter(shutterStartIdx, 6)}
                      className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                      style={{
                        backgroundColor: shutterSpan === 6 ? '#FF5500' : '#F4F1EA',
                        color: '#000000',
                      }}
                    >
                      [ 半日快門 10h ]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftShutter(0, 12)}
                      className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                      style={{
                        backgroundColor: shutterSpan === 12 ? '#FF5500' : '#F4F1EA',
                        color: '#000000',
                      }}
                    >
                      [ 全日母體 24h ]
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerPhysicalImpact('normal');
                        setTruncateYAxis(v => !v);
                      }}
                      className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                      style={{
                        backgroundColor: truncateYAxis ? '#18181B' : '#F4F1EA',
                        color: truncateYAxis ? '#FF5500' : '#000000',
                      }}
                    >
                      {truncateYAxis ? '[ Y軸截斷放大：ON ]' : '[ Y軸完整0起算：OFF ]'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                  {/* Left: Full 24-Hour Master Curve with Draggable Orange Shutter Window */}
                  <div className="lg:col-span-7 border-2 border-black bg-[#F4F1EA] p-3 space-y-2">
                    <div className="tabular-mono text-xs font-black flex justify-between">
                      <span>MASTER TAPE // 24 小時全線壅塞指數母帶</span>
                      <span>點擊下方任意時段移動取景框</span>
                    </div>

                    <svg viewBox="0 0 520 210" className="w-full h-auto select-none">
                      {[0, 50, 100].map(v => {
                        const y = 24 + 145 * (1 - v / 100);
                        return (
                          <g key={v}>
                            <text
                              x={6}
                              y={y + 4}
                              className="tabular-mono text-[10px] font-black fill-black"
                            >
                              {v}
                            </text>
                            <line
                              x1={34}
                              y1={y}
                              x2={504}
                              y2={y}
                              stroke="#000000"
                              strokeWidth={v === 0 ? 2 : 1}
                              strokeDasharray={v === 0 ? undefined : '2 3'}
                            />
                          </g>
                        );
                      })}

                      {/* Shutter Crop Highlight Window */}
                      {(() => {
                        const stepX = (504 - 44) / (HOURLY_WAVE.length - 1);
                        const x1 = 44 + shutterStartIdx * stepX - 10;
                        const x2 = 44 + (shutterStartIdx + shutterSpan - 1) * stepX + 10;
                        return (
                          <rect
                            x={x1}
                            y={14}
                            width={Math.max(24, x2 - x1)}
                            height={160}
                            fill="rgba(255, 85, 0, 0.22)"
                            stroke="#FF5500"
                            strokeWidth={2.5}
                          />
                        );
                      })()}

                      {/* Master Polyline */}
                      <polyline
                        points={HOURLY_WAVE.map((d, i) => {
                          const x = 44 + (i * (504 - 44)) / (HOURLY_WAVE.length - 1);
                          const y = 24 + 145 * (1 - d.val / 100);
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#000000"
                        strokeWidth={3}
                      />

                      {/* Clickable Hour Nodes */}
                      {HOURLY_WAVE.map((d, i) => {
                        const x = 44 + (i * (504 - 44)) / (HOURLY_WAVE.length - 1);
                        const y = 24 + 145 * (1 - d.val / 100);
                        const inShutter = i >= shutterStartIdx && i < shutterStartIdx + shutterSpan;
                        return (
                          <g
                            key={d.hour}
                            className="cursor-pointer"
                            onClick={() => handleShiftShutter(i, shutterSpan)}
                          >
                            <rect
                              x={x - 5}
                              y={y - 5}
                              width={10}
                              height={10}
                              fill={inShutter ? '#FF5500' : '#18181B'}
                              stroke="#000000"
                              strokeWidth={1.5}
                            />
                            {i % 2 === 0 && (
                              <text
                                x={x}
                                y={192}
                                textAnchor="middle"
                                className="tabular-mono text-[9.5px] font-bold fill-black"
                              >
                                {d.hour}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Right: Cropped & Magnified TV Broadcast Chart */}
                  <div className="lg:col-span-5 border-2 border-black bg-[#18181B] text-[#F4F1EA] p-3 space-y-2">
                    <div className="tabular-mono text-xs font-black flex justify-between text-[#FF5500]">
                      <span>CROPPED FEED // 截圖播出畫面</span>
                      <span>
                        落差 +{Math.round(sliceMax - sliceMin).toFixed(1)} 點
                      </span>
                    </div>

                    <svg viewBox="0 0 360 190" className="w-full h-auto select-none">
                      {shutterSlice.map((d, idx) => {
                        const x =
                          38 +
                          (idx * (330 - 38)) / Math.max(1, shutterSlice.length - 1);
                        const norm = truncateYAxis
                          ? (d.val - sliceMin) / Math.max(1, sliceMax - sliceMin)
                          : d.val / 100;
                        const y = 28 + 124 * (1 - norm);
                        return (
                          <g key={d.hour}>
                            <rect
                              x={x - 14}
                              y={y}
                              width={28}
                              height={Math.max(4, 152 - y)}
                              fill="#FF5500"
                              stroke="#000000"
                              strokeWidth={1.5}
                            />
                            <text
                              x={x}
                              y={Math.max(16, y - 6)}
                              textAnchor="middle"
                              className="tabular-mono text-[10px] font-black fill-[#F4F1EA]"
                            >
                              {d.val.toFixed(1)}
                            </text>
                            <text
                              x={x}
                              y={172}
                              textAnchor="middle"
                              className="tabular-mono text-[10px] font-bold fill-[#FF5500]"
                            >
                              {d.hour}
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    <div className="tabular-mono text-[11px] text-zinc-300 border-t border-zinc-700 pt-2">
                      &gt; {shutterLog}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                STAGE 06 (NEW!): DENOMINATOR COUNTERWEIGHT MEKKO AREA CHART
               =============================================================== */}
            {activeStage === 'stage6' && (
              <div
                className="p-4 sm:p-5 space-y-4"
                style={{
                  backgroundColor: '#F4F1EA',
                  color: '#18181B',
                  border: '2px solid #000000',
                  boxShadow: '4px 4px 0px #000000',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                  <div>
                    <div className="tabular-mono text-xs font-black uppercase">
                      STAGE 06 // 分母配重不等寬面積圖（MARIMEKKO AREA CHART）
                    </div>
                    <h3 className="tight-head text-xl font-black font-serif mt-0.5">
                      高度＝每十萬人事故率，寬度＝人口母體權重，矩形總面積＝真實事故總件數。
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyMekkoPreset('equal')}
                      className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                      style={{
                        backgroundColor: mekkoMode === 'equal' ? '#FF5500' : '#F4F1EA',
                        color: '#000000',
                      }}
                    >
                      [ 等寬長條 (隱藏人口基數) ]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyMekkoPreset('population')}
                      className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                      style={{
                        backgroundColor: mekkoMode === 'population' ? '#FF5500' : '#F4F1EA',
                        color: '#000000',
                      }}
                    >
                      [ 注入真實戶籍人口寬度 ]
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyMekkoPreset('news_bias')}
                      className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                      style={{
                        backgroundColor: mekkoMode === 'news_bias' ? '#FF5500' : '#F4F1EA',
                        color: '#000000',
                      }}
                    >
                      [ 套用晚間新聞版面寬度 ]
                    </button>
                  </div>
                </div>

                {/* Interactive Mekko SVG */}
                <div className="border-2 border-black bg-[#F4F1EA] p-3">
                  <svg viewBox="0 0 640 270" className="w-full h-auto select-none">
                    {(() => {
                      const plotLeft = 48;
                      const plotW = 572;
                      const plotBottom = 220;
                      const maxH = 176;
                      let accW = 0;

                      return COHORTS.map((c, idx) => {
                        const wPct = mekkoDisplayWidths[idx];
                        const boxW = (plotW * wPct) / 100;
                        const boxX = plotLeft + accW;
                        accW += boxW;

                        const boxH = maxH * (c.officialRate / 4500);
                        const boxY = plotBottom - boxH;
                        const isHov = mekkoHoverIdx === idx;

                        const fills = ['#FF5500', '#18181B', '#F4F1EA'];
                        const textCols = ['#000000', '#F4F1EA', '#000000'];

                        return (
                          <g
                            key={c.id}
                            className="cursor-pointer"
                            onMouseEnter={() => setMekkoHoverIdx(idx)}
                          >
                            <rect
                              x={boxX}
                              y={boxY}
                              width={Math.max(12, boxW - 3)}
                              height={boxH}
                              fill={fills[idx]}
                              stroke="#000000"
                              strokeWidth={isHov ? 3.5 : 2}
                            />

                            {/* Width Percentage Readout at Bottom */}
                            <text
                              x={boxX + boxW / 2}
                              y={plotBottom + 18}
                              textAnchor="middle"
                              className="tabular-mono text-[10px] font-black fill-black"
                            >
                              {c.code} (寬 {wPct.toFixed(1)}%)
                            </text>
                            <text
                              x={boxX + boxW / 2}
                              y={plotBottom + 34}
                              textAnchor="middle"
                              className="tabular-mono text-[10px] font-bold fill-black"
                            >
                              高 {c.officialRate.toFixed(1)}
                            </text>

                            {/* Area Label inside block if wide enough */}
                            {boxW > 75 && (
                              <text
                                x={boxX + boxW / 2}
                                y={boxY + boxH / 2 + 4}
                                textAnchor="middle"
                                className="tabular-mono text-[11px] font-black"
                                fill={textCols[idx]}
                              >
                                {c.officialCount.toLocaleString()} 筆
                              </text>
                            )}
                          </g>
                        );
                      });
                    })()}
                  </svg>
                </div>

                <div
                  className="p-3 tabular-mono text-xs font-bold flex flex-wrap items-center justify-between gap-2"
                  style={{ backgroundColor: '#18181B', color: '#F4F1EA', border: '2px solid #000' }}
                >
                  <span>
                    LOCKED BLOCK // {COHORTS[mekkoHoverIdx].label}：每十萬人{' '}
                    {COHORTS[mekkoHoverIdx].officialRate.toFixed(1)} 筆 × 人口權重{' '}
                    {COHORTS[mekkoHoverIdx].popWeightPct.toFixed(1)}%
                  </span>
                  <span className="text-[#FF5500] font-black">
                    乘積總面積 ＝ {COHORTS[mekkoHoverIdx].officialCount.toLocaleString()} 筆（占全體{' '}
                    {COHORTS[mekkoHoverIdx].officialShare.toFixed(1)}%）
                  </span>
                </div>
              </div>
            )}

            {/* ===============================================================
                STAGE 07 (GIS): TWD97 SPATIAL CHOROPLETH & SNG PIN OVERLAY
               =============================================================== */}
            {activeStage === 'stage7' &&
              (() => {
                const selectedZone =
                  GIS_ZONES.find(z => z.id === selectedZoneId) ?? GIS_ZONES[1];
                return (
                  <div
                    className="p-4 sm:p-5 space-y-4"
                    style={{
                      backgroundColor: '#F4F1EA',
                      color: '#18181B',
                      border: '2px solid #000000',
                      boxShadow: '4px 4px 0px #000000',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                      <div>
                        <div className="tabular-mono text-xs font-black uppercase">
                          STAGE 07 // TWD97 二度分帶空間網格分母校準儀（GIS CHOROPLETH &amp; SNG OVERLAY）
                        </div>
                        <h3 className="tight-head text-xl font-black font-serif mt-0.5">
                          切換「絕對件數 / 每萬人比率 / 省道密度」空間分母，比對 SNG 轉播車駐點熱區。
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSwitchGisMetric('raw')}
                          className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                          style={{
                            backgroundColor: gisMetricMode === 'raw' ? '#FF5500' : '#F4F1EA',
                            color: '#000000',
                          }}
                        >
                          [ 絕對事故總量 ]
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchGisMetric('per10k')}
                          className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                          style={{
                            backgroundColor: gisMetricMode === 'per10k' ? '#FF5500' : '#F4F1EA',
                            color: '#000000',
                          }}
                        >
                          [ 每萬人比率 ]
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchGisMetric('roadDensity')}
                          className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                          style={{
                            backgroundColor:
                              gisMetricMode === 'roadDensity' ? '#FF5500' : '#F4F1EA',
                            color: '#000000',
                          }}
                        >
                          [ 每百公里省道密度 ]
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerPhysicalImpact('normal');
                            setShowSngPins(v => !v);
                          }}
                          className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                          style={{
                            backgroundColor: showSngPins ? '#18181B' : '#F4F1EA',
                            color: showSngPins ? '#FF5500' : '#000000',
                          }}
                        >
                          {showSngPins ? '[ SNG 駐點圖層：ON ]' : '[ SNG 駐點圖層：OFF ]'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Left: Swiss Cartographic TWD97 Grid Map */}
                      <div className="lg:col-span-7 border-2 border-black bg-[#F4F1EA] p-3 space-y-2">
                        <div className="flex items-center justify-between tabular-mono text-[11px] font-black border-b border-black pb-1.5">
                          <span>CRS: EPSG:3826 (TWD97 / TM2 ZONE 121)</span>
                          <span>CLICK CELL TO IDENTIFY</span>
                        </div>

                        <svg viewBox="0 0 540 320" className="w-full h-auto select-none">
                          {/* Coordinate Graticule Lines */}
                          {[0, 1, 2, 3].map(c => {
                            const gx = 92 + c * 114;
                            const lon = (120.2 + c * 0.6).toFixed(1);
                            return (
                              <g key={`lon-${c}`}>
                                <line
                                  x1={gx}
                                  y1={24}
                                  x2={gx}
                                  y2={292}
                                  stroke="#000000"
                                  strokeWidth={1}
                                  strokeDasharray="2 4"
                                />
                                <text
                                  x={gx}
                                  y={16}
                                  textAnchor="middle"
                                  className="tabular-mono text-[9.5px] font-bold fill-black"
                                >
                                  {lon}°E
                                </text>
                              </g>
                            );
                          })}
                          {[0, 1, 2, 3, 4].map(r => {
                            const gy = 48 + r * 54;
                            const lat = (25.1 - r * 0.7).toFixed(1);
                            return (
                              <g key={`lat-${r}`}>
                                <line
                                  x1={48}
                                  y1={gy}
                                  x2={488}
                                  y2={gy}
                                  stroke="#000000"
                                  strokeWidth={1}
                                  strokeDasharray="2 4"
                                />
                                <text
                                  x={8}
                                  y={gy + 4}
                                  textAnchor="start"
                                  className="tabular-mono text-[9.5px] font-bold fill-black"
                                >
                                  {lat}°N
                                </text>
                              </g>
                            );
                          })}

                          {/* North Arrow & Scale Bar in Top-Left / Bottom-Right */}
                          <g transform="translate(476, 44)">
                            <rect
                              x={-22}
                              y={-16}
                              width={44}
                              height={54}
                              fill="#F4F1EA"
                              stroke="#000000"
                              strokeWidth={2}
                            />
                            <polygon points="0,-10 -8,12 0,6 8,12" fill="#000000" />
                            <text
                              x={0}
                              y={28}
                              textAnchor="middle"
                              className="tabular-mono text-[10px] font-black fill-black"
                            >
                              N
                            </text>
                          </g>

                          <g transform="translate(360, 286)">
                            <line x1={0} y1={0} x2={96} y2={0} stroke="#000000" strokeWidth={3} />
                            <line x1={0} y1={-5} x2={0} y2={5} stroke="#000000" strokeWidth={2} />
                            <line x1={48} y1={-4} x2={48} y2={4} stroke="#000000" strokeWidth={2} />
                            <line x1={96} y1={-5} x2={96} y2={5} stroke="#000000" strokeWidth={2} />
                            <text
                              x={48}
                              y={14}
                              textAnchor="middle"
                              className="tabular-mono text-[9px] font-black fill-black"
                            >
                              SCALE: 50 KM
                            </text>
                          </g>

                          {/* TWD97 Spatial Mesh Cells */}
                          {GIS_ZONES.map(zone => {
                            const cx = 114 + zone.col * 108;
                            const cy = 48 + zone.row * 54;
                            const cellW = 102;
                            const cellH = 48;
                            const isSel = zone.id === selectedZone.id;

                            // Compute normalized ratio (0..1) by current GIS denominator mode
                            const rawVal =
                              gisMetricMode === 'raw'
                                ? zone.rawCases
                                : gisMetricMode === 'per10k'
                                  ? zone.ratePer10k
                                  : zone.roadDensity;
                            const norm =
                              gisMetricMode === 'raw'
                                ? zone.rawCases / 75000
                                : gisMetricMode === 'per10k'
                                  ? (zone.ratePer10k - 150) / 150
                                  : (zone.roadDensity - 350) / 560;
                            const clampedNorm = Math.max(0.18, Math.min(1, norm));
                            const isHotspot = clampedNorm >= 0.72;

                            const cellFill = isHotspot
                              ? '#FF5500'
                              : clampedNorm >= 0.48
                                ? '#18181B'
                                : '#F4F1EA';
                            const cellText =
                              cellFill === '#18181B' ? '#F4F1EA' : '#000000';

                            return (
                              <g
                                key={zone.id}
                                className="cursor-pointer"
                                onClick={() => handleSelectGisZone(zone)}
                              >
                                {/* Base Choropleth Grid Tile */}
                                <rect
                                  x={cx - cellW / 2}
                                  y={cy - cellH / 2}
                                  width={cellW}
                                  height={cellH}
                                  fill={cellFill}
                                  stroke="#000000"
                                  strokeWidth={isSel ? 3.5 : 2}
                                />

                                {/* Selection Corner Brackets */}
                                {isSel && (
                                  <rect
                                    x={cx - cellW / 2 - 3}
                                    y={cy - cellH / 2 - 3}
                                    width={cellW + 6}
                                    height={cellH + 6}
                                    fill="none"
                                    stroke="#FF5500"
                                    strokeWidth={2}
                                  />
                                )}

                                {/* Proportional GIS Square Indicator on Left of Cell */}
                                <rect
                                  className="gis-zone-symbol"
                                  x={cx - cellW / 2 + 6}
                                  y={cy - (10 + clampedNorm * 14) / 2}
                                  width={10 + clampedNorm * 14}
                                  height={10 + clampedNorm * 14}
                                  fill={cellFill === '#FF5500' ? '#000000' : '#FF5500'}
                                  stroke="#000000"
                                  strokeWidth={1.5}
                                />

                                {/* Zone Code & Value Readout */}
                                <text
                                  x={cx + 8}
                                  y={cy - 4}
                                  textAnchor="middle"
                                  className="tabular-mono text-[10px] font-black"
                                  fill={cellText}
                                >
                                  {zone.code}
                                </text>
                                <text
                                  x={cx + 8}
                                  y={cy + 11}
                                  textAnchor="middle"
                                  className="tabular-mono text-[10px] font-bold"
                                  fill={cellText}
                                >
                                  {gisMetricMode === 'raw'
                                    ? `${(rawVal / 1000).toFixed(1)}k`
                                    : rawVal.toFixed(1)}
                                </text>

                                {/* SNG Broadcast Van Target Overlay */}
                                {showSngPins && zone.sngSharePct >= 6.0 && (
                                  <g transform={`translate(${cx + cellW / 2 - 14}, ${cy - cellH / 2 + 12})`}>
                                    <rect
                                      x={-16}
                                      y={-8}
                                      width={32}
                                      height={15}
                                      fill="#000000"
                                      stroke="#FF5500"
                                      strokeWidth={1.5}
                                    />
                                    <text
                                      x={0}
                                      y={3}
                                      textAnchor="middle"
                                      className="tabular-mono text-[8.5px] font-black fill-[#FF5500]"
                                    >
                                      SNG
                                    </text>
                                  </g>
                                )}
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Right: GIS Spatial Attribute Table & SNG vs Risk Discrepancy Bar Chart */}
                      <div className="lg:col-span-5 space-y-3">
                        <div className="p-3.5 border-2 border-black bg-[#18181B] text-[#F4F1EA] space-y-2 tabular-mono text-xs">
                          <div className="flex items-center justify-between border-b border-zinc-700 pb-1.5">
                            <span className="text-[#FF5500] font-black">
                              GIS IDENTIFY // 空間屬性表
                            </span>
                            <span className="px-1.5 py-0.5 bg-[#FF5500] text-black font-black">
                              {selectedZone.code}
                            </span>
                          </div>
                          <div className="text-sm font-black text-white">{selectedZone.name}</div>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                            <div className="p-1.5 border border-zinc-700">
                              <div className="opacity-70">TWD97 東距 (E)</div>
                              <div className="font-black text-[#FF5500]">
                                {selectedZone.twdX.toFixed(1)}m
                              </div>
                            </div>
                            <div className="p-1.5 border border-zinc-700">
                              <div className="opacity-70">TWD97 北距 (N)</div>
                              <div className="font-black text-[#FF5500]">
                                {selectedZone.twdY.toFixed(1)}m
                              </div>
                            </div>
                          </div>

                          {/* Synchronized Horizontal Bar Comparison inside Attribute Table */}
                          <div className="space-y-2 pt-2 border-t border-zinc-700">
                            <div>
                              <div className="flex justify-between text-[11px] font-bold mb-1">
                                <span>SNG 轉播車駐點連線占比</span>
                                <span className="text-[#FF5500]">
                                  {selectedZone.sngSharePct.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full h-3.5 bg-zinc-800 border border-black">
                                <div
                                  className="h-full bg-[#FF5500]"
                                  style={{
                                    width: `${Math.min(100, selectedZone.sngSharePct * 2.2)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] font-bold mb-1">
                                <span>每百公里省道事故密度</span>
                                <span>{selectedZone.roadDensity.toFixed(1)} 筆/百公里</span>
                              </div>
                              <div className="w-full h-3.5 bg-zinc-800 border border-black">
                                <div
                                  className="h-full bg-[#F4F1EA]"
                                  style={{
                                    width: `${Math.min(100, (selectedZone.roadDensity / 920) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] font-bold mb-1">
                                <span>每萬戶籍人口事故率</span>
                                <span>{selectedZone.ratePer10k.toFixed(1)} 筆/萬人</span>
                              </div>
                              <div className="w-full h-3.5 bg-zinc-800 border border-black">
                                <div
                                  className="h-full bg-[#FF5500]"
                                  style={{
                                    width: `${Math.min(100, (selectedZone.ratePer10k / 300) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          className="p-2.5 tabular-mono text-xs font-bold"
                          style={{
                            backgroundColor: '#F4F1EA',
                            color: '#18181B',
                            border: '2px solid #000',
                          }}
                        >
                          &gt; {gisTerminalLog}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* ===============================================================
                STAGE 08 (GIS): MICRO-SCALE INTERSECTION BUFFER & GEOMETRY SCAN
               =============================================================== */}
            {activeStage === 'stage8' &&
              (() => {
                // Convert bufferRadiusMeters (125.4 | 285.0 | 540.8) to SVG pixel radius
                const svgRadius =
                  bufferRadiusMeters === 125.4
                    ? 46
                    : bufferRadiusMeters === 285.0
                      ? 88
                      : 158;

                // Spatial Point-in-Polygon / Buffer Filter
                const capturedPoints = GIS_COLLISION_POINTS.filter(pt => {
                  const dx = pt.x - bufferOrigin.x;
                  const dy = pt.y - bufferOrigin.y;
                  return Math.hypot(dx, dy) <= svgRadius;
                });

                const totalCaptured = Math.max(1, capturedPoints.length);
                const geomCount = capturedPoints.filter(p => p.factor === 'geometry').length;
                const sigCount = capturedPoints.filter(p => p.factor === 'signal').length;
                const ageCount = capturedPoints.filter(p => p.factor === 'age').length;

                const geomPct = (geomCount / totalCaptured) * 100;
                const sigPct = (sigCount / totalCaptured) * 100;
                const agePct = (ageCount / totalCaptured) * 100;

                return (
                  <div
                    className="p-4 sm:p-5 space-y-4"
                    style={{
                      backgroundColor: '#F4F1EA',
                      color: '#18181B',
                      border: '2px solid #000000',
                      boxShadow: '4px 4px 0px #000000',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-black">
                      <div>
                        <div className="tabular-mono text-xs font-black uppercase">
                          STAGE 08 // 路口環域半徑掃描與道路幾何剖面（GIS BUFFER &amp; SPATIAL JOIN）
                        </div>
                        <h3 className="tight-head text-xl font-black font-serif mt-0.5">
                          在向量路網拖曳橘色環域圓心或放大半徑 R，套疊工程圖層檢視真實空間叢聚。
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {([125.4, 285.0, 540.8] as const).map(rVal => (
                          <button
                            key={rVal}
                            type="button"
                            onClick={() => {
                              triggerPhysicalImpact('normal');
                              setBufferRadiusMeters(rVal);
                              setGisBufferLog(
                                `19:16:05 環域半徑切換為 R=${rVal.toFixed(1)}m。空間點雲重新篩選。`
                              );
                            }}
                            className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                            style={{
                              backgroundColor:
                                bufferRadiusMeters === rVal ? '#FF5500' : '#F4F1EA',
                              color: '#000000',
                            }}
                          >
                            [ R={rVal.toFixed(1)}m ]
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            triggerPhysicalImpact('normal');
                            setLayerLeftTurnOffset(v => !v);
                          }}
                          className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                          style={{
                            backgroundColor: layerLeftTurnOffset ? '#18181B' : '#F4F1EA',
                            color: layerLeftTurnOffset ? '#FF5500' : '#000000',
                          }}
                        >
                          {layerLeftTurnOffset ? '[ 偏心左轉缺口層：ON ]' : '[ 偏心左轉缺口層：OFF ]'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerPhysicalImpact('normal');
                            setLayerRefugeIsland(v => !v);
                          }}
                          className="brutal-btn px-3 py-1.5 tabular-mono text-xs font-black"
                          style={{
                            backgroundColor: layerRefugeIsland ? '#18181B' : '#F4F1EA',
                            color: layerRefugeIsland ? '#FF5500' : '#000000',
                          }}
                        >
                          {layerRefugeIsland ? '[ 行穿線未退縮層：ON ]' : '[ 行穿線未退縮層：OFF ]'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Left: Interactive GIS Road Network & Draggable Buffer Scanner */}
                      <div className="lg:col-span-7 border-2 border-black bg-[#F4F1EA] p-2 select-none">
                        <svg
                          ref={svgGisBufferRef}
                          viewBox="0 0 560 270"
                          className="w-full h-auto cursor-crosshair touch-none"
                          onPointerDown={e => {
                            e.currentTarget.setPointerCapture(e.pointerId);
                            setBufferDragging(true);
                            updateBufferOriginFromPointer(e.clientX, e.clientY);
                          }}
                          onPointerMove={e => {
                            if (!bufferDragging) return;
                            updateBufferOriginFromPointer(e.clientX, e.clientY);
                          }}
                          onPointerUp={e => {
                            if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                              e.currentTarget.releasePointerCapture(e.pointerId);
                            }
                            setBufferDragging(false);
                          }}
                        >
                          {/* Vector Arterial Road Network Base Layer */}
                          <rect
                            x={12}
                            y={104}
                            width={536}
                            height={62}
                            fill="#18181B"
                            stroke="#000000"
                            strokeWidth={2}
                          />
                          <rect
                            x={244}
                            y={12}
                            width={72}
                            height={246}
                            fill="#18181B"
                            stroke="#000000"
                            strokeWidth={2}
                          />

                          {/* Lane Dividers */}
                          <line
                            x1={16}
                            y1={135}
                            x2={240}
                            y2={135}
                            stroke="#F4F1EA"
                            strokeWidth={2}
                            strokeDasharray="8 6"
                          />
                          <line
                            x1={320}
                            y1={135}
                            x2={544}
                            y2={135}
                            stroke="#F4F1EA"
                            strokeWidth={2}
                            strokeDasharray="8 6"
                          />
                          <line
                            x1={280}
                            y1={16}
                            x2={280}
                            y2={100}
                            stroke="#F4F1EA"
                            strokeWidth={2}
                            strokeDasharray="8 6"
                          />
                          <line
                            x1={280}
                            y1={170}
                            x2={280}
                            y2={254}
                            stroke="#F4F1EA"
                            strokeWidth={2}
                            strokeDasharray="8 6"
                          />

                          {/* Optional Layer 1: Left-Turn Offset Deficiency Vector Polygon */}
                          {layerLeftTurnOffset && (
                            <g>
                              <rect
                                x={162}
                                y={114}
                                width={66}
                                height={42}
                                fill="rgba(255, 85, 0, 0.28)"
                                stroke="#FF5500"
                                strokeWidth={2.5}
                                strokeDasharray="4 2"
                              />
                              <text
                                x={195}
                                y={96}
                                textAnchor="middle"
                                className="tabular-mono text-[9.5px] font-black fill-black"
                              >
                                [GIS層] 左轉無偏心車道衝突帶
                              </text>
                            </g>
                          )}

                          {/* Optional Layer 2: Unshielded Crosswalk Setback Vector Polygon */}
                          {layerRefugeIsland && (
                            <g>
                              <rect
                                x={342}
                                y={110}
                                width={54}
                                height={50}
                                fill="rgba(255, 85, 0, 0.28)"
                                stroke="#FF5500"
                                strokeWidth={2.5}
                                strokeDasharray="4 2"
                              />
                              <text
                                x={369}
                                y={96}
                                textAnchor="middle"
                                className="tabular-mono text-[9.5px] font-black fill-black"
                              >
                                [GIS層] 行穿線未退縮無庇護島
                              </text>
                            </g>
                          )}

                          {/* Interactive GIS Buffer Ring */}
                          <circle
                            cx={bufferOrigin.x}
                            cy={bufferOrigin.y}
                            r={svgRadius}
                            fill="rgba(255, 85, 0, 0.16)"
                            stroke="#FF5500"
                            strokeWidth={2.5}
                          />
                          <line
                            x1={bufferOrigin.x - 10}
                            y1={bufferOrigin.y}
                            x2={bufferOrigin.x + 10}
                            y2={bufferOrigin.y}
                            stroke="#FF5500"
                            strokeWidth={2}
                          />
                          <line
                            x1={bufferOrigin.x}
                            y1={bufferOrigin.y - 10}
                            x2={bufferOrigin.x}
                            y2={bufferOrigin.y + 10}
                            stroke="#FF5500"
                            strokeWidth={2}
                          />

                          {/* Collision Point Cloud */}
                          {GIS_COLLISION_POINTS.map(pt => {
                            const inBuf =
                              Math.hypot(pt.x - bufferOrigin.x, pt.y - bufferOrigin.y) <= svgRadius;
                            return (
                              <rect
                                key={pt.id}
                                className={inBuf ? 'gis-captured-pt' : undefined}
                                x={pt.x - (inBuf ? 5 : 3.5)}
                                y={pt.y - (inBuf ? 5 : 3.5)}
                                width={inBuf ? 10 : 7}
                                height={inBuf ? 10 : 7}
                                fill={inBuf ? '#FF5500' : '#F4F1EA'}
                                stroke="#000000"
                                strokeWidth={1.5}
                              />
                            );
                          })}

                          {/* Coordinate HUD Overlay at Bottom-Left of Map */}
                          <rect
                            x={12}
                            y={236}
                            width={218}
                            height={24}
                            fill="#000000"
                          />
                          <text
                            x={20}
                            y={252}
                            className="tabular-mono text-[10px] font-black fill-[#FF5500]"
                          >
                            BUFFER ORIGIN: ({bufferOrigin.x.toFixed(1)}, {bufferOrigin.y.toFixed(1)})
                          </text>
                        </svg>
                      </div>

                      {/* Right: Spatial Join Attribution Cross-Section Chart */}
                      <div className="lg:col-span-5 space-y-3">
                        <div className="p-3.5 border-2 border-black bg-[#18181B] text-[#F4F1EA] space-y-2.5 tabular-mono text-xs">
                          <div className="flex items-center justify-between border-b border-zinc-700 pb-1.5">
                            <span className="text-[#FF5500] font-black">
                              SPATIAL JOIN // 環域歸因剖面圖
                            </span>
                            <span className="font-black">
                              框選點位：{capturedPoints.length} / {GIS_COLLISION_POINTS.length} 筆
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-[11px] font-bold mb-1">
                                <span>道路幾何缺陷（無偏心車道/未退縮）</span>
                                <span className="text-[#FF5500] font-black">
                                  {geomPct.toFixed(1)}% ({geomCount}筆)
                                </span>
                              </div>
                              <div className="w-full h-4 bg-zinc-800 border border-black">
                                <div
                                  className="h-full bg-[#FF5500]"
                                  style={{ width: `${geomPct}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] font-bold mb-1">
                                <span>多時相號誌秒差與動線衝突</span>
                                <span>
                                  {sigPct.toFixed(1)}% ({sigCount}筆)
                                </span>
                              </div>
                              <div className="w-full h-4 bg-zinc-800 border border-black">
                                <div
                                  className="h-full bg-[#F4F1EA]"
                                  style={{ width: `${sigPct}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] font-bold mb-1">
                                <span>單純個人年齡/反應因素</span>
                                <span>
                                  {agePct.toFixed(1)}% ({ageCount}筆)
                                </span>
                              </div>
                              <div className="w-full h-4 bg-zinc-800 border border-black">
                                <div
                                  className="h-full bg-zinc-500"
                                  style={{ width: `${agePct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Quick Snap Preset Buttons */}
                          <div className="pt-2 border-t border-zinc-700 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                triggerPhysicalImpact('normal');
                                setBufferOrigin({ x: 96, y: 131 });
                                setBufferRadiusMeters(125.4);
                                setLayerLeftTurnOffset(false);
                                setLayerRefugeIsland(false);
                                setGisBufferLog(
                                  '19:17:12 快門對準單一擦撞點 (R=125.4m)，遮蔽道路幾何圖層。'
                                );
                              }}
                              className="brutal-btn p-2 text-[11px] font-black text-left"
                              style={{ backgroundColor: '#F4F1EA', color: '#000000' }}
                            >
                              [ 模擬單點行車紀錄器視角 ]
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                triggerPhysicalImpact('heavy');
                                setBufferOrigin({ x: 280, y: 135 });
                                setBufferRadiusMeters(540.8);
                                setLayerLeftTurnOffset(true);
                                setLayerRefugeIsland(true);
                                setGisBufferLog(
                                  '19:17:44 全路口環域掃描 (R=540.8m) 並套疊兩大道路幾何缺失圖層。'
                                );
                              }}
                              className="brutal-btn p-2 text-[11px] font-black text-left"
                              style={{ backgroundColor: '#FF5500', color: '#000000' }}
                            >
                              [ 展開全路口工程環域剖面 ]
                            </button>
                          </div>
                        </div>

                        <div
                          className="p-2.5 tabular-mono text-xs font-bold"
                          style={{
                            backgroundColor: '#F4F1EA',
                            color: '#18181B',
                            border: '2px solid #000',
                          }}
                        >
                          &gt; {gisBufferLog}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        )}
      </div>
    </div>
  );
}
