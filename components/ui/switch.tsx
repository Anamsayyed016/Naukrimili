"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(function Switch({ className, ...props }, ref) {
  return (
    <SwitchPrimitives.Root ref={ref} className={className} {...props}>
      <SwitchPrimitives.Thumb />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = "Switch";

export default Switch;
