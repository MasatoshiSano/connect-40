import { useEffect, useState } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('sm');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= breakpoints['2xl']) setCurrentBreakpoint('2xl');
      else if (width >= breakpoints.xl) setCurrentBreakpoint('xl');
      else if (width >= breakpoints.lg) setCurrentBreakpoint('lg');
      else if (width >= breakpoints.md) setCurrentBreakpoint('md');
      else setCurrentBreakpoint('sm');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAbove = (breakpoint: Breakpoint) => {
    const currentWidth = window.innerWidth;
    return currentWidth >= breakpoints[breakpoint];
  };

  const isBelow = (breakpoint: Breakpoint) => {
    const currentWidth = window.innerWidth;
    return currentWidth < breakpoints[breakpoint];
  };

  return { currentBreakpoint, isAbove, isBelow };
};
