import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Google auth route working" });
}

// Add a default export to ensure this file is a valid module
export default function handler() {
  return Response.json({ message: "Google auth route default export" });
}
