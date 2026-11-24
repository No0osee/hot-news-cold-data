import { casesData } from './cases';
import type { ResearchCase } from '../types/game';

export interface IslandZone {
  id: string;
  caseIndex: number;
  number: number;
  islandName: string;
  shortName: string;
  group: '國旅交通' | '社會安全' | '生活';
  groupCode: 'T' | 'S' | 'L';
  groupColor: string;
  cell: [number, number];
  ground: string;
  side: string;
  model:
    | 'traffic_cross'
    | 'smokestack'
    | 'tourism_train'
    | 'office_tower'
    | 'chapel_split'
    | 'fire_house'
    | 'police_siren'
    | 'salary_scale'
    | 'dark_houses'
    | 'wind_solar'
    | 'hotel_inn'
    | 'zebra_crossing'
    | 'speed_camera'
    | 'compost_farm';
  heatLevel: number;
  researchCase: ResearchCase;
}

// Taiwan Silhouette 2 - 3 - 3 - 3 - 2 - 1 pointy-top hex layout (14 islands total)
// Row 0 (North Tip):     [1,0], [2,0]
// Row 1 (North-Central): [0,1], [1,1], [2,1]
// Row 2 (Central):       [0,2], [1,2], [2,2]
// Row 3 (South-Central): [-1,3], [0,3], [1,3]
// Row 4 (South):         [0,4], [1,4]
// Row 5 (South Tip):     [0,5]
const ISLAND_CONFIGS: Array<{
  caseId: string;
  islandName: string;
  shortName: string;
  cell: [number, number];
  ground: string;
  side: string;
  model: IslandZone['model'];
  heatLevel: number;
}> = [
  {
    caseId: 'elderly_driver',
    islandName: '高齡駕駛島',
    shortName: '高齡駕駛',
    cell: [1, 1],
    ground: '#A45A49',
    side: '#5E3228',
    model: 'traffic_cross',
    heatLevel: 5,
  },
  {
    caseId: 'topic-01',
    islandName: '空污迷霧島',
    shortName: 'PM2.5空污',
    cell: [0, 1],
    ground: '#76848C',
    side: '#434C52',
    model: 'smokestack',
    heatLevel: 4,
  },
  {
    caseId: 'topic-02',
    islandName: '國旅人潮島',
    shortName: '國旅旅次',
    cell: [1, 0],
    ground: '#58876C',
    side: '#314D3D',
    model: 'tourism_train',
    heatLevel: 5,
  },
  {
    caseId: 'topic-03',
    islandName: '職場心聲島',
    shortName: '工作滿意',
    cell: [2, 0],
    ground: '#627694',
    side: '#374357',
    model: 'office_tower',
    heatLevel: 4,
  },
  {
    caseId: 'topic-04',
    islandName: '婚姻冷暖島',
    shortName: '離婚統計',
    cell: [2, 1],
    ground: '#966B7B',
    side: '#543A44',
    model: 'chapel_split',
    heatLevel: 3,
  },
  {
    caseId: 'topic-05',
    islandName: '祝融警戒島',
    shortName: '住宅火災',
    cell: [0, 2],
    ground: '#B55B3C',
    side: '#63301E',
    model: 'fire_house',
    heatLevel: 5,
  },
  {
    caseId: 'topic-06',
    islandName: '治安暗影島',
    shortName: '暴力犯罪',
    cell: [2, 2],
    ground: '#635B6E',
    side: '#36313D',
    model: 'police_siren',
    heatLevel: 5,
  },
  {
    caseId: 'topic-07',
    islandName: '薪資天平島',
    shortName: '經常薪資',
    cell: [1, 2],
    ground: '#AD904C',
    side: '#615028',
    model: 'salary_scale',
    heatLevel: 5,
  },
  {
    caseId: 'topic-10',
    islandName: '綠能風電島',
    shortName: '再生能源',
    cell: [0, 3],
    ground: '#478560',
    side: '#274A35',
    model: 'wind_solar',
    heatLevel: 4,
  },
  {
    caseId: 'topic-11',
    islandName: '旅宿燈火島',
    shortName: '國旅住房',
    cell: [1, 3],
    ground: '#8C7154',
    side: '#4F3F2E',
    model: 'hotel_inn',
    heatLevel: 4,
  },
  {
    caseId: 'topic-12',
    islandName: '斑馬線口島',
    shortName: '行人停讓',
    cell: [0, 4],
    ground: '#6E747C',
    side: '#3E4247',
    model: 'zebra_crossing',
    heatLevel: 5,
  },
  {
    caseId: 'topic-13',
    islandName: '測速分心島',
    shortName: '超速分心',
    cell: [1, 4],
    ground: '#87654F',
    side: '#4D382B',
    model: 'speed_camera',
    heatLevel: 4,
  },
  {
    caseId: 'topic-14',
    islandName: '廚餘去化島',
    shortName: '廚餘去向',
    cell: [0, 5],
    ground: '#758549',
    side: '#424B28',
    model: 'compost_farm',
    heatLevel: 4,
  },
];

const GROUP_META: Record<'國旅交通' | '社會安全' | '生活', { code: 'T' | 'S' | 'L'; color: string }> = {
  '國旅交通': { code: 'T', color: '#2C6DB5' },
  '社會安全': { code: 'S', color: '#A8201A' },
  '生活': { code: 'L', color: '#2E8B57' },
};

export const islandZones: IslandZone[] = casesData.map((researchCase, index) => {
  const cfg = ISLAND_CONFIGS.find(c => c.caseId === researchCase.id) ?? {
    caseId: researchCase.id,
    islandName: `議題島 ${index + 1}`,
    shortName: researchCase.title.slice(0, 4),
    cell: [index % 4, Math.floor(index / 4)] as [number, number],
    ground: '#6E7B82',
    side: '#3D454A',
    model: 'office_tower' as const,
    heatLevel: 4,
  };
  const group = (researchCase.group ?? '國旅交通') as '國旅交通' | '社會安全' | '生活';
  const gMeta = GROUP_META[group];

  return {
    id: researchCase.id,
    caseIndex: index,
    number: index + 1,
    islandName: cfg.islandName,
    shortName: cfg.shortName,
    group,
    groupCode: gMeta.code,
    groupColor: gMeta.color,
    cell: cfg.cell,
    ground: cfg.ground,
    side: cfg.side,
    model: cfg.model,
    heatLevel: cfg.heatLevel,
    researchCase,
  };
});

export const WILD_CELLS: Array<{ cell: [number, number] }> = [];

export interface IslandLink {
  id: string;
  from: string;
  to: string;
  label: string;
  group: '國旅交通' | '社會安全' | '生活';
}

export const ISLAND_LINKS: IslandLink[] = [
  { id: 'L1', from: 'elderly_driver', to: 'topic-12', label: '道路傷亡事故統計', group: '國旅交通' },
  { id: 'L2', from: 'topic-12', to: 'topic-13', label: 'A1+A2 肇因分類', group: '國旅交通' },
  { id: 'L3', from: 'topic-02', to: 'topic-11', label: '國旅旅次 vs 住房率', group: '國旅交通' },
  { id: 'L4', from: 'topic-05', to: 'topic-06', label: '社會安全事件母體', group: '社會安全' },
  { id: 'L5', from: 'topic-03', to: 'topic-07', label: '勞工調查 vs 薪資中位數', group: '生活' },
  { id: 'L6', from: 'topic-01', to: 'topic-10', label: '環境與能源統計', group: '生活' },
  { id: 'L7', from: 'topic-10', to: 'topic-14', label: '再生能源與資源循環', group: '生活' },
];
