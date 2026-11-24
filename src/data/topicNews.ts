import type { NewsArticle } from '../types/game';

// 人工選例；標題及日期保留原站內容，摘要與閱讀提醒由專題整理。
export const topicNews: Record<string, NewsArticle[]> = {
  "10": [
    {
      "id": "topic-10-news-1",
      "title": "全台離岸風機建置完成500座 能源署：持續擴大綠能建設",
      "media": "公視新聞網 PNN",
      "date": "2026-06-15",
      "summary": "離岸風機建置達成里程碑，報導裝置容量、企業綠電需求及後續規劃。",
      "url": "https://news.pts.org.tw/article/813128",
      "contextNote": "報導為 2026 年進度；裝置容量與實際發電量的單位不同。"
    },
    {
      "id": "topic-10-news-2",
      "title": "城市光電找屋頂｜私有建築能否突破發展困境？【我們的島】",
      "media": "公視新聞網 PNN",
      "date": "2025-02-19",
      "summary": "報導學校、公民電廠與私有屋頂裝設光電的模式，以及推動上的困難。",
      "url": "https://news.pts.org.tw/article/737975",
      "contextNote": "屋頂型光電是再生能源的一部分，不能直接當成全部再生能源容量。"
    },
    {
      "id": "topic-10-news-3",
      "title": "302坪以上新建物強制設光電 內政部估年增66萬瓩裝置容量",
      "media": "公視新聞網 PNN",
      "date": "2025-12-23",
      "summary": "報導新建物設置光電的標準與預估新增容量，呈現政策如何推動建置。",
      "url": "https://news.pts.org.tw/article/787190",
      "contextNote": "預估新增量是政策估算，不是已完成裝置量；保留報導當時的政策時間。"
    },
    {
      "id": "topic-10-news-4",
      "title": "風電海纜與海洋｜定置漁場業者擔心什麼？【我們的島】",
      "media": "公視新聞網 PNN",
      "date": "2025-04-23",
      "summary": "苗栗定置漁場業者談海纜與風機建置的疑慮，報導不同利害關係人的觀察。",
      "url": "https://news.pts.org.tw/article/747314",
      "contextNote": "居民疑慮不是已確認的因果；本題容量圖也無法回答生態影響。"
    },
    {
      "id": "topic-10-news-5",
      "title": "經部電力供需報告　再生能源目標改看裝置容量",
      "media": "中央社 CNA",
      "date": "2026-06-18",
      "summary": "經濟部電力供需報告改以裝置容量檢討再生能源目標，說明規劃與指標調整。",
      "url": "https://www.cna.com.tw/news/afe/202606180353.aspx",
      "contextNote": "報導同時包含已建容量及未來目標，兩者不能合併成實際成果。"
    },
    {
      "id": "topic-10-news-6",
      "title": "AI淨零／經部：綠能目標改看裝置容量　更務實滿足企業需求",
      "media": "中央社 CNA",
      "date": "2026-04-17",
      "summary": "經濟部說明增列裝置容量指標的理由，並回應用電需求與綠能發展爭議。",
      "url": "https://www.cna.com.tw/news/afe/202604170332.aspx",
      "contextNote": "這是政府對政策的說明；容量成長與是否達成原發電占比目標須分別檢驗。"
    }
  ],
  "11": [
    {
      "id": "topic-11-news-1",
      "title": "國內旅宿業上半年營運概況揭曉 住房率、平均房價皆比去年下降",
      "media": "公視新聞網 PNN",
      "date": "2024-08-28",
      "summary": "報導 2024 年上半年旅宿住房率、房價及花蓮震後旅遊信心的變化。",
      "url": "https://news.pts.org.tw/article/712068",
      "contextNote": "半年資料與本題全年住房率不同，且房價不等於住宿率。"
    },
    {
      "id": "topic-11-news-2",
      "title": "春節連假訂房率達41.28% 觀光署：高峰落在初一至初三",
      "media": "公視新聞網 PNN",
      "date": "2025-01-14",
      "summary": "春節前公布訂房率，業者與政府討論假期長短、出國選擇及旺日房價。",
      "url": "https://news.pts.org.tw/article/733695",
      "contextNote": "預訂房間與事後實際客房住用率不同；連假也不是全年平均。"
    },
    {
      "id": "topic-11-news-3",
      "title": "國旅2.22億人次創新高 住房率低成觀光課題",
      "media": "公視新聞網 PNN",
      "date": "2025-07-26",
      "summary": "國旅旅次增加，宜蘭民宿卻面對平日住房率偏低，業者提出吸引旅客的方案。",
      "url": "https://news.pts.org.tw/article/762694",
      "contextNote": "旅次是在算旅行次數，過夜比例是在算有住宿的旅行占多少，住房率則是在算客房使用情況，不能直接當成同一件事。"
    },
    {
      "id": "topic-11-news-4",
      "title": "國旅人次、支出創歷年新高 近8成「當天來回」住宿率低",
      "media": "公視新聞網 PNN",
      "date": "2026-08-04",
      "summary": "2025 年國旅總旅次創高，但近八成旅遊當日往返，報導住宿與景點吸引力。",
      "url": "https://news.pts.org.tw/article/820745",
      "contextNote": "旅遊調查與旅宿營運統計不是同一張表；旅次增加不保證每家旅館客滿。"
    },
    {
      "id": "topic-11-news-5",
      "title": "觀光署公布2025旅宿業調查 旅館每晚平均2984民宿2438元",
      "media": "公視新聞網 PNN",
      "date": "2026-02-26",
      "summary": "公布 2025 年合法旅宿營運調查，並討論平均房價與旅客實際感受的落差。",
      "url": "https://news.pts.org.tw/article/796611",
      "contextNote": "住客人次、客房住用率、平均房價各有定義，不可用人次直接推算住房率。"
    },
    {
      "id": "topic-11-news-6",
      "title": "春節國旅訂房率較去年下滑 業者認開學時間與出國影響",
      "media": "公視新聞網 PNN",
      "date": "2024-01-30",
      "summary": "春節訂房率下滑，業者提出開學、出國與旅宿缺工等可能因素。",
      "url": "https://news.pts.org.tw/article/678814",
      "contextNote": "2024 年連假預訂狀況，只能作為特定時段的觀察，不能當全年趨勢。"
    }
  ],
  "12": [
    {
      "id": "topic-12-news-1",
      "title": "行人穿越無號誌斑馬線被撞 警罰騎士未停讓致傷",
      "media": "公視新聞網 PNN",
      "date": "2025-05-04",
      "summary": "行人在無號誌行穿線遭撞，報導騎士未停讓及違停車輛可能遮擋視線。",
      "url": "https://news.pts.org.tw/article/749645",
      "contextNote": "個案可能同時有多種因素；警方初步說明不等於最終肇責。"
    },
    {
      "id": "topic-12-news-2",
      "title": "中壢公車左轉未停讓 撞飛行人致腦出血搶救中",
      "media": "公視新聞網 PNN",
      "date": "2026-08-04",
      "summary": "中壢公車轉彎撞上行人，報導救援、初步調查及路口安全問題。",
      "url": "https://news.pts.org.tw/article/820841",
      "contextNote": "2026 年個案，不能計入本題 2025 年件數；公車與行人責任仍需依調查認定。"
    },
    {
      "id": "topic-12-news-3",
      "title": "高市老翁闖紅燈遭撞亡 駕駛未停讓將吊照送辦",
      "media": "公視新聞網 PNN",
      "date": "2025-07-22",
      "summary": "行人闖紅燈遭車撞，警方同時調查駕駛未停讓及車速問題。",
      "url": "https://news.pts.org.tw/article/761960",
      "contextNote": "同一事故可能包含雙方因素，不能只依標題把全部責任交給某一方。"
    },
    {
      "id": "topic-12-news-4",
      "title": "遛狗走行穿線遭左轉車撞擊 25歲女急救後恢復生命徵象",
      "media": "公視新聞網 PNN",
      "date": "2025-06-11",
      "summary": "女子在行穿線遭左轉車撞，報導車禍調查及其他未停讓違規案例。",
      "url": "https://news.pts.org.tw/article/755683",
      "contextNote": "事故件數與取締違規件數不同；不同事件也不能混成一件。"
    },
    {
      "id": "topic-12-news-5",
      "title": "機車無照又不停讓 撞倒2女童雙方皆開罰 ",
      "media": "公視新聞網 PNN",
      "date": "2023-09-25",
      "summary": "無照騎士撞到穿越道路的女童，警方對騎士及監護人分別裁罰。",
      "url": "https://news.pts.org.tw/article/658649",
      "contextNote": "違規裁罰不等於最終事故責任，也不能證明全體行人事故的主因。"
    },
    {
      "id": "topic-12-news-6",
      "title": "「不停讓行人」今起最高罰6千 破解停讓5大困惑",
      "media": "公視新聞網 PNN",
      "date": "2023-06-16",
      "summary": "整理停讓行人的規則、常見疑問與執法資料，呈現制度如何回應路口安全。",
      "url": "https://news.pts.org.tw/article/641854",
      "contextNote": "規則以 2023 年報導及更新當時為準；取締數不是事故數或傷亡數。"
    }
  ],
  "13": [
    {
      "id": "topic-13-news-1",
      "title": "中和貨車追撞4輛等紅燈車 駕駛邊吃便當撿筷子分心釀禍",
      "media": "公視新聞網 PNN",
      "date": "2024-01-02",
      "summary": "貨車駕駛表示撿掉落筷子時分心，追撞停等紅燈車輛，警方追查事故。",
      "url": "https://news.pts.org.tw/article/674397",
      "contextNote": "是分心駕駛個案，不代表所有未注意車前狀態都由吃東西造成。"
    },
    {
      "id": "topic-13-news-2",
      "title": "高雄公車司機等紅燈追劇 業者：行車禁用手機將懲處",
      "media": "公視新聞網 PNN",
      "date": "2025-07-03",
      "summary": "公車駕駛停紅燈時看手機影片，業者說明禁止使用手機的規定及處置。",
      "url": "https://news.pts.org.tw/article/759107",
      "contextNote": "這是違規與風險報導，未報導事故發生，不能自行計入事故件數。"
    },
    {
      "id": "topic-13-news-3",
      "title": "國道工程車與緩撞車遭撞 多因用路人啟動駕駛輔助系統",
      "media": "公視新聞網 PNN",
      "date": "2023-05-12",
      "summary": "國道車輛使用駕駛輔助系統時追撞緩撞車，警方提醒駕駛仍要注意車前。",
      "url": "https://news.pts.org.tw/article/636640",
      "contextNote": "使用輔助系統與不注意車前不能視為同義；個案不能估算全臺因果比例。"
    },
    {
      "id": "topic-13-news-4",
      "title": "騎車滑手機追撞特斯拉 將開罰中壢騎士1千元",
      "media": "公視新聞網 PNN",
      "date": "2025-07-27",
      "summary": "桃園中壢機車騎士疑似騎車使用手機，追撞前方小客車；警方說明初步肇因與後續開罰。",
      "url": "https://news.pts.org.tw/article/762763",
      "contextNote": "警方初步認為可能涉及分心、沒注意前方路況。但這只是一場事故，不能代表全國事故的原因比例。"
    },
    {
      "id": "topic-13-news-5",
      "title": "國道去年70起死亡車禍 19死者未繫安全帶",
      "media": "公視新聞網 PNN",
      "date": "2025-01-02",
      "summary": "報導國道死亡事故與安全帶，也整理疲勞、分心及超速等主要肇因。",
      "url": "https://news.pts.org.tw/article/731880",
      "contextNote": "這篇談的是國道死亡事故，下一關看的是全國 A1+A2 傷亡事故，範圍不同。警方記錄的主要原因，也不會列出一場事故的所有因素。"
    },
    {
      "id": "topic-13-news-6",
      "title": "準快速道路速限40合理嗎？用路人為什麼愛超速　其實是道路設計讓人慢不下來",
      "media": "公視新聞網 PNN",
      "date": "2024-10-09",
      "summary": "討論事故肇因中的超速記錄、車速判定的限制，以及道路設計如何影響速度。",
      "url": "https://news.pts.org.tw/article/777129",
      "contextNote": "被記為主要原因的件數少，不表示車速對事故和死傷程度沒有影響。"
    }
  ],
  "14": [
    {
      "id": "topic-14-news-1",
      "title": "禁廚餘養豬後 廚餘篇 ：焚化之外，還有哪些其他方案？【我們的島】",
      "media": "公視新聞網 PNN",
      "date": "2026-04-23",
      "summary": "禁用廚餘養豬後，報導黑水虻、堆肥及能源化等替代方式與擴充困難。",
      "url": "https://news.pts.org.tw/article/804377",
      "contextNote": "2026 年處理容量與未來目標，不等於本題 2024 年歷史流向占比。"
    },
    {
      "id": "topic-14-news-2",
      "title": "回顧首例非洲豬瘟事件始末：盤點守了七年的防線，哪裡出現防疫破口？【我們的島】",
      "media": "公視新聞網 PNN",
      "date": "2025-11-12",
      "summary": "回顧非洲豬瘟防疫過程，也檢視停用廚餘養豬後各地的去化安排。",
      "url": "https://news.pts.org.tw/article/780688",
      "contextNote": "關注內文廚餘處理段落；這是 2025 年事件，不能直接代替 2024 年家戶流向。"
    },
    {
      "id": "topic-14-news-3",
      "title": "台南設置2高速廚餘發酵廠 廚餘變有機肥僅需10天",
      "media": "公視新聞網 PNN",
      "date": "2025-10-28",
      "summary": "臺南用高速發酵廠把廚餘做成有機肥，但目前能處理的量仍然有限。",
      "url": "https://news.pts.org.tw/article/778445",
      "contextNote": "地方設施容量只描述臺南處理能力，不能推估全臺可用容量。"
    },
    {
      "id": "topic-14-news-4",
      "title": "農業部說明廚餘覆土標準 未來廚餘養豬場將加裝監視器",
      "media": "公視新聞網 PNN",
      "date": "2025-10-29",
      "summary": "各縣市改用焚化、堆肥及沼氣等管道，主管機關說明處理與防疫要求。",
      "url": "https://news.pts.org.tw/article/778767",
      "contextNote": "與下篇同屬 2025 年非洲豬瘟後的政策追蹤；多篇報導不是多次新發生的禁令。"
    },
    {
      "id": "topic-14-news-5",
      "title": "全台6成廚餘用於養豬 非洲豬瘟禁令如何衝擊養豬業？",
      "media": "公視新聞網 PNN",
      "date": "2025-10-29",
      "summary": "報導家戶和事業廚餘如何拿來餵豬，以及禁止餵豬後可以怎麼處理、能不能處理得完。",
      "url": "https://news.pts.org.tw/article/778678",
      "contextNote": "標題的「約六成」把家戶和事業廚餘一起算；下一關只算家戶廚餘，兩個比例不能直接比較。"
    },
    {
      "id": "topic-14-news-6",
      "title": "花蓮縣廚餘廠年處理費1500萬 量能不足無法消化全縣產出引議",
      "media": "公視新聞網 PNN",
      "date": "2024-12-03",
      "summary": "花蓮廚餘處理廠被質疑處理量不夠、費用太高。報導整理了地方議會、環保局和廠商的回應。",
      "url": "https://news.pts.org.tw/article/727014",
      "contextNote": "地方個案說明處理限制，不能推論其他縣市或全臺都有相同情形。"
    }
  ],
  "01": [
    {
      "id": "topic-01-news-1",
      "title": "今年最大空污來襲 全台上午10測站空品紅色警示",
      "media": "公視新聞網 PNN",
      "date": "2025-02-28",
      "summary": "空污影響多個縣市，部分測站達紅色警示。報導說明擴散條件、本地與境外污染，以及空品警示門檻加嚴。",
      "url": "https://news.pts.org.tw/article/739938",
      "contextNote": "這是一次污染事件；警示門檻也有調整，不能只看紅色測站數就判定全年 PM₂.₅ 趨勢。"
    },
    {
      "id": "topic-01-news-2",
      "title": "全球空污排名台灣位居第54 台南、金門、高雄空品最差",
      "media": "公視新聞網 PNN",
      "date": "2025-03-12",
      "summary": "報導 IQAir 世界空品報告及臺灣各地差異，呈現全國排名與地方空品可能不同。",
      "url": "https://news.pts.org.tw/article/741768",
      "contextNote": "IQAir 的監測來源與本題環境部全國年平均不同，勿把兩套數值接成同一條線。"
    },
    {
      "id": "topic-01-news-3",
      "title": "中部PM2.5濃度上升 彰雲嘉7站空品達紅色警示",
      "media": "公視新聞網 PNN",
      "date": "2026-02-22",
      "summary": "彰化、雲林與嘉義部分測站出現空品警示，報導境外污染及擴散條件的影響。",
      "url": "https://news.pts.org.tw/article/795837",
      "contextNote": "這是 2026 年的一次區域污染事件，不代表全臺全年都維持同樣濃度。"
    },
    {
      "id": "topic-01-news-4",
      "title": "內蒙古沙塵暴來襲 週四迎新一波空污",
      "media": "公視新聞網 PNN",
      "date": "2025-11-26",
      "summary": "境外沙塵隨東北季風影響臺灣，報導污染移動與後續空品預測。",
      "url": "https://news.pts.org.tw/article/783030",
      "contextNote": "內文主要使用 PM10；PM10、PM₂.₅ 與空品指標不能互相代替。"
    },
    {
      "id": "topic-01-news-5",
      "title": "PM2.5年平均值優於113年　臭氧濃度略增",
      "media": "中央社 CNA",
      "date": "2025-12-31",
      "summary": "環境部公布當年度監測回顧，PM₂.₅ 與臭氧的變化方向並不完全相同。",
      "url": "https://www.cna.com.tw/news/ahel/202512310130.aspx",
      "contextNote": "數據有各自的統計截止日；本題圖表使用工作簿的全年 PM₂.₅ 數列。"
    },
    {
      "id": "topic-01-news-6",
      "title": "南部空氣品質紅色警示 離島金馬遭中國沿海空污",
      "media": "公視新聞網 PNN",
      "date": "2024-01-01",
      "summary": "元旦高屏與金馬部分測站出現空品紅色警示，報導 PM₂.₅ 污染累積、境外污染移入及地方應變。",
      "url": "https://news.pts.org.tw/article/674209",
      "contextNote": "報導聚焦當日、特定地區的污染；局部短期高濃度與全國年平均是不同尺度。"
    }
  ],
  "02": [
    {
      "id": "topic-02-news-1",
      "title": "國旅人次、支出創歷年新高 近8成「當天來回」住宿率低",
      "media": "公視新聞網 PNN",
      "date": "2026-08-04",
      "summary": "最新旅遊調查顯示國旅旅次增加，但多數旅遊當天來回，住宿需求未必同步。",
      "url": "https://news.pts.org.tw/article/820745",
      "contextNote": "報導發表於 2026 年，引用 2025 年調查；旅次會重複計入同一人的旅行。"
    },
    {
      "id": "topic-02-news-2",
      "title": "國旅2.22億人次創新高 住房率低成觀光課題",
      "media": "公視新聞網 PNN",
      "date": "2025-07-26",
      "summary": "報導全國國旅旅次增加，同時採訪宜蘭民宿業者面對平日住房偏低的處境。",
      "url": "https://news.pts.org.tw/article/762694",
      "contextNote": "引用 2024 年旅次及地方業者經驗；地方住房率不能代表全國旅次。"
    },
    {
      "id": "topic-02-news-3",
      "title": "2024年國旅支出少308億 觀光署：人次未減但多一日遊",
      "media": "公視新聞網 PNN",
      "date": "2025-03-12",
      "summary": "報導一份國旅消費估算與觀光署回應，討論一日遊、留宿及尖離峰房價。",
      "url": "https://news.pts.org.tw/article/741752",
      "contextNote": "研究室估算與官方全年旅次口徑不同，不直接合併。宜回查原始調查及發布時間。"
    },
    {
      "id": "topic-02-news-4",
      "title": "111年台灣國旅每人平均8.04次 每趟花2316元",
      "media": "中央社 CNA",
      "date": "2023-08-02",
      "summary": "觀光局公布 2022 年國旅調查，介紹每人旅行次數、旅遊天數及消費。",
      "url": "https://www.cna.com.tw/news/ahel/202308020194.aspx",
      "contextNote": "這篇用的是 2022 年資料。「平均旅行幾次」「有去旅行的人占多少」和「總共旅行幾次」的算法不同，要分開看。"
    },
    {
      "id": "topic-02-news-5",
      "title": "113年國旅總旅次、支出雙創新高　輕旅行成主流",
      "media": "中央社 CNA",
      "date": "2025-08-01",
      "summary": "報導 2024 年國旅總旅次、支出及旅遊型態變化，指出當日往返的輕旅行增加。",
      "url": "https://www.cna.com.tw/news/ahel/202508010267.aspx",
      "contextNote": "與 2025 年公視國旅報導引用同一年度官方調查，不是另一份獨立調查。"
    },
    {
      "id": "topic-02-news-6",
      "title": "去年觀光逆差近900萬人次 觀光署：經濟實力展現",
      "media": "公視新聞網 PNN",
      "date": "2025-02-24",
      "summary": "報導出入境人次差距，也採訪業者談國旅假日集中、住宿價格及市場壓力。",
      "url": "https://news.pts.org.tw/article/739274",
      "contextNote": "出入境人次與國內旅次是不同指標；觀光逆差不能直接當成國旅減少。"
    }
  ],
  "03": [
    {
      "id": "topic-03-news-1",
      "title": "國定假日增4+1天 產業憂衝擊、勞團盼改善高工時",
      "media": "公視新聞網 PNN",
      "date": "2025-05-10",
      "summary": "新增國定假日引發醫院排班與產業營運討論，勞團期待改善長工時與過勞風險。",
      "url": "https://news.pts.org.tw/article/750663",
      "contextNote": "呈現不同立場對工時與休假的看法，不是工作滿意度調查；不能把受訪意見當成全體勞工的比例。"
    },
    {
      "id": "topic-03-news-2",
      "title": "過去一年勞工對工作滿意度如何？哪些產業最常加班？ 勞工生活及就業狀況調查結果一次看",
      "media": "公視新聞網 PNN",
      "date": "2025-01-23",
      "summary": "報導勞動部 2024 年調查，整理工作滿意、加班及下班後交辦工作的情況。",
      "url": "https://news.pts.org.tw/article/735098",
      "contextNote": "這篇用的是 2024 年資料，下一關用的是 2025 年。看各項百分比時，也要確認是占哪些人的比例。"
    },
    {
      "id": "topic-03-news-3",
      "title": "2022幸福企業320家獲金獎肯定 人力銀行：上班族工作快樂指數僅53.7分",
      "media": "公視新聞網 PNN",
      "date": "2022-11-11",
      "summary": "人力銀行評選幸福企業，並公布上班族自評工作快樂及對薪資的感受。",
      "url": "https://news.pts.org.tw/article/608862",
      "contextNote": "民間調查的招募方式、題目與年份不同，不能直接代替勞動部滿意度調查。"
    },
    {
      "id": "topic-03-news-4",
      "title": "調查：近6成教師5年內想離職 自評幸福感指數平均僅50分",
      "media": "公視新聞網 PNN",
      "date": "2026-03-24",
      "summary": "教師問卷呈現幸福感與離職意願，討論尊嚴、工作壓力及教育政策的影響。",
      "url": "https://news.pts.org.tw/article/800378",
      "contextNote": "對象是國中小教師，不是本題調查的全體本國籍受僱勞工。"
    },
    {
      "id": "topic-03-news-5",
      "title": "職場心理健康調查 逾9成支持彈性工時、心理假等",
      "media": "公視新聞網 PNN",
      "date": "2024-10-09",
      "summary": "民團問卷關注工作壓力如何影響心理健康，並詢問對彈性工時與心理假的支持。",
      "url": "https://news.pts.org.tw/article/718575",
      "contextNote": "測量的是壓力與政策意見，不能把它直接換成「對工作不滿意」的比例。"
    },
    {
      "id": "topic-03-news-6",
      "title": "調查：逾7成上班族自認任職公司非幸福企業",
      "media": "中央社 CNA",
      "date": "2026-01-09",
      "summary": "人力銀行公布職場幸福感調查，受訪者提到加薪、工作量與經濟壓力。",
      "url": "https://www.cna.com.tw/news/afe/202601090183.aspx",
      "contextNote": "2026 年民間調查；「公司是不是幸福企業」與官方整體工作滿意度不是同一道題。"
    }
  ],
  "04": [
    {
      "id": "topic-04-news-1",
      "title": "離婚是否需要強制冷靜期？親密關係經營成當代課題【獨立特派員】",
      "media": "公視新聞網 PNN",
      "date": "2026-04-02",
      "summary": "報導離婚冷靜期的提議及不同意見，探討親密關係、生活壓力與離婚選擇。",
      "url": "https://news.pts.org.tw/article/801880",
      "contextNote": "以制度討論為閱讀重點。原文將粗離婚率單位寫成 %；官方為 ‰，不沿用該誤植。"
    },
    {
      "id": "topic-04-news-2",
      "title": "前年離婚率亞洲第二 法制局建議\"離婚冷靜期\"",
      "media": "公視新聞網 PNN",
      "date": "2026-01-05",
      "summary": "介紹立法院法制局的離婚冷靜期建議，呈現離婚統計如何進入政策討論。",
      "url": "https://news.pts.org.tw/article/789163",
      "contextNote": "標題與導言為台語文；報導引用 2024 年粗離婚率，不能視為已婚者的離婚機率。"
    },
    {
      "id": "topic-04-news-3",
      "title": "108年離婚5萬4346對 婚齡未滿5年者創10年新高",
      "media": "中央社 CNA",
      "date": "2020-07-11",
      "summary": "內政部統計 2019 年離婚對數為 5 萬 4346 對，其中結婚未滿 5 年離婚者占 34.45%，創近 10 年新高。",
      "url": "https://www.cna.com.tw/news/ahel/202007110063.aspx",
      "contextNote": "婚齡未滿 5 年占比高，反映新婚磨合期離婚比例，不等於全年總離婚對數持續飆升。"
    },
    {
      "id": "topic-04-news-4",
      "title": "7年之癢變5年 結婚未滿5年離婚居冠",
      "media": "中央社 CNA",
      "date": "2017-06-04",
      "summary": "內政部統計顯示，離婚夫妻中以結婚未滿 5 年者占比最高，30 至 39 歲年齡層為離婚人數主要集中區間。",
      "url": "https://www.cna.com.tw/news/aipl/201706040066.aspx",
      "contextNote": "特定婚齡或年齡層占離婚總數的比例高，不能直接推論整體離婚對數逐年增加。"
    },
    {
      "id": "topic-04-news-5",
      "title": "內政部：113年5.3萬對離婚　半數婚齡未達9年",
      "media": "中央社 CNA",
      "date": "2025-09-20",
      "summary": "內政部公布 2024 年離婚對數、婚齡結構及近十年變化。",
      "url": "https://www.cna.com.tw/news/ahel/202509200150.aspx",
      "contextNote": "離婚對數、婚齡中位數、有偶人口離婚率是不同指標，不能互換。"
    },
    {
      "id": "topic-04-news-6",
      "title": "內政部公布110年統計 5年內離婚者占34.75%創新高",
      "media": "中央社 CNA",
      "date": "2022-07-23",
      "summary": "回顧 2021 年離婚對數下降及短婚齡占比，提供不同年份的觀察起點。",
      "url": "https://www.cna.com.tw/news/ahel/202207230020.aspx",
      "contextNote": "與 2024 年統計搭配閱讀；起點不同會影響對「近年增加或減少」的印象。"
    }
  ],
  "05": [
    {
      "id": "topic-05-news-1",
      "title": "台南民宅火警意外 消防局提醒耗電電器勿插延長線",
      "media": "公視新聞網 PNN",
      "date": "2022-09-12",
      "summary": "台南住宅火警後，消防局討論延長線負載及高耗電器的使用。",
      "url": "https://news.pts.org.tw/article/599425",
      "contextNote": "報導使用初步調查，起火是否因延長線仍待釐清；不是所有住宅火災的比例。"
    },
    {
      "id": "topic-05-news-2",
      "title": "中壢民宅大火釀5死 疑電風扇電線走火導致",
      "media": "公視新聞網 PNN",
      "date": "2025-08-31",
      "summary": "中壢民宅清晨火警，報導救援與疑似電風扇電線走火的初步資訊。",
      "url": "https://news.pts.org.tw/article/768239",
      "contextNote": "發生於 2025 年，超出本題 2022–2024 年統計期間；「疑似」不等於最終認定。"
    },
    {
      "id": "topic-05-news-3",
      "title": "東湖民宅火警3人送醫 肇因仍待釐清",
      "media": "公視新聞網 PNN",
      "date": "2026-02-11",
      "summary": "內湖住宅火警救出受困住戶，消防局表示起火點及原因仍待調查。",
      "url": "https://news.pts.org.tw/article/794968",
      "contextNote": "2026 年個案；住戶猜測不能直接當成消防調查確認的原因。"
    },
    {
      "id": "topic-05-news-4",
      "title": "台中西屯民宅深夜起火 屋主稱卡式爐煮食不慎爆炸",
      "media": "公視新聞網 PNN",
      "date": "2025-05-27",
      "summary": "台中民宅深夜起火，屋主表示當時使用卡式爐煮食，消防人員進行火調。",
      "url": "https://news.pts.org.tw/article/753139",
      "contextNote": "2025 年個案；屋主陳述與最終火調結果須分開。"
    },
    {
      "id": "topic-05-news-5",
      "title": "台南新營民宅氣爆波及10民宅 消防局初判煮食不慎引起",
      "media": "公視新聞網 PNN",
      "date": "2025-12-16",
      "summary": "台南新營民宅氣爆波及鄰宅，消防局初步研判可能與煮食有關。",
      "url": "https://news.pts.org.tw/article/786086",
      "contextNote": "2025 年個案；氣爆與住宅火災統計分類需回查，勿自行計入某項起火原因。"
    },
    {
      "id": "topic-05-news-6",
      "title": "嘉義太保民宅火警釀3死1傷 縣府不排除人為縱火",
      "media": "公視新聞網 PNN",
      "date": "2024-05-08",
      "summary": "嘉義太保住宅火警後，報導傷亡、家庭援助及消防調查中的不確定因素。",
      "url": "https://news.pts.org.tw/article/694064",
      "contextNote": "警方與消防尚未確認原因；「不排除人為」不能改寫成已確定縱火。"
    }
  ],
  "06": [
    {
      "id": "topic-06-news-1",
      "title": "北捷案研判無共犯 警政署長：初步排除恐攻",
      "media": "公視新聞網 PNN",
      "date": "2025-12-20",
      "summary": "台北隨機攻擊案發生後，警方追查犯案過程，初步排除共犯及恐攻。",
      "url": "https://news.pts.org.tw/article/786818",
      "contextNote": "2025 年 12 月 19 日臺北攻擊案的初期報導；與下一篇屬同一事件。"
    },
    {
      "id": "topic-06-news-2",
      "title": "北捷隨機攻擊案偵結 檢：屬高度計畫的表達式犯罪",
      "media": "公視新聞網 PNN",
      "date": "2026-01-15",
      "summary": "同一臺北攻擊案偵查終結後，檢方說明追查證據與對犯案計畫的判斷。",
      "url": "https://news.pts.org.tw/article/790870",
      "contextNote": "追蹤 2025 年 12 月 19 日同一事件，不能再算成一件新發生的犯罪。"
    },
    {
      "id": "topic-06-news-3",
      "title": "雲林男帶麻布袋搶銀行500萬未果　遭聲押獲准",
      "media": "中央社 CNA",
      "date": "2025-10-27",
      "summary": "雲林虎尾銀行發生行搶未遂案，男子與保全扭打後逃離，警方當天逮人，檢方聲請羈押獲准。",
      "url": "https://www.cna.com.tw/news/asoc/202510270096.aspx",
      "contextNote": "報導依強盜未遂罪移送的個案；罪嫌與羈押不是有罪判決，也不能從新聞篇數推估全年犯罪件數。"
    },
    {
      "id": "topic-06-news-4",
      "title": "嘉義老翁晨運遇隨機攻擊 法院聲請羈押嫌犯獲准",
      "media": "公視新聞網 PNN",
      "date": "2026-02-22",
      "summary": "嘉義晨運者遇襲後，警方依殺人未遂等罪嫌移送，檢方聲請羈押獲准。",
      "url": "https://news.pts.org.tw/article/795840",
      "contextNote": "2026 年個案，不屬本題 2025 年總件數；罪嫌也不等於法院判決。"
    },
    {
      "id": "topic-06-news-5",
      "title": "中捷隨機砍人事件釀4傷 犯案動機不明檢警偵辦中",
      "media": "公視新聞網 PNN",
      "date": "2024-05-21",
      "summary": "台中捷運發生持刀攻擊，乘客合力制止，警方調查犯案動機。",
      "url": "https://news.pts.org.tw/article/696212",
      "contextNote": "2024 年個案，不計入本題 2025 年總件數；個案嚴重程度與年度規模分開看。"
    },
    {
      "id": "topic-06-news-6",
      "title": "北市內湖4嫌銀行前劫500萬 駕車逃逸後遭逮捕",
      "media": "公視新聞網 PNN",
      "date": "2023-03-23",
      "summary": "臺北銀行前發生現金搶案，警方依車輛線索追查並逮捕嫌犯。",
      "url": "https://news.pts.org.tw/article/628870",
      "contextNote": "2023 年搶案提供不同類型的暴力犯罪脈絡；不能與其他年度報導相加推估 2025 年件數。"
    }
  ],
  "07": [
    {
      "id": "topic-07-news-1",
      "title": "統計每月經常性薪資中位數 主計總處：過半勞工低於4萬元",
      "media": "公視新聞網 PNN",
      "date": "2025-12-10",
      "summary": "主計總處公布薪資統計，報導平均數與中位數的差距及不同產業感受。",
      "url": "https://news.pts.org.tw/article/785293",
      "contextNote": "引用 2025 年 1–10 月，不是完整年度；經常性薪資不含所有獎金。"
    },
    {
      "id": "topic-07-news-2",
      "title": "4月經常性薪資中位數39348元 主計總處統計不同產業落差大",
      "media": "公視新聞網 PNN",
      "date": "2026-06-13",
      "summary": "報導 2026 年 4 月經常性薪資，比較全體員工與不同產業的中間位置。",
      "url": "https://news.pts.org.tw/article/812877",
      "contextNote": "月資料與本題 2025 年資料期間不同，不能拼成相同統計。"
    },
    {
      "id": "topic-07-news-3",
      "title": "上半年7成受雇者薪資低於平均 主計總處：移工與部分工時增加",
      "media": "公視新聞網 PNN",
      "date": "2026-08-11",
      "summary": "報導薪資低於平均的員工比例與平均、中位數差距，並呈現主計總處與學者解釋。",
      "url": "https://news.pts.org.tw/article/821823",
      "contextNote": "資料為 2026 年上半年；平均增加不代表每位員工都同步加薪。"
    },
    {
      "id": "topic-07-news-4",
      "title": "年薪低於39萬元屬低薪 主計總處：全台約有126萬人",
      "media": "公視新聞網 PNN",
      "date": "2026-09-15",
      "summary": "介紹低薪門檻的計算，也區分經常性薪資與加入獎金後的總薪資。",
      "url": "https://news.pts.org.tw/article/827115",
      "contextNote": "年度總薪資、月經常性薪資與最低工資不同，勿直接互相比較。"
    },
    {
      "id": "topic-07-news-5",
      "title": "113年總薪資中位數54.6萬元　AI加持年增逾4%創12年最高成長",
      "media": "中央社 CNA",
      "date": "2025-11-25",
      "summary": "公布 2024 年全年總薪資中位數，說明產業與獎金如何影響結果。",
      "url": "https://www.cna.com.tw/news/afe/202511250287.aspx",
      "contextNote": "是包含非經常性收入的全年總薪資，不能直接除以十二當成本題月經常性薪資。"
    },
    {
      "id": "topic-07-news-6",
      "title": "最低工資審議會9/24登場 勞團籲增加調幅共享經濟成果",
      "media": "公視新聞網 PNN",
      "date": "2026-09-16",
      "summary": "最低工資審議前，勞團引用 2025 年平均與中位數談薪資分布及經濟成果。",
      "url": "https://news.pts.org.tw/article/827293",
      "contextNote": "報導中的勞團主張與官方統計分開看；原文對明年年份有誤植，不沿用。"
    }
  ],
  "08": [
    {
      "id": "topic-08-news-1",
      "title": "全國空屋比率略降至9.4% 高雄市11.9萬宅居六都之冠",
      "media": "公視新聞網 PNN",
      "date": "2026-07-21",
      "summary": "內政部公布 2025 年下半年低度用電住宅，報導全國占比與六都差異。",
      "url": "https://news.pts.org.tw/article/818677",
      "contextNote": "低度用電是代理指標，不是逐戶查訪確認無人居住。"
    },
    {
      "id": "topic-08-news-2",
      "title": "2023上半年全台空屋率逾9% 六都高雄、台南最高",
      "media": "公視新聞網 PNN",
      "date": "2024-01-20",
      "summary": "報導 2023 年上半年各地低度用電住宅占比，以及政府與業界的觀察。",
      "url": "https://news.pts.org.tw/article/677335",
      "contextNote": "報導標題簡稱空屋；定義及年份不同時，不直接與人口住宅普查空閒宅相比。"
    },
    {
      "id": "topic-08-news-3",
      "title": "空屋率9.96％創新低 房仲：囤房大戶調查期間多用電就可規避",
      "media": "公視新聞網 PNN",
      "date": "2021-09-14",
      "summary": "不同調查對空屋的結果差距，引發對低度用電門檻及實際居住狀態的討論。",
      "url": "https://news.pts.org.tw/article/544628",
      "contextNote": "2020 年低度用電資料與住宅普查使用不同方法，不能當成同一指標。"
    },
    {
      "id": "topic-08-news-4",
      "title": "全台空屋率近3年新高 疫後營建成本漲市場傳爛尾樓個案",
      "media": "公視新聞網 PNN",
      "date": "2022-11-10",
      "summary": "報導空屋指標上升及新屋、老屋差異，也討論房市與營建成本。",
      "url": "https://news.pts.org.tw/article/608789",
      "contextNote": "發布於 2022 年；市場個案與低度用電住宅數沒有一對一關係。"
    },
    {
      "id": "topic-08-news-5",
      "title": "六都與新竹縣市去年下半年低度用電住宅　增逾6萬宅",
      "media": "中央社 CNA",
      "date": "2025-08-05",
      "summary": "房仲引用內政部低度用電統計，討論交屋潮及住宅使用情況。",
      "url": "https://www.cna.com.tw/news/afe/202508050157.aspx",
      "contextNote": "報導文字將全臺數與六都、新竹範圍混寫；閱讀時回查官方各地表，不沿用該範圍敘述。"
    },
    {
      "id": "topic-08-news-6",
      "title": "空屋指標 112年下半年低度用電住宅較去年多5.5萬戶",
      "media": "中央社 CNA",
      "date": "2024-06-27",
      "summary": "內政部公布 2023 年下半年低度用電住宅數及各地變化。",
      "url": "https://www.cna.com.tw/news/afe/202406270300.aspx",
      "contextNote": "與 2025 年資料分開看；用電門檻不能直接判定屋主囤房或住宅長期空置。"
    }
  ],
  "09": [
    {
      "id": "topic-09-news-1",
      "title": "過去一年勞工對工作滿意度如何？哪些產業最常加班？ 勞工生活及就業狀況調查結果一次看",
      "media": "公視新聞網 PNN",
      "date": "2025-01-23",
      "summary": "勞動部調查整理遠距工作的可行性、使用情形及工作感受。",
      "url": "https://news.pts.org.tw/article/735098",
      "contextNote": "資料年為 2024 年；「工作不能遠距」與「近三個月曾否遠距」不是同一個指標。"
    },
    {
      "id": "topic-09-news-2",
      "title": "中經院：25%企業仍採遠距工作 職災責任歸屬難認定",
      "media": "公視新聞網 PNN",
      "date": "2023-11-21",
      "summary": "中經院調查呈現企業保留遠距工作的情況，並討論職災認定與管理問題。",
      "url": "https://news.pts.org.tw/article/667692",
      "contextNote": "這個比例算的是企業或這份調查的受訪者。「多少企業採用遠距工作」不等於「多少勞工曾經遠距工作」。"
    },
    {
      "id": "topic-09-news-3",
      "title": "多家金控業提前實施居家上班   進行彈性分流",
      "media": "公視新聞網 PNN",
      "date": "2022-01-17",
      "summary": "疫情期間金融、電信與電子業安排居家上班及分流，維持企業運作。",
      "url": "https://news.pts.org.tw/article/563687",
      "contextNote": "是 2022 年特定企業的防疫安排，不代表 2025 年所有勞工的工作方式。"
    },
    {
      "id": "topic-09-news-4",
      "title": "遠距辦公成流行 疫情帶來職場新形態",
      "media": "公視新聞網 PNN",
      "date": "2020-07-10",
      "summary": "疫情促進視訊與雲端應用，報導臺灣企業如何面對遠距辦公。",
      "url": "https://news.pts.org.tw/article/486619",
      "contextNote": "2020 年背景報導，不能把科技公司的經驗推廣到每種職業。"
    },
    {
      "id": "topic-09-news-5",
      "title": "北市提居家工作指引，勞工離線權被保障了嗎？【獨立特派員】",
      "media": "公視新聞網 PNN",
      "date": "2023-05-05",
      "summary": "臺北市推出居家工作指引，報導混合工作、工時紀錄與離線權的問題。",
      "url": "https://news.pts.org.tw/article/635391",
      "contextNote": "是臺灣制度與工作經驗報導；有遠距制度不代表每天都在家上班。"
    },
    {
      "id": "topic-09-news-6",
      "title": "亞馬遜明年起取消在家上班 恢復每周5天回辦公室工作",
      "media": "公視新聞網 PNN",
      "date": "2024-09-17",
      "summary": "亞馬遜宣布回到每週五天辦公室工作，報導企業與員工對遠距制度的歧見。",
      "url": "https://news.pts.org.tw/article/715128",
      "contextNote": "國際對照：以美國企業為主，不能用來推估臺灣遠距比例。"
    }
  ]
};
