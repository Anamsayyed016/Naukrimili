"use client";

import * as React from "react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert({ className, ...props }, ref) {
  return <div ref={ref} role="alert" className={className} {...props} />;
});
Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(function AlertTitle({ className, ...props }, ref) {
  return <h5 ref={ref} className={className} {...props} />;
});
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(function AlertDescription({ className, ...props }, ref) {
  return <p ref={ref} className={className} {...props} />;
});
AlertDescription.displayName = "AlertDescription";

export { AlertDescription as Description };

export default Alert;
