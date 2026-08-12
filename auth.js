import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getDatabase } from "./lib/db/index.js";
import { accounts, sessions, users } from "./lib/db/schema.js";
import { claimLegacyData, isInitialOwnerEmail, normalizeEmail } from "./lib/server/claimLegacyData.js";

function createAdapter() {
  const adapter = DrizzleAdapter(getDatabase(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
  });
  return {
    ...adapter,
    createUser: (user) => adapter.createUser({ ...user, emailVerified: new Date() }),
    createSession: async (session) => {
      const user = await adapter.getUser(session.userId);
      if (isInitialOwnerEmail(user?.email)) {
        await claimLegacyData(user);
      }
      return adapter.createSession(session);
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: createAdapter(),
  session: { strategy: "database" },
  trustHost: true,
  pages: { signIn: "/signin", error: "/signin" },
  providers: [Google({
    profile(profile) {
      const email = normalizeEmail(profile.email);
      if (!profile.email_verified || !email) throw new Error("Google email is not verified.");
      return { id: profile.sub, name: profile.name ?? email, email, image: profile.picture ?? null };
    },
  })],
  callbacks: {
    authorized({ auth: session }) {
      return Boolean(session?.user?.id);
    },
    signIn({ profile, user }) {
      const email = normalizeEmail(profile?.email ?? user?.email);
      const verified = profile ? profile.email_verified === true : Boolean(user?.emailVerified);
      const allowed = verified && Boolean(email);
      if (!allowed) console.warn("Google sign-in rejected for an unapproved account.");
      return allowed;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
}));
