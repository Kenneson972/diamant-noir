"use client";

import { useEffect, type RefObject } from "react";

/** Native replacement for GSAP ScrollTrigger scrub on a tall scroll driver. */
export function useScrollScrub(
  driverRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  onProgress: (progress: number) => void
) {
  useEffect(() => {
    if (!enabled) return;
    const driver = driverRef.current;
    if (!driver) return;

    let raf = 0;
    const update = () => {
      const rect = driver.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = driver.offsetHeight - viewport;
      if (total <= 0) {
        onProgress(0);
        return;
      }
      const scrolled = -rect.top;
      const progress = Math.min(Math.max(scrolled / total, 0), 1);
      onProgress(progress);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [driverRef, enabled, onProgress]);
}

/** Intersection-based trigger (enter / leave back). */
export function useIntersectionTrigger(
  targetRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  options: {
    rootMargin?: string;
    threshold?: number;
    onEnter?: () => void;
    onLeaveBack?: () => void;
  }
) {
  useEffect(() => {
    if (!enabled) return;
    const el = targetRef.current;
    if (!el) return;

    let wasIntersecting = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry?.isIntersecting ?? false;
        if (intersecting && !wasIntersecting) {
          options.onEnter?.();
        }
        if (!intersecting && wasIntersecting) {
          options.onLeaveBack?.();
        }
        wasIntersecting = intersecting;
      },
      {
        root: null,
        rootMargin: options.rootMargin ?? "0px",
        threshold: options.threshold ?? 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [targetRef, enabled, options.onEnter, options.onLeaveBack, options.rootMargin, options.threshold]);
}
