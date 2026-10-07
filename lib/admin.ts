import { auth, adminEmail, authConfigured } from './auth';
export async function authorizeAdmin(request: Request) {
  if (!authConfigured()) return null;
  // Reject cross-site writes even if a browser sends an authenticated cookie.
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return null;
  const session = await auth();
  return adminEmail(session?.user?.email) ? session!.user!.email! : null;
}
