declare global {
  namespace JSX {
    // Allow any intrinsic element to avoid JSX type errors in custom components
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};
