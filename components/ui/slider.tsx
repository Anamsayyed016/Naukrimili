"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(function Slider({ className, ...props }, ref) {
  return (
    <SliderPrimitive.Root ref={ref} className={className} {...props}>
      <SliderPrimitive.Track>
        <SliderPrimitive.Range />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb />
    </SliderPrimitive.Root>
  );
});
Slider.displayName = "Slider";

export default Slider;