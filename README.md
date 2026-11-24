# 當熱新聞遇上冷數據：島嶼互動專案

文件更新：2026-11-21。本資料夾是目前專題產品的主要參照版本；功能與數量以本機原始碼為準，部署狀態另行確認。專題背景見[研究與專案脈絡](../專題完整介紹與LLM對話脈絡.md)，交付狀態見[目前進度](../專題目前進度總整理.md)。

## 目前玩法

從 Three.js 六角島嶼地圖選擇議題，依序完成「先猜猜看、讀新聞、看數據、再想一想」。每案包含三題直覺問題、把握度選擇、六個新聞閱讀位置、互動預測及延伸判斷。完成反思後記錄島嶼成果；完成不等同全答對。

地圖提供類群篩選、視角與時間操作、議題連線及島嶼進出動畫。各島的草稿、未完成步驟、完成狀態與成果存於目前瀏覽器 localStorage，可返回地圖後繼續。清除瀏覽器資料或重設進度會影響本機紀錄，沒有跨裝置帳號同步。

成果摘要分別顯示直覺與反思練習答對率、自訂把握度校準及領域探索。它們是遊戲內紀錄，不是標準化媒體素養測驗；不同題組不能直接當作同題前後測的成效差。

## 可玩案例清單

以 [cases.ts](src/data/cases.ts) 的 `casesData`、[topics.ts](src/data/topics.ts) 的 `topicCases` 與 [islandZones.ts](src/data/islandZones.ts) 的映射核對，共 13 案。

| ID | 島嶼 | 類群 |
| --- | --- | --- |
| elderly_driver | 高齡駕駛島 | 國旅交通 |
| topic-01 | 空污迷霧島 | 生活 |
| topic-02 | 國旅人潮島 | 國旅交通 |
| topic-03 | 職場心聲島 | 生活 |
| topic-04 | 婚姻冷暖島 | 生活 |
| topic-05 | 祝融警戒島 | 社會安全 |
| topic-06 | 治安暗影島 | 社會安全 |
| topic-07 | 薪資天平島 | 生活 |
| topic-10 | 綠能風電島 | 生活 |
| topic-11 | 旅宿燈火島 | 國旅交通 |
| topic-12 | 斑馬線口島 | 國旅交通 |
| topic-13 | 測速分心島 | 國旅交通 |
| topic-14 | 廚餘去化島 | 生活 |

合計國旅交通 5、社會安全 2、生活 6；每案六個新聞位置，共 78 個。網址可能重複，並非 78 份獨立證據。本輪未重新測試外部新聞連結。

topic-08（低度用電住宅）、topic-09（遠距工作）與酒駕／無照不在目前主遊戲案例清單。舊資料或案例物件留存不代表啟用；新增島嶼時必須一併核對案例、新聞、圖表資料與地圖配置。

## 開發指令與配置

在此資料夾執行：

```powershell
npm ci
npm run dev
npm run lint
npm run build
npm run preview
```

上列為可用指令，文件更新不代表本輪已執行。build 會執行 TypeScript 建置與 Vite 打包；lint 的範圍為 `src` 與 `vite.config.ts`。

[package.json](package.json) 宣告 React／React DOM ^19.2.8、TypeScript ~6.0.2、Vite ^8.2.2、Tailwind CSS ^4.3.3、Three.js ^0.186.1、GSAP ^3.15.0、@gsap/react ^2.1.2、Motion ^13.2.0。實際鎖定版本由 [package-lock.json](package-lock.json) 管理，不把宣告範圍視為安裝版本。

## 程式與資料責任

| 路徑 | 負責內容 |
| --- | --- |
| [App.tsx](src/App.tsx) | 選島、四關切換、進度與成果狀態、本機保存 |
| [CatanWorldStage.tsx](src/components/CatanWorldStage.tsx) | Three.js 島嶼世界、鏡頭及場景互動 |
| [islandZones.ts](src/data/islandZones.ts) | 島名、地圖位置、模型與議題連線 |
| [cases.ts](src/data/cases.ts) | 高齡案例、保留案例物件與主遊戲匯出清單 |
| [topics.ts](src/data/topics.ts) | 目前啟用議題、題目、資料範圍與判讀限制 |
| [topicNews.ts](src/data/topicNews.ts) | 人工新聞選例、摘要與提醒 |
| [topicWorkbooks.json](src/data/topicWorkbooks.json) | 工作簿資料、來源、單位與雜湊 |
| [scenes](src/scenes/) | 直覺、閱讀、揭曉與反思場景 |
| [YouDrawItChart.tsx](src/components/YouDrawItChart.tsx)、[TopicPredictionChart.tsx](src/components/TopicPredictionChart.tsx) | 互動預測圖表 |
| [HowToPlay.tsx](src/components/HowToPlay.tsx) | 目前四關操作說明 |
| [LiteracySummaryModal.tsx](src/components/LiteracySummaryModal.tsx) | 個人成果與領域探索摘要 |
| [public/sources](public/sources/) | 可下載工作簿、資料來源與方法說明 |

localStorage 使用鍵 `catan_news_framing_progress_v2`，保存 `completedCaseIds`、`caseStats` 與 `caseProgressMap`。保存的是此瀏覽器的互動紀錄，不能當作已收集到研究者端的問卷或行為資料。

## 統計與內容限制

- 高齡資料為篩選後的第一當事者登記筆數；戶籍人口換算不等於個人駕駛風險。
- 六篇新聞是人工選例，不用來估計全體媒體報導比例；同一事件與同一消息來源要分開辨識。
- 各工作簿保留其原始統計期間，不因文件更新而改成年份較新的資料。
- 官方「—」、計算補數、資料分類缺口及不同分母的限制須保留，不能為簡化敘述移除。
- 所有「已實測／連結有效／建置通過」均須附實際檢查日期與版本；歷史紀錄不替代目前驗證。

## 研究儲備與歷史資產

[交通罰單資料審閱](public/sources/traffic-tickets-review/資料核對與互動圖表提案.md)與[罰鍰收入補充](public/sources/traffic-tickets-review/罰鍰收入補充查核.md)為待審閱資料，尚未加入案例及島嶼清單。

[第一批工作簿查核](public/sources/data-review.md)包含 14 題歷史資料；其中未啟用的題目仍有保存價值。行人案例的[方法說明](public/sources/topic-12-method.md)為網站使用的來源檔，不因其他資料夾有相同副本而刪除。

[操作手冊](public/guide/quick-start.html)與[操作影片](public/guide/walkthrough.webm)保留為 2026-10-13 介面示範；其選題畫面不代表目前島嶼首頁。舊版網站及測試紀錄保留在 [12_網站與程式原型](../12_網站與程式原型/)。
