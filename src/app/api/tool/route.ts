import { handleTool } from "@/lib/api";

export const dynamic = "force-dynamic";

export function POST(request: Request): Promise<Response> {
  return handleTool(request);
}
