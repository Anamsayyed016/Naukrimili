declare module "*.ts" {
  import { NextRequest } from 'next/server'
  
  interface RouteHandlerContext {
    params: Record<string, string | string[]>
  }

  export type RouteHandler = (
    request: NextRequest,
    context: RouteHandlerContext
  ) => Promise<Response> | Response
}
