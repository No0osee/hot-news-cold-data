// 高齡駕駛案例：讀完六篇後「印象最深」的選項（第 2 步作答、第 3／4 步回顧共用）。
export const elderlyImpressionOptions = [
  { id: 'elderly_runaway', label: '三峽事故與換照討論' },
  { id: 'taichung_elderly', label: '台中高齡駕駛事故' },
  { id: 'youth_bike', label: '青年騎車事故' },
  { id: 'daily_collision', label: '軍車與機車事故' }
];

export const elderlyImpressionLabel = (id?: string) =>
  elderlyImpressionOptions.find(option => option.id === id)?.label ?? null;
