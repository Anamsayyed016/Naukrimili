// Route handler types (kept minimal)
import type { NextRequest } from 'next/server'

export interface RouteHandlerContext {
  params: Record<string, string | string[]>
}

export type RouteHandler = (
  request: NextRequest,
  context: RouteHandlerContext
) => Promise<Response> | Response