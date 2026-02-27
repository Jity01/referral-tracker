# Maurice Blackburn Referral Vendor Rankings

Reference data for the MB referral network. Used for demo, ranking calibration, and alternative vendor recommendations.

---

## Scoring Model

### Baseline Methodology (Pre–Email Monitoring)

Baseline scores are derived from publicly available signals:

- **Google rating** (1–5, weighted 25%) — client review sentiment
- **Review volume** (normalized, 15%) — sample size confidence
- **Doyle's Guide recognition** (20%) — industry peer recognition
- **Firm longevity** (15%) — years in practice
- **Geographic coverage** (25%) — multi-state vs single-state

### Live Model (Post–Email Monitoring)

Once email analysis is active, baseline is replaced by live signals:

- **Responsiveness** — inferred from reply timing and acknowledgment
- **Communication** — clarity, substantive updates, client understanding
- **Client Satisfaction** — sentiment across thread (gratitude, frustration, relief)
- **Conversion** — engagement and matter progression
- **Outcome** — resolution type (settlement, closure, withdrawal)

### Action Thresholds

| Score Range | Status           | Action                          |
|-------------|------------------|---------------------------------|
| 80+         | Preferred Partner| Priority referrals              |
| 65–79       | Active           | Standard referrals              |
| 50–64       | Watch List       | Reduced volume, review          |
| Below 50    | Suspended        | No new referrals until review   |

---

## Tier 1 — Law Firms (15 vendors)

| Rank | Vendor | Practice Area | Baseline Score | Google | Doyle's | Longevity | States |
|------|--------|---------------|----------------|--------|--------|-----------|--------|
| 1 | Farrar Gesini Dunn | Family, Wills & Estates | 92 | 4.6 | First Tier | 30 yrs | ACT, NSW, VIC |
| 2 | Nyman Gibson Miralis | Criminal Defence | 90 | 4.8 | First Tier | 55 yrs | NSW |
| 3 | Nicholes Family Lawyers | Family Law | 88 | 4.9 | Recommended | 25 yrs | VIC |
| 4 | Attwood Marshall | Wills, Estates, Property | 85 | 4.7 | Recommended | 78 yrs | QLD, NSW |
| 5 | Hall Payne | Employment, PI | 84 | 4.5 | Recommended | 40 yrs | National |
| 6 | Stacks Law Firm | Property, PI, Commercial | 82 | 4.4 | Recommended | 90 yrs | NSW, QLD |
| 7 | Aitken Whyte | Criminal, Property, PI | 80 | 4.5 | Recommended | 25 yrs | QLD |
| 8 | Zaparas Lawyers | Personal Injury | 78 | 4.6 | Recommended | 30 yrs | VIC |
| 9 | Arnold Thomas & Becker | Personal Injury | 76 | 4.4 | Recommended | 35 yrs | VIC |
| 10 | BPC Lawyers | Personal Injury | 74 | 4.3 | Recommended | 20 yrs | VIC |
| 11 | Maxiom Injury Lawyers | Personal Injury | 72 | 4.5 | — | 15 yrs | VIC |
| 12 | Unified Lawyers | Family Law | 70 | 4.2 | — | 12 yrs | NSW |
| 13 | Parish Patience | Immigration | 68 | 4.3 | — | 20 yrs | NSW |
| 14 | Lawlab | Conveyancing | 65 | 4.4 | — | 8 yrs | National (online) |
| 15 | LegalVision | Commercial, IP | 62 | 4.1 | — | 12 yrs | National (online) |

*Live scores (Responsiveness, Communication, Client Satisfaction, Conversion, Outcome) are blank until email monitoring populates them.*

---

## Tier 2 — Professional Service Providers

| Provider | Category | Referral Scenario | Tracking |
|----------|-----------|--------------------|----------|
| Relationships Australia | Family dispute resolution | FDR before court | Lighter-touch |
| National Debt Helpline | Financial counselling | Client financial distress | Engagement only |
| 1800RESPECT | Domestic violence support | DV disclosure | Engagement only |
| Migration agents (MARA) | Immigration | Straightforward visa | Lighter-touch |
| WorkCover Assist | Workers comp support | WorkCover claims | Engagement only |

---

## Tier 3 — Government & Free Services

| Provider | Category | Referral Scenario | Tracking |
|----------|-----------|--------------------|----------|
| Fair Work Commission | Workplace | Unfair dismissal, disputes | Routing only |
| Australian Financial Complaints Authority | Financial | Insurance, banking complaints | Routing only |
| WorkSafe Victoria | Workplace safety | WorkCover, safety complaints | Routing only |
| State consumer affairs | Consumer | Consumer disputes | Routing only |
| Legal Aid (state bodies) | General | Means-tested legal aid | Routing only |
| Justice Connect | Pro bono | Pro bono eligibility | Routing only |

---

## Competitive Dynamics

- **PI overflow:** Zaparas, Law Partners, Arnold Thomas & Becker, BPC, Maxiom are MB competitors. Referrals to them are rare (conflicts, capacity only). Prefer small boutiques (e.g. Maxiom) for overflow.
- **Non-competing:** Family, criminal, immigration, wills/estates, property have zero competitive tension. Highest referral volume.
- **Network size:** ~15–25 Tier 1 vendors total. 10–12 seeded for demo.
