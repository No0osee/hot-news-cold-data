import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export function ReadingNavigation({ pageKey }: { pageKey: string }) {
  const [position, setPosition] = useState({ above: false, below: false });

  useEffect(() => {
    const container = document.querySelector('.calibration-overlay') as HTMLElement | null;
    const update = () => {
      if (container) {
        setPosition({
          above: container.scrollTop > 120,
          below: container.scrollTop + container.clientHeight < container.scrollHeight - 80,
        });
      } else {
        const page = document.documentElement;
        setPosition({
          above: window.scrollY > 120,
          below: window.scrollY + window.innerHeight < page.scrollHeight - 80,
        });
      }
    };

    const resizeObserver = new ResizeObserver(update);
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(update);
    });

    if (container) {
      resizeObserver.observe(container);
      if (container.firstElementChild) resizeObserver.observe(container.firstElementChild);
      mutationObserver.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      container.addEventListener('scroll', update, { passive: true });
    } else {
      resizeObserver.observe(document.body);
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      window.addEventListener('scroll', update, { passive: true });
    }
    window.addEventListener('resize', update);
    update();
    const timer1 = window.setTimeout(update, 150);
    const timer2 = window.setTimeout(update, 380);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (container) container.removeEventListener('scroll', update);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [pageKey]);

  if (!position.above && !position.below) return null;

  const scroll = (direction: number) => {
    const container = document.querySelector('.calibration-overlay') as HTMLElement | null;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth';
    if (container) {
      container.scrollBy({ top: direction * container.clientHeight * 0.65, behavior });
    } else {
      window.scrollBy({ top: direction * window.innerHeight * 0.65, behavior });
    }
  };

  return (
    <nav className="reading-navigation" aria-label="閱讀頁面上下捲動">
      {position.above && (
        <button type="button" onClick={() => scroll(-1)} aria-label="往上看">
          <ArrowUp size={14} />
          <span>往上</span>
        </button>
      )}
      {position.below && (
        <button type="button" onClick={() => scroll(1)} aria-label="往下看更多內容">
          <ArrowDown size={14} />
          <span>往下</span>
        </button>
      )}
    </nav>
  );
}
