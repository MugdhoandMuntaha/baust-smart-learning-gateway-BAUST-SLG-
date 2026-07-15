import { NextResponse } from "next/server";
import { encrypt } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    const validCode = process.env.CLASS_ACCESS_CODE;

    if (!validCode) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (code !== validCode) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 401 }
      );
    }

    // Create encrypted session token
    const token = await encrypt({
      role: "viewer",
      verified: true,
    });

    const response = NextResponse.json({ success: true });

    // Set httpOnly secure cookie
    response.cookies.set("cr-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
