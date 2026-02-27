import { getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import { findClientByEmail, provisionClientFromOAuth, saveClientConsent } from "./lib/store.js";

const TRACKING_SCOPE_NOTICE =
  "Case support metadata, vendor quality signals, and read-only communication activity may be shared with MB for service monitoring.";
const TERMS_VERSION = "2026-02-27";

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly"
        }
      }
    })
  );
}

if (process.env.MICROSOFT_ENTRA_ID_CLIENT_ID && process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET) {
  providers.push(
    AzureAD({
      tenantId: process.env.MICROSOFT_ENTRA_ID_TENANT_ID || "common",
      clientId: process.env.MICROSOFT_ENTRA_ID_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid profile email offline_access User.Read Mail.Read Calendars.Read"
        }
      }
    })
  );
}

export const authOptions = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/"
  },
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    signIn({ user, account }) {
      const email = user.email?.toLowerCase() ?? "";
      if (!email) return false;
      const client =
        findClientByEmail(email) ??
        provisionClientFromOAuth({
          email,
          fullName: user.name
        });

      saveClientConsent(client.clientId, {
        provider: account?.provider ?? "unknown",
        scopes: (account?.scope ?? "").split(" ").filter(Boolean),
        termsVersion: TERMS_VERSION,
        notice: TRACKING_SCOPE_NOTICE
      });
      user.id = client.clientId;
      user.clientId = client.clientId;
      user.authProvider = account?.provider ?? "oauth";
      user.termsVersion = TERMS_VERSION;
      return true;
    },
    jwt({ token, user, account }) {
      if (user) {
        token.clientId = user.clientId ?? user.id;
        token.authProvider = user.authProvider ?? account?.provider ?? token.authProvider ?? "oauth";
        token.termsVersion = user.termsVersion ?? token.termsVersion ?? TERMS_VERSION;
      }
      if (account?.scope) {
        token.oauthScope = account.scope;
      }
      return token;
    },
    session({ session, token }) {
      session.user.clientId = token.clientId;
      session.user.authProvider = token.authProvider;
      session.user.termsVersion = token.termsVersion;
      session.user.oauthScope = token.oauthScope;
      return session;
    }
  }
};

export function auth() {
  return getServerSession(authOptions);
}
