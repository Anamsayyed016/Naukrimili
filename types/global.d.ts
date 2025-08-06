/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare global {
  // Node.js types
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      [key: string]: string | undefined}
  }

  // Web API types
  interface RequestInit {
    method?: string;
    headers?: Record<string, string> | Headers;
    body?: string | FormData | URLSearchParams | ReadableStream | null;
    mode?: 'cors' | 'no-cors' | 'same-origin';
    credentials?: 'omit' | 'same-origin' | 'include';
    cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
    redirect?: 'follow' | 'error' | 'manual';
    referrer?: string;
    referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
    integrity?: string;
    keepalive?: boolean;
    signal?: AbortSignal | null}

  // Buffer types
  type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex';

  // React types
  namespace React {
    interface ReactElement<P = unknown, T extends string | JSXElementConstructor<unknown> = string | JSXElementConstructor<unknown>> {
      type: T;
      props: P;
      key: Key | null}
  }

  // DMMF types (for Prisma)
  interface DMMF {
    modelMap: Record<string, unknown>;
    enumMap: Record<string, unknown>;
    typeMap: Record<string, unknown>}

  // Proxy types
  interface ProxyConstructor {
    new <T extends object>(target: T, handler: ProxyHandler<T>): T}
}

export {}; 