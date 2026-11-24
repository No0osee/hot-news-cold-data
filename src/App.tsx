import { useState, useEffect, useRef, useCallback } from 'react';
import type { SetStateAction } from 'react';
import { AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { casesData } from './data/cases';

gsap.registerPlugin(useGSAP);
import { islandZones, type IslandZone } from './data/islandZones';
import type { IntuitionAnswerRecord, NewsObservation } from './types/game';
import { evaluateIntuitionRecord } from './utils/scoring';

import { CatanWorldStage } from './components/CatanWorldStage';
import { SceneIntuitionDuel } from './scenes/SceneIntuitionDuel';
import { SceneNewsReading } from './scenes/SceneNewsReading';
import { SceneTruthFlip } from './scenes/SceneTruthFlip';
import { SceneReflection } from './scenes/SceneReflection';
import { TopicReading, TopicTruth, TopicReflection } from './scenes/TopicScenes';
import { ReadingNavigation } from './components/ReadingNavigation';
import { HowToPlay } from './components/HowToPlay';
import {
  LiteracySummaryModal,
  type CaseCalibrationStat,
} from './components/LiteracySummaryModal';

type StepType = 'menu' | 'intuition' | 'news_reading' | 'truth_reveal' | 'reflection';
type ActiveStepType = Exclude<StepType, 'menu'>;

interface CaseProgressState {
  currentStep: ActiveStepType;
  intuitionRecord: IntuitionAnswerRecord | null;
  intuitionDraft: { answers: Record<string, string>; confidenceLevel: 1 | 2 | 3 | null };
  newsObservation: NewsObservation;
  truthRevealed: boolean;
  case1PredictionDraft?: {
    values: [number, number, number];
    touched: number[];
    revealed: boolean;
  } | null;
  topicPredictionsDraft?: Record<string, { guesses: (number | null)[]; revealed: boolean }>;
  reflectionDraft?: { answers: Record<string, string>; checked: boolean } | null;
  reflectionCompleted: boolean;
}

const STORAGE_KEY = 'catan_news_framing_progress_v2';

function createEmptyCaseProgress(): CaseProgressState {
  return {
    currentStep: 'intuition',
    intuitionRecord: null,
    intuitionDraft: { answers: {}, confidenceLevel: null },
    newsObservation: { readArticleIds: [] },
    truthRevealed: false,
    case1PredictionDraft: null,
    topicPredictionsDraft: {},
    reflectionDraft: null,
    reflectionCompleted: false,
  };
}

interface StoredSaveData {
  completedCaseIds: string[];
  caseStats: Record<string, CaseCalibrationStat>;
  caseProgressMap: Record<string, CaseProgressState>;
}

function loadSavedData(): StoredSaveData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { completedCaseIds: [], caseStats: {}, caseProgressMap: {} };
    }
    const parsed = JSON.parse(raw) as Partial<StoredSaveData>;
    const validIds = new Set(islandZones.map(z => z.id));
    return {
      completedCaseIds: Array.isArray(parsed.completedCaseIds)
        ? Array.from(new Set(parsed.completedCaseIds)).filter(id => validIds.has(id))
        : [],
      caseStats: parsed.caseStats && typeof parsed.caseStats === 'object' ? parsed.caseStats : {},
      caseProgressMap:
        parsed.caseProgressMap && typeof parsed.caseProgressMap === 'object'
          ? parsed.caseProgressMap
          : {},
    };
  } catch {
    return { completedCaseIds: [], caseStats: {}, caseProgressMap: {} };
  }
}

function hexPolygonPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function getStepNumber(s: ActiveStepType): number {
  switch (s) {
    case 'intuition':
      return 1;
    case 'news_reading':
      return 2;
    case 'truth_reveal':
      return 3;
    case 'reflection':
      return 4;
  }
}

function hasCaseInProgress(progress?: CaseProgressState): boolean {
  if (!progress) return false;
  if (progress.reflectionCompleted) return false;
  if (progress.currentStep !== 'intuition') return true;
  if (Object.keys(progress.intuitionDraft?.answers ?? {}).length > 0) return true;
  if (progress.intuitionDraft?.confidenceLevel !== null && progress.intuitionDraft?.confidenceLevel !== undefined) {
    return true;
  }
  if ((progress.newsObservation?.readArticleIds?.length ?? 0) > 0) return true;
  return false;
}

export default function App() {
  const initialSave = useRef<StoredSaveData | null>(null);
  if (initialSave.current === null) {
    initialSave.current = loadSavedData();
  }

  // Game Map State
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<number>(720);
  const [showLinks, setShowLinks] = useState<boolean>(false);
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('ALL');
  const [overviewSignal, setOverviewSignal] = useState<number>(0);
  const [replayIntroSignal, setReplayIntroSignal] = useState<number>(0);
  const [isIntroPlaying, setIsIntroPlaying] = useState<boolean>(true);

  // Responsive UI Menus & Strip State
  const [toolsMenuOpen, setToolsMenuOpen] = useState<boolean>(false);
  const [confirmToolReset, setConfirmToolReset] = useState<boolean>(false);
  const [stripCollapsed, setStripCollapsed] = useState<boolean>(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  // 4-Step Calibration Game State
  const overlayRef = useRef<HTMLDivElement>(null);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [step, setStep] = useState<StepType>('menu');

  const [completedCaseIds, setCompletedCaseIds] = useState<string[]>(
    () => initialSave.current?.completedCaseIds ?? []
  );
  const [caseStats, setCaseStats] = useState<Record<string, CaseCalibrationStat>>(
    () => initialSave.current?.caseStats ?? {}
  );
  const [caseProgressMap, setCaseProgressMap] = useState<Record<string, CaseProgressState>>(
    () => initialSave.current?.caseProgressMap ?? {}
  );
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    try {
      const payload: StoredSaveData = {
        completedCaseIds,
        caseStats,
        caseProgressMap,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [completedCaseIds, caseStats, caseProgressMap]);

  // Close tools dropdown on outside click
  useEffect(() => {
    if (!toolsMenuOpen) {
      setConfirmToolReset(false);
      return;
    }
    const handlePointerDown = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setToolsMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [toolsMenuOpen]);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [step, currentCaseIndex]);

  const activeCase = casesData[currentCaseIndex] || casesData[0];
  const activeProgress: CaseProgressState =
    caseProgressMap[activeCase.id] ?? createEmptyCaseProgress();

  const selectedZone: IslandZone | null =
    islandZones.find(z => z.id === selectedZoneId) ?? null;

  const ReadingScene = activeCase.topic ? TopicReading : SceneNewsReading;
  const TruthScene = activeCase.topic ? TopicTruth : SceneTruthFlip;
  const ReflectionScene = activeCase.topic ? TopicReflection : SceneReflection;

  const updateCaseProgress = useCallback(
    (caseId: string, updater: (prev: CaseProgressState) => CaseProgressState) => {
      setCaseProgressMap(prevMap => {
        const current = prevMap[caseId] ?? createEmptyCaseProgress();
        return {
          ...prevMap,
          [caseId]: updater(current),
        };
      });
    },
    []
  );

  const handleSelectIslandZone = (zoneId: string) => {
    const z = islandZones.find(item => item.id === zoneId);
    if (!z) return;
    setSelectedZoneId(z.id);
    setCurrentCaseIndex(z.caseIndex);
  };

  const handleResetOverview = () => {
    setSelectedZoneId(null);
    setOverviewSignal(s => s + 1);
  };

  const handleReplayIntro = () => {
    setSelectedZoneId(null);
    setToolsMenuOpen(false);
    setReplayIntroSignal(s => s + 1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showSummaryModal) return;
      if (e.key === 'Escape' && toolsMenuOpen) {
        setToolsMenuOpen(false);
        return;
      }
      if (step !== 'menu') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        handleResetOverview();
      } else if (e.key === 'ArrowRight' && selectedZone) {
        const nextIdx = (selectedZone.caseIndex + 1) % islandZones.length;
        handleSelectIslandZone(islandZones[nextIdx].id);
      } else if (e.key === 'ArrowLeft' && selectedZone) {
        const prevIdx = (selectedZone.caseIndex - 1 + islandZones.length) % islandZones.length;
        handleSelectIslandZone(islandZones[prevIdx].id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, selectedZone, showSummaryModal, toolsMenuOpen]);

  // Start or resume an island challenge
  const handleStartCalibration = (zone: IslandZone, mode: 'fresh' | 'resume' = 'fresh') => {
    setToolsMenuOpen(false);
    setSelectedZoneId(zone.id);
    setCurrentCaseIndex(zone.caseIndex);
    const existing = caseProgressMap[zone.id];

    if (mode === 'resume' && existing && !existing.reflectionCompleted) {
      setStep(existing.currentStep);
      return;
    }

    // Fresh start or replay for this island
    const fresh = createEmptyCaseProgress();
    setCaseProgressMap(prev => ({
      ...prev,
      [zone.id]: fresh,
    }));
    setStep('intuition');
  };

  const handleIntuitionDraftChange = useCallback(
    (draft: { answers: Record<string, string>; confidenceLevel: 1 | 2 | 3 | null }) => {
      updateCaseProgress(activeCase.id, prev => ({
        ...prev,
        intuitionDraft: draft,
      }));
    },
    [activeCase.id, updateCaseProgress]
  );

  const handleIntuitionSubmit = (record: IntuitionAnswerRecord) => {
    const evalResult = evaluateIntuitionRecord(activeCase, record);

    setCaseStats(prev => ({
      ...prev,
      [activeCase.id]: {
        ...prev[activeCase.id],
        confidenceLevel: record.confidenceLevel,
        intuitionCorrect: evalResult.correct,
        intuitionTotal: evalResult.total,
      },
    }));

    updateCaseProgress(activeCase.id, prev => ({
      ...prev,
      currentStep: 'news_reading',
      intuitionRecord: record,
      intuitionDraft: { answers: record.answers, confidenceLevel: record.confidenceLevel },
    }));

    setStep('news_reading');
  };

  const handleReadingDraftChange = useCallback(
    (action: SetStateAction<NewsObservation>) => {
      updateCaseProgress(activeCase.id, prev => {
        const nextObs =
          typeof action === 'function' ? action(prev.newsObservation) : action;
        return {
          ...prev,
          newsObservation: nextObs,
        };
      });
    },
    [activeCase.id, updateCaseProgress]
  );

  const handleNewsReadingSubmit = (obs: NewsObservation) => {
    updateCaseProgress(activeCase.id, prev => ({
      ...prev,
      currentStep: 'truth_reveal',
      newsObservation: obs,
    }));
    setStep('truth_reveal');
  };

  const handleCase1PredictionDraftChange = useCallback(
    (draft: { values: [number, number, number]; touched: number[]; revealed: boolean }) => {
      updateCaseProgress(activeCase.id, prev => ({
        ...prev,
        case1PredictionDraft: draft,
        truthRevealed: draft.revealed || prev.truthRevealed,
      }));
    },
    [activeCase.id, updateCaseProgress]
  );

  const handleTopicPredictionDraftChange = useCallback(
    (seriesTitle: string, draft: { guesses: (number | null)[]; revealed: boolean }) => {
      updateCaseProgress(activeCase.id, prev => {
        const nextMap = {
          ...prev.topicPredictionsDraft,
          [seriesTitle]: draft,
        };
        const allSeriesRevealed =
          activeCase.topic?.series.every(s => nextMap[s.title]?.revealed) ?? false;
        return {
          ...prev,
          topicPredictionsDraft: nextMap,
          truthRevealed: allSeriesRevealed || prev.truthRevealed,
        };
      });
    },
    [activeCase.id, activeCase.topic, updateCaseProgress]
  );

  // Moving from Step 3 to Step 4 does NOT mark the island completed!
  // Completion is strictly triggered when Step 4 reflection questions are finished.
  const handleTruthFlipNext = () => {
    updateCaseProgress(activeCase.id, prev => ({
      ...prev,
      currentStep: 'reflection',
      truthRevealed: true,
    }));
    setStep('reflection');
  };

  const handleReflectionDraftChange = useCallback(
    (draft: { answers: Record<string, string>; checked: boolean }) => {
      updateCaseProgress(activeCase.id, prev => ({
        ...prev,
        reflectionDraft: draft,
      }));
    },
    [activeCase.id, updateCaseProgress]
  );

  // Triggered ONLY when user finishes Step 4 reflection questions
  const handleCompleteReflection = useCallback(
    (score: { correct: number; total: number; answers: Record<string, string> }) => {
      setCompletedCaseIds(prev =>
        prev.includes(activeCase.id) ? prev : [...prev, activeCase.id]
      );

      setCaseStats(prev => {
        const existing = prev[activeCase.id];
        const fallbackEval = evaluateIntuitionRecord(
          activeCase,
          activeProgress.intuitionRecord
        );
        return {
          ...prev,
          [activeCase.id]: {
            confidenceLevel:
              existing?.confidenceLevel ??
              activeProgress.intuitionRecord?.confidenceLevel ??
              2,
            intuitionCorrect: existing?.intuitionCorrect ?? fallbackEval.correct,
            intuitionTotal: existing?.intuitionTotal ?? fallbackEval.total,
            reflectionCorrect: score.correct,
            reflectionTotal: score.total,
          },
        };
      });

      updateCaseProgress(activeCase.id, prev => ({
        ...prev,
        reflectionDraft: { answers: score.answers, checked: true },
        reflectionCompleted: true,
      }));
    },
    [activeCase, activeProgress.intuitionRecord, updateCaseProgress]
  );

  const handleStepBack = () => {
    let prevStep: ActiveStepType = 'intuition';
    if (step === 'news_reading') prevStep = 'intuition';
    else if (step === 'truth_reveal') prevStep = 'news_reading';
    else if (step === 'reflection') prevStep = 'truth_reveal';

    updateCaseProgress(activeCase.id, prev => ({
      ...prev,
      currentStep: prevStep,
    }));
    setStep(prevStep);
  };

  // Returning to map preserves current step & unfinished answers
  const resetToMenu = () => {
    if (step !== 'menu') {
      updateCaseProgress(activeCase.id, prev => ({
        ...prev,
        currentStep: step,
      }));
    }
    setStep('menu');
  };

  const restartCurrentCase = () => {
    const fresh = createEmptyCaseProgress();
    setCaseProgressMap(prev => ({
      ...prev,
      [activeCase.id]: fresh,
    }));
    setStep('intuition');
  };

  const handleResetAllProgress = () => {
    setCompletedCaseIds([]);
    setCaseStats({});
    setCaseProgressMap({});
    setStep('menu');
    setConfirmToolReset(false);
    setToolsMenuOpen(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  // Compute next island for Step 4 completion CTA
  const nextIslandZone: IslandZone = (() => {
    const curZoneIdx = islandZones.findIndex(z => z.caseIndex === currentCaseIndex);
    for (let offset = 1; offset <= islandZones.length; offset++) {
      const candidate = islandZones[(curZoneIdx + offset) % islandZones.length];
      if (!completedCaseIds.includes(candidate.id) && candidate.id !== activeCase.id) {
        return candidate;
      }
    }
    return islandZones[(curZoneIdx + 1) % islandZones.length];
  })();

  const handleGoNextIsland = () => {
    setSelectedZoneId(nextIslandZone.id);
    setCurrentCaseIndex(nextIslandZone.caseIndex);
    const existing = caseProgressMap[nextIslandZone.id];
    if (existing && hasCaseInProgress(existing)) {
      setStep(existing.currentStep);
    } else {
      const fresh = createEmptyCaseProgress();
      setCaseProgressMap(prev => ({
        ...prev,
        [nextIslandZone.id]: fresh,
      }));
      setStep('intuition');
    }
  };

  const getStepBadgeText = () => {
    switch (step) {
      case 'intuition':
        return '1/4 先猜猜看';
      case 'news_reading':
        return '2/4 讀新聞';
      case 'truth_reveal':
        return '3/4 看數據';
      case 'reflection':
        return '4/4 再想一想';
      default:
        return '';
    }
  };

  const selectedZoneProgress = selectedZone ? caseProgressMap[selectedZone.id] : undefined;
  const selectedZoneHasUnfinished = hasCaseInProgress(selectedZoneProgress);
  const selectedZoneIsCompleted = selectedZone
    ? completedCaseIds.includes(selectedZone.id)
    : false;

  const timeLabel =
    timeOfDay === 360
      ? '晨'
      : timeOfDay === 720
        ? '晝'
        : timeOfDay === 1080
          ? '暮'
          : '夜';

  // GSAP HUD & Mini-Map Staggered Reveal after Harbor Intro
  useGSAP(
    () => {
      if (isIntroPlaying) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(
        '.atlas-brand, .domain-tabs, .atlas-controls > *',
        { y: -14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.48, stagger: 0.05, ease: 'back.out(1.7)', clearProps: 'transform,opacity' }
      )
        .fromTo(
          '.mini-hex-poly',
          { scale: 0, transformOrigin: '50% 50%' },
          { scale: 1, duration: 0.42, stagger: 0.024, ease: 'back.out(2.1)', clearProps: 'transform' },
          '-=0.3'
        )
        .fromTo(
          '.tile-strip .strip-item',
          { y: 14, opacity: 0, scale: 0.92 },
          { y: 0, opacity: 1, scale: 1, duration: 0.38, stagger: 0.022, ease: 'back.out(1.6)', clearProps: 'transform' },
          '-=0.35'
        );
    },
    { scope: rootRef, dependencies: [isIntroPlaying] }
  );

  // GSAP Tabletop Card Deal & Mini-Map Hex Pulse when selecting an Island
  useGSAP(
    () => {
      if (!selectedZoneId || !cardRef.current) return;
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', overwrite: 'auto' } });
      tl.fromTo(
        cardRef.current,
        { y: 18, scale: 0.94 },
        { y: 0, scale: 1, duration: 0.46, ease: 'back.out(1.85)', clearProps: 'transform' }
      )
        .fromTo(
          cardRef.current.querySelectorAll('.gc-cat'),
          { y: 8, opacity: 0, scale: 0.85 },
          { y: 0, opacity: 1, scale: 1, duration: 0.34, stagger: 0.055, ease: 'back.out(2.2)' },
          '-=0.32'
        )
        .fromTo(
          cardRef.current.querySelectorAll('.gc-title'),
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.36 },
          '-=0.26'
        )
        .fromTo(
          cardRef.current.querySelectorAll('.gc-actions button'),
          { y: 12, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.7)' },
          '-=0.24'
        )
        .fromTo(
          cardRef.current.querySelectorAll('.gc-foot, .gc-meta-strip'),
          { y: 6, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, stagger: 0.04 },
          '-=0.22'
        );

      const activePoly = rootRef.current?.querySelector(`.mini-hex-poly[data-zone-id="${selectedZoneId}"]`);
      if (activePoly) {
        gsap.fromTo(
          activePoly,
          { scale: 1.32, transformOrigin: '50% 50%' },
          { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' }
        );
      }
    },
    { scope: rootRef, dependencies: [selectedZoneId] }
  );

  // GSAP Category Filter Tactile Pulse
  useGSAP(
    () => {
      if (isIntroPlaying) return;
      gsap.fromTo(
        '.tile-strip .strip-item:not(.dim-item)',
        { scale: 0.92, y: 4 },
        { scale: 1, y: 0, duration: 0.36, stagger: 0.018, ease: 'back.out(2)', overwrite: 'auto', clearProps: 'transform' }
      );
    },
    { scope: rootRef, dependencies: [activeGroupFilter] }
  );

  return (
    <div ref={rootRef} className="catan-root">
      {/* Slim Responsive Game Top Bar */}
      <header className="atlas-header">
        <div className="atlas-left-group">
          <div className="atlas-brand">
            <h1 className="atlas-title">當熱新聞遇上冷數據</h1>
          </div>

          <div className="atlas-center">
            <div className="domain-tabs" role="tablist" aria-label="議題分類">
              {[
                { id: 'ALL', label: '全部' },
                { id: '國旅交通', label: '交通' },
                { id: '社會安全', label: '安全' },
                { id: '生活', label: '生活' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeGroupFilter === tab.id ? 'active' : ''}
                  onClick={() => setActiveGroupFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="atlas-controls">
          <HowToPlay inline hidden={isIntroPlaying || step !== 'menu'} />

          <button type="button" className="ctrl-btn" onClick={handleResetOverview}>
            全景復原
          </button>

          {/* Expandable Tools Menu (Day/Night, Links, Intro Animation, Reset) */}
          <div className="tools-menu-wrap" ref={toolsMenuRef}>
            <button
              type="button"
              className={`ctrl-btn ${toolsMenuOpen || showLinks ? 'active' : ''}`}
              aria-expanded={toolsMenuOpen}
              aria-haspopup="true"
              onClick={() => setToolsMenuOpen(v => !v)}
            >
              <span>設定 ({timeLabel})</span>
              <span aria-hidden="true">{toolsMenuOpen ? '▴' : '▾'}</span>
            </button>

            {toolsMenuOpen && (
              <div className="tools-dropdown" role="menu" aria-label="地圖與環境設定選單">
                <div>
                  <span className="tools-section-label">時段與日夜光影</span>
                  <div className="light-switch" role="group" aria-label="時段切換">
                    {[
                      { t: 360, label: '晨' },
                      { t: 720, label: '晝' },
                      { t: 1080, label: '暮' },
                      { t: 1260, label: '夜' },
                    ].map(item => (
                      <button
                        key={item.t}
                        type="button"
                        className={timeOfDay === item.t ? 'active' : ''}
                        onClick={() => setTimeOfDay(item.t)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="tools-menu-actions">
                  <span className="tools-section-label">場景互動控制</span>
                  <button
                    type="button"
                    className={`tools-item-btn ${showLinks ? 'active' : ''}`}
                    onClick={() => setShowLinks(v => !v)}
                  >
                    <span>議題關聯連線</span>
                    <span>{showLinks ? '已開啟 ✓' : '關閉'}</span>
                  </button>

                  <button
                    type="button"
                    className="tools-item-btn"
                    onClick={handleReplayIntro}
                  >
                    <span>重播入港動畫</span>
                  </button>
                </div>

                <div className="tools-menu-actions" style={{ borderTop: '1px solid var(--line)', paddingTop: '8px' }}>
                  {!confirmToolReset ? (
                    <button
                      type="button"
                      className="tools-item-btn danger"
                      onClick={() => setConfirmToolReset(true)}
                    >
                      <span>重設全部進度</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#b83728' }}>
                        確定清除所有島嶼進度與紀錄？
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="tools-item-btn danger"
                          style={{ justifyContent: 'center', background: '#b83728', color: '#fff' }}
                          onClick={handleResetAllProgress}
                        >
                          確定清除
                        </button>
                        <button
                          type="button"
                          className="tools-item-btn"
                          style={{ justifyContent: 'center' }}
                          onClick={() => setConfirmToolReset(false)}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3D Catan & Voxel Island World Stage */}
      <CatanWorldStage
        selectedZoneId={selectedZoneId}
        completedCaseIds={completedCaseIds}
        timeOfDay={timeOfDay}
        showLinks={showLinks}
        activeGroupFilter={activeGroupFilter}
        searchQuery=""
        overviewSignal={overviewSignal}
        replayIntroSignal={replayIntroSignal}
        onSelectZone={handleSelectIslandZone}
        onIntroChange={setIsIntroPlaying}
      />

      {/* Bottom-Left Compact 2D Taiwan Hex Mini-Map */}
      <aside
        className="board-compass"
        aria-label="台灣島嶼縮圖"
        style={{
          opacity: isIntroPlaying ? 0 : 1,
          pointerEvents: isIntroPlaying ? 'none' : undefined,
          transition: 'opacity 0.4s ease',
        }}
      >
        <div className="compass-head">
          <span>台灣島嶼縮圖</span>
          <span>點選跳島</span>
        </div>
        <svg className="mini-hex-svg" viewBox="0 0 124 98">
          <path
            d="M66,3 C78,5 89,14 91,27 C92,41 87,56 79,71 C73,83 65,93 56,95 C47,94 42,86 38,75 C32,63 23,51 25,38 C27,26 36,15 48,7 C54,4 60,2 66,3 Z"
            fill="#dcd0bc"
            stroke="#c4b193"
            strokeWidth="1.5"
          />
          {islandZones.map(z => {
            const [col, row] = z.cell;
            const r = 9.5;
            const cx = 42 + (col + 0.5 * (row & 1)) * (r * 1.75);
            const cy = 14 + row * (r * 1.48);
            const isSel = selectedZoneId === z.id;
            const isDone = completedCaseIds.includes(z.id);
            const isDim = activeGroupFilter !== 'ALL' && z.group !== activeGroupFilter;

            return (
              <g
                key={z.id}
                onClick={() => handleSelectIslandZone(z.id)}
                style={{ opacity: isDim ? 0.28 : 1, transition: 'opacity 0.2s ease' }}
              >
                <title>{z.shortName}</title>
                <polygon
                  className="mini-hex-poly"
                  data-zone-id={z.id}
                  points={hexPolygonPoints(cx, cy, r - 1)}
                  fill={isSel ? '#b83728' : isDone ? '#2a6f52' : z.ground}
                />
              </g>
            );
          })}
        </svg>
      </aside>

      {/* Bottom Quick Tile Strip (Single-row horizontally scrollable + collapsible) */}
      <div
        className="tile-strip-wrapper"
        style={{
          opacity: isIntroPlaying ? 0 : 1,
          pointerEvents: isIntroPlaying ? 'none' : undefined,
          transition: 'opacity 0.4s ease',
        }}
      >
        <button
          type="button"
          className="tile-strip-toggle"
          aria-expanded={!stripCollapsed}
          onClick={() => setStripCollapsed(v => !v)}
        >
          {stripCollapsed ? `展開 ${islandZones.length} 島清單 ▴` : '收合清單 ▾'}
        </button>

        {!stripCollapsed && (
          <nav className="tile-strip" aria-label="十三座島嶼快速切換">
            {islandZones.map(z => {
              const isSel = selectedZoneId === z.id;
              const isDone = completedCaseIds.includes(z.id);
              const inProg = hasCaseInProgress(caseProgressMap[z.id]);
              const isDim = activeGroupFilter !== 'ALL' && z.group !== activeGroupFilter;
              return (
                <button
                  key={z.id}
                  type="button"
                  className={`strip-item ${isSel ? 'active' : ''} ${isDone ? 'done' : ''} ${
                    !isDone && inProg ? 'in-progress' : ''
                  } ${isDim ? 'dim-item' : ''}`}
                  style={{ opacity: isDim ? 0.35 : 1 }}
                  onClick={() => handleSelectIslandZone(z.id)}
                >
                  <span>{z.shortName}</span>
                  {isDone && <span>已完成</span>}
                  {!isDone && inProg && <span>進行中</span>}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Compact Game Stage Card (Opens when an island is clicked; never overlaps bottom strip) */}
      <article ref={cardRef} className={`game-card ${selectedZone ? 'open' : ''}`} aria-live="polite">
        {selectedZone && (
          <>
            <div className="gc-head">
              <button
                type="button"
                className="gc-close"
                onClick={handleResetOverview}
                aria-label="關閉卡片"
              >
                ×
              </button>
              <div className="gc-badges">
                <span
                  className="gc-cat"
                  style={{ backgroundColor: selectedZone.groupColor }}
                >
                  {selectedZone.group}
                </span>
                {selectedZoneIsCompleted && (
                  <span className="gc-cat" style={{ backgroundColor: '#2a6f52' }}>
                    已完成校準
                  </span>
                )}
                {selectedZoneHasUnfinished && selectedZoneProgress && (
                  <span className="gc-cat" style={{ backgroundColor: '#d97706' }}>
                    進行中（第 {getStepNumber(selectedZoneProgress.currentStep)}/4 關）
                  </span>
                )}
              </div>

              <h2 className="gc-title">{selectedZone.islandName}</h2>
            </div>

            <div className="gc-actions">
              {(() => {
                const questionText = selectedZone.researchCase.title.includes('？')
                  ? selectedZone.researchCase.title
                  : selectedZone.researchCase.subtitle || selectedZone.researchCase.title;

                return selectedZoneHasUnfinished && selectedZoneProgress ? (
                  <>
                    <button
                      type="button"
                      className="btn-play-main"
                      onClick={() => handleStartCalibration(selectedZone, 'resume')}
                    >
                      <span>{questionText}</span>
                      <span className="btn-play-sub">
                        繼續挑戰（第 {getStepNumber(selectedZoneProgress.currentStep)}/4 關）
                      </span>
                    </button>
                    <button
                      type="button"
                      className="btn-play-secondary"
                      onClick={() => handleStartCalibration(selectedZone, 'fresh')}
                    >
                      從頭開始挑戰
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn-play-main"
                    onClick={() => handleStartCalibration(selectedZone, 'fresh')}
                  >
                    <span>{questionText}</span>
                  </button>
                );
              })()}
            </div>

            <div className="gc-foot">
              <button
                type="button"
                onClick={() => {
                  const prevIdx =
                    (selectedZone.caseIndex - 1 + islandZones.length) % islandZones.length;
                  handleSelectIslandZone(islandZones[prevIdx].id);
                }}
              >
                ← 上一島
              </button>
              <span style={{ color: 'var(--muted)', fontWeight: 700 }}>
                {selectedZone.shortName}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextIdx = (selectedZone.caseIndex + 1) % islandZones.length;
                  handleSelectIslandZone(islandZones[nextIdx].id);
                }}
              >
                下一島
              </button>
            </div>

            <div className="gc-meta-strip">
              <span>統計期間｜{selectedZone.researchCase.period}</span>
              <span>資料來源｜{selectedZone.researchCase.officialDataMeta.source}</span>
            </div>
          </>
        )}
      </article>

      {/* 4-Step Interactive Calibration Modal Overlay */}
      {step !== 'menu' && (
        <>
          <div className="calibration-backdrop" />
          <header
            className="calibration-header fixed top-0 left-0 right-0 z-[80] bg-zinc-950/95 backdrop-blur-md border-b-2 border-[#8c734b] px-2.5 py-2 md:px-4 md:py-2.5 flex flex-wrap items-center justify-between gap-1.5 shadow-md"
            style={{ zIndex: 80 }}
          >
            <div className="min-w-0 text-zinc-100 font-bold flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
              <span className="text-amber-400 font-serif font-black truncate max-w-[115px] sm:max-w-none">
                {selectedZone
                  ? selectedZone.islandName
                  : islandZones.find(z => z.caseIndex === currentCaseIndex)?.islandName ??
                    activeCase.title}
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-amber-200 font-mono font-bold truncate">
                {getStepBadgeText()}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <ReadingNavigation pageKey={`${activeCase.id}-${step}`} />
              {step !== 'intuition' && (
                <button
                  type="button"
                  onClick={handleStepBack}
                  aria-label="回到上一步"
                  className="whitespace-nowrap text-xs font-mono font-bold bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-amber-200 px-2.5 py-1 rounded border border-zinc-700 shadow-xs cursor-pointer transition-all min-h-[32px]"
                >
                  上一步
                </button>
              )}
              <button
                type="button"
                onClick={resetToMenu}
                aria-label="返回地圖"
                className="whitespace-nowrap text-xs font-mono font-bold bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-200 px-2.5 py-1 rounded border border-zinc-600 shadow-xs cursor-pointer transition-all min-h-[32px]"
              >
                返回地圖
              </button>
            </div>
          </header>

          <div ref={overlayRef} className="calibration-overlay product-root text-zinc-100">
            <AnimatePresence mode="wait">
              {step === 'intuition' && (
                <SceneIntuitionDuel
                  key={`intuition_${activeCase.id}`}
                  researchCase={activeCase}
                  initialRecord={activeProgress.intuitionRecord}
                  initialDraft={activeProgress.intuitionDraft}
                  onDraftChange={handleIntuitionDraftChange}
                  onSubmit={handleIntuitionSubmit}
                />
              )}

              {step === 'news_reading' && (
                <ReadingScene
                  key={`reading_${activeCase.id}`}
                  researchCase={activeCase}
                  observation={activeProgress.newsObservation}
                  onDraftChange={handleReadingDraftChange}
                  onSubmit={handleNewsReadingSubmit}
                />
              )}

              {step === 'truth_reveal' && (
                <TruthScene
                  key={`truth_${activeCase.id}`}
                  researchCase={activeCase}
                  intuitionAnswers={activeProgress.intuitionRecord}
                  observation={activeProgress.newsObservation}
                  initialRevealed={activeProgress.truthRevealed}
                  initialPredictionDraft={activeProgress.case1PredictionDraft}
                  onPredictionDraftChange={handleCase1PredictionDraftChange}
                  initialTopicPredictions={activeProgress.topicPredictionsDraft}
                  onTopicPredictionDraftChange={handleTopicPredictionDraftChange}
                  next={handleTruthFlipNext}
                />
              )}

              {step === 'reflection' && (
                <ReflectionScene
                  key={`reflection_${activeCase.id}`}
                  researchCase={activeCase}
                  intuitionAnswers={activeProgress.intuitionRecord}
                  observation={activeProgress.newsObservation}
                  initialReflectionDraft={activeProgress.reflectionDraft}
                  onReflectionDraftChange={handleReflectionDraftChange}
                  onCompleteReflection={handleCompleteReflection}
                  isAllIslandsCompleted={completedCaseIds.length >= islandZones.length}
                  onOpenSummary={() => setShowSummaryModal(true)}
                  nextIsland={{
                    id: nextIslandZone.id,
                    title: nextIslandZone.islandName,
                  }}
                  onGoNextIsland={handleGoNextIsland}
                  reset={resetToMenu}
                  restart={restartCurrentCase}
                />
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Personal News Literacy Radar & Island Summary Card Modal */}
      <LiteracySummaryModal
        open={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        completedCaseIds={completedCaseIds}
        caseStats={caseStats}
        onSelectZone={zoneId => {
          resetToMenu();
          handleSelectIslandZone(zoneId);
        }}
        onResetAllProgress={handleResetAllProgress}
      />
    </div>
  );
}
