// React 18 compatibility types for components that expect older React types
import React from 'react';

declare module 'react' {
  // Add missing types that were available in React 17
  export type ElementRef<T extends React.ElementType> = T extends React.ComponentType<infer P> ? P : never;
  
  export type ComponentPropsWithoutRef<T extends React.ElementType> = Omit<
    React.ComponentProps<T>,
    'ref'
  >;
  
  export type ComponentProps<T extends React.ElementType> = React.ComponentProps<T>;
  
  // Add missing React types
  export type RefObject<T> = React.RefObject<T>;
  export type ReactElement<T = any> = React.ReactElement<T>;
  
  // Add missing HTML attribute types
  export interface ButtonHTMLAttributes<T> extends React.HTMLAttributes<T> {
    disabled?: boolean;
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: string;
    formNoValidate?: boolean;
    formTarget?: string;
    name?: string;
    type?: 'button' | 'submit' | 'reset';
    value?: string | string[] | number;
  }
  
  export interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
    accept?: string;
    alt?: string;
    autoComplete?: string;
    autoFocus?: boolean;
    capture?: boolean | string;
    checked?: boolean;
    crossOrigin?: string;
    disabled?: boolean;
    enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
    form?: string;
    formAction?: string;
    formEncType?: string;
    formMethod?: string;
    formNoValidate?: boolean;
    formTarget?: string;
    height?: number | string;
    list?: string;
    max?: number | string;
    maxLength?: number;
    min?: number | string;
    minLength?: number;
    multiple?: boolean;
    name?: string;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    size?: number;
    src?: string;
    step?: number | string;
    type?: string;
    value?: string | string[] | number;
    width?: number | string;
  }
  
  export interface TextareaHTMLAttributes<T> extends React.HTMLAttributes<T> {
    autoComplete?: string;
    autoFocus?: boolean;
    cols?: number;
    disabled?: boolean;
    enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
    form?: string;
    maxLength?: number;
    minLength?: number;
    name?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    rows?: number;
    value?: string | string[] | number;
    wrap?: string;
  }
  
  export interface ThHTMLAttributes<T> extends React.HTMLAttributes<T> {
    align?: 'left' | 'center' | 'right' | 'justify' | 'char';
    colSpan?: number;
    headers?: string;
    rowSpan?: number;
    scope?: string;
    abbr?: string;
    height?: number | string;
    width?: number | string;
    valign?: 'top' | 'middle' | 'bottom' | 'baseline';
  }
  
  export interface TdHTMLAttributes<T> extends React.HTMLAttributes<T> {
    align?: 'left' | 'center' | 'right' | 'justify' | 'char';
    colSpan?: number;
    headers?: string;
    rowSpan?: number;
    scope?: string;
    abbr?: string;
    height?: number | string;
    width?: number | string;
    valign?: 'top' | 'middle' | 'bottom' | 'baseline';
  }
  
  // Add missing React types
  export interface ErrorInfo {
    componentStack: string;
  }
  
  export class Component<P = {}, S = {}, SS = any> extends React.Component<P, S, SS> {
    state: Readonly<S>;
    props: Readonly<P>;
    setState(state: S | ((prevState: Readonly<S>, props: Readonly<P>) => S | Pick<S, keyof S> | null) | Pick<S, keyof S> | null, callback?: () => void): void;
  }
  
  // Add useId hook for React 17 compatibility
  export function useId(): string;
}

// Global augmentation for ComponentProps
declare global {
  namespace React {
    type ComponentProps<T extends React.ElementType> = React.ComponentProps<T>;
  }
}
