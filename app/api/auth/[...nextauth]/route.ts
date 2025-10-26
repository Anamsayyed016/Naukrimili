import { handler } from "@/lib/nextauth-config"

export async function GET(request: Request) {
  return await handler(request);
}

export async function POST(request: Request) {
  return await handler(request);
}
