import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
export function adminEmail(email?: string | null) {
  return !!email && (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}
export function authConfigured() { return !!(process.env.AUTH_SECRET && process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && process.env.ADMIN_EMAILS); }
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  callbacks: { signIn({ account, profile }) { return account?.provider === 'google' && profile?.email_verified === true && adminEmail(profile?.email); } }
});
