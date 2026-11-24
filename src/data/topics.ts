import workbooks from './topicWorkbooks.json';
import { topicNews } from './topicNews';
import type { ResearchCase, IntuitionQuestion, TopicSeries } from '../types/game';

const resolvePublicUrl = (url: string) =>
  url.startsWith('/') ? `${import.meta.env.BASE_URL}${url.slice(1)}` : url;

type Group = NonNullable<ResearchCase['group']>;
interface Spec {
  number: string; group: Group; title: string; subtitle: string; chartTitle: string;
  scope: string; finding: string; limitation: string; furtherQuestion: string;
  q1: string; options1: string[]; answer1: number;
  q2: string; options2: string[]; answer2: number;
  overclaim: string;
}
const specs: Spec[] = [
  {
    number: '01', group: '生活', title: '全國 PM₂.₅ 年平均越來越高？', subtitle: '看見霧霾之前，先看 PM₂.₅ 的五年變化。', chartTitle: '全國 PM₂.₅ 年平均濃度',
    scope: '2021–2025 年，全國 PM₂.₅ 年平均濃度，單位 µg/m³。',
    finding: '2025 年的年均濃度低於 2021 年；中間有起伏，2023 年曾回升。',
    limitation: '全國年平均不能代表每個地點、每一天，也不能代表所有空氣污染物。',
    furtherQuestion: '你所在地的測站和其他污染物，有沒有相同趨勢？',
    q1: '你猜 2025 年全國 PM₂.₅ 年平均，比 2021 年如何？', options1: ['更高', '更低', '相同'], answer1: 1,
    q2: '全國 PM₂.₅ 年平均適合回答哪個問題？', options2: ['今天我家附近空氣如何', '全國所有污染物是否下降', '這一種污染物的年度變化'], answer2: 2,
    overclaim: '年平均下降，代表每個地方每天的空氣都變好。',
  },
  {
    number: '02', group: '國旅交通', title: '國旅已經沒人去了？', subtitle: '一個人旅行三次，算三次還是一人？從哪一年開始比，也很重要。', chartTitle: '國人國內旅遊旅次',
    scope: '2019–2025 年，調查 12 歲以上國人的國內旅行次數，再估算全國總旅次。一個人旅行三次，就算三旅次；圖表單位是萬旅次。',
    finding: '2025 年旅次高於疫情前 2019 年，並非只有從 2021 年低點回升。',
    limitation: '旅次可以重複計入同一個人；總旅次增加不能代表每個景點或旅宿生意都好。',
    furtherQuestion: '哪些地區、旅遊型態或業者沒有分享到成長？',
    q1: '2025 年國內旅遊旅次，你猜比疫情前 2019 年如何？', options1: ['更少', '相同', '更多'], answer1: 2,
    q2: '一人一年旅行三次，在「旅次」中怎麼計？', options2: ['三旅次', '一旅次', '無法重複計入'], answer2: 0,
    overclaim: '全國旅次增加，就能證明每家旅宿都賺得更多。',
  },
  {
    number: '03', group: '生活', title: '上班族都討厭自己的工作？', subtitle: '社群上的抱怨，和受訪勞工的回答。', chartTitle: '受訪勞工對整體工作的滿意度',
    scope: '2025 年 5 月勞工調查，有效樣本 4,029 份；參加勞保、就保及職災保險的本國籍受僱勞工。',
    finding: '在這份調查中，「滿意」是占比最高的回答。',
    limitation: '這是受訪者自己對工作的評價，不能代表所有工作者，也不表示工作條件都沒問題。',
    furtherQuestion: '不同職業、工時與薪資的滿意度，有沒有差異？',
    q1: '受訪勞工對整體工作的回答，你猜哪一類最多？', options1: ['不滿意', '普通', '滿意'], answer1: 2,
    q2: '這份工作滿意度調查，問的是哪些人？', options2: ['全台灣所有有工作的人', '有保勞保、就保的本國籍上班族', '只有在網路上抱怨的人'], answer2: 1,
    overclaim: '多數受訪者滿意，所以勞動條件完全不需要改善。',
  },
  {
    number: '04', group: '生活', title: '2016 到 2025 年，離婚對數增加了嗎？', subtitle: '從哪一年開始看，會改變你的結論。', chartTitle: '離婚／終止結婚對數',
    scope: '2016–2025 年，離婚／終止結婚對數（按發生日期統計），單位對。',
    finding: '2025 年高於 2021 年低點，卻低於 2016 年與 2024 年，並非一路上升。',
    limitation: '離婚對數只告訴我們有幾對離婚。要看已婚者的離婚機率，還要知道同一期間有多少已婚人口，選擇合適的算法。',
    furtherQuestion: '如果把已婚人口的多寡也算進去，結果會不會不同？',
    q1: '2025 年離婚／終止結婚對數，比 2016 年如何？', options1: ['更低', '更高', '相同'], answer1: 0,
    q2: '要比較離婚風險，除了對數，還需要什麼？', options2: ['更多單一個案', '只選最低的一年', '同一期間有多少已婚人口'], answer2: 2,
    overclaim: '離婚對數降低，就代表每個人的離婚風險都降低。',
  },
  {
    number: '05', group: '社會安全', title: '住宅火災最常由什麼引起？', subtitle: '最讓人害怕的畫面，未必是最多的原因。', chartTitle: '住宅火災起火原因占比',
    scope: '2022–2024 年合計的住宅火災，單位 %；不是所有場所的火災。',
    finding: '官方發布的三項常見原因中，電氣因素占比最高。',
    limitation: '這是已發生住宅火災的原因分布，不能解讀為一般住宅每年的起火機率。',
    furtherQuestion: '不同屋齡、設備與居住條件，是否需要不同的防火措施？',
    q1: '住宅火災中，你猜哪一項起火原因最多？', options1: ['爐火烹調', '電氣因素', '遺留火種'], answer1: 1,
    q2: '算「住宅火災原因占幾 %」的時候，分母是什麼？', options2: ['全國所有的房子', '全國所有的電器設備', '這幾年實際發生火災的住宅'], answer2: 2,
    overclaim: '電氣因素占 40.1%，代表四成住宅都會起火。',
  },
  {
    number: '06', group: '社會安全', title: '一年有多少「暴力犯罪」？', subtitle: '新聞留下的印象，和一整年的總件數差多少？', chartTitle: '2025 年暴力犯罪總件數',
    scope: '2025 年全臺警政署暴力犯罪發生數；本題比較一整年的總件數，不是各案類的多寡。',
    finding: '2025 年，警政署暴力犯罪全年合計 503 件，接近「約 500 件」。這個數字限定在警政署的統計範圍。',
    limitation: '本統計不等於所有暴力事件，沒有包含未報案的事件。2024 年 9 月起，案件的認定方式改變了，前後數字不能直接比較。',
    furtherQuestion: '新聞帶來的治安印象，和全年件數是否一致？若要判斷個人風險，還需要哪些資料？',
    q1: '憑你平常看新聞的印象，台灣 2025 年暴力犯罪全年合計約有幾件？', options1: ['約 500 件', '約 5,000 件', '約 50,000 件'], answer1: 0,
    q2: '同一件重大案件被多次報導，能直接當成多件犯罪嗎？', options2: ['能，每則新聞就是一件案件', '不能，報導次數不等於發生件數', '能，只要報導來自不同媒體'], answer2: 1,
    overclaim: '新聞常出現暴力案件，就足以認定全年至少發生數萬件暴力犯罪。',
  },
  {
    number: '07', group: '生活', title: '平均月薪近 4.8 萬，多數人都領這麼多？', subtitle: '把所有人的薪水平均，和把薪水排好後看中間那個人，會一樣嗎？', chartTitle: '每人每月經常性薪資：平均數與中位數',
    scope: '2025 年，工業及服務業全體受僱員工（含本國籍、外國籍、全時及部分工時），單位元／月。',
    finding: '經常性薪資平均數為 47,884 元，中位數為 38,406 元；兩個指標不相同。',
    limitation: '經常性薪資不是每月實領金額或包含獎金的總薪資；平均數不代表多數人都領到這個數字。',
    furtherQuestion: '不同產業、工時與年資的薪資分布如何？',
    q1: '你猜 2025 年經常性薪資中位數，比平均數如何？', options1: ['更高', '相同', '更低'], answer1: 2,
    q2: '哪個指標描述薪資分布的中間位置？', options2: ['中位數', '平均數', '最高薪資'], answer2: 0,
    overclaim: '平均月薪近 4.8 萬，表示多數人每月實領至少 4.8 萬。',
  },
  {
    number: '10', group: '生活', title: '再生能源裝置容量有增加嗎？', subtitle: '裝置容量、發電量與政策目標，要分開看。', chartTitle: '年底再生能源累計裝置容量',
    scope: '2021–2025 年年底累計再生能源裝置容量，單位 MW（百萬瓦）。',
    finding: '累計裝置容量從 2021 年 11,585 MW 增至 2025 年 22,872 MW。',
    limitation: '裝置容量不是實際發電量；成長也不能直接證明政策已達標。',
    furtherQuestion: '實際發電量、供電條件和政策目標，各自需要哪些資料？',
    q1: '2025 年再生能源累計裝置容量，比 2021 年如何？', options1: ['更多', '更少', '相同'], answer1: 0,
    q2: '累計裝置容量可以直接說明什麼？', options2: ['全年實際發電量', '當年新增容量', '年底已裝設的容量規模'], answer2: 2,
    overclaim: '裝置容量有成長，所以供電與政策目標都已經解決。',
  },
  {
    number: '11', group: '國旅交通', title: '住房率低，就等於國旅沒人？', subtitle: '當日來回旅遊，會不會出現在旅館客房裡？', chartTitle: '國內旅遊旅次：當日來回與有過夜',
    scope: '2025 年國內旅遊旅次的型態占比；另列 2023–2025 年旅宿住房率作對照。',
    finding: '當日來回占國旅旅次 79.1%；沒有住宿的旅遊也會計入旅次。',
    limitation: '旅次占比是在算旅行次數，住房率是在算客房使用情況。兩個百分比不能直接比較；旅次多，也不表示旅館就沒有經營困難。',
    furtherQuestion: '不同地區、房價與可供客房量，如何影響住房率？',
    q1: '2025 年國旅旅次，你猜哪種型態更多？', options1: ['有過夜', '當日來回', '一樣多'], answer1: 1,
    q2: '旅行次數的占比和旅館住房率，能直接當成同一件事來比較嗎？', options2: ['不能，一個算旅行次數，一個算客房使用情況', '可以，都是百分比', '可以，都是國旅'], answer2: 0,
    overclaim: '國旅旅次增加，就代表旅宿住房率一定上升。',
  },
  {
    number: '12', group: '國旅交通', title: '行人出事主要怪自己亂穿越？', subtitle: '只比較「行人違規穿越」和「車輛未停讓」，就能知道所有事故是誰的責任嗎？', chartTitle: '人車事故：違規穿越與未停讓的紀錄件數',
    scope: '2025 年警方 A1+A2 傷亡事故中的「人與車」事故。只看被列為「第一當事者」的主要原因，比較「行人違規穿越」和「車輛未停讓」這兩類。這是警方的初步記錄，不是最後的責任判定。',
    finding: 'A1 和 A2 合計，記為「車輛未停讓」的件數比「行人違規穿越」多。但只看 A1，兩者是 33 件和 40 件，結果反過來了。',
    limitation: '這裡只選了兩種原因，沒有包含全部行人事故或所有責任因素。警方初步記錄的原因，也不等於法院最後認定的責任。A1 算的是事故件數，不是死亡人數。',
    furtherQuestion: '把其他肇因、道路設計與事故嚴重度一起看，會得到什麼結論？',
    q1: '人和車相撞的死傷車禍裡，警方記為「行人違規穿越」和「車沒讓人」，你猜哪種比較多？', options1: ['行人違規穿越', '車輛沒停讓行人', '一樣多'], answer1: 1,
    q2: '警察在車禍紀錄表寫的「主要肇因」，代表什麼意思？', options2: ['法官最後判定的責任', '雙方各自要負的全部責任', '警察初步記下的主要原因'], answer2: 2,
    overclaim: '這兩項件數比較，證明所有行人事故都由同一方負責。',
  },
  {
    number: '13', group: '國旅交通', title: '事故紀錄裡，超速和分心哪個比較多？', subtitle: '事故紀錄寫的原因是分心，就表示車速完全沒有影響嗎？', chartTitle: '傷亡事故：記為分心與超速的件數',
    scope: '2025 年警方 A1+A2 傷亡事故中，被列為「第一當事者」的主要原因。只比較原表的「恍神緊張心不在焉分心駕駛」和「超速駕駛」這兩類。',
    finding: '記為分心等原因的有 31,838 件，記為超速的有 853 件。這張圖只選了兩類，還有其他事故原因沒有列出。',
    limitation: '一場事故可能有好幾個原因，這裡只看警方記錄的主要原因。記為超速的件數少，也不表示車速和死傷沒有關係。',
    furtherQuestion: '若要討論安全速度，還需要哪些速度、道路與傷亡資料？',
    q1: '警方登記的車禍原因裡，你猜記為「分心」和「超速」哪一種件數比較多？', options1: ['超速駕駛', '一樣多', '分心駕駛'], answer1: 2,
    q2: '警方統計「某種車禍原因有幾件」時，是怎麼算的？', options2: ['只看排第一欄的當事人，被記下哪個主要原因', '把車禍裡所有人的總人數加起來', '只要車速快，就全部算進超速'], answer2: 0,
    overclaim: '超速登錄件數少，代表降低車速沒有安全作用。',
  },
  {
    number: '14', group: '生活', title: '回收廚餘，除了餵豬還去了哪裡？', subtitle: '以前的廚餘送去哪裡？以後還處理得完嗎？這是兩個問題。', chartTitle: '2024 年家戶回收廚餘的再利用去向',
    scope: '2024 年家戶回收廚餘 50.5 萬噸的分類，不含事業廚餘；另參考 2025 年去化專案報告。',
    finding: '2024 年回收的家戶廚餘，最多拿去做堆肥（45.8%），其次是餵豬（42.8%）。但 2025 年專案報告指出，每天仍有近 500 噸的廚餘缺乏處理能力。',
    limitation: '以前有其他處理方式，不表示禁餵豬後就能處理完全部廚餘。這兩份資料的對象也不同：一份只算家戶廚餘，另一份還加上事業廚餘。',
    furtherQuestion: '改用其他方式處理廚餘時，各地還能處理多少？增加設施需要多久、多少錢？',
    q1: '2024 年家戶回收廚餘，哪種去向占比最高？', options1: ['養豬利用', '堆肥再利用', '其他再利用'], answer1: 1,
    q2: '只知道過去有堆肥等去向，能證明什麼？', options2: ['現在已足夠處理所有廚餘', '完全沒有處理缺口', '過去確實有養豬以外的利用方式'], answer2: 2,
    overclaim: '2024 年有其他去向，所以禁餵豬後全部廚餘都處理得完。',
  },
];

// 先測指標理解，不在前測公布後面才要揭曉的數字或趨勢。
const checks: Record<string, { claim: string; alternatives: string[]; explanation: string; investigate: string; reading: string }> = {
  '01': { claim: '全國 PM₂.₅ 年平均能代表每個測站每天的空氣品質。', alternatives: ['同一年不同測站的濃度可能不同。', '判斷其他污染物，需要查它們各自的資料。'], explanation: '年平均把一整年的測量結果算成一個數字；PM₂.₅ 年平均只涵蓋單一污染物，不能回答今天附近測站或其他污染物的情況。', investigate: '你所在地測站的 PM₂.₅ 變化方向與全國一致。', reading: '全國、你所在的地區，以及今天的空氣，分別需要什麼資料？' },
  '02': { claim: '只要知道全國旅次，就能判斷每家旅宿的營收。', alternatives: ['同一人多次旅行會重複計入旅次。', '當日來回的旅遊也可能計入旅次。'], explanation: '旅次計算旅行次數，同一人旅行三次就是三旅次；不是在算有幾個不同的人去旅行，也不是旅館賺了多少錢。', investigate: '各地旅宿營收的變化方向一致。', reading: '「旅次」與「去旅遊的人數」，你會用哪個回答原本的問題？' },
  '03': { claim: '受僱勞工滿意度調查可以代表自營工作者的感受。', alternatives: ['滿意度是受訪者對工作的自評。', '看調查結果時，要先知道它問了哪些人。'], explanation: '調查範圍是符合條件的本國籍受僱勞工，不能直接代表自營工作者、所有工作者或網路發文者。', investigate: '不同工時的受僱勞工有相同的滿意度分布。', reading: '你在社群上看到的抱怨者，和這份調查的受訪對象相同嗎？' },
  '04': { claim: '離婚對數可以直接當成每位已婚者的離婚機率。', alternatives: ['比較趨勢時要指定起訖年份。', '對數與有配偶人口比例是不同指標。'], explanation: '離婚對數是在算有幾對離婚。要比較離婚機率，還得考慮已婚人口多寡，並用相同年份、對象和算法來比較。', investigate: '以有配偶人口為分母的離婚指標呈現相同趨勢。', reading: '「近年」從哪一年算起？換一個起點，答案可能改變嗎？' },
  '05': { claim: '起火原因占比就是一般住宅每年的起火機率。', alternatives: ['住宅火災與所有場所火災的範圍不同。', '原因占比的分母是已發生的住宅火災。'], explanation: '分母是 2022–2024 年統計到的住宅火災，不是全國住宅戶數；原因分布不等於住宅起火機率。', investigate: '不同屋齡住宅的起火原因分布相同。', reading: '這裡的百分比是在已發生的火災中比較，還是在所有住宅中比較？' },
  '06': { claim: '暴力犯罪發生數包括所有已報案與未報案的暴力事件。', alternatives: ['同一案件可能被持續追蹤報導。', '警政署暴力犯罪統計有固定的案類範圍。'], explanation: '同一案件可能被多次、跨媒體報導。報導篇數不能直接換成犯罪件數；本題限定警政署暴力犯罪。', investigate: '你的新聞接觸量與所在地的暴力犯罪發生數同步變化。', reading: '同一事件的追蹤報導，會不會讓你感覺發生了更多案件？' },
  '07': { claim: '平均經常性薪資可以直接當成多數人的實領薪資。', alternatives: ['經常性薪資與包含獎金的總薪資不同。', '平均數和中位數使用不同的計算方式。'], explanation: '把大家的薪水從低到高排好，中位數就是中間的位置；平均數則是把薪水全部加起來，再除以人數，會被高薪或低薪拉動。這兩個數字都不等於每月實際入帳的薪水。', investigate: '不同產業的經常性薪資中位數相同。', reading: '你想知道排在中間的人領多少，還是把所有薪水平均後是多少？' },
  '08': { claim: '每一宅低度用電住宅都已經被逐戶確認空置。', alternatives: ['低度用電依指定月份與用電門檻判定。', '要算占多少，得先知道統計母體總共算了多少住宅。'], explanation: '這裡的「低度用電」是指 11、12 月平均每月用電不超過 60 度。用電少，不表示已經逐戶確認沒人住。', investigate: '低度用電住宅中有固定比例實際空置。', reading: '從用電量能知道什麼？又有哪些居住情況無法直接判定？' },
  '10': { claim: '年底裝置容量可以直接當成全年實際發電量。', alternatives: ['累計容量包含以前年度已裝設的容量。', '是否達標需要另比對目標及期限。'], explanation: '累計裝置容量描述年底已裝設的容量規模，不是當年新增量；發電量還與運轉時間及條件有關。', investigate: '實際發電量的變化幅度與裝置容量相同。', reading: '已裝設多少、實際發多少電、是否達到目標，分別需要什麼指標？' },
  '11': { claim: '國旅旅次占比與旅宿住房率可以直接當成同一指標。', alternatives: ['當日來回旅遊不一定使用旅宿客房。', '住房率的分母與旅次占比不同。'], explanation: '旅次占比比較旅行次數，住房率比較客房使用情況。即使都用百分比，計算對象與分母仍不同。', investigate: '各地可供客房量與房價對住房率的影響相同。', reading: '一次沒有住宿的旅行，會不會出現在旅次與住房率兩份統計中？' },
  '12': { claim: '兩項警方初步肇因件數能決定所有行人事故的最終責任。', alternatives: ['A1 與 A1+A2 是不同的事故範圍。', '初步肇因分類與司法最終責任認定不同。'], explanation: '這是警方初步記錄的主要原因，不是法院最後認定的責任。這兩種原因也沒有包含全部行人事故或所有責任因素。', investigate: '加入其他肇因與道路設計後，責任分布仍相同。', reading: '兩項登記分類涵蓋所有事故嗎？初判與最終責任有什麼差別？' },
  '13': { claim: '主要肇因只有登記一類，就能排除其他因素的影響。', alternatives: ['這項比較只涵蓋兩種主要肇因分類。', '有幾場事故，和有幾個人遇到事故，是兩回事。'], explanation: '數字是第一當事者主要肇因的登記件數，不是所有涉入人數或所有風險因素的次數。速度可能影響事故後果，即使未被登記為主要肇因。', investigate: '不同道路條件下，車速與傷亡嚴重度的關係相同。', reading: '一件事故可能同時有多個因素，主要肇因欄位能記下所有因素嗎？' },
  '14': { claim: '過去有堆肥去向，就代表目前容量足夠處理全部廚餘。', alternatives: ['以前送去哪裡，和現在能處理多少，要看不同資料。', '家戶廚餘與家戶加事業廚餘的範圍不同。'], explanation: '2024 年堆肥再利用占 45.8%，高於養豬利用的 42.8%。歷史上有其他去向，只能證明它們曾被使用，不能證明目前容量足夠。', investigate: '各縣市的替代處理設施能在相同時間完成。', reading: '過去送去哪裡，與現在還能處理多少，是同一個問題嗎？' },
};

const termNotes: Record<string, { plain: string; q2Plain?: string }> = {
  '01': { plain: 'PM₂.₅ 是細懸浮微粒，單位是微克／立方公尺（µg/m³）。' },
  '02': { plain: '本題比較 2019–2025 年 12 歲以上國人的國內旅遊總旅次（單位：萬旅次）。' },
  '03': { plain: '本題引用勞動部 2025 年 5 月勞工生活及就業狀況調查（有效樣本 4,029 份）。' },
  '04': { plain: '「離婚對數」是按實際發生日期統計當年完成離婚登記的伴侶對數。' },
  '05': { plain: '本題看的是 2022–2024 年建築物「住宅火災」常見起火原因，不包含非住宅場所。' },
  '06': { plain: '警政署的「暴力犯罪」只包含故意殺人、強盜、搶奪、重傷害、強制性交等指定案類，不含一般傷害或街頭糾紛。' },
  '07': { plain: '「經常性薪資」是指本薪與按月固定發放的津貼，不包含年終獎金、績效獎金與加班費。' },
  '10': { plain: '單位 MW（百萬瓦）是發電設備的裝置功率規模單位。' },
  '11': { plain: '國旅型態分為「當日來回」與「有過夜」兩類；旅館住用率則是統計客房實際住人的比例。' },
  '12': {
    plain: 'A1 是造成人員當場或 24 小時內死亡的車禍，A2 是造成人員受傷的車禍；「第一當事者」是警方事故表排第一欄的人。',
  },
  '13': {
    plain: 'A1 是 24 小時內死亡車禍、A2 是受傷車禍；本題比較警方紀錄表中的「分心駕駛」與「超速駕駛」兩類。',
  },
  '14': { plain: '這題統計的是家戶回收廚餘的再利用去向，不包含餐廳、市場等事業廚餘。' },
};

function question(
  id: string,
  tag: string,
  prompt: string,
  labels: string[],
  fact: string,
  plainNote?: string,
  termDetail?: string
): IntuitionQuestion {
  return {
    id,
    tag,
    prompt,
    plainNote,
    termDetail,
    options: labels.map((label, i) => ({ id: String(i), label })),
    realityFact: fact,
  };
}

export const topicCases: ResearchCase[] = specs.map(spec => {
  const workbook = workbooks.find(w => w.number === spec.number)!;
  const check = checks[spec.number];
  const series: TopicSeries[] = workbook.series.map((s, i) => ({
    title: i === 0 ? spec.chartTitle : '旅館有多少客房住了人？（不能直接和旅次占比比較）',
    unit: s.unit, kind: /^\d{4}$/.test(s.points[0].label) ? 'line' : 'bar',
    predictionMaximum: s.unit === '%' ? 100 : ({ '01': 25, '02': 32000, '04': 80000, '06': 200, '07': 60000, '10': 32000, '12': 6000, '13': 40000 } as Record<string, number>)[spec.number],
    knownFirst: spec.number === '07',
    points: s.points.map(p => ({ ...p,
      note: spec.number === '06' && p.label === '重大恐嚇取財' ? '原表為「—」；提供的製圖表以 0 顯示'
        : (spec.number === '05' && p.label === '其他原因') || (spec.number === '08' && p.label === '其餘稅籍住宅')
          || (spec.number === '11' && p.label === '有過夜')
          ? '用 100% 減掉官方公布的其他占比算出，可能有四捨五入誤差' : undefined,
    })),
  }));
  const supportingSeries = spec.number === '06' ? series.map(s => ({ ...s, title: '案類明細（補充查核）' })) : undefined;
  if (spec.number === '06') {
    const total = workbook.series[0].points.reduce((sum, p) => sum + p.value, 0);
    series.splice(0, series.length, { title: spec.chartTitle, unit: '件', kind: 'bar', predictionControl: 'slider', predictionMaximum: 30000, points: [{ label: '全年合計', value: total, note: '由提供的案類製圖值加總；重大恐嚇取財原表為「—」，未自行補入其他案件。' }] });
  }
  const detailNote = `${spec.scope} ${spec.number === '06' ? workbook.meta['統計口徑與注意事項'].replace('七類合計', '指定案類合計') : workbook.meta['統計口徑與注意事項']}`;
  const questions = [
    question('q1', '先猜結果', spec.q1, spec.options1, spec.finding, termNotes[spec.number]?.plain, detailNote),
    question('q2', spec.number === '06' ? '報導與件數' : '這個數字在算什麼', spec.q2, spec.options2, check.explanation, termNotes[spec.number]?.q2Plain),
    question('q3', '這樣說有根據嗎', '討論這項議題的統計資料時，下面哪一句話屬於「過度推論」？',
      [check.claim, ...check.alternatives], spec.limitation),
  ];
  // 依案例調整排列；選項 ID 保持不變，核對答案不受顯示位置影響。
  questions.forEach((q, i) => { const shift = (Number(spec.number) + i) % q.options.length; q.options = [...q.options.slice(shift), ...q.options.slice(0, shift)]; });
  return {
    id: `topic-${spec.number}`, group: spec.group, title: spec.title, subtitle: spec.subtitle,
    status: 'active', verificationStatus: 'verified', simulationBadgeText: '官方統計｜附計算說明',
    period: workbook.meta['資料期間'], region: '臺灣', description: [spec.scope, spec.limitation],
    categories: [], articles: topicNews[spec.number], reflectionPrompts: [], intuitionQuestions: questions,
    newsSampleMeta: { totalArticles: topicNews[spec.number].length, sampleUnit: '篇', source: '人工選錄公視新聞網與中央社相關報導', searchKeywords: [spec.title], notes: '這六篇是我們挑來一起讀的新聞，不能代表全部新聞的數量或比例。有些是同一事件的後續報導，有些年份或統計對象不同，各篇提醒會說明。' },
    officialDataMeta: { totalAccidents: 0, officialUnit: series[0].unit, source: workbook.sources[0].title, definition: spec.scope, notes: spec.number === '06' ? workbook.meta['統計口徑與注意事項'].replace('七類合計', '指定案類合計') : workbook.meta['統計口徑與注意事項'] },
    topic: {
      file: workbook.file, sha256: workbook.sha256, workbookUrl: resolvePublicUrl(workbook.workbookUrl),
      sources: workbook.sources.map(s => ({ ...s, url: resolvePublicUrl(s.url) })), series, supportingSeries, scope: spec.scope, finding: spec.finding,
      limitation: spec.limitation, furtherQuestion: spec.furtherQuestion,
      overclaim: check.claim, investigation: check.investigate, readingPrompt: check.reading,
      correctAnswers: { q1: String(spec.answer1), q2: String(spec.answer2), q3: '0' },
    },
  };
});
