import { redirect } from "next/navigation";
import ClientLoginPortal from "../components/ClientLoginPortal.js";
import { auth } from "../auth.js";
import { findClientByEmail } from "../lib/store.js";

export default async function HomePage({ searchParams }) {
  const session = await auth();
  const query = await searchParams;

  if (session?.user?.email) {
    const client = findClientByEmail(session.user.email);
    if (client) {
      redirect(`/client/${client.clientId}`);
    }
  }

  const authError = typeof query?.error === "string" ? query.error : "";
  const availableProviders = {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    outlook: Boolean(process.env.MICROSOFT_ENTRA_ID_CLIENT_ID && process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET)
  };
  return <ClientLoginPortal authError={authError} availableProviders={availableProviders} />;
}
