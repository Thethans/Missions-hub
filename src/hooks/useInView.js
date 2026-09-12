import { useEffect, useRef, useState } from 'react';

// Drives a code-fetch/mount decision (when to let a lazy section's work
// actually start), not just a CSS/motion trigger like RevealOnScroll's
// whileInView — so this fires once and disconnects, rather than tracking
// in/out repeatedly. rootMargin defaults to a viewport-height-ish lookahead
// so the section has already started loading by the time a scrolling user
// actually reaches it, instead of showing a fresh loading spinner.
//
// IntersectionObserver alone isn't reliable here: a fast/instant scroll
// (keyboard "End", a hard fling, a programmatic scrollTo) can jump the
// element from "way below the lookahead margin" to "way above it" between
// two composited frames with no frame in between where it was actually
// intersecting — the observer then never fires and the section stays
// permanently unmounted, which is exactly the "content doesn't load"
// failure this hook exists to prevent. The scroll/resize listener below is
// a synchronous rect-math fallback: it re-checks on every scroll event
// (including the one an instant jump still dispatches) whether the target
// is already visible OR already scrolled past, and resolves either way.
export default function useInView(rootMargin = '800px 0px') {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const margin = parseInt(rootMargin, 10) || 0;
    function isNearOrPast() {
      const rect = node.getBoundingClientRect();
      return rect.top < window.innerHeight + margin && rect.bottom > -margin;
    }

    if (isNearOrPast()) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);

    const onScroll = () => {
      if (isNearOrPast()) setInView(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [inView, rootMargin]);

  return [ref, inView];
}
