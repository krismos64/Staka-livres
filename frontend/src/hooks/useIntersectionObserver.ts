import { useCallback, useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  root?: Element | null;
}

interface UseInViewReturn {
  ref: React.RefObject<HTMLDivElement>;
  inView: boolean;
}

export function useInView(options: UseInViewOptions = {}): UseInViewReturn {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    ([entry]: IntersectionObserverEntry[]) => {
      setInView(entry.isIntersecting);
    },
    []
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: options.threshold || 0,
      rootMargin: options.rootMargin || "0px",
      root: options.root || null,
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [handleIntersection, options.threshold, options.rootMargin, options.root]);

  return { ref, inView };
}
