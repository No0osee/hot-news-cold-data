import type { ResearchCase } from '../types/game';
import { topicCases } from './topics';

export const elderlyDriverCase: ResearchCase = {
  id: 'elderly_driver',
    title: '高齡駕駛：新聞與事故數據',
    subtitle: '新聞裡常看到高齡車禍，整年的事故資料也是這樣嗎？',
    status: 'active',
    verificationStatus: 'verified',
    simulationBadgeText: '資料來源：警政署 114 年 A1/A2 逐案資料',
    period: '新聞：2025–2026 年｜事故資料：2025 年',
    region: '全國',
    description: [
      '重大交通事故發生後，同一事件可能接連產生事故進展、制度檢討與政策回應等多篇新聞。',
      '同一場事故，報導可以聚焦傷亡、換照制度，也可以追問路口設計與移動需求。',
      '本單元閱讀有來源的報導，再對照警政署傷亡事故逐案資料；這些數字只算符合條件的紀錄，不能直接告訴你某個人開車有多危險。'
    ],
    categories: [
      {
        id: 'youth',
        label: '青年駕駛 (18-24歲)',
        shortLabel: '青年 (18-24)',
        color: '#31546b',
        borderClass: 'border-blue-700',
        badgeClass: 'bg-blue-800 text-white',
        newsCount: 0,
        officialCount: 63972,
        population: 1563132,
        ratePer100k: 4092.6,
        description: '18–24 歲；與高齡組採同一年度、同一傷亡事故類型及第一當事者車種篩選口徑。每十萬戶籍人口的第一當事者登記筆數約為高齡組的 3.07 倍；這不是每位駕駛人的事故機率。'
      },
      {
        id: 'adult',
        label: '青壯年駕駛 (25-64歲)',
        shortLabel: '青壯年 (25-64)',
        color: '#4e6042',
        borderClass: 'border-emerald-800',
        badgeClass: 'bg-emerald-900 text-white',
        newsCount: 0,
        officialCount: 258966,
        population: 13819381,
        ratePer100k: 1873.9,
        description: '25–64 歲的紀錄占這三組總筆數的 67.2%，也就是約三分之二。'
      },
      {
        id: 'elderly',
        label: '高齡駕駛 (65歲以上)',
        shortLabel: '高齡 (65+)',
        color: '#8d2e25',
        borderClass: 'border-red-600',
        badgeClass: 'bg-red-700 text-white',
        newsCount: 0,
        officialCount: 62222,
        population: 4673155,
        ratePer100k: 1331.5,
        description: '65 歲以上；2025 年 A1+A2 傷亡事故逐案檔，取第一當事者、年齡可辨且車種不為「人」或空白。第一當事者不等於法院認定的肇事責任。'
      }
    ],
    newsSampleMeta: {
      totalArticles: 6,
      sampleUnit: '則',
      source: '人工選錄公視新聞網 6 篇：4 篇高齡相關、2 篇其他事故；高齡相關篇中 3 篇圍繞同一件三峽事故',
      searchKeywords: ['車禍暴衝', '老翁車禍', '路口碰撞', '高齡換照'],
      notes: '這六篇是我們挑來一起讀的新聞，不能代表全臺媒體報導的比例。四篇和高齡駕駛有關，但只談到兩場事故：其中三篇都在追蹤三峽同一場事故。所以四篇新聞不等於四場事故。'
    },
    officialDataMeta: {
      totalAccidents: 385160,
      officialUnit: '件',
      source: '內政部警政署「114 年傷亡道路交通事故資料」A1+A2 逐案檔 ＋ 內政部戶政司 114 年底戶籍人口統計',
      definition: '2025 年 A1+A2；當事者順位＝1、年齡介於 18 歲以上、車種不為「人」且非空白。這是符合條件的當事者筆數，不是所有道路事故，也不是法院最終肇責。',
      notes: '本專題以 2025 年 A1/A2 第一當事者登記筆數除以同年年底戶籍人口，自行計算每十萬人登記筆數：18–24 歲 4,092.6、25–64 歲 1,873.9、65 歲以上 1,331.5；青年約為高齡組的 3.07 倍。'
    },
    articles: [
      {
        id: 'art_1',
        title: '三峽汽車衝撞人群釀3死 初判78歲肇事駕駛無酒駕',
        media: '公視新聞網 PNN',
        date: '2025-05-20',
        summary: '新北三峽北大國小外發生重大死傷車禍，78歲余姓老翁駕車不明原因突失控暴衝，撞向放學過路學童與停等紅燈機車騎士，釀3死、12人輕重傷。警方初步調查排除酒駕，詳細事故肇因仍由專案小組進一步調查。',
        url: 'https://news.pts.org.tw/article/751995',
        contextNote: '2025 年三峽事故的初期報導；與本關換照檢討、政策回應兩篇屬同一事件。傷亡數保留發布當時的資訊。',
        categoryId: 'elderly',
      },
      {
        id: 'art_2',
        title: '屏東車城軍車對撞機車 造成女騎士傷重不治',
        media: '公視新聞網 PNN',
        date: '2025-06-15',
        summary: '屏東縣車城鄉發生一起汽機車對撞死亡車禍，一輛軍車行經路段時與對向機車發生猛烈撞擊，導致33歲機車女騎士傷勢嚴重，緊急送醫搶救宣告不治。警方現場實施酒測雙方均無酒駕，車禍責任歸屬仍有待釐清。',
        url: 'https://news.pts.org.tw/article/756170',
        contextNote: '其他年齡的事故對照：報導中的軍車駕駛為 26 歲、機車騎士為 33 歲，責任仍待釐清。',
        categoryId: 'adult',
      },
      {
        id: 'art_3',
        title: '三峽車禍78歲翁2月才換照 民團籲建立回訓與淘汰機制',
        media: '公視新聞網 PNN',
        date: '2025-05-20',
        summary: '三峽事故後，報導指出 78 歲駕駛於當年 2 月完成換照。路權團體提出檢討駕駛制度、違規記點與高風險駕駛再教育；專家則提醒，評估應注意認知、反應與協調功能，不能只看年齡。',
        url: 'https://news.pts.org.tw/article/752037',
        contextNote: '追蹤同一件三峽事故，聚焦換照與制度討論，不是另一起新發生的事故。',
        categoryId: 'elderly',
      },
      {
        id: 'art_4',
        title: '台中76歲駕駛逆向衝撞釀1死 警方：去年照舊規完成換照',
        media: '公視新聞網 PNN',
        date: '2026-05-31',
        summary: '台中市發生嚴重失控車禍，一名76歲莊姓老翁開車越過雙黃線逆向衝撞對向機車騎士，再波及路旁車輛與電線桿後翻覆，38歲機車騎士傷重送醫不治。警方證實老翁去年依舊制完成換照，初步排除酒駕與毒駕。報導後段介紹 5 月 31 日上路的高齡換照新制：年齡下修至 70 歲，並加強體格與認知功能檢查。',
        url: 'https://news.pts.org.tw/article/810828',
        contextNote: '2026 年臺中另一起事故，不計入下一關的 2025 年官方統計；政策狀態以報導當時為準。',
        categoryId: 'elderly',
      },
      {
        id: 'art_5',
        title: '屏科大新生校內騎機車 自撞分隔島送醫不治',
        media: '公視新聞網 PNN',
        date: '2025-10-02',
        summary: '屏東科技大學校內發生死亡車禍，一名邱姓大一男學生騎乘機車行經體育館前，過彎時撞上分隔島後倒地失去意識，緊急送醫仍告不治。警方表示自摔原因仍在調查；學校說明已對新生宣導交通安全，並曾與警方會勘改善校內道路。',
        url: 'https://news.pts.org.tw/article/773226',
        contextNote: '青年事故對照：大一新生在校內自摔，詳細原因仍在調查，不能只憑報導認定超速。',
        categoryId: 'youth',
      },
      {
        id: 'art_6',
        title: '交通部下修高齡駕駛換照年齡至70歲 增檢測項目、繳回駕照補助',
        media: '公視新聞網 PNN',
        date: '2025-05-20',
        summary: '三峽汽車衝撞造成重大傷亡後，交通部火速召開記者會宣布修改高齡換照制度，換照年齡由75歲下修至70歲，新增四肢靈活與認知檢測，違規者增設實地訓練，並提供自願繳回駕照者大眾運輸補助。',
        url: 'https://news.pts.org.tw/article/752086',
        contextNote: '同一件三峽事故後的政策回應；報導當時為宣布調整方向，不表示全部措施已施行。',
        categoryId: 'elderly',
      }
    ],
    reflectionPrompts: [
      {
        id: 'rf1',
        question: '六篇選例中有四篇與高齡駕駛有關，其中三篇都圍繞同一件三峽事故。「四篇報導」等於「四起高齡事故」嗎？',
        explanation: '不等於。三峽事故分別衍生事故進展、換照檢討及政策回應，另有一篇台中事故；四篇高齡相關報導只涉及兩起高齡事故。計算新聞篇數時，須另記錄其所對應的事故事件。'
      },
      {
        id: 'rf2',
        question: '同一件三峽事故的三篇報導，分別著重了哪些內容？只看這些報導，還缺少什麼背景才能判斷事故分布？',
        explanation: '報導分別著重死傷與事發經過、駕駛換照紀錄、政府的政策回應。每篇提供的資訊不同，但幾篇新聞不能代替整年的事故資料。要知道新聞是否改變了讀者的想法，還需要實際測試。'
      },
      {
        id: 'rf3',
        question: '若要研究「高齡事故是否在新聞中被報得比較多」，這六篇選例和官方事故筆數之外，還必須補哪些資料？',
        explanation: '先界定相同期間與媒體範圍，取得完整新聞清單，標註報導主題並去重、區分篇數與獨立事故數；再與定義相容的官方事故資料比較。若要證明報導安排會改變讀者估計，還須另做有對照條件的使用者測試。'
      }
    ],
    intuitionQuestions: [
      {
        id: 'q_risk_impression',
        tag: '考慮人口多寡',
        prompt: '如果把各年齡層的人數差算進去（換算成每十萬人有幾筆車禍紀錄），你猜哪一組最高？',
        plainNote: '把不同人數的年齡組都換算成每十萬人，才好比較；「第一當事者」是警方事故紀錄表排在第一欄的人，不等於法院最後認定的肇事責任。',
        termDetail: '資料範圍：2025 年警政署 A1+A2 傷亡道路交通事故逐案檔，取當事者順位＝1、年齡 18 歲以上、車種不為「人」且非空白之登記筆數，再除以 114 年底各年齡組戶籍人口數，換算為每十萬名戶籍人口筆數。',
        realityFact: '本專題以同年資料自行計算：18–24 歲每十萬戶籍人口約 4,093 筆、25–64 歲約 1,874 筆、65 歲以上約 1,332 筆，青年組約為高齡組的 3.07 倍。',
        options: [
          { id: 'q1_youth', label: '18–24 歲', biasTag: 'youth' },
          { id: 'q1_adult', label: '25–64 歲', biasTag: 'adult' },
          { id: 'q1_elderly', label: '65 歲以上', biasTag: 'elderly' }
        ]
      },
      {
        id: 'q_majority_impression',
        tag: '哪組總筆數最多',
        prompt: '如果不管各年齡層有多少人，單看整年被記在第一欄的車禍總筆數，你猜哪一組最多？',
        plainNote: '這題直接比較三個年齡組被記在第一當事者欄位的總筆數，不除以各組人口數。',
        realityFact: '2025 年警政署逐案紀錄中，25–64 歲青壯年第一當事者登記為 258,966 筆，佔本專題三大年齡組總量的 67.2%（近七成）；18–24 歲（63,972 筆）與 65 歲以上（62,222 筆）各約佔 16%。比較限於本專題篩選的三組第一當事者紀錄。',
        options: [
          { id: 'q2_youth', label: '18–24 歲 (青年)', biasTag: 'youth' },
          { id: 'q2_adult', label: '25–64 歲 (青壯年)', biasTag: 'adult' },
          { id: 'q2_elderly', label: '65 歲以上 (高齡)', biasTag: 'elderly' }
        ]
      },
      {
        id: 'q_elderly_share',
        tag: '高齡組占多少',
        prompt: '在這三組年齡層的車禍紀錄裡，你猜 65 歲以上占了多少？',
        realityFact: '在本專題篩選的警政署 114 年三大年齡組第一當事者紀錄中，65 歲以上為 62,222 筆，佔 16.2%（約一成六）；25–64 歲為 258,966 筆，佔 67.2%。高齡組並非這三組登記筆數的多數。',
        options: [
          { id: 'q3_majority', label: '約五成至六成 (50%–60%)', biasTag: 'majority' },
          { id: 'q3_middle', label: '約三到四成 (30%–40%)', biasTag: 'middle' },
          { id: 'q3_minority', label: '約一成至二成 (10%–20%)', biasTag: 'accurate' }
        ]
      }
    ]
};

export const unlicensedVsDuiCase: ResearchCase = {
    id: 'unlicensed_vs_dui',
    title: '酒後駕車 vs 無照駕駛',
    subtitle: '新聞檢索能見度、官方取締紀錄與統計口徑檢視',
    status: 'active',
    verificationStatus: 'verified',
    simulationBadgeText: '【警政署酒駕通報與交通部公路局第21條統計】',
    period: 'OpView 檢索期：2024/08/01–2025/08/21 ｜ 取締統計：民國114年',
    region: '全國',
    description: [
      '酒後駕車與無照駕駛在日常新聞中的能見度存在顯著差異，引發公眾對兩類違規行為的不同關注。',
      '然而，不同機關所發布的官方執法統計各自採用不同法規定義與統計口徑。',
      '本單元分別呈現新聞檢索量與官方取締資料，並說明不同指標之間的比較限制與口徑差異。'
    ],
    categories: [
      {
        id: 'dui',
        label: '酒後駕車 (DUI)',
        shortLabel: '酒駕',
        color: '#8d2e25',
        borderClass: 'border-red-600',
        badgeClass: 'bg-red-700 text-white',
        newsCount: 216691,
        officialCount: 56303,
        description: '呼氣酒精濃度達 0.15mg/L 以上取締及拒測（114年警政署全年警察機關取締總件數：56,303 件）'
      },
      {
        id: 'unlicensed',
        label: '無照駕駛',
        shortLabel: '無照',
        color: '#31546b',
        borderClass: 'border-blue-700',
        badgeClass: 'bg-blue-800 text-white',
        newsCount: 30648,
        officialCount: 147668,
        description: '道路交通管理處罰條例第21條（114年公路局汽機車未領照等4欄位取締合計：147,668 件；非全國總數）'
      }
    ],
    newsSampleMeta: {
      totalArticles: 247339,
      sampleUnit: '則',
      source: 'OpView 社群口碑資料庫於 2024/08/01–2025/08/21 依特定關鍵詞之新聞檢索結果',
      searchKeywords: ['酒駕', '無照駕駛'],
      notes: '此數據為 OpView 特定查詢設定下的檢索總量（酒駕約為無照 7.1 倍），未留存完整去重與收錄媒體清單，不能視為全臺所有新聞或社群情緒。頁面 6 張卡片為人工策展示例，刻意各挑 3 篇，不能推論檢索比例。'
    },
    officialDataMeta: {
      totalAccidents: 0,
      officialUnit: '件',
      source: '內政部警政署《114年警察機關取締酒後駕車概況》＋ 交通部公路局《道交條例第21條取締性別統計》',
      definition: '警政署酒駕取締件數（56,303 件）為警察取締總量；公路局無照取締（147,668 件）為第 21 條汽機車男女 4 欄合計，非全國總數。',
      notes: '重要限制說明：兩來源主管機關與統計口徑不同，不得相加視為同一母體計算佔比，更無法由此推定個人肇事風險。'
    },
    articles: [
      {
        id: 'u1',
        title: '東湖少年無照駕車奪3命 涉過失致死裁定收容',
        media: '公視新聞網 PNN',
        date: '2024-10-18',
        summary: '台北市內湖區東湖路發生15歲少年無照駕車衝撞小吃攤致3死事故，士林地院少年法庭裁定收容，引發社會對無照處罰與監護責任的討論。',
        url: 'https://news.pts.org.tw/article/720151',
        categoryId: 'unlicensed',
      },
      {
        id: 'u2',
        title: '無照駕駛成道安隱憂 交通部擬修法加重處罰與扣車扣牌',
        media: '公視新聞網 PNN',
        date: '2025-06-12',
        summary: '針對無照駕駛事故與道安管理，交通部研議修法提高罰鍰上限、增加扣牌扣車規範，同時評估駕訓教育與偏鄉大眾運輸配套。',
        url: 'https://news.pts.org.tw/article/755817',
        categoryId: 'unlicensed',
      },
      {
        id: 'u3',
        title: '【TNL圖表】台灣無照駕駛有多嚴重？數據顯示死傷人數比酒駕更多',
        media: '關鍵評論網 The News Lens',
        date: '2025-06-17',
        summary: '資料新聞整理官方統計，比對無照駕駛與酒後駕車之取締與事故數據，探討非都會區公共運輸缺乏與駕照管理等結構脈絡。',
        url: 'https://www.thenewslens.com/article/254411',
        categoryId: 'unlicensed',
      },
      {
        id: 'd1',
        title: '澎湖軍人遭酒駕撞死 肇事駕駛酒測值超標依法送辦',
        media: '公視新聞網 PNN',
        date: '2024-11-14',
        summary: '澎湖縣發生休假軍人遭自小客車追撞身亡事故，警方現場施測駕駛酒測值超標，全案依公共危險及過失致死罪嫌移送檢方偵辦。',
        url: 'https://news.pts.org.tw/article/724289',
        categoryId: 'dui',
      },
      {
        id: 'd2',
        title: '台中酒駕致死傷案例頻傳 地方民代籲加強執法與防制宣導',
        media: '公視新聞網 PNN',
        date: '2025-03-10',
        summary: '台中市發生酒後駕車致人死傷事故，報導討論執法與防制措施，文中亦提及部分涉案駕駛具有無照紀錄，顯示兩類違規樣態可能重疊。',
        url: 'https://news.pts.org.tw/article/741380',
        categoryId: 'dui',
      },
      {
        id: 'd3',
        title: '台東警方強化酒駕與重點違規取締 統計顯示執法件數趨勢',
        media: '公視新聞網 PNN',
        date: '2025-07-17',
        summary: '台東縣警局公布專案取締成果，分析不同路段與時段酒後駕車案件變化，說明持續執法與落實防制對降低事故之成效。',
        url: 'https://news.pts.org.tw/article/761216',
        categoryId: 'dui',
      }
    ],
    reflectionPrompts: [
      {
        id: 'rf_dui1',
        question: '為什麼新聞檢索量與官方取締件數會呈現顯著差異？',
        explanation: '媒體選題常受事件戲劇性、公眾關注度與道德批判焦點影響；而官方執法資料則依行政稽查規範記錄，兩者反映不同的社會運作機制。'
      },
      {
        id: 'rf_dui2',
        question: '在比對官方取締資料時，為什麼不能將警政署酒駕與公路局第 21 條數據合併計算全國比例？',
        explanation: '兩者主管機關、稽查範圍與法規依據不同。公路局 147,668 件僅為特定四欄合計，非全國所有無照取締總數；強行合併計算比例會造成方法論偏誤。'
      },
      {
        id: 'rf_dui3',
        question: '面對重大車禍事件時，報導常聚焦於加重處罰，閱聽人應如何審視相關討論？',
        explanation: '單一法律重罰訴求往往忽視了不同違規樣態（如偏鄉交通缺乏、累犯成因、考照駕訓機制）。理性公共討論需檢視更多結構數據與配套措施。'
      }
    ],
    intuitionQuestions: [
      {
        id: 'q_dui_media',
        tag: '媒體曝光印象',
        prompt: '憑你平時瀏覽新聞或社群推播的日常經驗，關於「酒後駕車」與「無照駕駛」，你覺得哪一類事件的新聞曝光度明顯較高？',
        realityFact: '在特定檢索期內，酒駕相關新聞量（216,691 則）約為無照駕駛（30,648 則）的 7.1 倍，呈現極高的新聞曝光度與道德譴責性。',
        options: [
          { id: 'media_dui_heavy', label: '酒後駕車 相關報導明顯較常看見', biasTag: 'accurate' },
          { id: 'media_both', label: '兩者新聞報導 出現頻率大致相近', biasTag: 'equal' },
          { id: 'media_unlicensed_heavy', label: '無照駕駛 相關報導較常看見', biasTag: 'counter' }
        ]
      },
      {
        id: 'q_dui_enforcement',
        tag: '執法規模印象',
        prompt: '脫離新聞版面、回到官方全年的執法紀錄，憑你的直覺推測，警察取締「酒駕」的件數，與主管機關處分「無照駕駛」的件數，何者規模較大？',
        realityFact: '官方執法資料顯示：公路局第 21 條（汽機車未領照等4欄）處分合計達 147,668 件，而警政署酒駕取締為 56,303 件。無照在執法裁處件數上規模龐大，但新聞能見度卻相對偏低。',
        options: [
          { id: 'unlicensed_enforce_more', label: '直覺認為「無照駕駛」處分件數 規模較大', biasTag: 'accurate' },
          { id: 'dui_enforce_more', label: '直覺認為「酒後駕車」取締件數 規模較大', biasTag: 'high_stigma' },
          { id: 'equal_enforce', label: '兩者執法取締規模 大致相當', biasTag: 'equal' }
        ]
      },
      {
        id: 'q_dui_framing',
        tag: '違規樣態與日常認知',
        prompt: '在重大車禍新聞中常看見「少年無照釀禍」。但若檢視主管機關的處分樣態，你認為「無照駕駛」主要是哪些族群？',
        realityFact: '官方裁罰樣態與實務分析顯示：無照駕駛成因多元，除了未成年無照通學或生活代步外，很大比例是「成年人駕照遭吊銷或吊扣後仍駕車」、甚至偏鄉缺乏公共運輸之代步需求。若新聞僅聚焦特定青少年個案，容易窄化制度性問題。',
        options: [
          { id: 'framing_diverse', label: '涵蓋多元成因（包含駕照遭吊扣銷後仍上路、逾期未換照、偏鄉代步等）', biasTag: 'accurate' },
          { id: 'framing_teen_mostly', label: '絕大多數都是未滿 18 歲的未成年青少年', biasTag: 'counter' },
          { id: 'framing_outlaw', label: '絕大多數都是故意拒絕考照的慣性違規者', biasTag: 'high_stigma' }
        ]
      }
    ]
};

// 原有事故案例保留；新增議題由提供的官方製圖工作簿匯入。
export const casesData: ResearchCase[] = [
  { ...elderlyDriverCase, group: '國旅交通' },
  ...topicCases
];
