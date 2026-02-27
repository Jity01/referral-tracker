#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { randomUUID } from "node:crypto";

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const options = {
    caseId: "MB-CASE-2026",
    intervalMs: 20_000,
    leadInMs: 3_000,
    dryRun: false,
    startAtIso: null
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--case-id") options.caseId = argv[i + 1];
    else if (arg === "--interval-ms") options.intervalMs = Number(argv[i + 1]);
    else if (arg === "--lead-in-ms") options.leadInMs = Number(argv[i + 1]);
    else if (arg === "--start-at") options.startAtIso = argv[i + 1];
  }

  return options;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function createMessageId(email) {
  const domain = (email.split("@")[1] || "local.test").toLowerCase();
  return `<${randomUUID()}@${domain}>`;
}

async function requestToken(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString()
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`OAuth token request failed: ${payload.error_description ?? payload.error ?? response.status}`);
  }
  return payload;
}

function createGoogleTokenProvider() {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const refreshToken = requireEnv("SIM_TEST_GOOGLE_REFRESH_TOKEN");
  let cachedToken = null;
  let expiresAt = 0;

  return async () => {
    if (cachedToken && Date.now() < expiresAt - 60_000) return cachedToken;

    const token = await requestToken("https://oauth2.googleapis.com/token", {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    });

    cachedToken = token.access_token;
    expiresAt = Date.now() + Number(token.expires_in ?? 3600) * 1000;
    return cachedToken;
  };
}

function createMicrosoftTokenProvider() {
  const clientId =
    process.env.SIM_MICROSOFT_CLIENT_ID || requireEnv("MICROSOFT_ENTRA_ID_CLIENT_ID");
  const clientSecret =
    process.env.SIM_MICROSOFT_CLIENT_SECRET || requireEnv("MICROSOFT_ENTRA_ID_CLIENT_SECRET");
  const tenantId =
    process.env.SIM_MICROSOFT_TENANT_ID || requireEnv("MICROSOFT_ENTRA_ID_TENANT_ID");
  const refreshToken = requireEnv("SIM_VENDOR_MICROSOFT_REFRESH_TOKEN");
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  let cachedToken = null;
  let expiresAt = 0;

  return async () => {
    if (cachedToken && Date.now() < expiresAt - 60_000) return cachedToken;

    const token = await requestToken(tokenUrl, {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      scope: "https://graph.microsoft.com/Mail.Send offline_access openid profile email"
    });

    cachedToken = token.access_token;
    expiresAt = Date.now() + Number(token.expires_in ?? 3600) * 1000;
    return cachedToken;
  };
}

async function sendWithSmtpOAuth({ host, port, secure, user, getAccessToken, mail }) {
  const _ = { host, port, secure, user, getAccessToken, mail };
  return _;
}

function formatMimeHeaders(headers) {
  return Object.entries(headers)
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => `${name}: ${value}`)
    .join("\r\n");
}

function toBase64(input) {
  return Buffer.from(input, "utf8").toString("base64");
}

function toBase64Url(input) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function sendWithMicrosoftGraphMime({ from, to, accessToken, subject, text, date, messageId, headers }) {
  const baseHeaders = {
    From: from,
    To: to,
    Subject: subject,
    Date: new Date(date).toUTCString(),
    "Message-ID": messageId,
    "MIME-Version": "1.0",
    "Content-Type": "text/plain; charset=utf-8",
    ...headers
  };

  const mime = `${formatMimeHeaders(baseHeaders)}\r\n\r\n${text}\r\n`;
  const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain"
    },
    body: toBase64(mime)
  });

  if (!response.ok) {
    const failureText = await response.text();
    throw new Error(`Microsoft Graph sendMail failed: ${response.status} ${failureText}`);
  }
}

async function sendWithGmailApiMime({ accessToken, from, to, subject, text, date, messageId, headers }) {
  const mimeHeaders = {
    From: from,
    To: to,
    Subject: subject,
    Date: new Date(date).toUTCString(),
    "Message-ID": messageId,
    "MIME-Version": "1.0",
    "Content-Type": "text/plain; charset=utf-8",
    ...headers
  };

  const mime = `${formatMimeHeaders(mimeHeaders)}\r\n\r\n${text}\r\n`;
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ raw: toBase64Url(mime) })
  });

  if (!response.ok) {
    const failureText = await response.text();
    throw new Error(`Gmail API send failed: ${response.status} ${failureText}`);
  }
}

function buildCaseOneScenario(caseId) {
  const baseSubject = `(case 1) [${caseId}-001] Intro + onboarding for billing dispute`;
  const caseLabel = `${caseId}-001`;
  return [
    {
      id: "c1-e1",
      actor: "vendor",
      thread: "case-1",
      subject: baseSubject,
      text: `Hi Maya,

Great meeting you today. I am Jity from Osmaura Vendor Services.

Case: ${caseLabel}
Matter: billing dispute + account correction
Goal: submit corrections, negotiate balances, close all action items

If you are ready, send me the latest statements and authorization form and I will start intake today.

Best,
Jity`
    },
    {
      id: "c1-e2",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e1",
      subject: `Re: ${baseSubject}`,
      text: `Hi Jity,

Thanks for the intro. Nice to meet you too.

Attached:
- signed authorization
- statement batch A (Jan-Feb)
- statement batch B (Mar)

Please confirm intake complete.

Maya`
    },
    {
      id: "c1-e3",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e2",
      subject: `Re: ${baseSubject}`,
      text: `Hi Maya,

Intake complete and indexed under ${caseLabel}.
I found 3 line-item mismatches already and opened follow-up requests.

ETA for first status packet: tomorrow morning.

Best,
Jity`
    },
    {
      id: "c1-e4",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e3",
      subject: `Re: ${baseSubject}`,
      text: `Perfect, thank you.

Please prioritize account ending in 4421. That one is time-sensitive for me.

Maya`
    },
    {
      id: "c1-e5",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e4",
      subject: `Re: ${baseSubject}`,
      text: `Done. 4421 is now priority queue.

I called the provider and confirmed dispute review has started.
Reference: PR-4421-77

Jity`
    },
    {
      id: "c1-e6",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e5",
      subject: `Re: ${baseSubject}`,
      text: `Amazing turnaround.

Do you need anything else from me right now?

Maya`
    },
    {
      id: "c1-e7",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e6",
      subject: `Re: ${baseSubject}`,
      text: `Only one item: proof of payment receipt from 2025-11-09.

If you send that, I can close issue 4421 this week.

Jity`
    },
    {
      id: "c1-e8",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e7",
      subject: `Re: ${baseSubject}`,
      text: `Attached receipt from 2025-11-09.

Thanks again for being clear and fast.

Maya`
    },
    {
      id: "c1-e9",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e8",
      subject: `Re: ${baseSubject}`,
      text: `Received.

I submitted final evidence to provider and insurer.
Next checkpoint: 24 hours.

Jity`
    },
    {
      id: "c1-e10",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e9",
      subject: `Re: ${baseSubject}`,
      text: `Great. I appreciate the proactive updates.

Maya`
    },
    {
      id: "c1-e11",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e10",
      subject: `Re: ${baseSubject}`,
      text: `Status packet 1:
- 4421 pending final sign-off
- 8830 balance reduced by $210
- 1172 duplicate fee removed

No blockers.

Jity`
    },
    {
      id: "c1-e12",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e11",
      subject: `Re: ${baseSubject}`,
      text: `This is super helpful.

Can we target full closure before next Friday?

Maya`
    },
    {
      id: "c1-e13",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e12",
      subject: `Re: ${baseSubject}`,
      text: `Yes, that timeline is realistic.

I escalated 4421 to supervisor queue to keep pace.

Jity`
    },
    {
      id: "c1-e14",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e13",
      subject: `Re: ${baseSubject}`,
      text: `Thank you.

Please send me the final balance summary as soon as available.

Maya`
    },
    {
      id: "c1-e15",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e14",
      subject: `Re: ${baseSubject}`,
      text: `Final review completed:
- 4421 corrected to $0
- 8830 corrected to $145
- 1172 corrected to $0

Draft summary attached for your review.

Jity`
    },
    {
      id: "c1-e16",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e15",
      subject: `Re: ${baseSubject}`,
      text: `Reviewed and approved.

Everything looks right on my side.

Maya`
    },
    {
      id: "c1-e17",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e16",
      subject: `Re: ${baseSubject}`,
      text: `Great.

I sent closure filings to all parties and requested written confirmation.

Jity`
    },
    {
      id: "c1-e18",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e17",
      subject: `Re: ${baseSubject}`,
      text: `Got it. This has been smooth and easy to follow.

Thank you.

Maya`
    },
    {
      id: "c1-e19",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e18",
      subject: `Re: ${baseSubject}`,
      text: `Case-end signal:
All providers acknowledged closure and balances now match final summary.
No open action items remain.

Case ${caseLabel} is now closed.

Jity`
    },
    {
      id: "c1-e20",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e19",
      subject: `Re: ${baseSubject}`,
      text: `Confirmed on my portal too.

Closing this thread. Really appreciate your responsiveness and execution.

Maya`
    }
  ];
}

function buildCaseTwoScenario(caseId) {
  const baseSubject = `(case 2) [${caseId}-002] Intro + onboarding for account transfer dispute`;
  const caseLabel = `${caseId}-002`;
  return [
    {
      id: "c2-e1",
      actor: "vendor",
      thread: "case-2",
      subject: baseSubject,
      delaySlots: 2,
      text: `Hi Maya,

Nice to meet you. I am Jity from Osmaura Vendor Services.

Case: ${caseLabel}
Matter: account transfer dispute and duplicate billing concern

Send over your statements and I will begin intake.

Jity`
    },
    {
      id: "c2-e2",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e1",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Hi Jity,

Nice to meet you too.
I just sent:
- signed authorization
- all transfer notices
- statement bundle (April-May)

Please confirm you got everything.

Maya`
    },
    {
      id: "c2-e3",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e2",
      delaySlots: 6,
      subject: `Re: ${baseSubject}`,
      text: `Received.

Will review soon.

Jity`
    },
    {
      id: "c2-e4",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e3",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Can you share a timeline?

I have a payment deadline in four days.

Maya`
    },
    {
      id: "c2-e5",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e4",
      delaySlots: 5,
      subject: `Re: ${baseSubject}`,
      text: `No update yet.

Please wait.

Jity`
    },
    {
      id: "c2-e6",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e5",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `I am confused. Did you submit anything to the provider yet?

Maya`
    },
    {
      id: "c2-e7",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e6",
      delaySlots: 6,
      subject: `Re: ${baseSubject}`,
      text: `I submitted one request but do not have the number right now.

Jity`
    },
    {
      id: "c2-e8",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e7",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Please send the claim reference. I need proof this is moving.

Maya`
    },
    {
      id: "c2-e9",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e8",
      delaySlots: 5,
      subject: `Re: ${baseSubject}`,
      text: `The docs may have been uploaded to the wrong account.
We are checking.

Jity`
    },
    {
      id: "c2-e10",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e9",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `This is getting frustrating.

Wrong account upload is a serious issue. Which account did you use?

Maya`
    },
    {
      id: "c2-e11",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e10",
      delaySlots: 7,
      subject: `Re: ${baseSubject}`,
      text: `I cannot confirm at this moment.
We are still locating the file trail.

Jity`
    },
    {
      id: "c2-e12",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e11",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `I still need:
1) correct claim references
2) proof of provider contact
3) corrected upload confirmation

Please respond clearly.

Maya`
    },
    {
      id: "c2-e13",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e12",
      delaySlots: 6,
      subject: `Re: ${baseSubject}`,
      text: `Here are partial details:
- claim reference maybe TR-8871
- provider call not logged
- upload correction pending

Jity`
    },
    {
      id: "c2-e14",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e13",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `\"Maybe\" is not acceptable.

I am now getting late notices because this has stalled.

Maya`
    },
    {
      id: "c2-e15",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e14",
      delaySlots: 5,
      subject: `Re: ${baseSubject}`,
      text: `Understood.
I reassigned the file internally.

Jity`
    },
    {
      id: "c2-e16",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e15",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `I need a concrete remediation plan and dates by end of day.

Maya`
    },
    {
      id: "c2-e17",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e16",
      delaySlots: 6,
      subject: `Re: ${baseSubject}`,
      text: `Plan:
- rebuild case file from source docs
- resubmit all disputes
- send summary tomorrow

Jity`
    },
    {
      id: "c2-e18",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e17",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Thanks, but confidence is low after multiple misses.

Please include supervisor contact in the next update.

Maya`
    },
    {
      id: "c2-e19",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e18",
      delaySlots: 5,
      subject: `Re: ${baseSubject}`,
      text: `Case-end signal:
We are closing this engagement from our side pending reassignment.
Open errors remain unresolved:
- incorrect upload trail
- incomplete case activity logging
- missed timeline commitments

Jity`
    },
    {
      id: "c2-e20",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e19",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Understood.
I am ending this case with your team and escalating internally due to delays and work quality issues.

Case ${caseLabel} closed on my side.

Maya`
    }
  ];
}

function buildCaseOneScenarioPi(caseId) {
  const baseSubject = `(case 1) [${caseId}-001] Car accident injury - need legal help`;
  const caseLabel = `${caseId}-001`;
  return [
    {
      id: "c1-e1",
      actor: "test",
      thread: "case-1",
      subject: baseSubject,
      text: `Hi,

I was in a car accident 2 weeks ago - someone rear-ended me at a red light. I've been to the ER and my doctor says I need physical therapy. The other driver's insurance has been calling me and I'm not sure what to say or do.

A friend recommended I get a lawyer. Can you help? I'm worried about my medical bills and I had to miss work.

Thank you,
Marcus`
    },
    {
      id: "c1-e2",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e1",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Hi Marcus,

Thank you for reaching out. I'm Sarah Chen, and I handle personal injury cases at Chen & Associates. I'm sorry to hear about your accident - that sounds stressful.

You're right to be cautious about talking to the insurance company. They often try to get recorded statements that can hurt your case later. Here's what we should do:

1. Schedule a free consultation (phone or video - your choice) to discuss your case
2. Once we have a signed agreement, I'll send representation letters to the at-fault driver's insurance and your own carrier
3. We'll gather your medical records, bills, and wage loss documentation
4. I'll handle all communication with the insurers so you don't have to

Can you reply with:
- Date of the accident
- Police report number (if you have it)
- Names of doctors/hospitals you've seen
- Whether you've given any statements to insurance yet

I'll call you tomorrow to set up our consultation. You're in good hands.

Best,
Sarah Chen
Chen & Associates Injury Law`
    },
    {
      id: "c1-e3",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e2",
      subject: `Re: ${baseSubject}`,
      text: `Hi Sarah,

Thank you for responding so quickly. I really appreciate it.

Accident date: January 18, 2026
Police report: MPD-26-011847
I went to Harbor Medical ER that night, and now I'm seeing Dr. Walsh for PT twice a week.
I have NOT given any statement to insurance - they've left 3 voicemails asking me to call back.

I'm attaching the signed retainer agreement. When can we talk?

Marcus`
    },
    {
      id: "c1-e4",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e3",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Marcus,

Received your signed agreement. Welcome to the firm - I'm glad you didn't give that statement. Smart move.

Case opened: ${caseLabel}
Matter: Rear-end collision, Harbor Medical ER + ongoing PT

Completed today:
- Representation letters sent to at-fault carrier (State Mutual) and your UM carrier
- Formal notice to both: all contact goes through our office, no direct statements
- Medical authorization sent to Harbor Medical and Dr. Walsh's office for records
- Opened your damages tracker - I'll update it as we go

Next steps:
- Send me copies of any medical bills or EOBs you receive
- If insurance calls again, give them our number: (555) 234-5678
- Keep a log of any out-of-pocket costs (meds, Uber to appointments, etc.)

I'll have your first status update to you by end of week. How are you feeling with PT so far?

Sarah`
    },
    {
      id: "c1-e5",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e4",
      subject: `Re: ${baseSubject}`,
      text: `Sarah,

This is such a relief. I've been so overwhelmed.

PT is helping but my neck and lower back still hurt a lot. Dr. Walsh ordered an MRI - they said possible disc involvement. I'm worried this might be more serious than I thought.

I'll send the bills as they come in. I've also missed 8 days of work so far. What do you need for the wage loss part?

Marcus`
    },
    {
      id: "c1-e6",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e5",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Marcus,

Don't worry - disc involvement actually strengthens the case from a damages perspective. We want the full picture before we make a demand, so the MRI is important. Please send me the results as soon as you get them.

For wage loss, I need:
1. Last 4 pay stubs before the accident
2. A note from your employer listing the exact dates you missed and your hourly/daily rate
3. Any PTO or sick leave you used (we can still claim it)

I've added a record request for the MRI facility - we'll get the official report once it's read. In the meantime, focus on your treatment. The insurance company will try to lowball you if we settle too early. We're building the full case first.

Sarah`
    },
    {
      id: "c1-e7",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e6",
      delaySlots: 2,
      subject: `Re: ${baseSubject}`,
      text: `Sarah,

MRI came back - they found an L4-L5 disc bulge. Dr. Walsh referred me to a pain management specialist. I'm attaching the report and the referral.

Also sending:
- Pay stubs
- Employer letter (I missed 8 shifts, $1,200 gross)
- Pharmacy and Uber receipts for PT appointments

Let me know if you need anything else.

Marcus`
    },
    {
      id: "c1-e8",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e7",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Marcus,

Received everything. The L4-L5 finding is significant - we'll use it in the demand. I've updated your medical chronology and damages ledger.

Status update:
- State Mutual (at-fault carrier) has acknowledged our representation and accepted liability. No pushback.
- All medical records received through this week
- Wage loss documentation looks solid - I'll get employer verification letter to lock it in
- We're holding the demand until you've had a few pain management visits. We want to show the full treatment arc.

Timeline: I expect to send the demand package in about 2-3 weeks. After that, carriers typically take 30-45 days to respond. I'll keep you posted every step of the way.

How are you doing with the pain management referral?

Sarah`
    },
    {
      id: "c1-e9",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e8",
      subject: `Re: ${baseSubject}`,
      text: `That timeline helps. I've had 2 pain management visits - they're doing injections. Not fun but it's helping.

One question: the at-fault insurance sent me a letter saying they need "additional information" and to contact them. Should I respond?

Marcus`
    },
    {
      id: "c1-e10",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e9",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Do not respond. Forward me that letter - I'll handle it.

They're required to go through us. I'll send them a follow-up today reiterating that. This is a common tactic to get clients to slip up. You're doing everything right.

Sarah`
    },
    {
      id: "c1-e11",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e10",
      subject: `Re: ${baseSubject}`,
      text: `Forwarded. Thanks for the heads up.

Marcus`
    },
    {
      id: "c1-e12",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e11",
      delaySlots: 2,
      subject: `Re: ${baseSubject}`,
      text: `Marcus,

Demand package is ready. I'm attaching a draft for your review before we send it. It includes:
- Full medical chronology (ER through pain management)
- All special damages (bills, wage loss, out-of-pocket)
- Narrative linking the collision to your injuries
- Demand amount based on your documented damages

Please review and let me know if anything looks wrong or if you want changes. Once you approve, I'll send it with a 30-day response deadline.

Sarah`
    },
    {
      id: "c1-e13",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e12",
      subject: `Re: ${baseSubject}`,
      text: `Sarah,

I reviewed it - everything looks accurate. You can send it. Thank you for letting me see it first.

Marcus`
    },
    {
      id: "c1-e14",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e13",
      delaySlots: 3,
      subject: `Re: ${baseSubject}`,
      text: `Marcus,

Update: State Mutual responded with their first offer. It's low - about 40% of what we demanded. This is normal. They always start low.

I've sent a rebuttal with additional support and requested revised authority. I'll keep you posted. If they don't move meaningfully, we'll discuss filing suit. No pressure - the choice is always yours.

Sarah`
    },
    {
      id: "c1-e15",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e14",
      subject: `Re: ${baseSubject}`,
      text: `I trust your judgment. Let me know what they come back with.

Marcus`
    },
    {
      id: "c1-e16",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e15",
      delaySlots: 2,
      subject: `Re: ${baseSubject}`,
      text: `Marcus,

Good news. After two more rounds of negotiation, they've agreed to a number within our target range. I'm attaching the settlement agreement for your review.

Summary:
- Gross settlement: [amount in your range]
- Attorney fees and costs per our agreement
- Medical liens will be negotiated before disbursement
- Release is standard - no adverse clauses

Please review and sign where indicated. Once I have it, I'll initiate lien resolution and get you a disbursement timeline. We're in the home stretch.

Sarah`
    },
    {
      id: "c1-e17",
      actor: "test",
      thread: "case-1",
      replyTo: "c1-e16",
      subject: `Re: ${baseSubject}`,
      text: `Sarah,

Signed and attached. I can't thank you enough. This has been a long few months and you made it manageable. I always knew what was happening.

Marcus`
    },
    {
      id: "c1-e18",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e17",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Marcus,

Received. Case ${caseLabel} is now in final closure - lien resolution and disbursement. I'll send you the final accounting once everything clears. Expect your check within 2-3 weeks.

Take care of yourself. If you ever need anything in the future, you know where to find us.

Best,
Sarah`
    }
  ];
}

function buildCaseTwoScenarioPi(caseId) {
  const baseSubject = `(case 2) [${caseId}-002] Slip and fall at grocery store - need lawyer`;
  const caseLabel = `${caseId}-002`;
  return [
    {
      id: "c2-e1",
      actor: "test",
      thread: "case-2",
      subject: baseSubject,
      text: `Hi,

I slipped and fell at a grocery store 3 weeks ago - wet floor, no sign. I broke my wrist and had to have surgery. The store's insurance has been difficult and I'm drowning in medical bills.

I need a lawyer. Can you take my case?

Thanks,
Diana`
    },
    {
      id: "c2-e2",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e1",
      delaySlots: 4,
      subject: `Re: ${baseSubject}`,
      text: `Hi Diana,

Thanks for reaching out. I'm Marcus from Metro Injury Law. We handle premises cases.

Send over your incident report, medical records, and any photos. We'll take a look.

Marcus`
    },
    {
      id: "c2-e3",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e2",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Marcus,

Thanks. Sending:
- signed retainer
- store incident report
- ER records, orthopedic records, surgery records
- photos of the wet floor and my wrist
- 2 witness names and numbers (they saw the spill)

URGENT: The store has surveillance cameras. I've heard they delete footage after 30 days. It's been 3 weeks. Can you send a preservation letter ASAP?

Diana`
    },
    {
      id: "c2-e4",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e3",
      delaySlots: 6,
      subject: `Re: ${baseSubject}`,
      text: `Got it. We'll review.

Marcus`
    },
    {
      id: "c2-e5",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e4",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Marcus,

It's been over a week. Did you send the preservation letter for the surveillance footage? That was my main concern - the 30 day window is almost up.

Also - have you notified the store's insurance that I'm represented? They keep calling me directly.

Diana`
    },
    {
      id: "c2-e6",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e5",
      delaySlots: 5,
      subject: `Re: ${baseSubject}`,
      text: `We're working on it. Things have been busy.

Marcus`
    },
    {
      id: "c2-e7",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e6",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `Marcus,

That's not acceptable. The footage could be gone by now. I specifically asked you to preserve it.

Can you at least tell me:
1. Did you ever send a preservation letter? If so, when and to whom?
2. Did you send a representation letter to the insurer?
3. What is the status of my case?

I'm getting collection notices for my medical bills. I need answers.

Diana`
    },
    {
      id: "c2-e8",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e7",
      delaySlots: 6,
      subject: `Re: ${baseSubject}`,
      text: `I need to check our files. There may have been a mix-up with the matter number. I'll get back to you.

Marcus`
    },
    {
      id: "c2-e9",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e8",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `A mix-up? With my case? This is my medical care and my financial future we're talking about.

I need a direct answer: was a preservation letter sent for the surveillance footage or not? The 30 days has passed.

Diana`
    },
    {
      id: "c2-e10",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e9",
      delaySlots: 5,
      subject: `Re: ${baseSubject}`,
      text: `We're still sorting through things. Some of your documents may have been filed under a different case. We're correcting it.

Marcus`
    },
    {
      id: "c2-e11",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e10",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `My documents were filed under the WRONG case? That's a serious error. Were my medical records sent to someone else? That's a privacy violation.

I need:
1. Confirmation my file is now correct
2. A list of everything that was actually done (or not done) on my case
3. The name of your supervising attorney - I want to escalate this

Diana`
    },
    {
      id: "c2-e12",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e11",
      delaySlots: 7,
      subject: `Re: ${baseSubject}`,
      text: `I don't have all the details in front of me. We're reconstructing the file. A preservation letter may have gone out - I'd have to verify the date. Representation notice - I believe we sent something to the insurer but I'd need to confirm.

Your file has been reassigned to another team member for review.

Marcus`
    },
    {
      id: "c2-e13",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e12",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `"May have" and "I believe" are not acceptable. I've been patient for weeks. My wrist is healing but I'm out thousands in medical bills and lost wages. Key evidence may be destroyed because of your delay.

I'm requesting my complete file and a withdrawal letter. I'm finding another attorney. Please send everything within 48 hours.

Diana`
    },
    {
      id: "c2-e14",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e13",
      delaySlots: 5,
      subject: `Re: ${baseSubject}`,
      text: `Understood. We'll prepare your file for transfer. I'm sorry we couldn't resolve this to your satisfaction.

Case ${caseLabel} - disengagement initiated. File will be assembled and sent within 5-7 business days.

Marcus`
    },
    {
      id: "c2-e15",
      actor: "test",
      thread: "case-2",
      replyTo: "c2-e14",
      delaySlots: 1,
      subject: `Re: ${baseSubject}`,
      text: `I requested 48 hours. 5-7 business days is not acceptable given how long I've already waited.

Send my file by end of week or I will file a bar complaint. I'm done.

Diana`
    }
  ];
}

function buildScenario(caseId) {
  return [...buildCaseOneScenarioPi(caseId), ...buildCaseTwoScenarioPi(caseId)];
}

function computeSchedule(events, { intervalMs, leadInMs, startAtIso }) {
  const now = Date.now();
  const startMs = startAtIso ? new Date(startAtIso).getTime() : now + leadInMs;
  if (Number.isNaN(startMs)) {
    throw new Error("Invalid --start-at value. Use an ISO date string.");
  }
  let cursorMs = startMs;
  return events.map((event, index) => {
    if (index > 0) {
      cursorMs += intervalMs * (event.delaySlots ?? 1);
    }
    return {
      ...event,
      scheduledAt: new Date(cursorMs)
    };
  });
}

function createHeaderPlan(event, sentById, referencesByThread) {
  const headers = {};
  if (event.replyTo) {
    const parentId = sentById.get(event.replyTo);
    if (!parentId) {
      throw new Error(`Cannot reply: parent message "${event.replyTo}" not found.`);
    }
    const refs = referencesByThread.get(event.thread) ?? [];
    const dedupedRefs = [...new Set([...refs, parentId])];
    headers["In-Reply-To"] = parentId;
    headers.References = dedupedRefs.join(" ");
  }
  return headers;
}

function printPlan(events, actors) {
  console.log("\nSimulation plan:");
  for (const event of events) {
    const sender = actors[event.actor].email;
    const to = event.actor === "vendor" ? actors.test.email : actors.vendor.email;
    console.log(
      `- ${event.id} | ${event.scheduledAt.toISOString()} | ${sender} -> ${to} | ${event.subject}`
    );
  }
  console.log("");
}

async function main() {
  loadDotEnv();
  const options = parseArgs(process.argv.slice(2));

  if (!options.caseId) throw new Error("--case-id is required.");
  if (!Number.isFinite(options.intervalMs) || options.intervalMs < 0) {
    throw new Error("--interval-ms must be a non-negative number.");
  }
  if (!Number.isFinite(options.leadInMs) || options.leadInMs < 0) {
    throw new Error("--lead-in-ms must be a non-negative number.");
  }

  const actors = {
    vendor: {
      email: requireEnv("SIM_VENDOR_EMAIL")
    },
    test: {
      email: requireEnv("SIM_TEST_EMAIL")
    }
  };

  const events = computeSchedule(buildScenario(options.caseId), options);
  printPlan(events, actors);
  if (options.dryRun) {
    console.log("Dry run only. No emails were sent.");
    return;
  }

  const tokenProviders = {
    vendor: createMicrosoftTokenProvider(),
    test: createGoogleTokenProvider()
  };

  const sentById = new Map();
  const referencesByThread = new Map();

  for (const event of events) {
    const now = Date.now();
    const waitMs = event.scheduledAt.getTime() - now;
    if (waitMs > 0) {
      await sleep(waitMs);
    }

    const sender = event.actor;
    const receiver = sender === "vendor" ? "test" : "vendor";
    const headers = createHeaderPlan(event, sentById, referencesByThread);
    const mail = {
      from: actors[sender].email,
      to: actors[receiver].email,
      subject: event.subject,
      text: event.text,
      date: event.scheduledAt,
      headers,
      messageId: createMessageId(actors[sender].email)
    };

    const messageId = mail.messageId;
    if (sender === "vendor") {
      const accessToken = await tokenProviders.vendor();
      await sendWithMicrosoftGraphMime({
        from: mail.from,
        to: mail.to,
        accessToken,
        subject: mail.subject,
        text: mail.text,
        date: mail.date,
        messageId,
        headers: mail.headers
      });
    } else {
      const accessToken = await tokenProviders.test();
      await sendWithGmailApiMime({
        accessToken,
        from: mail.from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        date: mail.date,
        messageId,
        headers: mail.headers
      });
    }

    sentById.set(event.id, messageId);

    const existingRefs = referencesByThread.get(event.thread) ?? [];
    referencesByThread.set(event.thread, [...existingRefs, messageId]);

    console.log(
      `Sent ${event.id} at ${new Date().toISOString()} | from=${mail.from} to=${mail.to} | messageId=${messageId}`
    );
  }

  console.log("\nSimulation complete.");
}

main().catch((error) => {
  console.error(`Simulation failed: ${error.message}`);
  process.exit(1);
});
