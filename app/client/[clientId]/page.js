import Link from "next/link";
import { redirect } from "next/navigation";
import ClientExperience from "../../../components/ClientExperience.js";
import { buildClientReport, buildDigest } from "../../../lib/domain.js";
import { auth } from "../../../auth.js";
import { getClient, getClientFeedback, listClientConsents } from "../../../lib/store.js";
import { analyzeBothSimulatedCases } from "../../../lib/email-report-analyzer.js";

export default async function ClientPage({ params }) {
  const { clientId } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  const client = getClient(clientId);

  if (!client) {
    return (
      <main>
        <h1>Client not found</h1>
        <Link href="/">Back to dashboard</Link>
      </main>
    );
  }

  if (client.email.toLowerCase() !== session.user.email.toLowerCase()) {
    redirect("/");
  }

  const report = buildClientReport(client);
  const digest = buildDigest(client, report);
  const feedback = getClientFeedback(clientId);
  const consents = listClientConsents(clientId);
  const authMethod = session.user.authProvider ?? "email";

  const case1 = getClient("case-1");
  const case2 = getClient("case-2");
  const emailAnalysis = (case1 || case2) ? analyzeBothSimulatedCases() : null;
  const simulatedCaseReports = [];
  if (case1) simulatedCaseReports.push({ client: case1, report: buildClientReport(case1), label: "Case 1 (auto collision)", emailAnalysis: emailAnalysis?.case1 });
  if (case2) simulatedCaseReports.push({ client: case2, report: buildClientReport(case2), label: "Case 2 (premises injury)", emailAnalysis: emailAnalysis?.case2 });

  return (
    <ClientExperience
      client={client}
      report={report}
      digest={digest}
      feedback={feedback}
      authMethod={authMethod}
      consents={consents}
      simulatedCaseReports={simulatedCaseReports}
    />
  );
}
