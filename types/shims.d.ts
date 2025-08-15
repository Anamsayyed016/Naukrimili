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
    
    // Event types
    type FormEvent<T = Element> = any;
    type ChangeEvent<T = Element> = any;
    type MouseEvent<T = Element> = any;
    type KeyboardEvent<T = Element> = any;
    type FocusEvent<T = Element> = any;
    type DragEvent<T = Element> = any;
    type SyntheticEvent<T = Element> = any;
    
    // HTML attributes
    interface HTMLAttributes<T> {
      [key: string]: any;
    }
    
    // Ref types
    type Ref<T> = any;
    
    // Hook types
    function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
    function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
    function useMemo<T>(factory: () => T, deps: any[]): T;
    function useRef<T>(initialValue: T): { current: T };
    function useContext<T>(context: any): T;
    function createContext<T>(defaultValue: T): any;
    function forwardRef<T, P = {}>(render: (props: P, ref: React.Ref<T>) => React.ReactElement | null): React.ComponentType<P & { ref?: React.Ref<T> }>;
  }
}

declare module 'react-dom';
declare module 'react-dropzone';
declare module 'lucide-react';
declare module 'next-auth/react';
declare module 'recharts';


