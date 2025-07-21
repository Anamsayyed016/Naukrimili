import React from "react";
import clsx from "clsx";

type BadgeVariant = "primary" | "secondary" | "success" | "danger";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = "primary", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block px-2 py-0.5 rounded text-xs font-medium",
        {
          "bg-jobseeker-primary text-white": variant === "primary",
          "bg-jobseeker-secondary text-jobseeker-primary": variant === "secondary",
          "bg-green-500 text-white": variant === "success",
          "bg-red-500 text-white": variant === "danger",
        },
        className
      )}
    >
      {children}
    </span>
  );
} 