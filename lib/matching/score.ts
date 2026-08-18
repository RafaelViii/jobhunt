import synonymGroups from "@/lib/matching/title-synonyms.json";
import type { ApplicantProfileDoc, EmploymentType, JobDoc, MatchBreakdown, Seniority } from "@/lib/types";

// Pure function, no Firestore calls — CLAUDE.md §5.2. All recompute call
// sites (§7) call this and write the result; scoring never runs at dashboard
// render time (§3).

export type MatchResult = {
  score: number;
  breakdown: MatchBreakdown;
};

const WEIGHTS = {
  title: 0.25,
  skills: 0.3,
  location: 0.15,
  salary: 0.1,
  type: 0.1,
  seniority: 0.1,
} as const;

const SENIORITY_ORDER: Seniority[] = ["intern", "junior", "mid", "senior", "lead"];

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

const titleToGroup = new Map<string, number>();
(synonymGroups as string[][]).forEach((group, index) => {
  for (const title of group) {
    titleToGroup.set(normalize(title), index);
  }
});

function scoreTitle(preferredTitles: string[], jobTitle: string): number {
  const normalizedJobTitle = normalize(jobTitle);
  const normalizedPreferred = preferredTitles.map(normalize);

  if (normalizedPreferred.includes(normalizedJobTitle)) return 1;

  const jobGroup = titleToGroup.get(normalizedJobTitle);
  if (jobGroup !== undefined && normalizedPreferred.some((title) => titleToGroup.get(title) === jobGroup)) {
    return 0.7;
  }

  return 0;
}

function scoreSkills(applicantSkills: string[], jobSkills: string[]): number {
  if (applicantSkills.length === 0 || jobSkills.length === 0) return 0;

  const normalizedApplicant = new Set(applicantSkills.map(normalize));
  const matched = jobSkills.map(normalize).filter((skill) => normalizedApplicant.has(skill)).length;

  return matched / Math.min(applicantSkills.length, jobSkills.length);
}

// "Region" isn't a concept the schema tracks (§4 stores plain city strings,
// no geography hierarchy) — folded into the remote-compatible tier rather
// than inventing a region taxonomy the rest of the app doesn't have.
// Applicant "open to remote" is read from a literal "Remote" entry in their
// preferred locations, matching how the seed data (scripts/seed.mjs) encodes it.
function scoreLocation(preferredLocations: string[], jobLocation: string, jobRemote: boolean): number {
  const normalizedJobLocation = normalize(jobLocation);
  const normalizedPreferred = preferredLocations.map(normalize);

  if (normalizedPreferred.includes(normalizedJobLocation)) return 1;

  const applicantOpenToRemote = normalizedPreferred.includes("remote");
  if (jobRemote || applicantOpenToRemote) return 0.6;

  return 0;
}

// Null on either side means no basis for comparison — scored as no match
// rather than defaulting to a free pass for incomplete data.
function scoreSalary(
  applicantMin: number | null,
  applicantMax: number | null,
  jobMin: number | null,
  jobMax: number | null,
): number {
  if (applicantMin === null || applicantMax === null || jobMin === null || jobMax === null) {
    return 0;
  }

  const overlapStart = Math.max(applicantMin, jobMin);
  const overlapEnd = Math.min(applicantMax, jobMax);
  const smallerSpan = Math.min(applicantMax - applicantMin, jobMax - jobMin);

  // One side is a single point (zero span): the general overlap<=0 check
  // below would always read 0 here (a point-width intersection), so check
  // point-in-range separately — full credit if the point falls inside the
  // other range, since there's no span to compute a ratio against.
  if (smallerSpan === 0) return overlapEnd >= overlapStart ? 1 : 0;

  const overlap = overlapEnd - overlapStart;
  if (overlap <= 0) return 0;

  return Math.min(1, overlap / smallerSpan);
}

function scoreType(preferredTypes: EmploymentType[], jobType: EmploymentType): number {
  return preferredTypes.includes(jobType) ? 1 : 0;
}

function scoreSeniority(preferred: Seniority | null, jobSeniority: Seniority): number {
  if (preferred === null) return 0;

  const diff = Math.abs(SENIORITY_ORDER.indexOf(preferred) - SENIORITY_ORDER.indexOf(jobSeniority));
  if (diff === 0) return 1;
  if (diff === 1) return 0.5;
  return 0;
}

export function computeMatchScore(applicant: ApplicantProfileDoc, job: JobDoc): MatchResult {
  const breakdown: MatchBreakdown = {
    title: scoreTitle(applicant.preferences.titles, job.title),
    skills: scoreSkills(applicant.skills, job.skills),
    location: scoreLocation(applicant.preferences.locations, job.location, job.remote),
    salary: scoreSalary(
      applicant.preferences.salaryMin,
      applicant.preferences.salaryMax,
      job.salaryMin,
      job.salaryMax,
    ),
    type: scoreType(applicant.preferences.employmentTypes, job.employmentType),
    seniority: scoreSeniority(applicant.preferences.seniority, job.seniority),
  };

  const rawScore =
    100 *
    (WEIGHTS.title * breakdown.title +
      WEIGHTS.skills * breakdown.skills +
      WEIGHTS.location * breakdown.location +
      WEIGHTS.salary * breakdown.salary +
      WEIGHTS.type * breakdown.type +
      WEIGHTS.seniority * breakdown.seniority);

  return { score: Math.round(rawScore * 100) / 100, breakdown };
}
