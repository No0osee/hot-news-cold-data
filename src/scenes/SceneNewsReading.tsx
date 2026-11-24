import { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Newspaper, ArrowRight } from 'lucide-react';
import type { ResearchCase, NewsObservation } from '../types/game';

gsap.registerPlugin(useGSAP);

interface Props {
  researchCase: ResearchCase;
  observation: NewsObservation;
  onDraftChange: Dispatch<SetStateAction<NewsObservation>>;
  onSubmit: (observation: NewsObservation) => void;
}

export function SceneNewsReading({ researchCase, observation, onSubmit }: Props) {
  const articles = researchCase.articles;
  const boardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!boardRef.current) return;
      gsap.fromTo(
        boardRef.current.querySelectorAll('.gsap-news-item'),
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.42, stagger: 0.055, ease: 'power3.out', clearProps: 'transform,opacity' }
      );
    },
    { scope: boardRef, dependencies: [researchCase.id] }
  );

  const handleNext = () => {
    onSubmit({
      ...observation,
      readArticleIds: articles.map(a => a.id),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center p-4 md:p-8 pb-24"
    >
      <div ref={boardRef} className="relative z-10 w-full max-w-4xl mt-20 sm:mt-16 mb-8">
        {/* Main Document Board */}
        <div className="bg-[#fcf8e3] border-4 border-[#8c734b] p-5 md:p-8 shadow-[8px_8px_0_0_rgba(0,0,0,0.85)] rounded-sm text-zinc-900">
          
          {/* Header */}
          <div className="border-b-2 border-[#8c734b] pb-4 mb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono text-zinc-700 bg-amber-100/90 px-2.5 py-0.5 border border-amber-300 font-bold">
                {researchCase.period}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black font-serif text-zinc-950 flex items-center gap-2.5">
              <Newspaper className="text-[#8d2e25]" size={28} />
              <span>同一場事故，新聞會怎麼報？</span>
            </h2>

            <p className="text-sm text-zinc-700 mt-2 leading-relaxed">
              這裡有 {articles.length} 篇新聞選例，可瀏覽標題或點選連結閱讀新聞原文。
            </p>
          </div>

          {/* Clean News Cards List (Title & Link Only) */}
          <div className="space-y-3.5 mb-6">
            {articles.map((article, idx) => (
              <div
                key={article.id}
                className="gsap-news-item border-2 border-[#c5b596] rounded bg-[#fdfbf3] p-4 md:p-5 space-y-2 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold text-[#8d2e25]">
                  <span>
                    剪報 {String(idx + 1).padStart(2, '0')} · {article.media} · {article.date}
                  </span>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 underline text-[#8d2e25] hover:text-red-900 font-bold text-xs font-mono"
                    aria-label={`看新聞原文：${article.title}`}
                  >
                    <span>看新聞原文</span>
                  </a>
                </div>

                <h3 className="font-black text-base md:text-lg text-zinc-950 leading-snug font-serif">
                  {article.title}
                </h3>
              </div>
            ))}
          </div>

          {/* Submit / Proceed Action */}
          <div className="pt-4 border-t-2 border-[#8c734b] flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto px-8 py-3.5 text-base md:text-lg font-black rounded border-2 border-black flex items-center justify-center gap-2 transition-all min-h-[48px] bg-yellow-300 hover:bg-yellow-400 text-black shadow-[4px_4px_0_0_#000] cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_0_#000]"
            >
              <span>來猜數字，再看答案</span>
              <ArrowRight size={20} className="text-black" />
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
