# Privacy Policy

> **Disclaimer:** This is a template draft for review purposes only. It is not legal advice. Consult a qualified attorney in your jurisdiction before publishing or relying on this policy.

**Effective date:** [EFFECTIVE DATE]

---

## Operator information

| | |
|---|---|
| **Data controller** | [OPERATOR LEGAL NAME] |
| **Trade name** | Flowstate |
| **Status** | Operated by [OPERATOR LEGAL NAME] as an individual / sole proprietor, pending formal company registration |
| **Registered address** | [REGISTERED ADDRESS] |
| **Privacy contact** | [PRIVACY EMAIL] |
| **General contact** | [CONTACT EMAIL] |
| **Grievance officer (India)** | [GRIEVANCE OFFICER NAME] — [GRIEVANCE OFFICER EMAIL] |
| **Website** | [WEBSITE URL] |

---

## 1. Introduction

This Privacy Policy explains how **[OPERATOR LEGAL NAME]** ("**we**", "**us**", or "**our**") collects, uses, shares, and protects personal information when you use **Flowstate** (the "**Service**") at [WEBSITE URL] and related applications.

We are committed to handling your information responsibly. Please read this policy carefully. By using the Service, you acknowledge that you have read this Privacy Policy.

If you do not agree with our practices, do not use the Service.

---

## 2. Scope

This policy applies to:

- The Flowstate web application
- Account sign-in and authentication
- Cloud storage and synchronization of your canvases
- AI-assisted features
- Collaboration features
- Optional Google Workspace integration
- Feedback and support channels we operate

This policy does not apply to third-party websites, services, or AI providers' own privacy practices. We encourage you to review their policies separately.

---

## 3. Information we collect

### 3.1 Account information

When you sign in with **Google**, we receive and store:

- Email address
- Display name
- Profile photo URL
- Unique user identifier (from our authentication provider)

This is used to create your profile, identify you in the Service, and enable collaboration features.

### 3.2 Canvas and content data

We store the content you create and interact with on the Service, including:

- Questions and AI-generated answers on your canvas
- Artifacts (tables, maps, charts, code, custom UI, and similar outputs)
- Canvas layout, connections between cards, and viewport state
- File attachments you upload (stored in cloud object storage)
- Token usage metadata associated with AI turns (for service operation and internal analytics)
- Preferences such as your last active canvas and selected AI model

**Note:** Conversation content is stored as part of your canvas data in our database. There is no separate "messages" table — your Q&A lives inside your canvas state.

### 3.3 Collaboration data

If you use collaboration features, we may collect and process:

- Email addresses you invite to a canvas
- Collaboration roles (owner, editor, viewer)
- Invite and share-link status
- Realtime presence information (display name, avatar, cursor position on the canvas) while you are actively collaborating

### 3.4 Google Workspace data (optional)

If you connect a Google account, we store:

- Your connected Google email address
- OAuth access and refresh tokens (encrypted at rest)
- Authorized scopes and token expiry

We use this connection only to perform actions you request (such as importing a Google Doc or exporting a table to Sheets). We do not access your Google account beyond the scopes you approve.

### 3.5 Feedback and support

If you submit feedback or suggestions through the Service, we may collect:

- Your message
- Your email (if you are signed in)
- The page URL you were on
- Optional screenshot images you attach

Feedback may be stored in our database and, if configured, forwarded to internal tools (such as a spreadsheet or messaging webhook) for review.

### 3.6 Technical and usage information

We automatically collect certain technical information, including:

- IP address
- Browser type and version
- Device type and operating system
- Referring URLs
- Dates and times of access
- Pages and features used

We use **Google Analytics** to understand how the Service is used. Analytics cookies are used only where permitted by law and, in regions that require it, after you provide consent.

### 3.7 Local storage on your device

The Service may store backup copies of canvas data in your browser's **local storage** to help recover work if a save is interrupted. This data remains on your device unless you clear browser storage.

### 3.8 Information we do not intentionally collect

We do not intentionally collect sensitive categories of personal data (such as health information, government ID numbers, or financial account details) unless you voluntarily include them in your canvas content or attachments.

---

## 4. How we use your information

We use personal information to:

| Purpose | Examples |
|---------|----------|
| **Provide the Service** | Authenticate you, save and sync canvases, render collaboration, process AI requests |
| **AI features** | Send prompts, history, and attachments to AI providers to generate responses |
| **Collaboration** | Manage invites, roles, share links, and realtime presence |
| **Google integration** | Import/export content you request via connected Google services |
| **Security** | Detect abuse, protect accounts, enforce our Terms |
| **Improve the Service** | Analyze usage patterns, fix bugs, develop features |
| **Support** | Respond to feedback and inquiries |
| **Legal compliance** | Comply with law, respond to lawful requests, enforce our Terms |

We do **not** sell your personal information. We do **not** use your personal information for cross-context behavioral advertising.

---

## 5. Legal bases for processing (EU / UK)

If you are in the European Economic Area or United Kingdom, we process personal data on the following legal bases:

| Processing | Legal basis |
|------------|-------------|
| Providing the Service you signed up for | **Performance of a contract** (Art. 6(1)(b) GDPR) |
| Security, fraud prevention, service improvement | **Legitimate interests** (Art. 6(1)(f) GDPR) — balanced against your rights |
| Google Analytics and non-essential cookies | **Consent** (Art. 6(1)(a) GDPR) where required |
| Legal obligations | **Compliance with law** (Art. 6(1)(c) GDPR) |

You may withdraw consent for analytics at any time without affecting the lawfulness of processing before withdrawal.

---

## 6. AI processing and third-party providers

### 6.1 AI providers

When you use AI features, we send relevant data to **third-party AI providers** to generate responses. Our primary provider is **Anthropic** (Claude models). Some features may also use other AI tooling (such as the Cursor Agent SDK for custom UI generation).

Data sent may include your prompts, conversation history, file attachments, artifact context, and fetched page content from URLs in your messages.

**Anthropic's privacy policy:** https://www.anthropic.com/privacy

You should not submit personal information you are not comfortable sharing with these providers.

### 6.2 Other service providers (processors)

We use the following categories of service providers who process data on our behalf:

| Provider | Role | Location (typical) |
|----------|------|-------------------|
| **Supabase** | Authentication, database, file storage, realtime sync | US / EU (configurable) |
| **Vercel** | Application hosting and serverless functions | US / global edge |
| **Anthropic** | AI text and tool processing | US |
| **Google** | Sign-in OAuth, optional Workspace APIs, Maps embeds, Analytics | US / global |
| **Giphy** | GIF search (if you use GIF features) | US |
| **OpenStreetMap / Nominatim** | Map geocoding (travel map artifacts) | EU / community-operated |
| **GitHub** | Repository metadata (if you use repo artifacts) | US |
| **Microlink** | Link preview screenshots (if configured) | EU |
| **Slack / Google Sheets** | Optional feedback forwarding (if configured by operator) | US |

We require processors to handle data only for the purposes we specify and in accordance with applicable data protection law. Where required, we use standard contractual clauses or equivalent safeguards for international transfers.

---

## 7. How we share information

We share personal information only in these circumstances:

### 7.1 With collaborators you invite

When you share a canvas, collaborators you invite can see User Content on that canvas according to their role.

### 7.2 With service providers

As described in Section 6, we share data with vendors who help us operate the Service.

### 7.3 For legal reasons

We may disclose information if we believe it is necessary to:

- Comply with applicable law, regulation, legal process, or government request
- Protect the rights, property, or safety of us, our users, or the public
- Enforce our Terms and Conditions

### 7.4 Business transfers

If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any change in ownership or use of your personal information.

### 7.5 With your direction

We share information when you explicitly request an integration or export (e.g. exporting a table to Google Sheets).

---

## 8. Cookies and similar technologies {#cookies}

### 8.1 What we use

| Cookie / storage | Type | Purpose |
|------------------|------|---------|
| Supabase auth session | **Essential** | Keep you signed in |
| Google OAuth state cookies | **Essential** | Secure Google Workspace connection flow |
| Google Analytics (`_ga`, etc.) | **Analytics** | Understand site usage |
| Browser local storage | **Functional** | Local canvas backup on your device |

### 8.2 Your choices

- **Essential cookies** are required for sign-in and core functionality.
- **Analytics cookies** will only be set in jurisdictions that require consent after you accept them (when a cookie banner is implemented).
- You can control cookies through your browser settings. Disabling essential cookies may prevent you from using the Service.

---

## 9. International data transfers

We and our service providers may process your information in the **United States**, **India**, the **European Union**, and other countries where our providers operate.

If you are in the EEA, UK, or India, your data may be transferred to countries that may not provide the same level of data protection as your home country. Where required, we implement appropriate safeguards, such as:

- Standard Contractual Clauses approved by the European Commission
- Adequacy decisions
- Other mechanisms recognized under applicable law

Contact [PRIVACY EMAIL] for more information about safeguards we use.

---

## 10. Data retention

| Data type | Retention |
|-----------|-----------|
| Account and profile | Until you request account deletion |
| Canvas content | Until you delete the canvas or your account |
| File attachments | Until the parent canvas is deleted |
| Google connection tokens | Until you disconnect or delete your account |
| Collaboration invites | Until accepted, declined, expired, or canvas deleted |
| Feedback submissions | Up to [RETENTION PERIOD — e.g. 2 years] or until no longer needed |
| Server logs | Up to [RETENTION PERIOD — e.g. 90 days] |
| Analytics data | Per Google Analytics default retention settings |

We may retain information longer where required by law or for legitimate purposes such as dispute resolution, security, or enforcement of our Terms.

When you delete a canvas, we delete the database record and associated files in cloud storage. Deletion may not be immediate in all backup systems.

---

## 11. Your rights and choices

Your rights depend on where you live. We honor applicable rights regardless of where our servers are located.

### 11.1 All users

You can:

- **Access and update** profile information through your Google account and the Service
- **Delete canvases** you own through the Service
- **Disconnect Google Workspace** through the Service
- **Request account or data deletion** by emailing [PRIVACY EMAIL]
- **Opt out of marketing emails** — we do not currently send marketing emails; if we do in future, you may unsubscribe

### 11.2 European Economic Area and United Kingdom (GDPR)

You have the right to:

- **Access** your personal data
- **Rectify** inaccurate data
- **Erase** your data ("right to be forgotten")
- **Restrict** processing in certain circumstances
- **Data portability** — receive your data in a structured, machine-readable format where technically feasible
- **Object** to processing based on legitimate interests
- **Withdraw consent** at any time (for consent-based processing)
- **Lodge a complaint** with your local data protection supervisory authority

To exercise these rights, contact [PRIVACY EMAIL]. We will respond within the timeframe required by law (typically one month under GDPR).

### 11.3 United States — California (CCPA / CPRA)

If you are a California resident, you have the right to:

- **Know** what personal information we collect, use, and disclose
- **Delete** personal information we hold about you (subject to exceptions)
- **Correct** inaccurate personal information
- **Opt out of sale or sharing** — we do **not** sell or share personal information for cross-context behavioral advertising

We will not discriminate against you for exercising your privacy rights.

To submit a request, email [PRIVACY EMAIL]. We may verify your identity before processing requests.

### 11.4 India (Digital Personal Data Protection Act, 2023)

If you are in India, you have the right to:

- **Access** information about personal data we process about you
- **Correction** of inaccurate or misleading personal data
- **Erasure** of personal data when it is no longer necessary or consent is withdrawn (subject to legal exceptions)
- **Grievance redressal** by contacting our Grievance Officer: **[GRIEVANCE OFFICER NAME]** at [GRIEVANCE OFFICER EMAIL]. We will acknowledge grievances within [NUMBER] days and resolve them within [NUMBER] days as required by applicable rules.

We process personal data based on your consent or other grounds permitted under the DPDPA. Where consent is the basis, you may withdraw it at any time.

We may transfer personal data outside India to service providers in the United States and other countries. We take reasonable steps to ensure such transfers comply with applicable Indian law.

---

## 12. Account deletion and data requests

We do not currently offer a self-serve "delete my account" button. To request deletion of your account and associated personal data, email **[PRIVACY EMAIL]** from the email address associated with your account.

We will verify your identity and process requests within a reasonable timeframe and as required by applicable law.

**Note:** Feedback you submitted may be retained even after account deletion (with your user ID removed from the record). Aggregated or de-identified analytics data may also be retained.

To request a copy of your data (data portability), email [PRIVACY EMAIL].

---

## 13. Security

We implement reasonable technical and organizational measures to protect personal information, including:

- Encryption of Google OAuth tokens at rest
- Row-level security on database tables
- HTTPS for data in transit
- Access controls on administrative tools

No method of transmission or storage is 100% secure. We cannot guarantee absolute security.

If you believe your account has been compromised, contact [CONTACT EMAIL] immediately.

---

## 14. Children's privacy

The Service is not directed to children under 13. We do not knowingly collect personal information from children under 13.

If you believe a child under 13 has provided us with personal information, contact [PRIVACY EMAIL] and we will take steps to delete it.

---

## 15. Changes to this policy

We may update this Privacy Policy from time to time. When we do, we will revise the "Effective date" at the top and, where appropriate, provide additional notice (such as a banner in the Service).

We encourage you to review this policy periodically.

---

## 16. Contact us

**Privacy inquiries:** [PRIVACY EMAIL]

**General contact:** [CONTACT EMAIL]

**Postal address:** [REGISTERED ADDRESS]

**Grievance Officer (India):** [GRIEVANCE OFFICER NAME] — [GRIEVANCE OFFICER EMAIL]

---

## Appendix: Summary of categories collected (CCPA reference)

| Category | Collected | Disclosed to service providers | Sold |
|----------|-----------|-------------------------------|------|
| Identifiers (email, user ID) | Yes | Yes | No |
| Customer records (profile name, avatar) | Yes | Yes | No |
| User-generated content (canvases, attachments) | Yes | Yes (AI/collaboration) | No |
| Internet/network activity (logs, analytics) | Yes | Yes | No |
| Geolocation (inferred from IP) | Possibly | Yes (analytics) | No |

We do not sell personal information.
