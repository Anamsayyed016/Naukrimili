"use client";

import * as React from "react";

// Temporary minimal stub Toaster. Replace with real 'sonner' integration later.
export interface ToasterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Toaster: React.FC<ToasterProps> = ({ className, ...props }) => (
  <div className={className} {...props} />
);

export default Toaster;