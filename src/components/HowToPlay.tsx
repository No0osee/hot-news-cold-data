import { useRef, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const steps = [
  ['先猜猜看', '先憑直覺回答三題，再選你對答案有多大把握。這時不用查資料。'],
  ['讀新聞', '瀏覽相關新聞標題；想看完整報導可點「看新聞原文」。'],
  [
    '看數據',
    '在圖上拖動或輸入你的預測數值。完成後按揭曉按鈕，並排比較你的預測（橘色）與官方統計（藍色）。',
  ],
  [
    '再想一想',
    '完成 3 題延伸判斷練習，分辨哪些說法有數據支持、哪些推論過度。完成後即可插旗解鎖該島成果！',
  ],
];

export function HowToPlay({
  hidden = false,
  inline = false,
}: {
  hidden?: boolean;
  inline?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [example, setExample] = useState(0);
  const guessHeights = [35, 72, 52];
  const actualHeights = [58, 44];

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        className={inline ? 'ctrl-btn help-inline-btn' : 'help-trigger'}
        onClick={() => dialog.current?.showModal()}
      >
        <HelpCircle size={16} />
        <span>怎麼玩？</span>
      </button>
      <dialog
        ref={dialog}
        className="how-to-dialog"
        onClick={event => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        aria-labelledby="how-to-title"
      >
        <div className="sticky top-0 z-10 bg-[#fcf8e3] pb-3 border-b border-[#d8ccb2] flex items-center justify-between gap-4">
          <h2 id="how-to-title" className="text-xl sm:text-2xl font-bold">
            第一次玩？從這裡開始
          </h2>
          <button
            type="button"
            className="p-2 cursor-pointer rounded hover:bg-[#e9ddbc]"
            aria-label="關閉操作說明"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <p className="mt-3">四個步驟，看看新聞印象和實際資料差多少。</p>
        <ol className="help-steps">
          {steps.map(([title, description], i) => (
            <li key={title}>
              <span className="help-step-number">{i + 1}</span>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ol>
        <section className="border-t border-[#c5b596] pt-4 mt-4">
          <h3 className="text-lg font-bold">試試看：在圖上猜數字並對比雙色圖表</h3>
          <p>點一下示意圖，橘色預測柱就會調整高度，揭曉後會與藍色官方數據並排比較。</p>
          <button
            type="button"
            className="prediction-example"
            aria-label="試著調整示意圖上的預測"
            onClick={() => setExample(old => (old + 1) % 3)}
          >
            <span className="prediction-example-chart">
              <span className="example-grid" />
              <span
                style={{
                  position: 'absolute',
                  left: '22%',
                  bottom: 0,
                  width: '26px',
                  height: `${guessHeights[example]}%`,
                  background: '#d97706',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.28s ease',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 'calc(22% + 32px)',
                  bottom: 0,
                  width: '26px',
                  height: `${actualHeights[0]}%`,
                  background: '#0369a1',
                  borderRadius: '3px 3px 0 0',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '58%',
                  bottom: 0,
                  width: '26px',
                  height: `${guessHeights[(example + 1) % 3]}%`,
                  background: '#d97706',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.28s ease',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 'calc(58% + 32px)',
                  bottom: 0,
                  width: '26px',
                  height: `${actualHeights[1]}%`,
                  background: '#0369a1',
                  borderRadius: '3px 3px 0 0',
                }}
              />
            </span>
            <span className="example-caption">
              點這裡試試看（橘色：你的預測 ／ 藍色：官方資料）
            </span>
          </button>
        </section>
      </dialog>
    </>
  );
}
