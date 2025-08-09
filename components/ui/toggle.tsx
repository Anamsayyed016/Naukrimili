"use client";

import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";

export const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
>(function Toggle({ className, ...props }, ref) {
  return <TogglePrimitive.Root ref={ref} className={className} {...props} />;
});
Toggle.displayName = "Toggle";

export default Toggle;