import { useEffect, useRef, useState } from 'react';

type AnimationDirection = 'up' | 'left' | 'right' | 'scale' | 'fade';

export const useScrollAnimation = (threshold = 0.15, direction: AnimationDirection = 'up') => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold, rootMargin: '50px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  const getAnimationClass = (visible: boolean) => {
    const base = 'transition-all duration-700 ease-out will-change-transform';
    if (!visible) {
      switch (direction) {
        case 'left': return `${base} opacity-0 -translate-x-12`;
        case 'right': return `${base} opacity-0 translate-x-12`;
        case 'scale': return `${base} opacity-0 scale-90`;
        case 'fade': return `${base} opacity-0`;
        default: return `${base} opacity-0 translate-y-8`;
      }
    }
    return `${base} opacity-100 translate-x-0 translate-y-0 scale-100`;
  };

  return { ref, isVisible, getAnimationClass };
};

export const useStaggerAnimation = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold, rootMargin: '50px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  const getItemClass = (index: number, direction: AnimationDirection = 'up') => {
    const base = 'transition-all duration-600 ease-out will-change-transform';
    if (!isVisible) {
      switch (direction) {
        case 'left': return `${base} opacity-0 -translate-x-8`;
        case 'right': return `${base} opacity-0 translate-x-8`;
        case 'scale': return `${base} opacity-0 scale-90`;
        default: return `${base} opacity-0 translate-y-6`;
      }
    }
    return `${base} opacity-100 translate-x-0 translate-y-0 scale-100`;
  };

  const getItemDelay = (index: number) => ({ transitionDelay: `${index * 80 + 100}ms` });

  return { ref, isVisible, getItemClass, getItemDelay };
};
