import { type NextRequest, NextResponse } from "next/server";
import { resolveLocaleRedirect } from "./lib/redirect";

export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const decision = resolveLocaleRedirect(pathname, search);
  if (decision.kind === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon\\.ico|.*\\.[a-zA-Z0-9]+$|.*opengraph-image).*)"],
};
