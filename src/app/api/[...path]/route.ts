import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getUpstreamBase(): string {
  const configured =
    process.env.LOCAL_BACKEND_URL ||
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://clientbackend.carramarket.com";
  return configured.replace(/\/$/, "");
}

function rewriteCookie(rawCookie: string, req: NextRequest): string {
  const isHttps = req.nextUrl.protocol === "https:";

  // Strip Domain attribute so the cookie is bound to the frontend host (e.g. carramarket.com or localhost)
  // even if the backend was configured with COOKIE_DOMAIN=localhost.
  let cookie = rawCookie.replace(/;\s*Domain=[^;]*/gi, "");

  if (isHttps) {
    // Inside Telegram WebView (iframe on web.telegram.org), cookies must be SameSite=None; Secure
    if (!/;\s*Secure/i.test(cookie)) {
      cookie += "; Secure";
    }
    if (/;\s*SameSite=/i.test(cookie)) {
      cookie = cookie.replace(/;\s*SameSite=[^;]*/gi, "; SameSite=None");
    } else {
      cookie += "; SameSite=None";
    }
  } else {
    cookie = cookie.replace(/;\s*Secure/gi, "");
    cookie = cookie.replace(/;\s*SameSite=None/gi, "; SameSite=Lax");
  }
  return cookie;
}

async function proxyRequest(req: NextRequest): Promise<NextResponse> {
  const upstreamBase = getUpstreamBase();
  const targetUrl = `${upstreamBase}${req.nextUrl.pathname}${req.nextUrl.search}`;

  const headers = new Headers();
  const forwardHeaderNames = [
    "content-type",
    "accept",
    "cookie",
    "x-csrf-token",
    "authorization",
    "x-requested-with",
    "user-agent",
  ];
  for (const name of forwardHeaderNames) {
    const val = req.headers.get(name);
    if (val) {
      headers.set(name, val);
    }
  }

  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD", "OPTIONS"].includes(method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      redirect: "manual",
      cache: "no-store",
    });

    const resHeaders = new Headers();
    const contentType = upstreamRes.headers.get("content-type");
    if (contentType) {
      resHeaders.set("content-type", contentType);
    }

    const setCookies =
      typeof upstreamRes.headers.getSetCookie === "function"
        ? upstreamRes.headers.getSetCookie()
        : [];
    if (setCookies.length > 0) {
      for (const ck of setCookies) {
        resHeaders.append("set-cookie", rewriteCookie(ck, req));
      }
    } else {
      const singleCookie = upstreamRes.headers.get("set-cookie");
      if (singleCookie) {
        resHeaders.set("set-cookie", rewriteCookie(singleCookie, req));
      }
    }

    const resBody = await upstreamRes.arrayBuffer();
    return new NextResponse(resBody, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upstream proxy error";
    return NextResponse.json(
      {
        success: false,
        message: "Unable to reach backend server",
        error: msg,
      },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  return proxyRequest(req);
}

export async function POST(req: NextRequest) {
  return proxyRequest(req);
}

export async function PUT(req: NextRequest) {
  return proxyRequest(req);
}

export async function PATCH(req: NextRequest) {
  return proxyRequest(req);
}

export async function DELETE(req: NextRequest) {
  return proxyRequest(req);
}

export async function OPTIONS(req: NextRequest) {
  return proxyRequest(req);
}
