import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_REALM = "SEA Admin";

function getAdminCredentials() {
  const username = process.env.SEA_ADMIN_USERNAME;
  const password = process.env.SEA_ADMIN_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

function unauthorizedResponse() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${ADMIN_REALM}", charset="UTF-8"`,
    },
  });
}

function misconfiguredResponse() {
  return new NextResponse("Admin auth is not configured.", {
    status: 503,
  });
}

function credentialsAreValid(
  authorizationHeader: string | null,
  credentials: { username: string; password: string },
) {
  if (!authorizationHeader?.startsWith("Basic ")) {
    return false;
  }

  const encodedCredentials = authorizationHeader.slice(6).trim();

  try {
    const decodedCredentials = atob(encodedCredentials);
    const separatorIndex = decodedCredentials.indexOf(":");

    if (separatorIndex === -1) {
      return false;
    }

    const username = decodedCredentials.slice(0, separatorIndex);
    const password = decodedCredentials.slice(separatorIndex + 1);

    return username === credentials.username && password === credentials.password;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const credentials = getAdminCredentials();

  if (!credentials) {
    return misconfiguredResponse();
  }

  if (!credentialsAreValid(request.headers.get("authorization"), credentials)) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};