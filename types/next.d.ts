/// <reference types="next" />

declare module 'next/server' {
  export type { NextRequest } from 'next/dist/server/web/spec-extension/request'
  export type { NextResponse } from 'next/dist/server/web/spec-extension/response'
  export { NextResponse } from 'next/dist/server/web/spec-extension/response'
}
