"use client";

// Clean rewritten toast primitives (minimal subset of shadcn style)
import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { X } from 'lucide-react';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export const ToastProvider = ToastPrimitives.Provider;

export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(function ToastViewport({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        'fixed top-0 right-0 z-[100] m-4 flex max-h-screen w-full flex-col-reverse gap-2 sm:bottom-0 sm:top-auto sm:flex-col sm:w-[420px]',
        className
      )}
      {...props}
    />
  );
});
ToastViewport.displayName = 'ToastViewport';

const baseToast = 'group relative pointer-events-auto flex w-full items-start gap-3 overflow-hidden rounded-md border bg-background p-4 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out';

export interface SimpleToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> {
  variant?: 'default' | 'destructive';
}

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  SimpleToastProps
>(function Toast({ className, variant = 'default', ...props }, ref) {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        baseToast,
        variant === 'destructive'
          ? 'border-destructive bg-destructive text-destructive-foreground'
          : 'border-border',
        className
      )}
      {...props}
    />
  );
});
Toast.displayName = 'Toast';

export const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(function ToastAction({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Action
      ref={ref}
      className={cn(
        'inline-flex h-8 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        className
      )}
      {...props}
    />
  );
});
ToastAction.displayName = 'ToastAction';

export const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(function ToastClose({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        'absolute right-2 top-2 rounded p-1 text-foreground/60 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none group-hover:opacity-100',
        className
      )}
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
  );
});
ToastClose.displayName = 'ToastClose';

export const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(function ToastTitle({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Title
      ref={ref}
      className={cn('text-sm font-semibold', className)}
      {...props}
    />
  );
});
ToastTitle.displayName = 'ToastTitle';

export const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(function ToastDescription({ className, ...props }, ref) {
  return (
    <ToastPrimitives.Description
      ref={ref}
      className={cn('text-sm opacity-90', className)}
      {...props}
    />
  );
});
ToastDescription.displayName = 'ToastDescription';

export type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
export type ToastActionElement = React.ReactElement<typeof ToastAction>;

// (Named exports already declared above; no need to re-export again.)
