import React from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={clsx(
        "border border-input rounded px-3 py-2 focus:outline-none focus:ring focus:border-jobseeker-primary bg-background text-foreground transition",
        className
      )}
      {...props}
    />
  );
} 