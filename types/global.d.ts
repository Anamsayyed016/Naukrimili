/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export {};