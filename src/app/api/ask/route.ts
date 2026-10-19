import { handleAsk } from "@/lib/api";
import { chat } from "../../../../ai-kit/router";

export const dynamic = "force-dynamic";

export function POST(request: Request): Promise<Response> {
  return handleAsk(request, { chat });
}
