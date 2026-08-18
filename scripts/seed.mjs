// Standalone seed script — Firebase Admin SDK only, never bundled client-side.
// Run with:  node --env-file=.env.local scripts/seed.mjs
//
// Idempotent: re-running reuses existing Auth users/companies by email/name
// instead of erroring, so you can re-seed after tweaking data without first
// wiping the project by hand.
//
// Seeds 5 companies (1 recruiter each), 13 jobs, and 18 applicants, per
// CLAUDE.md §4. The applicant/job pairings are deliberately uneven — some
// near-perfect matches, some partial (one axis off: title synonym, skill
// overlap, location, salary, or seniority), some poor — so Phase 2 scoring
// produces a visible spread instead of clustering at 0% or 100% (§10 Phase 1.5).

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
];

// ---------------------------------------------------------------------------
// Jobs (companyKey references COMPANIES[].key)
// ---------------------------------------------------------------------------

const JOBS = [
  {
    companyKey: "acme",
    title: "Frontend Engineer",
    description: "Build and ship UI for our core product using React and TypeScript.",
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
    description: "Own our REST API and data layer.",
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
    description: "Lead feature work end-to-end across our React/Node stack.",
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
    description: "Turn raw data into dashboards and recommendations for stakeholders.",
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
    description: "Build predictive models on top of our customer data.",
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
    description: "Build and maintain our ELT pipelines.",
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
    description: "Own CI/CD and cloud infrastructure for a fleet of microservices.",
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
    description: "Keep our platform fast and available at scale.",
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
    description: "First line of support for customers running on our cloud platform.",
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
    description: "Design end-to-end product experiences alongside a small, fast team.",
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
    description: "Run studies that shape our product roadmap.",
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
    description: "Build our patient-facing iOS app.",
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
    description: "Own manual and automated testing across our web and mobile apps.",
    skills: ["Manual Testing", "Selenium", "JIRA", "Automation"],
    location: "Manila",
    remote: false,
    salaryMin: 35000,
    salaryMax: 50000,
    employmentType: "full-time",
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
    basicInfo: { name, location, phone: "+63 900 000 0000", photoUrl: null },
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
