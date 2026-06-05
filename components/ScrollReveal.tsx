"use client";

import { useEffect, useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ScrollReveal({ children, className = "", delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.classList.add("reveal-is-visible");
      return;
    }

    let revealTimeout: ReturnType<typeof setTimeout> | undefined;

    /** Si l’IntersectionObserver ne déclenche pas (bug navigateur, layout), éviter du contenu bloqué en opacity:0 */
    const safetyId = window.setTimeout(() => {
      el.classList.add("reveal-is-visible");
      if (revealTimeout !== undefined) clearTimeout(revealTimeout);
    }, 4500 + delay);

    const scheduleReveal = () => {
      if (el.classList.contains("reveal-is-visible")) return;
      if (revealTimeout !== undefined) clearTimeout(revealTimeout);
      revealTimeout = setTimeout(() => {
        el.classList.add("reveal-is-visible");
        window.clearTimeout(safetyId);
        revealTimeout = undefined;
      }, delay);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            scheduleReveal();
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px 14% 0px" },
    );

    observer.observe(el);

    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      const visible =
        rect.top < vh * 0.94 && rect.bottom > vh * 0.04 && rect.width > 0 && rect.height > 0;
      if (visible) {
        scheduleReveal();
        observer.unobserve(el);
      }
    });

    return () => {
      observer.disconnect();
      window.clearTimeout(safetyId);
      if (revealTimeout !== undefined) clearTimeout(revealTimeout);
    };
  }, [delay]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
