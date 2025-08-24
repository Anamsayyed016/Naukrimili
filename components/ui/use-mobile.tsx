"use client";
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);
  const [isClient, setIsClient] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsClient(true);
    
    function update() {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      }
    }
    
    update();
    
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
  }, []);

  // Return false during SSR to prevent hydration mismatch
  return isClient ? isMobile : false;
}

export default useIsMobile;
