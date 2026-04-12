import { useEffect, useRef, useState } from 'react';

type AnimationDirection = 'up' | 'left' | 'right' | 'scale' | 'fade';

export const useScrollAnimation = (threshold = 0.15, direction: AnimationDirection = 'up') => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  const getAnimationClass = (visible: boolean, delay = 0) => {
    const base = 'transition-all duration-700';
    const delayStyle = delay ? `transition-delay: ${delay}ms` : '';
    
    if (!visible) {
      switch (direction) {
        case 'left': return `${base} opacity-0 -translate-x-16`;
        case 'right': return `${base} opacity-0 translate-x-16`;
        case 'scale': return `${base} opacity-0 scale-75`;
        case 'fade': return `${base} opacity-0`;
        default: return `${base} opacity-0 translate-y-10`;
      }
    }
    return `${base} opacity-100 translate-x-0 translate-y-0 scale-100`;
  };

  return { ref, isVisible, getAnimationClass };
};

export const useStaggerAnimation = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  const getItemClass = (index: number, direction: AnimationDirection = 'up') => {
    const base = 'transition-all duration-700';
    if (!isVisible) {
      switch (direction) {
        case 'left': return `${base} opacity-0 -translate-x-12`;
        case 'right': return `${base} opacity-0 translate-x-12`;
        case 'scale': return `${base} opacity-0 scale-75`;
        default: return `${base} opacity-0 translate-y-8`;
      }
    }
    return `${base} opacity-100 translate-x-0 translate-y-0 scale-100`;
  };

  const getItemDelay = (index: number) => ({ transitionDelay: `${index * 120 + 150}ms` });

  return { ref, isVisible, getItemClass, getItemDelay };
};
