"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

export const ToggleGroup = React.forwardRef<
  React.Ref<typeof ToggleGroupPrimitive.Root>,
  React.HTMLAttributes<HTMLDivElement>
>(function ToggleGroup({ className, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Root ref={ref} className={className} {...props} />
  );
});
ToggleGroup.displayName = "ToggleGroup";

export const ToggleGroupItem = React.forwardRef<
  React.Ref<typeof ToggleGroupPrimitive.Item>,
  React.HTMLAttributes<HTMLButtonElement>
>(function ToggleGroupItem({ className, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Item ref={ref} className={className} {...props} />
  );
});
ToggleGroupItem.displayName = "ToggleGroupItem";

export default ToggleGroup;
