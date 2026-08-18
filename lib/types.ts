// Shared types mirroring the Firestore schema in CLAUDE.md §4.

export type Role = "applicant" | "recruiter";

export type EmploymentType = "full-time" | "part-time" | "contract" | "internship";

export type Seniority = "intern" | "junior" | "mid" | "senior" | "lead";

export type UserDoc = {
  role: Role;
  email: string;
  displayName: string;
  createdAt: number;
};

export type ExperienceEntry = {
  title: string;
  company: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
};

export type EducationEntry = {
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string | null;
};

export type ApplicantPreferences = {
  titles: string[];
  locations: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  employmentTypes: EmploymentType[];
  seniority: Seniority | null;
};

export type ApplicantBasicInfo = {
  name: string;
  location: string;
  phone: string;
  photoUrl: string | null;
};

export type ApplicantProfileDoc = {
  basicInfo: ApplicantBasicInfo;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  preferences: ApplicantPreferences;
  resumeUrl: string | null;
  onboardingComplete: boolean;
};

export type CompanyDoc = {
  name: string;
  logoUrl: string | null;
  website: string;
  industry: string;
  size: string;
  recruiterUids: string[];
};

export type JobStatus = "open" | "closed";

export type ApplicationStatus = "submitted" | "shortlisted" | "interview" | "offer" | "rejected";

export type ApplicationStatusEvent = {
  status: ApplicationStatus;
  changedAt: number;
};

export type ApplicationDoc = {
  jobId: string;
  applicantUid: string;
  companyId: string;
  resumeUrl: string | null;
  status: ApplicationStatus;
  appliedAt: number;
  statusHistory: ApplicationStatusEvent[];
};

export type MatchBreakdown = {
  title: number;
  skills: number;
  location: number;
  salary: number;
  type: number;
  seniority: number;
};

export type MatchDoc = {
  applicantUid: string;
  jobId: string;
  companyId: string;
  score: number;
  breakdown: MatchBreakdown;
  computedAt: number;
};

export type JobDoc = {
  companyId: string;
  title: string;
  description: string;
  skills: string[];
  location: string;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  employmentType: EmploymentType;
  seniority: Seniority;
  status: JobStatus;
  postedAt: number;
  postedBy: string;
};
