'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ViewportInfo extends ViewportSize {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
}

export function useViewport() {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 0,
        height: 0,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape' as const,
        devicePixelRatio: 1
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      orientation: width > height ? 'landscape' : 'portrait',
      devicePixelRatio: window.devicePixelRatio || 1
    };
  });

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setViewport({
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      orientation: width > height ? 'landscape' : 'portrait',
      devicePixelRatio: window.devicePixelRatio || 1
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      // Debounce resize events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateViewport, 150);
    };

    const handleOrientationChange = () => {
      // Handle orientation change with slight delay for accurate measurements
      setTimeout(updateViewport, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Initial measurement
    updateViewport();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateViewport]);

  return viewport;
}

export interface IntersectionOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
}

export function useIntersectionObserver(
  options: IntersectionOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = targetRef.current;
    if (!element || typeof window === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      setIsIntersecting(entry.isIntersecting);
      setIntersectionRatio(entry.intersectionRatio);
    }, {
      threshold: options.threshold || 0,
      rootMargin: options.rootMargin || '0px',
      root: options.root || null
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options.threshold, options.rootMargin, options.root]);

  return {
    targetRef,
    isIntersecting,
    intersectionRatio,
    isVisible: isIntersecting && intersectionRatio > 0
  };
}

export function useVisibilityObserver(
  threshold: number = 0.1,
  rootMargin: string = '50px'
) {
  return useIntersectionObserver({ threshold, rootMargin });
}

export default useViewport;