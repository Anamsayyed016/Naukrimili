import React from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "px-4 py-2 rounded font-semibold transition focus:outline-none focus:ring",
        {
          "bg-jobseeker-primary text-white hover:bg-jobseeker-primary/90": variant === "primary",
          "bg-jobseeker-secondary text-jobseeker-primary hover:bg-jobseeker-secondary/80": variant === "secondary",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
          "w-full": fullWidth,
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
} 