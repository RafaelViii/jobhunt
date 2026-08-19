// Standalone seed script — Firebase Admin SDK only, never bundled client-side.
// Run with:  node --env-file=.env.local scripts/seed.mjs
//
// Idempotent: re-running reuses existing Auth users/companies by email/name
// instead of erroring, so you can re-seed after tweaking data without first
// wiping the project by hand.
//
// Seeds 12 companies (1 recruiter each), 32 jobs, and 28 applicants, per
// CLAUDE.md §4. The applicant/job pairings are deliberately uneven — some
// near-perfect matches, some partial (one axis off: title synonym, skill
// overlap, location, salary, or seniority), some poor — so Phase 2 scoring
// produces a visible spread instead of clustering at 0% or 100% (§10 Phase 1.5).
//
// 2026-08-19: expanded past the original tech-company set with a second
// wave of companies/jobs covering common Philippines remote/BPO roles (VA,
// customer support, creative, marketing, e-commerce ops, bookkeeping,
// online tutoring) — added because the seed data previously skewed entirely
// toward software engineering titles.

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const SEED_PASSWORD = "Password123!";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in .env.local — run 0.2/0.3 (Firebase project setup) first.`);
  }
  return value;
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: requireEnv("FIREBASE_ADMIN_PROJECT_ID"),
        clientEmail: requireEnv("FIREBASE_ADMIN_CLIENT_EMAIL"),
        privateKey: requireEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n"),
      }),
    });

const auth = getAuth(app);
const db = getFirestore(app);

async function ensureAuthUser(email, displayName) {
  try {
    return await auth.getUserByEmail(email);
  } catch {
    return auth.createUser({ email, password: SEED_PASSWORD, displayName });
  }
}

async function seedAccount(email, displayName, role) {
  const user = await ensureAuthUser(email, displayName);
  await auth.setCustomUserClaims(user.uid, { role });
  await db.collection("users").doc(user.uid).set({
    role,
    email,
    displayName,
    createdAt: Date.now(),
  });
  return user.uid;
}

// ---------------------------------------------------------------------------
// Companies + recruiters
// ---------------------------------------------------------------------------

const COMPANIES = [
  {
    key: "acme",
    name: "Acme Software",
    industry: "Software",
    size: "51-200",
    website: "https://acme.example.test",
    recruiterEmail: "recruiter.acme@jobhunt.test",
    recruiterName: "Recruiter — Acme",
  },
  {
    key: "northwind",
    name: "Northwind Analytics",
    industry: "Data & Analytics",
    size: "11-50",
    website: "https://northwind.example.test",
    recruiterEmail: "recruiter.northwind@jobhunt.test",
    recruiterName: "Recruiter — Northwind",
  },
  {
    key: "bluepeak",
    name: "BluePeak Systems",
    industry: "Cloud Infrastructure",
    size: "201-500",
    website: "https://bluepeak.example.test",
    recruiterEmail: "recruiter.bluepeak@jobhunt.test",
    recruiterName: "Recruiter — BluePeak",
  },
  {
    key: "fern",
    name: "Fern Studio",
    industry: "Design & Product",
    size: "1-10",
    website: "https://fernstudio.example.test",
    recruiterEmail: "recruiter.fern@jobhunt.test",
    recruiterName: "Recruiter — Fern Studio",
  },
  {
    key: "solstice",
    name: "Solstice Health",
    industry: "HealthTech",
    size: "51-200",
    website: "https://solsticehealth.example.test",
    recruiterEmail: "recruiter.solstice@jobhunt.test",
    recruiterName: "Recruiter — Solstice Health",
  },
  {
    key: "manilavs",
    name: "Manila Virtual Staffing",
    industry: "Staffing & BPO",
    size: "51-200",
    website: "https://manilavirtualstaffing.example.test",
    recruiterEmail: "recruiter.manilavs@jobhunt.test",
    recruiterName: "Recruiter — Manila Virtual Staffing",
  },
  {
    key: "clearline",
    name: "ClearLine Support",
    industry: "Customer Experience & BPO",
    size: "201-500",
    website: "https://clearlinesupport.example.test",
    recruiterEmail: "recruiter.clearline@jobhunt.test",
    recruiterName: "Recruiter — ClearLine Support",
  },
  {
    key: "pixelco",
    name: "Pixel & Co Creative",
    industry: "Design & Creative Agency",
    size: "11-50",
    website: "https://pixelandco.example.test",
    recruiterEmail: "recruiter.pixelco@jobhunt.test",
    recruiterName: "Recruiter — Pixel & Co Creative",
  },
  {
    key: "growthwave",
    name: "GrowthWave Marketing",
    industry: "Digital Marketing Agency",
    size: "11-50",
    website: "https://growthwavemarketing.example.test",
    recruiterEmail: "recruiter.growthwave@jobhunt.test",
    recruiterName: "Recruiter — GrowthWave Marketing",
  },
  {
    key: "cartflow",
    name: "CartFlow Commerce",
    industry: "E-Commerce Management",
    size: "11-50",
    website: "https://cartflowcommerce.example.test",
    recruiterEmail: "recruiter.cartflow@jobhunt.test",
    recruiterName: "Recruiter — CartFlow Commerce",
  },
  {
    key: "ledgerco",
    name: "Ledger & Co",
    industry: "Remote Finance & Accounting",
    size: "1-10",
    website: "https://ledgerandco.example.test",
    recruiterEmail: "recruiter.ledgerco@jobhunt.test",
    recruiterName: "Recruiter — Ledger & Co",
  },
  {
    key: "brightpath",
    name: "BrightPath Tutors",
    industry: "Online Education",
    size: "11-50",
    website: "https://brightpathtutors.example.test",
    recruiterEmail: "recruiter.brightpath@jobhunt.test",
    recruiterName: "Recruiter — BrightPath Tutors",
  },
];

// ---------------------------------------------------------------------------
// Jobs (companyKey references COMPANIES[].key)
// ---------------------------------------------------------------------------

const JOBS = [
  {
    companyKey: "acme",
    title: "Frontend Engineer",
    description: `Acme Software builds the tools mid-market retailers use to run their online stores, from checkout to inventory to customer support — trusted by over 400 businesses across Southeast Asia.

We're looking for a Frontend Engineer to join our core product team and help us rebuild key parts of the merchant dashboard in React and TypeScript. You'll work closely with design and backend engineering to ship features that thousands of store owners touch every day.

What you'll do:
• Build and maintain UI components for our merchant dashboard using React, TypeScript, and our internal design system
• Partner with product design to turn Figma files into responsive, accessible interfaces
• Improve page load performance and reduce technical debt in our older jQuery-based screens as we migrate them to React
• Write unit and integration tests for the components you ship
• Participate in code review and help mentor junior engineers on the team

What we're looking for:
• 2+ years of experience building production web applications with React
• Strong fundamentals in JavaScript/TypeScript, CSS, and responsive design
• Experience working with REST APIs and handling asynchronous state
• Comfortable working in a fast-moving startup environment with shifting priorities
• Bonus: experience with Next.js or design systems

We offer a hybrid work setup (3 days in our Manila office), health coverage for you and one dependent, and a learning budget for courses and conferences.`,
    skills: ["React", "TypeScript", "CSS", "JavaScript", "HTML"],
    location: "Manila",
    remote: true,
    salaryMin: 55000,
    salaryMax: 75000,
    employmentType: "full-time",
    seniority: "mid",
  },
  {
    companyKey: "acme",
    title: "Backend Engineer",
    description: `Acme Software builds the tools mid-market retailers use to run their online stores, from checkout to inventory to customer support — trusted by over 400 businesses across Southeast Asia.

We're hiring a Backend Engineer to own the services behind our order and inventory APIs. You'll be the person merchants (indirectly) rely on to make sure an order placed at 2am gets processed correctly, every time.

What you'll do:
• Design, build, and maintain REST APIs on Node.js backed by PostgreSQL
• Own the reliability of order processing and inventory sync — this is customer-facing infrastructure, not an internal tool
• Containerize and deploy services with Docker as part of our move toward a more modular backend
• Work with the frontend team to design clean, well-documented API contracts
• Investigate and fix production incidents, and write postmortems so we don't repeat them

What we're looking for:
• 2+ years building backend services in Node.js or a similar server-side language
• Solid understanding of relational databases — schema design, indexing, query performance
• Experience with Docker and basic familiarity with cloud deployment
• You care about API design and can explain why a bad endpoint shape causes pain three teams downstream
• Bonus: experience with event-driven architectures or message queues

Office is in Manila; on-site 4 days a week during your first 3 months, hybrid after that.`,
    skills: ["Node.js", "PostgreSQL", "REST APIs", "Docker"],
    location: "Manila",
    remote: false,
    salaryMin: 50000,
    salaryMax: 70000,
    employmentType: "full-time",
    seniority: "mid",
  },
  {
    companyKey: "acme",
    title: "Senior Full-Stack Developer",
    description: `Acme Software builds the tools mid-market retailers use to run their online stores, from checkout to inventory to customer support — trusted by over 400 businesses across Southeast Asia.

We're looking for a Senior Full-Stack Developer to take ownership of features end-to-end, from database schema to the pixels a merchant clicks on. This is a senior individual contributor role — you'll set technical direction for the features you own and mentor engineers across both frontend and backend.

What you'll do:
• Lead feature development across our React/TypeScript frontend and Node.js/PostgreSQL backend
• Make architectural calls on how new features fit into our existing systems, and document the tradeoffs
• Own a feature from a one-paragraph product brief through to a monitored, shipped release
• Review code across the stack and raise the bar on testing, performance, and API design
• Work directly with the CTO and product lead on roadmap planning — this role has real influence on what we build next

What we're looking for:
• 5+ years of professional software engineering experience, with real depth in both frontend and backend work
• Proven track record shipping and owning production features at a company with real users
• Strong communication skills — you can explain a tradeoff to a non-technical stakeholder in two sentences
• Comfortable working with AWS (we use it for hosting, S3, and background jobs)
• Bonus: startup experience, or experience mentoring other engineers formally

This is a senior, high-trust role with a competitive salary, equity, and full remote flexibility — we only ask for occasional in-person time for planning weeks.`,
    skills: ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL"],
    location: "Manila",
    remote: true,
    salaryMin: 90000,
    salaryMax: 130000,
    employmentType: "full-time",
    seniority: "senior",
  },
  {
    companyKey: "northwind",
    title: "Data Analyst",
    description: `Northwind Analytics helps consumer brands understand their customers through data — we build the dashboards and reports that let a marketing team see, in plain language, what's actually working.

We're looking for a Data Analyst to join our client insights team. This is a great first or second job for someone who loves turning messy data into a clear story, and wants to grow into more senior analytics or data science work.

What you'll do:
• Write SQL queries against client data warehouses to answer specific business questions
• Build and maintain dashboards in Tableau that client teams check every week
• Clean and validate incoming data feeds, and flag data quality issues before they reach a client
• Prepare slide-ready summaries in Excel/PowerPoint for client-facing analysts
• Work closely with senior analysts to learn how to frame a data question the right way before touching a keyboard

What we're looking for:
• Comfortable writing SQL — joins, aggregations, window functions
• Some exposure to Python (pandas is enough) for one-off data cleaning
• Tableau or a similar BI tool (Power BI, Looker) — we'll teach you our specific setup
• Strong attention to detail; a wrong number in a client report is a bad day for everyone
• 0–2 years of experience — we're happy to train the right person

Based in our Cebu office, on-site with flexibility for occasional remote days.`,
    skills: ["SQL", "Python", "Tableau", "Excel"],
    location: "Cebu",
    remote: false,
    salaryMin: 35000,
    salaryMax: 50000,
    employmentType: "full-time",
    seniority: "junior",
  },
  {
    companyKey: "northwind",
    title: "Data Scientist",
    description: `Northwind Analytics helps consumer brands understand their customers through data — we build the dashboards and reports that let a marketing team see, in plain language, what's actually working.

We're hiring a Data Scientist to build the predictive models behind our churn and lifetime-value products — the features that let a client know which customers to worry about before they leave.

What you'll do:
• Design and train models (churn prediction, LTV estimation, segmentation) using our clients' transaction and behavioral data
• Own the full lifecycle: feature engineering, model selection, validation, and monitoring model performance after launch
• Translate model output into something a marketing director can act on — a probability score is useless without a recommendation attached
• Collaborate with data engineers to make sure the pipelines feeding your models are reliable
• Contribute to our internal library of reusable modeling code

What we're looking for:
• Strong Python skills, especially pandas, scikit-learn, and standard ML workflows
• Solid statistics foundation — you know when a model is overfit before it ships, not after
• Comfortable with SQL for pulling and shaping your own training data
• Experience presenting technical findings to non-technical stakeholders
• 4+ years of experience in a data science or applied statistics role

Hybrid role based in Cebu, with the option to work remote most of the month.`,
    skills: ["Python", "Machine Learning", "SQL", "Pandas", "Statistics"],
    location: "Cebu",
    remote: true,
    salaryMin: 85000,
    salaryMax: 115000,
    employmentType: "full-time",
    seniority: "senior",
  },
  {
    companyKey: "northwind",
    title: "Data Engineer",
    description: `Northwind Analytics helps consumer brands understand their customers through data — we build the dashboards and reports that let a marketing team see, in plain language, what's actually working.

We're looking for a Data Engineer to build and maintain the pipelines that move client data from raw source systems into the warehouse our analysts and data scientists rely on every day.

What you'll do:
• Build and maintain ELT pipelines using Airflow, moving data from client APIs and file drops into our warehouse
• Design schemas that make life easier for the analysts and data scientists downstream of you
• Monitor pipeline health and be the first line of response when a client's data feed breaks overnight
• Work with cloud infrastructure (we're primarily on AWS) to keep pipeline costs and runtimes reasonable
• Document data lineage so anyone on the team can trace a number in a dashboard back to its source

What we're looking for:
• Strong SQL and Python skills
• Experience with a workflow orchestration tool — Airflow, Dagster, or similar
• Familiarity with distributed data processing (Spark or equivalent) for larger client datasets
• Comfortable owning infrastructure, not just writing queries against data someone else prepared
• 2–4 years of experience in a data engineering or backend-adjacent role

Remote-friendly, with the team based primarily in Cebu — we get together in person once a quarter.`,
    skills: ["Python", "SQL", "Airflow", "Spark", "AWS"],
    location: "Cebu",
    remote: true,
    salaryMin: 70000,
    salaryMax: 90000,
    employmentType: "full-time",
    seniority: "mid",
  },
  {
    companyKey: "bluepeak",
    title: "DevOps Engineer",
    description: `BluePeak Systems runs the cloud infrastructure behind a portfolio of SaaS products used by companies across finance and logistics. We're a remote-first infrastructure team that takes reliability seriously — our clients' businesses depend on our uptime.

We're hiring a DevOps Engineer to help us scale our CI/CD pipelines and Kubernetes infrastructure as we onboard larger enterprise clients this year.

What you'll do:
• Design and maintain CI/CD pipelines that our product teams use to ship multiple times a day, safely
• Manage and scale our Kubernetes clusters across multiple environments
• Write and maintain infrastructure as code with Terraform
• Partner with product engineering teams to make deployments boring — no 2am pages because of a bad rollout
• Own incident response for infrastructure-level issues, including writing clear postmortems

What we're looking for:
• Solid hands-on experience with AWS, Docker, and Kubernetes in production
• Comfortable writing and maintaining Terraform for real infrastructure, not just tutorials
• Experience building or maintaining CI/CD pipelines (GitHub Actions, GitLab CI, Jenkins, or similar)
• You think in terms of failure modes — what breaks, how do we know, how fast can we recover
• 4+ years of experience in a DevOps, SRE, or infrastructure engineering role

Fully remote — we're intentional about async communication and don't expect you online outside your working hours.`,
    skills: ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD"],
    location: "Remote",
    remote: true,
    salaryMin: 95000,
    salaryMax: 135000,
    employmentType: "full-time",
    seniority: "senior",
  },
  {
    companyKey: "bluepeak",
    title: "Site Reliability Engineer",
    description: `BluePeak Systems runs the cloud infrastructure behind a portfolio of SaaS products used by companies across finance and logistics. We're a remote-first infrastructure team that takes reliability seriously — our clients' businesses depend on our uptime.

We're looking for a Site Reliability Engineer to take a lead role in how we think about uptime, observability, and incident response across the whole platform. This is a senior/lead-level role with real scope to shape how the team operates.

What you'll do:
• Define and own our SLOs across all client-facing services, and build the tooling to track them
• Improve our observability stack (metrics, logs, traces) so incidents get diagnosed in minutes, not hours
• Lead incident response for the most severe production issues, and run blameless postmortems afterward
• Automate away recurring operational toil — if the team does something manually twice, you're the one who scripts it away
• Mentor other engineers on production readiness and on-call best practices

What we're looking for:
• 6+ years of experience in SRE, DevOps, or backend infrastructure roles, with real on-call experience
• Deep comfort with Linux internals, Kubernetes, and Python for tooling/automation
• Experience with observability tooling (Prometheus, Grafana, or equivalent) — you've built dashboards people actually use during an incident
• A track record of reducing incident frequency or severity at a previous company, not just responding to them
• Comfortable being the calm voice during a production outage

Fully remote, senior compensation band, and genuine influence over how the whole engineering org handles reliability.`,
    skills: ["Kubernetes", "Python", "Monitoring", "Linux"],
    location: "Remote",
    remote: true,
    salaryMin: 100000,
    salaryMax: 140000,
    employmentType: "full-time",
    seniority: "lead",
  },
  {
    companyKey: "bluepeak",
    title: "Junior Cloud Support Engineer",
    description: `BluePeak Systems runs the cloud infrastructure behind a portfolio of SaaS products used by companies across finance and logistics. We're a remote-first infrastructure team that takes reliability seriously — our clients' businesses depend on our uptime.

We're hiring a Junior Cloud Support Engineer to be the first point of contact when a customer or internal team runs into an infrastructure issue. This is a great entry point into infrastructure and DevOps work, with a lot of hands-on learning in your first year.

What you'll do:
• Triage incoming support tickets related to cloud infrastructure — connectivity issues, access requests, basic troubleshooting
• Monitor dashboards and escalate anomalies to senior engineers with the right context already gathered
• Maintain internal documentation and runbooks as you learn how our systems fit together
• Shadow senior SREs during incidents to build real production experience
• Handle basic AWS console tasks (IAM access reviews, simple networking checks) under supervision

What we're looking for:
• Basic familiarity with Linux and networking fundamentals (DNS, HTTP, TCP/IP at a conceptual level)
• Some exposure to AWS or another cloud provider — coursework or personal projects count
• Strong written communication — you'll be writing clear updates to customers and teammates
• Curious and comfortable saying "I don't know yet, let me find out" during your first few months
• No professional experience required — this is an entry-level role designed to grow into DevOps/SRE work

Fully remote, with a structured onboarding program and a dedicated mentor for your first 90 days.`,
    skills: ["AWS", "Linux", "Networking"],
    location: "Remote",
    remote: true,
    salaryMin: 30000,
    salaryMax: 45000,
    employmentType: "full-time",
    seniority: "intern",
  },
  {
    companyKey: "fern",
    title: "Product Designer",
    description: `Fern Studio is a small product design studio — six of us, working closely with early-stage startups to design the first real version of their product. We care a lot about craft and about actually shipping, not just producing pretty mockups nobody builds.

We're looking for a Product Designer to join our core team and take ownership of end-to-end design for two or three client engagements at a time.

What you'll do:
• Run the full design process for client projects — discovery, wireframes, high-fidelity UI, and handoff to engineering
• Conduct light user research and usability testing to validate design decisions before they're built
• Build and maintain design systems in Figma that client teams can keep using after we roll off
• Present design work directly to client stakeholders, including founders and non-design leadership
• Collaborate closely with a UX researcher and, on larger engagements, other designers on the team

What we're looking for:
• A strong portfolio showing real shipped product work, not just concept projects
• Comfortable owning a project from a vague brief to a polished, developer-ready design
• Skilled in Figma, including component systems and auto-layout
• Some experience running or contributing to user research, even informally
• 3+ years of product design experience, ideally including startup or agency work

Based in our Davao studio — we work in-person most days because we believe in-room collaboration produces better work, faster.`,
    skills: ["Figma", "UX Research", "Prototyping", "UI Design"],
    location: "Davao",
    remote: false,
    salaryMin: 45000,
    salaryMax: 65000,
    employmentType: "full-time",
    seniority: "mid",
  },
  {
    companyKey: "fern",
    title: "UX Researcher",
    description: `Fern Studio is a small product design studio — six of us, working closely with early-stage startups to design the first real version of their product. We care a lot about craft and about actually shipping, not just producing pretty mockups nobody builds.

We're looking for a UX Researcher (contract) to run research across several client engagements — helping founders validate product decisions with real user evidence instead of gut feel.

What you'll do:
• Plan and run qualitative research — user interviews, usability tests, contextual inquiries — for client projects
• Synthesize findings into clear, actionable reports that a non-research audience can act on
• Partner with our product designers to make sure research actually shapes the design, not just documents it
• Help clients (many of whom have never done formal research) build lightweight research habits of their own
• Occasionally run quick surveys or lightweight quant research to complement qualitative findings

What we're looking for:
• Demonstrated experience running end-to-end UX research, ideally in a startup or agency context
• Comfortable working independently across multiple concurrent projects
• Strong synthesis and writing skills — your reports need to convince a skeptical founder
• Familiarity with Figma for reviewing and annotating design work
• Available for a contract engagement (target: 3 days/week, flexible)

Based in Davao, with some remote flexibility for research synthesis work.`,
    skills: ["User Research", "Figma", "Surveys", "Usability Testing"],
    location: "Davao",
    remote: true,
    salaryMin: 48000,
    salaryMax: 68000,
    employmentType: "contract",
    seniority: "mid",
  },
  {
    companyKey: "solstice",
    title: "Mobile Engineer (iOS)",
    description: `Solstice Health builds the patient-facing app that connects people to their care team — appointment scheduling, secure messaging, and lab results, all in one place. We work with clinics across the country, and our app is often a patient's first digital touchpoint with their healthcare provider.

We're hiring a Senior iOS Engineer to help us rebuild key parts of our patient app in SwiftUI and improve reliability for a user base that genuinely depends on the app working correctly.

What you'll do:
• Design and build features in our SwiftUI-based patient app, from appointment booking to secure messaging
• Own the migration of legacy UIKit screens to SwiftUI without disrupting patients mid-flow
• Work closely with backend engineers to integrate REST APIs for health records, respecting strict data privacy requirements
• Improve app stability and performance — crash-free sessions matter more here than in a typical consumer app
• Participate in code review and help set iOS engineering standards for the team

What we're looking for:
• 4+ years of professional iOS development experience, with real SwiftUI experience (not just UIKit)
• Comfortable working with REST APIs and handling sensitive data responsibly
• Experience shipping and maintaining apps on the App Store, including dealing with review and release processes
• Health tech or another regulated-industry background is a plus but not required
• Genuine care about building software that people rely on for their health — this isn't a "move fast and break things" environment

Based in our Manila office, on-site — the sensitivity of the data we work with means we keep this team in-office.`,
    skills: ["Swift", "iOS", "Xcode", "REST APIs"],
    location: "Manila",
    remote: false,
    salaryMin: 70000,
    salaryMax: 100000,
    employmentType: "full-time",
    seniority: "senior",
  },
  {
    companyKey: "solstice",
    title: "QA Engineer",
    description: `Solstice Health builds the patient-facing app that connects people to their care team — appointment scheduling, secure messaging, and lab results, all in one place. We work with clinics across the country, and our app is often a patient's first digital touchpoint with their healthcare provider.

We're looking for a QA Engineer to own quality across our web and mobile apps. Bugs in a typical app are annoying; a bug in ours can mean a missed appointment or a delayed lab result, so we take testing seriously.

What you'll do:
• Write and execute manual test plans for new features before they ship
• Build and maintain automated test suites using Selenium for our web application
• Log, triage, and track bugs through JIRA, working closely with engineers to get them fixed
• Perform regression testing ahead of releases, especially for any flow touching patient data
• Help define our QA process as the team and product both grow

What we're looking for:
• 1–3 years of QA experience, manual and/or automated
• Familiarity with Selenium or a similar browser automation tool
• Comfortable using JIRA (or willing to learn quickly) for bug tracking and workflow
• Meticulous attention to detail — you notice the edge case everyone else missed
• Healthcare or another regulated-industry QA background is a plus but not required

Based in our Manila office, on-site with the rest of the engineering team.`,
    skills: ["Manual Testing", "Selenium", "JIRA", "Automation"],
    location: "Manila",
    remote: false,
    salaryMin: 35000,
    salaryMax: 50000,
    employmentType: "full-time",
    seniority: "junior",
  },

  // --- Remote/BPO roles common in the Philippines online job market ---

  {
    companyKey: "manilavs",
    title: "General Virtual Assistant",
    description: `Manila Virtual Staffing places Filipino virtual assistants with small and mid-sized businesses across the US, Australia, and the UK — we currently support over 150 clients, from solo founders to 20-person teams.

We're hiring a General Virtual Assistant to support one of our long-term clients, a US-based consulting firm. You'll be the person keeping their inbox, calendar, and day-to-day admin running smoothly so they can focus on client work.

What you'll do:
• Manage a busy inbox — triage, draft replies, and flag anything urgent
• Keep a multi-timezone calendar organized, scheduling calls and avoiding double-bookings
• Handle recurring data entry and light research tasks in Google Sheets
• Prepare simple documents and slide decks from rough notes
• Coordinate with other VAs and contractors on the client's behalf

What we're looking for:
• 1+ years of VA, admin, or executive support experience
• Comfortable with Google Workspace (Gmail, Calendar, Sheets, Docs) day to day
• Clear written English and a habit of over-communicating rather than under-communicating
• Reliable internet connection and the ability to overlap a few hours with US business hours
• Bonus: experience supporting more than one client at a time

Fully remote, with a fixed weekly schedule agreed with the client.`,
    skills: ["Calendar Management", "Email Management", "Data Entry", "Google Workspace"],
    location: "Remote",
    remote: true,
    salaryMin: 25000,
    salaryMax: 35000,
    employmentType: "full-time",
    seniority: "junior",
  },
  {
    companyKey: "manilavs",
    title: "Executive Virtual Assistant",
    description: `Manila Virtual Staffing places Filipino virtual assistants with small and mid-sized businesses across the US, Australia, and the UK — we currently support over 150 clients, from solo founders to 20-person teams.

We're hiring an Executive Virtual Assistant to support a founder/CEO client directly. This is a higher-trust role than general admin — you'll be making judgment calls on their behalf, not just following a checklist.

What you'll do:
• Own the executive's calendar end-to-end, including proactively resolving scheduling conflicts
• Book travel (flights, hotels, itineraries) and handle changes when plans shift last-minute
• Draft correspondence and internal updates in the executive's voice
• Track action items from meetings and follow up with the right people
• Manage a handful of recurring vendor and personal admin tasks

What we're looking for:
• 2+ years supporting a founder, executive, or senior manager directly
• Excellent written English and sound judgment about what needs escalation versus what doesn't
• Experience with travel booking tools and calendar tools beyond the basics
• Discretion — you'll see sensitive information and need to handle it appropriately
• Bonus: experience working across US and Australian time zones

Fully remote, with core hours overlapping the client's morning (US Pacific).`,
    skills: ["Executive Support", "Scheduling", "Travel Booking", "Communication"],
    location: "Remote",
    remote: true,
    salaryMin: 35000,
    salaryMax: 48000,
    employmentType: "full-time",
    seniority: "mid",
  },
  {
    companyKey: "manilavs",
    title: "Data Entry Specialist",
    description: `Manila Virtual Staffing places Filipino virtual assistants with small and mid-sized businesses across the US, Australia, and the UK — we currently support over 150 clients, from solo founders to 20-person teams.

We're hiring a Data Entry Specialist to support a client migrating years of records from spreadsheets into a new CRM. It's detail-heavy work with a clear, well-defined scope — a good fit if you take pride in getting the small things exactly right.

What you'll do:
• Enter and validate records in the client's CRM against source spreadsheets
• Flag inconsistent or duplicate entries instead of just entering them as-is
• Keep a daily log of records processed and issues found
• Follow a written data-entry standard and suggest improvements when you spot gaps in it
• Hit agreed daily throughput targets without sacrificing accuracy

What we're looking for:
• Fast, accurate typing and strong attention to detail
• Comfortable in Excel or Google Sheets (formulas, filters, basic cleanup)
• No CRM experience required — we'll train you on the client's specific tool
• Able to work independently once given a clear task list
• Bonus: prior experience with any CRM (HubSpot, Salesforce, Zoho)

Fully remote, flexible hours as long as daily targets are met.`,
    skills: ["Data Entry", "Excel", "Attention to Detail", "Typing"],
    location: "Remote",
    remote: true,
    salaryMin: 20000,
    salaryMax: 28000,
    employmentType: "full-time",
    seniority: "intern",
  },
  {
    companyKey: "clearline",
    title: "Customer Service Representative",
    description: `ClearLine Support runs outsourced customer service teams for e-commerce and subscription brands across North America — our agents are often the only human a customer talks to.

We're hiring a Customer Service Representative for a growing DTC brand's support line. You'll handle order issues, refunds, and general questions over email and chat.

What you'll do:
• Respond to customer inquiries via email and live chat within our SLA
• Process refunds, exchanges, and order corrections following the client's policy
• De-escalate frustrated customers calmly and know when to loop in a supervisor
• Log every interaction accurately in Zendesk for the client's own reporting
• Spot recurring complaint patterns and flag them to the team lead

What we're looking for:
• 6+ months in a customer-facing support role (call center, retail, or remote)
• Comfortable typing quickly while still writing clearly and warmly
• Familiarity with Zendesk or a similar helpdesk tool is a plus, not required
• Even temperament — you don't take a rude customer personally
• Available for shifting schedules that cover North American business hours

Remote-first, with a required overlap of US Eastern hours.`,
    skills: ["Customer Service", "Zendesk", "Communication", "Conflict Resolution"],
    location: "Remote",
    remote: true,
    salaryMin: 24000,
    salaryMax: 32000,
    employmentType: "full-time",
    seniority: "junior",
  },
  {
    companyKey: "clearline",
    title: "Chat Support Specialist",
    description: `ClearLine Support runs outsourced customer service teams for e-commerce and subscription brands across North America — our agents are often the only human a customer talks to.

We're hiring a Chat Support Specialist to handle live chat exclusively for one of our SaaS clients — think quick account questions, billing confusion, and "how do I..." moments, not lengthy phone calls.

What you'll do:
• Handle 3-5 concurrent live chats during peak hours without dropping quality
• Answer product how-to questions using our internal knowledge base
• Escalate billing disputes and bugs to the right internal team with full context
• Keep response times inside the client's chat SLA
• Contribute new articles to the knowledge base when you notice a gap

What we're looking for:
• Fast, accurate typing and comfort multitasking across several conversations at once
• Some prior chat, email, or messaging-based support experience
• Clear written English — chat is unforgiving of ambiguity
• Comfortable learning a new SaaS product's ins and outs quickly
• Bonus: experience with Intercom or a similar live-chat platform

Fully remote, fixed shift schedule assigned at hire.`,
    skills: ["Live Chat", "Customer Support", "Typing Speed", "Multitasking"],
    location: "Remote",
    remote: true,
    salaryMin: 23000,
    salaryMax: 30000,
    employmentType: "full-time",
    seniority: "junior",
  },
  {
    companyKey: "clearline",
    title: "Technical Support Specialist",
    description: `ClearLine Support runs outsourced customer service teams for e-commerce and subscription brands across North America — our agents are often the only human a customer talks to.

We're hiring a Technical Support Specialist for a client that sells home networking hardware. You'll walk non-technical customers through setup and troubleshooting over chat and phone.

What you'll do:
• Diagnose connectivity and device-setup issues over chat and phone
• Walk customers step-by-step through router/app configuration without losing patience
• Log recurring hardware issues so the client's product team can see patterns
• Maintain and update ticketing records in the client's helpdesk system
• Escalate confirmed hardware defects for RMA processing

What we're looking for:
• 1+ years in technical or IT support, or strong personal networking/hardware knowledge
• Comfortable explaining technical steps in plain language to a frustrated customer
• Experience with any ticketing system (Zendesk, Freshdesk, Jira Service Desk)
• Patience — some calls will be the same issue explained five different ways
• Bonus: CompTIA A+/Network+ or equivalent hands-on experience

Remote, with rotating shifts to cover extended support hours.`,
    skills: ["Troubleshooting", "Technical Support", "Ticketing Systems", "Networking Basics"],
    location: "Remote",
    remote: true,
    salaryMin: 28000,
    salaryMax: 38000,
    employmentType: "full-time",
    seniority: "mid",
  },
  {
    companyKey: "pixelco",
    title: "Graphic Designer",
    description: `Pixel & Co Creative is a small design studio building brand identities and marketing assets for startups that don't have an in-house designer yet.

We're hiring a Graphic Designer to work across a rotating roster of client projects — logos, pitch decks, social templates, and the occasional full brand kit.

What you'll do:
• Design logos, brand guidelines, and marketing collateral from a client brief
• Turn a founder's rough idea into a polished, on-brand visual system
• Prepare layered, export-ready files for print and digital use
• Present concepts to clients and incorporate feedback across revision rounds
• Keep a shared asset library organized as projects wrap up

What we're looking for:
• A portfolio showing range across branding, digital, and print work
• Strong command of Adobe Photoshop and Illustrator
• Comfortable presenting your own work and defending design decisions with reasoning, not just taste
• Able to juggle 2-3 client projects at different stages at once
• Bonus: motion or basic video editing skills

Fully remote, with weekly client check-in calls.`,
    skills: ["Adobe Photoshop", "Adobe Illustrator", "Branding", "Layout Design"],
    location: "Remote",
    remote: true,
    salaryMin: 30000,
    salaryMax: 45000,
    employmentType: "full-time",
    seniority: "mid",
  },
  {
    companyKey: "pixelco",
    title: "Video Editor",
    description: `Pixel & Co Creative is a small design studio building brand identities and marketing assets for startups that don't have an in-house designer yet.

We're hiring a Video Editor to cut short-form marketing videos and the occasional longer explainer for our clients' social and ad campaigns.

What you'll do:
• Edit raw footage into polished short-form videos for Instagram, TikTok, and YouTube Shorts
• Add captions, motion graphics, and sound design that fit each client's brand
• Color grade footage shot in inconsistent lighting into something usable
• Turn around quick-response content (trend-based clips) within a day or two
• Organize and archive raw project files so nothing gets lost between revisions

What we're looking for:
• A reel showing short-form social edits, not just long-form work
• Strong Adobe Premiere Pro skills; After Effects for motion graphics is a plus
• An eye for pacing — you know when a cut is a beat too slow
• Comfortable taking direction from a written creative brief
• Bonus: experience editing for a specific niche (fitness, SaaS, e-commerce)

Fully remote, deadline-driven rather than fixed hours.`,
    skills: ["Adobe Premiere Pro", "After Effects", "Color Grading", "Storytelling"],
    location: "Remote",
    remote: true,
    salaryMin: 28000,
    salaryMax: 42000,
    employmentType: "contract",
    seniority: "mid",
  },
  {
    companyKey: "pixelco",
    title: "Social Media Content Creator",
    description: `Pixel & Co Creative is a small design studio building brand identities and marketing assets for startups that don't have an in-house designer yet.

We're hiring a Social Media Content Creator to plan and produce day-to-day content for a handful of client accounts — the person who makes a brand's feed feel alive week to week.

What you'll do:
• Design on-brand graphics and short video content in Canva for Instagram, Facebook, and TikTok
• Draft captions that match each client's voice, not a generic template
• Maintain a monthly content calendar and hit posting deadlines
• Repurpose long-form client content (blog posts, videos) into bite-sized social posts
• Track which posts perform well and suggest adjustments the next month

What we're looking for:
• A portfolio or personal social presence showing you can create engaging content
• Comfortable in Canva; any additional design tool is a bonus
• Familiarity with what actually performs on Instagram/TikTok versus what just looks nice
• Organized — you won't be micromanaged on deadlines, so you need to hit them on your own
• Bonus: basic short-form video editing skills

Fully remote, part-time to start with room to grow into full-time.`,
    skills: ["Canva", "Content Creation", "Instagram", "TikTok"],
    location: "Remote",
    remote: true,
    salaryMin: 18000,
    salaryMax: 26000,
    employmentType: "part-time",
    seniority: "junior",
  },
  {
    companyKey: "growthwave",
    title: "Social Media Manager",
    description: `GrowthWave Marketing runs digital marketing for small e-commerce and local service businesses that want an agency's expertise without hiring a full internal team.

We're hiring a Social Media Manager to own strategy and execution for a portfolio of client accounts — not just posting, but actually growing the numbers that matter to each client.

What you'll do:
• Build and run a content calendar and posting strategy per client
• Manage and optimize paid Meta Ads campaigns alongside organic content
• Report on engagement, follower growth, and ad performance monthly, in plain language
• Coordinate with our designers and writers to keep content on-brand and on-schedule
• Stay on top of platform changes (algorithm shifts, new formats) and adjust strategy accordingly

What we're looking for:
• 2+ years managing social accounts for a brand or agency, not just a personal account
• Hands-on experience running Meta Ads campaigns, not just organic posting
• Comfortable reading analytics and turning numbers into a plain-English recommendation
• Strong organization — you're juggling multiple clients' calendars at once
• Bonus: experience with Later, Buffer, or similar scheduling tools

Fully remote, with monthly client reporting calls.`,
    skills: ["Social Media Strategy", "Content Calendar", "Meta Ads", "Analytics"],
    location: "Remote",
    remote: true,
    salaryMin: 32000,
    salaryMax: 45000,
    employmentType: "full-time",
    seniority: "mid",
  },
  {
    companyKey: "growthwave",
    title: "SEO Specialist",
    description: `GrowthWave Marketing runs digital marketing for small e-commerce and local service businesses that want an agency's expertise without hiring a full internal team.

We're hiring an SEO Specialist to run on-page and technical SEO for a set of client websites, most of them small e-commerce or local service sites competing for very specific search terms.

What you'll do:
• Do keyword research and map target keywords to existing or new pages
• Run technical audits (site speed, indexing issues, broken links) using Search Console and Screaming Frog
• Write on-page SEO briefs for our content writers to follow
• Build and track a link-building plan for each client
• Report monthly on ranking movement and organic traffic trends

What we're looking for:
• 2+ years doing hands-on SEO, not just "helped with SEO" on a broader marketing team
• Comfortable with Google Search Console, Google Analytics, and at least one SEO tool (Ahrefs, SEMrush)
• Can explain a technical SEO fix to a client who has never heard the term "canonical tag"
• Genuinely curious about why a page ranks where it does, not just checklist-following
• Bonus: experience with local SEO (Google Business Profile) for service businesses

Fully remote, results tracked against agreed monthly targets per client.`,
    skills: ["SEO", "Keyword Research", "Google Search Console", "Link Building"],
    location: "Remote",
    remote: true,
    salaryMin: 30000,
    salaryMax: 42000,
    employmentType: "full-time",
    seniority: "mid",
  },
  {
    companyKey: "growthwave",
    title: "Content Writer",
    description: `GrowthWave Marketing runs digital marketing for small e-commerce and local service businesses that want an agency's expertise without hiring a full internal team.

We're hiring a Content Writer to produce blog posts, landing page copy, and email content for a rotating set of client accounts, guided by SEO briefs from our specialists.

What you'll do:
• Write blog posts and landing pages from an SEO brief, hitting target keywords naturally
• Adapt tone and voice across multiple clients without everything sounding the same
• Research unfamiliar topics quickly enough to write credibly about them
• Edit your own drafts against a style guide before submitting for review
• Repurpose long-form content into shorter formats (email, social captions) when needed

What we're looking for:
• A portfolio of published writing — blog posts, articles, or client work
• Comfortable writing to an SEO brief without producing keyword-stuffed, robotic copy
• Strong research skills and honest about what you don't know yet
• Can take editorial feedback without treating every edit as a personal critique
• Bonus: basic understanding of on-page SEO principles

Fully remote, paid per assigned project with a steady monthly workload.`,
    skills: ["Content Writing", "SEO Writing", "Research", "Copyediting"],
    location: "Remote",
    remote: true,
    salaryMin: 22000,
    salaryMax: 35000,
    employmentType: "contract",
    seniority: "junior",
  },
  {
    companyKey: "cartflow",
    title: "E-Commerce Virtual Assistant",
    description: `CartFlow Commerce manages the day-to-day operations of Shopify stores for brands that want to focus on product and marketing, not backend admin.

We're hiring an E-Commerce Virtual Assistant to support daily store operations for a handful of client stores — a mix of catalog upkeep, order support, and general Shopify admin.

What you'll do:
• Update product listings, pricing, and inventory counts in Shopify
• Respond to customer questions about orders, shipping, and returns
• Coordinate with suppliers on stock updates and delivery timelines
• Keep store promotions and discount codes configured correctly during sales
• Flag anything unusual (sudden order spikes, payment issues) to the client quickly

What we're looking for:
• Some hands-on Shopify experience, even from a personal or small project store
• Comfortable handling customer messages professionally and promptly
• Organized enough to track multiple small tasks across several stores without dropping any
• Basic comfort with spreadsheets for inventory tracking
• Bonus: experience with Shopify apps for inventory or fulfillment

Fully remote, standard business-hours schedule.`,
    skills: ["Shopify", "Product Listing", "Order Processing", "Customer Support"],
    location: "Remote",
    remote: true,
    salaryMin: 24000,
    salaryMax: 32000,
    employmentType: "full-time",
    seniority: "junior",
  },
  {
    companyKey: "cartflow",
    title: "Product Listing Specialist",
    description: `CartFlow Commerce manages the day-to-day operations of Shopify stores for brands that want to focus on product and marketing, not backend admin.

We're hiring a Product Listing Specialist to research and build out new product listings as clients expand their catalogs, with a strong focus on discoverability.

What you'll do:
• Research competitor listings and search terms before writing a new listing
• Write SEO-friendly titles, bullet points, and descriptions for new products
• Source and lightly edit product images to meet marketplace/store requirements
• Keep a consistent listing template across a client's full catalog
• Track which listings underperform and suggest rewrites

What we're looking for:
• Experience listing products on Shopify, Amazon, or a similar platform
• An eye for what makes a listing convert, not just read well
• Comfortable with basic image editing (cropping, resizing, background cleanup)
• Detail-oriented — a wrong size or price listed wrong creates real customer problems
• Bonus: prior Amazon Seller Central experience

Fully remote, output-based workload (listings per week) rather than a fixed shift.`,
    skills: ["Amazon Seller Central", "Product Research", "SEO Titles", "Data Entry"],
    location: "Remote",
    remote: true,
    salaryMin: 25000,
    salaryMax: 34000,
    employmentType: "full-time",
    seniority: "junior",
  },
  {
    companyKey: "cartflow",
    title: "Order Processing Assistant",
    description: `CartFlow Commerce manages the day-to-day operations of Shopify stores for brands that want to focus on product and marketing, not backend admin.

We're hiring an Order Processing Assistant to keep order fulfillment running smoothly across client stores during a busy growth period.

What you'll do:
• Review incoming orders daily and confirm they're routed correctly to fulfillment
• Handle order edits, cancellations, and address corrections before they ship
• Communicate with customers about delays or fulfillment issues
• Reconcile shipped-order counts against the fulfillment provider's reports
• Escalate fulfillment provider errors to the client promptly

What we're looking for:
• Comfortable working inside Shopify's order management screens
• Careful and methodical — this role is unforgiving of a rushed, sloppy pass
• Clear, calm written communication for customer-facing messages
• Able to work a consistent daily schedule during order-processing hours
• Bonus: experience with a third-party fulfillment or shipping platform

Fully remote, fixed daily hours to match order-processing cutoffs.`,
    skills: ["Order Management", "Shopify", "Attention to Detail", "Customer Communication"],
    location: "Remote",
    remote: true,
    salaryMin: 22000,
    salaryMax: 30000,
    employmentType: "full-time",
    seniority: "intern",
  },
  {
    companyKey: "ledgerco",
    title: "Bookkeeper",
    description: `Ledger & Co provides remote bookkeeping for small US-based businesses that have outgrown a spreadsheet but aren't ready for a full-time in-house accountant.

We're hiring a Bookkeeper to manage the books for a portfolio of small business clients — recording transactions, reconciling accounts, and keeping everything audit-ready.

What you'll do:
• Record day-to-day transactions and categorize them correctly in QuickBooks
• Reconcile bank and credit card statements monthly
• Prepare simple monthly financial summaries for client review
• Track accounts payable/receivable and flag anything overdue
• Answer client questions about their own numbers in plain language

What we're looking for:
• 2+ years of bookkeeping experience, ideally across multiple small-business clients
• Strong QuickBooks Online skills
• Comfortable with US accounting conventions (even if trained elsewhere) — we'll fill gaps in onboarding
• Meticulous — small categorization errors compound into real problems at tax time
• Bonus: experience with multiple clients in parallel, not just one employer's books

Fully remote, standard business-hours availability for client questions.`,
    skills: ["QuickBooks", "Bookkeeping", "Excel", "Accounts Payable"],
    location: "Remote",
    remote: true,
    salaryMin: 30000,
    salaryMax: 42000,
    employmentType: "full-time",
    seniority: "mid",
  },
  {
    companyKey: "ledgerco",
    title: "Accounting Assistant",
    description: `Ledger & Co provides remote bookkeeping for small US-based businesses that have outgrown a spreadsheet but aren't ready for a full-time in-house accountant.

We're hiring an Accounting Assistant to support our bookkeepers with the recurring, high-volume work behind each client's books — a good entry point into remote accounting work.

What you'll do:
• Enter invoices, receipts, and expense reports into QuickBooks
• Assist with payroll data entry ahead of each pay cycle
• Organize digital receipts and supporting documents for each client's records
• Run first-pass reconciliations for a senior bookkeeper to review
• Follow a documented checklist for month-end close tasks

What we're looking for:
• Some exposure to bookkeeping or accounting coursework/work, even if junior
• Comfortable in Excel and willing to learn QuickBooks Online quickly
• Very high attention to detail — this role is almost entirely about accuracy
• Able to follow a written checklist precisely without needing constant check-ins
• Bonus: pursuing or holding an accounting-related degree

Fully remote, entry-level with a clear path toward a full Bookkeeper role.`,
    skills: ["Financial Data Entry", "Payroll Assistant", "Excel", "QuickBooks"],
    location: "Remote",
    remote: true,
    salaryMin: 20000,
    salaryMax: 28000,
    employmentType: "full-time",
    seniority: "intern",
  },
  {
    companyKey: "brightpath",
    title: "Online English Tutor",
    description: `BrightPath Tutors connects Filipino tutors with students abroad for one-on-one and small-group English lessons over video call.

We're hiring an Online English Tutor to teach conversational and business English to adult learners, mostly based in Japan and Korea, on a flexible lesson schedule.

What you'll do:
• Teach 1-on-1 and small-group English lessons over Zoom using our lesson materials
• Adapt lessons on the fly to a student's actual level, not just the assigned material
• Give students specific, encouraging feedback on pronunciation and grammar
• Track each student's progress in our learning platform after every session
• Communicate professionally with students who are still building their English confidence

What we're looking for:
• Fluent, clear spoken English and a genuine patience for repeating/rephrasing
• Prior tutoring, teaching, or ESL experience (formal or informal)
• Comfortable teaching over video call with basic tech troubleshooting on your own
• Reliable internet and a quiet space for lessons during your chosen hours
• Bonus: TESOL/TEFL certification, though not required to start

Fully remote, you set your own available lesson slots.`,
    skills: ["ESL Teaching", "Lesson Planning", "Communication", "Zoom"],
    location: "Remote",
    remote: true,
    salaryMin: 20000,
    salaryMax: 32000,
    employmentType: "part-time",
    seniority: "junior",
  },
  {
    companyKey: "brightpath",
    title: "Online Math Tutor",
    description: `BrightPath Tutors connects Filipino tutors with students abroad for one-on-one and small-group lessons over video call.

We're hiring an Online Math Tutor to teach middle and high school math (algebra through pre-calculus) to students preparing for exams or catching up on core concepts.

What you'll do:
• Run 1-on-1 tutoring sessions over Zoom using a shared digital whiteboard
• Diagnose exactly where a student's understanding breaks down, not just what topic they're "behind" on
• Prepare short practice sets between sessions matched to each student's level
• Update parents/students on progress after each block of sessions
• Adjust pacing for students preparing for a specific exam versus general skill-building

What we're looking for:
• Strong command of algebra through pre-calculus, comfortable explaining multiple ways to solve the same problem
• Prior tutoring or teaching experience, formal or informal
• Patient, encouraging teaching style — most students come in already anxious about math
• Comfortable with basic video call and digital whiteboard tools
• Bonus: education or math-related degree in progress or completed

Fully remote, you set your own available lesson slots.`,
    skills: ["Subject Tutor", "Lesson Planning", "Communication", "Zoom"],
    location: "Remote",
    remote: true,
    salaryMin: 20000,
    salaryMax: 32000,
    employmentType: "part-time",
    seniority: "junior",
  },
];

// ---------------------------------------------------------------------------
// Applicants — see the comment for each on which job(s) it's meant to match
// and how well, once Phase 2 scoring exists.
// ---------------------------------------------------------------------------

function applicant({
  name,
  location,
  skills,
  titles,
  prefLocations,
  salaryMin,
  salaryMax,
  employmentTypes,
  seniority,
  headline,
  company,
}) {
  return {
    basicInfo: { name, location, address: "", phone: "+63 900 000 0000", photoUrl: null, about: "" },
    experience: [
      {
        title: headline,
        company,
        startDate: "2022-01",
        endDate: null,
        current: true,
        description: `${headline} at ${company}.`,
      },
    ],
    education: [
      {
        school: "State University",
        degree: "B.S.",
        field: "Computer Science",
        startDate: "2016-06",
        endDate: "2020-05",
      },
    ],
    skills,
    preferences: {
      titles,
      locations: prefLocations,
      salaryMin,
      salaryMax,
      employmentTypes,
      seniority,
    },
  };
}

const APPLICANTS = [
  // Near-perfect matches (title, skills, location, salary, type, seniority all line up)
  applicant({
    name: "Maria Santos",
    location: "Manila",
    headline: "Frontend Engineer",
    company: "Prior Co",
    skills: ["React", "TypeScript", "CSS", "JavaScript", "HTML", "Redux"],
    titles: ["Frontend Engineer", "Frontend Developer"],
    prefLocations: ["Manila", "Remote"],
    salaryMin: 55000,
    salaryMax: 75000,
    employmentTypes: ["full-time"],
    seniority: "mid",
  }),
  applicant({
    name: "Juan Dela Cruz",
    location: "Manila",
    headline: "Backend Developer",
    company: "Prior Co",
    skills: ["Node.js", "PostgreSQL", "Express", "Docker", "REST APIs"],
    titles: ["Backend Engineer", "Backend Developer"],
    prefLocations: ["Manila"],
    salaryMin: 50000,
    salaryMax: 70000,
    employmentTypes: ["full-time"],
    seniority: "mid",
  }),
  applicant({
    name: "Angela Reyes",
    location: "Cebu",
    headline: "Full-Stack Developer",
    company: "Prior Co",
    skills: ["React", "Node.js", "TypeScript", "AWS", "MongoDB"],
    titles: ["Full-Stack Developer", "Full Stack Engineer"],
    prefLocations: ["Manila", "Remote"],
    salaryMin: 90000,
    salaryMax: 130000,
    employmentTypes: ["full-time"],
    seniority: "senior",
  }),
  applicant({
    name: "Carlo Mendoza",
    location: "Cebu",
    headline: "Junior Data Analyst",
    company: "Prior Co",
    skills: ["SQL", "Excel", "Python", "Power BI"],
    titles: ["Data Analyst"],
    prefLocations: ["Cebu"],
    salaryMin: 35000,
    salaryMax: 50000,
    employmentTypes: ["full-time"],
    seniority: "junior",
  }),
  applicant({
    name: "Bianca Torres",
    location: "Cebu",
    headline: "Data Scientist",
    company: "Prior Co",
    skills: ["Python", "Machine Learning", "SQL", "Pandas", "Scikit-learn"],
    titles: ["Data Scientist", "ML Engineer"],
    prefLocations: ["Cebu", "Remote"],
    salaryMin: 85000,
    salaryMax: 115000,
    employmentTypes: ["full-time"],
    seniority: "senior",
  }),
  applicant({
    name: "Katrina Lim",
    location: "Remote",
    headline: "DevOps Engineer",
    company: "Prior Co",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "Jenkins"],
    titles: ["DevOps Engineer", "Site Reliability Engineer"],
    prefLocations: ["Remote"],
    salaryMin: 95000,
    salaryMax: 135000,
    employmentTypes: ["full-time"],
    seniority: "senior",
  }),
  applicant({
    name: "Enrico Bautista",
    location: "Remote",
    headline: "Site Reliability Engineer",
    company: "Prior Co",
    skills: ["Kubernetes", "Python", "Prometheus", "Linux", "Grafana"],
    titles: ["Site Reliability Engineer", "DevOps Engineer"],
    prefLocations: ["Remote"],
    salaryMin: 100000,
    salaryMax: 140000,
    employmentTypes: ["full-time"],
    seniority: "lead",
  }),
  applicant({
    name: "Patricia Cruz",
    location: "Remote",
    headline: "Cloud Support Associate",
    company: "Prior Co",
    skills: ["AWS", "Linux", "Networking", "Bash"],
    titles: ["Cloud Support Engineer", "Technical Support"],
    prefLocations: ["Remote"],
    salaryMin: 30000,
    salaryMax: 45000,
    employmentTypes: ["full-time"],
    seniority: "intern",
  }),
  applicant({
    name: "Miguel Ortiz",
    location: "Davao",
    headline: "Product Designer",
    company: "Prior Co",
    skills: ["Figma", "UI Design", "Prototyping", "Adobe XD"],
    titles: ["Product Designer", "UI Designer"],
    prefLocations: ["Davao", "Remote"],
    salaryMin: 45000,
    salaryMax: 65000,
    employmentTypes: ["full-time"],
    seniority: "mid",
  }),
  applicant({
    name: "Samantha Garcia",
    location: "Davao",
    headline: "UX Researcher",
    company: "Prior Co",
    skills: ["User Research", "Usability Testing", "Figma", "Surveys"],
    titles: ["UX Researcher", "User Researcher"],
    prefLocations: ["Davao"],
    salaryMin: 48000,
    salaryMax: 68000,
    employmentTypes: ["contract"],
    seniority: "mid",
  }),
  applicant({
    name: "Daniel Aquino",
    location: "Manila",
    headline: "iOS Developer",
    company: "Prior Co",
    skills: ["Swift", "iOS", "Xcode", "REST APIs", "SwiftUI"],
    titles: ["iOS Engineer", "Mobile Engineer"],
    prefLocations: ["Manila"],
    salaryMin: 70000,
    salaryMax: 100000,
    employmentTypes: ["full-time"],
    seniority: "senior",
  }),
  applicant({
    name: "Josephine Ramos",
    location: "Manila",
    headline: "QA Engineer",
    company: "Prior Co",
    skills: ["Manual Testing", "Selenium", "JIRA", "Automation"],
    titles: ["QA Engineer", "Test Engineer"],
    prefLocations: ["Manila"],
    salaryMin: 35000,
    salaryMax: 50000,
    employmentTypes: ["full-time"],
    seniority: "junior",
  }),

  // Partial matches — one or more axes deliberately off
  applicant({
    // Title synonym + partial skill overlap (Vue vs React) + location mismatch
    // (Baguio isn't any job's location) + seniority one level off vs Job 1 (mid).
    name: "Grace Fernandez",
    location: "Baguio",
    headline: "Frontend Developer",
    company: "Prior Co",
    skills: ["Vue.js", "JavaScript", "CSS", "HTML"],
    titles: ["Frontend Developer"],
    prefLocations: ["Baguio"],
    salaryMin: 40000,
    salaryMax: 55000,
    employmentTypes: ["full-time"],
    seniority: "junior",
  }),
  applicant({
    // Exact title match to Job 2, but near-zero skill overlap (Java/Spring vs Node/Postgres).
    name: "Leo Navarro",
    location: "Manila",
    headline: "Backend Engineer",
    company: "Prior Co",
    skills: ["Java", "Spring Boot", "MySQL", "Docker"],
    titles: ["Backend Engineer"],
    prefLocations: ["Manila"],
    salaryMin: 60000,
    salaryMax: 80000,
    employmentTypes: ["full-time"],
    seniority: "mid",
  }),
  applicant({
    // Exact title match to Job 5, but location mismatch (Manila vs Cebu) and
    // salary band skewed high; skills only partially overlap (R vs Python).
    name: "Christine Mercado",
    location: "Manila",
    headline: "Senior Data Scientist",
    company: "Prior Co",
    skills: ["R", "Statistics", "SQL", "Tableau"],
    titles: ["Data Scientist"],
    prefLocations: ["Manila"],
    salaryMin: 100000,
    salaryMax: 140000,
    employmentTypes: ["full-time"],
    seniority: "senior",
  }),
  applicant({
    // Generic/junior profile with broad, shallow title preferences — should
    // land low-to-mid scores across several jobs rather than matching any one well.
    name: "Anton Reyes",
    location: "Manila",
    headline: "Junior Software Engineer",
    company: "Prior Co",
    skills: ["Python", "Java", "SQL", "Git"],
    titles: ["Software Engineer", "Junior Developer"],
    prefLocations: ["Manila", "Cebu", "Remote"],
    salaryMin: 25000,
    salaryMax: 40000,
    employmentTypes: ["full-time"],
    seniority: "intern",
  }),

  // Poor matches — no comparable job posted at all
  applicant({
    name: "Vincent Tan",
    location: "Manila",
    headline: "Marketing Specialist",
    company: "Prior Co",
    skills: ["SEO", "Content Writing", "Google Analytics", "Social Media"],
    titles: ["Marketing Specialist", "Growth Marketer"],
    prefLocations: ["Manila"],
    salaryMin: 30000,
    salaryMax: 45000,
    employmentTypes: ["full-time"],
    seniority: "mid",
  }),
  applicant({
    name: "Ella Ramirez",
    location: "Iloilo",
    headline: "HR Generalist",
    company: "Prior Co",
    skills: ["Recruiting", "Payroll", "Employee Relations", "HRIS"],
    titles: ["HR Generalist", "People Ops"],
    prefLocations: ["Iloilo"],
    salaryMin: 28000,
    salaryMax: 40000,
    employmentTypes: ["full-time"],
    seniority: "junior",
  }),

  // --- Applicants matched to the remote/BPO roles above ---
  applicant({
    name: "Bea Villanueva",
    location: "Davao",
    headline: "Virtual Assistant",
    company: "Prior Co",
    skills: ["Calendar Management", "Email Management", "Data Entry", "Google Workspace", "Communication"],
    titles: ["Virtual Assistant", "General Virtual Assistant"],
    prefLocations: ["Remote"],
    salaryMin: 25000,
    salaryMax: 35000,
    employmentTypes: ["full-time"],
    seniority: "junior",
  }),
  applicant({
    name: "Ramon Cruz",
    location: "Cebu",
    headline: "Customer Service Representative",
    company: "Prior Co",
    skills: ["Customer Service", "Zendesk", "Communication", "Conflict Resolution"],
    titles: ["Customer Service Representative", "Chat Support Specialist"],
    prefLocations: ["Remote"],
    salaryMin: 24000,
    salaryMax: 32000,
    employmentTypes: ["full-time"],
    seniority: "junior",
  }),
  applicant({
    name: "Miguel Torres",
    location: "Manila",
    headline: "Technical Support Representative",
    company: "Prior Co",
    skills: ["Troubleshooting", "Technical Support", "Ticketing Systems", "Networking Basics"],
    titles: ["Technical Support Specialist", "IT Support Specialist"],
    prefLocations: ["Remote"],
    salaryMin: 28000,
    salaryMax: 38000,
    employmentTypes: ["full-time"],
    seniority: "mid",
  }),
  applicant({
    name: "Kim Aquino",
    location: "Manila",
    headline: "Graphic Designer",
    company: "Prior Co",
    skills: ["Adobe Photoshop", "Adobe Illustrator", "Branding", "Layout Design"],
    titles: ["Graphic Designer", "Visual Designer"],
    prefLocations: ["Remote"],
    salaryMin: 30000,
    salaryMax: 45000,
    employmentTypes: ["full-time"],
    seniority: "mid",
  }),
  applicant({
    name: "Nico Bautista",
    location: "Quezon City",
    headline: "Social Media Manager",
    company: "Prior Co",
    skills: ["Social Media Strategy", "Content Calendar", "Meta Ads", "Analytics"],
    titles: ["Social Media Manager", "Social Media Strategist"],
    prefLocations: ["Remote"],
    salaryMin: 32000,
    salaryMax: 45000,
    employmentTypes: ["full-time"],
    seniority: "mid",
  }),
  applicant({
    name: "Trisha Navarro",
    location: "Baguio",
    headline: "Content Writer",
    company: "Prior Co",
    skills: ["Content Writing", "SEO Writing", "Research", "Copyediting"],
    titles: ["Content Writer", "SEO Specialist"],
    prefLocations: ["Remote"],
    salaryMin: 22000,
    salaryMax: 35000,
    employmentTypes: ["contract", "full-time"],
    seniority: "junior",
  }),
  applicant({
    name: "Grace Lim",
    location: "Manila",
    headline: "E-Commerce Virtual Assistant",
    company: "Prior Co",
    skills: ["Shopify", "Product Listing", "Order Processing", "Customer Support"],
    titles: ["E-Commerce Virtual Assistant", "Product Listing Specialist"],
    prefLocations: ["Remote"],
    salaryMin: 24000,
    salaryMax: 32000,
    employmentTypes: ["full-time"],
    seniority: "junior",
  }),
  applicant({
    name: "Paolo Garcia",
    location: "Pasig",
    headline: "Bookkeeper",
    company: "Prior Co",
    skills: ["QuickBooks", "Bookkeeping", "Excel", "Accounts Payable"],
    titles: ["Bookkeeper", "Accounting Assistant"],
    prefLocations: ["Remote"],
    salaryMin: 30000,
    salaryMax: 42000,
    employmentTypes: ["full-time"],
    seniority: "mid",
  }),
  applicant({
    name: "Diana Reyes",
    location: "Manila",
    headline: "Online English Tutor",
    company: "Prior Co",
    skills: ["ESL Teaching", "Lesson Planning", "Communication", "Zoom"],
    titles: ["Online English Tutor", "ESL Teacher"],
    prefLocations: ["Remote"],
    salaryMin: 20000,
    salaryMax: 32000,
    employmentTypes: ["part-time"],
    seniority: "junior",
  }),
  applicant({
    // Broad admin/entry-level profile — should land partial matches across
    // several VA/data-entry roles rather than a clean top match on any one.
    name: "Liza Fernandez",
    location: "Manila",
    headline: "Administrative Assistant",
    company: "Prior Co",
    skills: ["Data Entry", "Excel", "Email Management", "Customer Support"],
    titles: ["Data Entry Specialist", "Administrative Assistant", "Order Processing Assistant"],
    prefLocations: ["Remote", "Manila"],
    salaryMin: 20000,
    salaryMax: 30000,
    employmentTypes: ["full-time", "part-time"],
    seniority: "intern",
  }),
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedCompanies() {
  const companyIdByKey = {};
  for (const company of COMPANIES) {
    const recruiterUid = await seedAccount(company.recruiterEmail, company.recruiterName, "recruiter");

    const existing = await db
      .collection("companies")
      .where("recruiterUids", "array-contains", recruiterUid)
      .limit(1)
      .get();

    const companyRef = existing.empty ? db.collection("companies").doc() : existing.docs[0].ref;
    await companyRef.set({
      name: company.name,
      logoUrl: null,
      website: company.website,
      industry: company.industry,
      size: company.size,
      recruiterUids: [recruiterUid],
      // Pre-verified: these companies already have seeded jobs posted
      // directly (bypassing createJob's verification gate), so leaving
      // them "unverified" would confusingly block posting a new job
      // through a seeded recruiter account that already looks established.
      verification: {
        status: "verified",
        documentType: "business_permit",
        documentPath: null,
        submittedAt: Date.now(),
        verifiedAt: Date.now(),
      },
    });

    companyIdByKey[company.key] = { companyId: companyRef.id, recruiterUid };
    console.log(`  company: ${company.name} (${companyRef.id})`);
  }
  return companyIdByKey;
}

async function seedJobs(companyIdByKey) {
  let count = 0;
  for (const job of JOBS) {
    const { companyId, recruiterUid } = companyIdByKey[job.companyKey];

    const existing = await db
      .collection("jobs")
      .where("companyId", "==", companyId)
      .where("title", "==", job.title)
      .limit(1)
      .get();

    const jobRef = existing.empty ? db.collection("jobs").doc() : existing.docs[0].ref;
    await jobRef.set({
      companyId,
      title: job.title,
      description: job.description,
      bannerUrl: null,
      skills: job.skills,
      location: job.location,
      remote: job.remote,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      employmentType: job.employmentType,
      seniority: job.seniority,
      status: "open",
      postedAt: Date.now(),
      postedBy: recruiterUid,
    });
    count += 1;
  }
  console.log(`  ${count} jobs seeded`);
}

async function seedApplicants() {
  let count = 0;
  for (const profile of APPLICANTS) {
    const email = `applicant.${profile.basicInfo.name.toLowerCase().replace(/[^a-z]+/g, ".")}@jobhunt.test`;
    const uid = await seedAccount(email, profile.basicInfo.name, "applicant");

    await db
      .collection("applicantProfiles")
      .doc(uid)
      .set({
        basicInfo: profile.basicInfo,
        experience: profile.experience,
        education: profile.education,
        skills: profile.skills,
        preferences: profile.preferences,
        resumeUrl: null,
        onboardingComplete: true,
      });
    count += 1;
  }
  console.log(`  ${count} applicants seeded`);
}

async function main() {
  console.log("Seeding companies + recruiters…");
  const companyIdByKey = await seedCompanies();

  console.log("Seeding jobs…");
  await seedJobs(companyIdByKey);

  console.log("Seeding applicants…");
  await seedApplicants();

  console.log(`\nDone. All seeded accounts share the password: ${SEED_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
