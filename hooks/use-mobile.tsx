import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return; // SSR safeguard
    const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
    const mql = window.matchMedia(query);
    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return isMobile;
}
