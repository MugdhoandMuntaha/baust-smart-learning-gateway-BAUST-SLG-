import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define Public Routes
  const publicRoutes = ["/", "/signup", "/pending", "/admin/login", "/api/verify-code"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Allow static files, api and static paths to pass through
  if (isPublicRoute || pathname.startsWith("/_next") || pathname.includes("/logo.png") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 2. Initialize Supabase Server Client inside Middleware Proxy context
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 3. Retrieve logged-in Auth User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Authentication Check
  if (!user) {
    // Not logged in — redirect to login page (/)
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 5. Query student profile to determine if they are student or admin
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("approved")
    .eq("id", user.id)
    .single();

  const isStudent = !!profile;
  const isAdmin = !isStudent || user.email?.includes("admin");

  if (pathname.startsWith("/admin")) {
    if (!isAdmin) {
      // Students cannot access admin dashboard — redirect to student dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Admin is allowed to pass
    return response;
  }

  // 6. Student Approval check (Join Request verification)
  if (isStudent && !profile?.approved) {
    // Registration not approved yet — redirect to pending screen
    if (pathname !== "/pending") {
      return NextResponse.redirect(new URL("/pending", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - favicon.ico
     * - public assets
     */
    "/((?!favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
