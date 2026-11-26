import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          await connectDB();
          const user = await User.findOne({
            email: credentials.email.toLowerCase(),
          });

          if (!user || !user.passwordHash) return null;

          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );
          if (!isValid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        } catch (err) {
          console.error("[NextAuth] Credentials authorize error:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          const existing = await User.findOne({
            email: user.email!.toLowerCase(),
          });
          if (!existing) {
            await User.create({
              name: user.name,
              email: user.email!.toLowerCase(),
              image: user.image,
              provider: "google",
              role: "customer",
            });
          }
        } catch (err) {
          console.error("[NextAuth] Google signIn callback error:", err);
          // Still allow sign-in even if DB write fails
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // Only fetch from DB on initial sign-in (user object is present)
      // On subsequent requests, just return the existing token to avoid
      // hitting MongoDB on every API call.
      if (user) {
        // user.id is set by the credentials provider's authorize()
        // For Google, we need to look up the DB id
        if (account?.provider === "google") {
          try {
            await connectDB();
            const dbUser = await User.findOne({
              email: user.email!.toLowerCase(),
            });
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.role = dbUser.role;
            } else {
              token.role = "customer";
            }
          } catch (err) {
            console.error("[NextAuth] jwt callback DB lookup error:", err);
            token.role = "customer";
          }
        } else {
          // Credentials provider already resolved id and role in authorize()
          token.id = user.id;
          token.role = (user as { role?: string }).role ?? "customer";
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/log-in-page",
    error: "/log-in-page",
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
