/**
 * Simulated email corpus for LLM-based report analysis.
 * Extracted from scripts/simulate-case-email-lifecycle.js for use by the email analyzer.
 * Case 1 = good vendor (Chen & Associates), Case 2 = bad vendor (Metro Injury Law).
 */

const DEFAULT_CASE_ID = "MB-CASE-2026";

function buildCaseOneEmails(caseId = DEFAULT_CASE_ID) {
  const caseLabel = `${caseId}-001`;
  return [
    {
      id: "c1-e1",
      actor: "client",
      thread: "case-1",
      subject: `(case 1) [${caseLabel}] Car accident injury - need legal help`,
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
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
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
      actor: "client",
      thread: "case-1",
      replyTo: "c1-e2",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
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
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
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
      actor: "client",
      thread: "case-1",
      replyTo: "c1-e4",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
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
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
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
      actor: "client",
      thread: "case-1",
      replyTo: "c1-e6",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
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
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
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
      actor: "client",
      thread: "case-1",
      replyTo: "c1-e8",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
      text: `That timeline helps. I've had 2 pain management visits - they're doing injections. Not fun but it's helping.

One question: the at-fault insurance sent me a letter saying they need "additional information" and to contact them. Should I respond?

Marcus`
    },
    {
      id: "c1-e10",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e9",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
      text: `Do not respond. Forward me that letter - I'll handle it.

They're required to go through us. I'll send them a follow-up today reiterating that. This is a common tactic to get clients to slip up. You're doing everything right.

Sarah`
    },
    {
      id: "c1-e11",
      actor: "client",
      thread: "case-1",
      replyTo: "c1-e10",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
      text: `Forwarded. Thanks for the heads up.

Marcus`
    },
    {
      id: "c1-e12",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e11",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
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
      actor: "client",
      thread: "case-1",
      replyTo: "c1-e12",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
      text: `Sarah,

I reviewed it - everything looks accurate. You can send it. Thank you for letting me see it first.

Marcus`
    },
    {
      id: "c1-e14",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e13",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
      text: `Marcus,

Update: State Mutual responded with their first offer. It's low - about 40% of what we demanded. This is normal. They always start low.

I've sent a rebuttal with additional support and requested revised authority. I'll keep you posted. If they don't move meaningfully, we'll discuss filing suit. No pressure - the choice is always yours.

Sarah`
    },
    {
      id: "c1-e15",
      actor: "client",
      thread: "case-1",
      replyTo: "c1-e14",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
      text: `I trust your judgment. Let me know what they come back with.

Marcus`
    },
    {
      id: "c1-e16",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e15",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
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
      actor: "client",
      thread: "case-1",
      replyTo: "c1-e16",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
      text: `Sarah,

Signed and attached. I can't thank you enough. This has been a long few months and you made it manageable. I always knew what was happening.

Marcus`
    },
    {
      id: "c1-e18",
      actor: "vendor",
      thread: "case-1",
      replyTo: "c1-e17",
      subject: `Re: (case 1) [${caseLabel}] Car accident injury - need legal help`,
      text: `Marcus,

Received. Case ${caseLabel} is now in final closure - lien resolution and disbursement. I'll send you the final accounting once everything clears. Expect your check within 2-3 weeks.

Take care of yourself. If you ever need anything in the future, you know where to find us.

Best,
Sarah`
    }
  ];
}

function buildCaseTwoEmails(caseId = DEFAULT_CASE_ID) {
  const caseLabel = `${caseId}-002`;
  return [
    {
      id: "c2-e1",
      actor: "client",
      thread: "case-2",
      subject: `(case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
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
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
      text: `Hi Diana,

Thanks for reaching out. I'm Marcus from Metro Injury Law. We handle premises cases.

Send over your incident report, medical records, and any photos. We'll take a look.

Marcus`
    },
    {
      id: "c2-e3",
      actor: "client",
      thread: "case-2",
      replyTo: "c2-e2",
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
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
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
      text: `Got it. We'll review.

Marcus`
    },
    {
      id: "c2-e5",
      actor: "client",
      thread: "case-2",
      replyTo: "c2-e4",
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
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
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
      text: `We're working on it. Things have been busy.

Marcus`
    },
    {
      id: "c2-e7",
      actor: "client",
      thread: "case-2",
      replyTo: "c2-e6",
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
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
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
      text: `I need to check our files. There may have been a mix-up with the matter number. I'll get back to you.

Marcus`
    },
    {
      id: "c2-e9",
      actor: "client",
      thread: "case-2",
      replyTo: "c2-e8",
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
      text: `A mix-up? With my case? This is my medical care and my financial future we're talking about.

I need a direct answer: was a preservation letter sent for the surveillance footage or not? The 30 days has passed.

Diana`
    },
    {
      id: "c2-e10",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e9",
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
      text: `We're still sorting through things. Some of your documents may have been filed under a different case. We're correcting it.

Marcus`
    },
    {
      id: "c2-e11",
      actor: "client",
      thread: "case-2",
      replyTo: "c2-e10",
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
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
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
      text: `I don't have all the details in front of me. We're reconstructing the file. A preservation letter may have gone out - I'd have to verify the date. Representation notice - I believe we sent something to the insurer but I'd need to confirm.

Your file has been reassigned to another team member for review.

Marcus`
    },
    {
      id: "c2-e13",
      actor: "client",
      thread: "case-2",
      replyTo: "c2-e12",
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
      text: `"May have" and "I believe" are not acceptable. I've been patient for weeks. My wrist is healing but I'm out thousands in medical bills and lost wages. Key evidence may be destroyed because of your delay.

I'm requesting my complete file and a withdrawal letter. I'm finding another attorney. Please send everything within 48 hours.

Diana`
    },
    {
      id: "c2-e14",
      actor: "vendor",
      thread: "case-2",
      replyTo: "c2-e13",
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
      text: `Understood. We'll prepare your file for transfer. I'm sorry we couldn't resolve this to your satisfaction.

Case ${caseLabel} - disengagement initiated. File will be assembled and sent within 5-7 business days.

Marcus`
    },
    {
      id: "c2-e15",
      actor: "client",
      thread: "case-2",
      replyTo: "c2-e14",
      subject: `Re: (case 2) [${caseLabel}] Slip and fall at grocery store - need lawyer`,
      text: `I requested 48 hours. 5-7 business days is not acceptable given how long I've already waited.

Send my file by end of week or I will file a bar complaint. I'm done.

Diana`
    }
  ];
}

/**
 * Returns the full email corpus for both simulated cases.
 * @param {string} [caseId] - Optional case ID for subject lines (default: MB-CASE-2026)
 * @returns {{ case1: Array<{id, actor, thread, subject, text}>, case2: Array<{id, actor, thread, subject, text}> }}
 */
export function getSimulatedEmailCorpus(caseId = DEFAULT_CASE_ID) {
  return {
    case1: buildCaseOneEmails(caseId),
    case2: buildCaseTwoEmails(caseId)
  };
}

/**
 * Returns a single thread as a concatenated string for LLM analysis.
 * @param {Array<{id, actor, subject, text}>} emails
 * @returns {string}
 */
export function threadToAnalysisText(emails) {
  return emails
    .map((e) => {
      const from = e.actor === "vendor" ? "VENDOR" : "CLIENT";
      return `[${from}]\n${e.text}`;
    })
    .join("\n\n---\n\n");
}
