import React from "react";
import clsx from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  shadow?: boolean;
  padding?: boolean;
}

export default function Card({ children, className, shadow = true, padding = true }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-lg bg-card text-card-foreground border border-card",
        shadow && "shadow-md",
        padding && "p-4",
        className
      )}
    >
      {children}
    </div>
  );
} 