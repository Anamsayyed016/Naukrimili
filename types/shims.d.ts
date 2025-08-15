// Minimal module shims to satisfy TypeScript during local builds when
// type packages are not present. These should be removed once the
// corresponding @types or libraries are properly installed.

declare module 'react' {
  export = React;
  export as namespace React;
  
  namespace React {
    type ReactNode = any;
    type ReactElement = any;
    type ComponentType<P = any> = any;
    type FC<P = {}> = any;
    
    function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
    function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    function forwardRef<T, P = {}>(render: (props: P, ref: React.Ref<T>) => React.ReactElement | null): React.ComponentType<P & { ref?: React.Ref<T> }>;
  }
}

declare module 'react-dom';
declare module 'react-dropzone';
declare module 'lucide-react';
declare module 'next-auth/react';


