import { describe, expect, it } from "vitest";
import { computeMatchScore } from "@/lib/matching/score";
import type { ApplicantProfileDoc, JobDoc } from "@/lib/types";

function baseApplicant(overrides: Partial<ApplicantProfileDoc> = {}): ApplicantProfileDoc {
  return {
    basicInfo: { name: "Test Applicant", location: "Manila", address: "", phone: "", photoUrl: null, about: "" },
    experience: [],
    education: [],
    skills: [],
    preferences: {
      titles: [],
      locations: [],
      salaryMin: null,
      salaryMax: null,
      employmentTypes: [],
      seniority: null,
    },
    resumeUrl: null,
    onboardingComplete: true,
    ...overrides,
  };
}

function baseJob(overrides: Partial<JobDoc> = {}): JobDoc {
  return {
    companyId: "company-1",
    title: "Backend Engineer",
    description: "",
    bannerUrl: null,
    skills: [],
    location: "Manila",
    remote: false,
    salaryMin: null,
    salaryMax: null,
    employmentType: "full-time",
    seniority: "mid",
    status: "open",
    postedAt: Date.now(),
    postedBy: "recruiter-1",
    ...overrides,
  };
}

describe("computeMatchScore", () => {
  it("scores a perfect match at 100", () => {
    const applicant = baseApplicant({
      skills: ["React", "TypeScript"],
      preferences: {
        titles: ["Frontend Engineer"],
        locations: ["Manila"],
        salaryMin: 50000,
        salaryMax: 70000,
        employmentTypes: ["full-time"],
        seniority: "mid",
      },
    });
    const job = baseJob({
      title: "Frontend Engineer",
      skills: ["React", "TypeScript"],
      location: "Manila",
      salaryMin: 50000,
      salaryMax: 70000,
      employmentType: "full-time",
      seniority: "mid",
    });

    const result = computeMatchScore(applicant, job);
    expect(result.breakdown).toEqual({ title: 1, skills: 1, location: 1, salary: 1, type: 1, seniority: 1 });
    expect(result.score).toBe(100);
  });

  it("scores a mixed partial match at 61.5 (hand-checked)", () => {
    // title: synonym (0.7) · skills: 2/3 matched (0.667) · location: remote-compatible (0.6)
    // · salary: applicant's range fully inside job's range (1) · type: mismatch (0)
    // · seniority: one level off (0.5)
    // 100 * (0.25*0.7 + 0.30*0.667 + 0.15*0.6 + 0.10*1 + 0.10*0 + 0.10*0.5) = 61.5
    const applicant = baseApplicant({
      skills: ["React", "CSS", "Vue"],
      preferences: {
        titles: ["Frontend Developer"],
        locations: ["Remote"],
        salaryMin: 55000,
        salaryMax: 65000,
        employmentTypes: ["contract"],
        seniority: "junior",
      },
    });
    const job = baseJob({
      title: "Frontend Engineer",
      skills: ["React", "TypeScript", "CSS"],
      location: "Manila",
      remote: true,
      salaryMin: 50000,
      salaryMax: 70000,
      employmentType: "full-time",
      seniority: "mid",
    });

    const result = computeMatchScore(applicant, job);
    expect(result.breakdown.title).toBe(0.7);
    expect(result.breakdown.skills).toBeCloseTo(2 / 3, 5);
    expect(result.breakdown.location).toBe(0.6);
    expect(result.breakdown.salary).toBe(1);
    expect(result.breakdown.type).toBe(0);
    expect(result.breakdown.seniority).toBe(0.5);
    expect(result.score).toBe(61.5);
  });

  it("scores a total mismatch at 0", () => {
    const applicant = baseApplicant({
      skills: ["SEO", "Content Writing"],
      preferences: {
        titles: ["Marketing Specialist"],
        locations: ["Iloilo"],
        salaryMin: 20000,
        salaryMax: 30000,
        employmentTypes: ["part-time"],
        seniority: "lead",
      },
    });
    const job = baseJob({
      title: "Backend Engineer",
      skills: ["Node.js", "PostgreSQL"],
      location: "Cebu",
      salaryMin: 80000,
      salaryMax: 100000,
      employmentType: "full-time",
      seniority: "junior",
    });

    const result = computeMatchScore(applicant, job);
    expect(result.breakdown).toEqual({ title: 0, skills: 0, location: 0, salary: 0, type: 0, seniority: 0 });
    expect(result.score).toBe(0);
  });

  it("gives full salary credit when a single-point applicant range falls inside the job's range", () => {
    const applicant = baseApplicant({
      preferences: {
        titles: [],
        locations: [],
        salaryMin: 60000,
        salaryMax: 60000,
        employmentTypes: [],
        seniority: null,
      },
    });
    const job = baseJob({ salaryMin: 50000, salaryMax: 70000 });

    expect(computeMatchScore(applicant, job).breakdown.salary).toBe(1);
  });

  it("scores disjoint salary ranges at 0", () => {
    const applicant = baseApplicant({
      preferences: {
        titles: [],
        locations: [],
        salaryMin: 20000,
        salaryMax: 30000,
        employmentTypes: [],
        seniority: null,
      },
    });
    const job = baseJob({ salaryMin: 80000, salaryMax: 100000 });

    expect(computeMatchScore(applicant, job).breakdown.salary).toBe(0);
  });

  it("treats missing salary data as no match rather than a free pass", () => {
    const applicant = baseApplicant();
    const job = baseJob({ salaryMin: 50000, salaryMax: 70000 });

    expect(computeMatchScore(applicant, job).breakdown.salary).toBe(0);
  });

  it("scores seniority two-or-more levels off at 0", () => {
    const applicant = baseApplicant({
      preferences: {
        titles: [],
        locations: [],
        salaryMin: null,
        salaryMax: null,
        employmentTypes: [],
        seniority: "intern",
      },
    });
    const job = baseJob({ seniority: "senior" });

    expect(computeMatchScore(applicant, job).breakdown.seniority).toBe(0);
  });
});
