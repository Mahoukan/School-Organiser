export { auth as proxy } from "./auth";

export const config = {
  matcher: ["/", "/timetable/:path*", "/classes/:path*", "/calendar/:path*", "/setup/:path*", "/settings/:path*"],
};
