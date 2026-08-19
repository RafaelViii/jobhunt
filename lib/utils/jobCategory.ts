export type JobCategory =
  | "frontend"
  | "backend"
  | "mobile"
  | "data"
  | "design"
  | "devops"
  | "marketing"
  | "writing"
  | "sales-support"
  | "finance"
  | "education"
  | "general";

const KEYWORD_RULES: { category: JobCategory; keywords: string[] }[] = [
  { category: "mobile", keywords: ["ios", "android", "mobile", "swift", "kotlin", "react native"] },
  { category: "frontend", keywords: ["frontend", "front-end", "front end", "react", "web developer", "web designer", "wordpress", "shopify"] },
  { category: "backend", keywords: ["backend", "back-end", "back end", "api", "server", "full-stack", "full stack", "software"] },
  { category: "devops", keywords: ["devops", "infrastructure", "sre", "platform engineer", "it support", "automation", "qa tester", "quality assurance"] },
  {
    category: "data",
    keywords: ["data", "analyst", "analytics", "bookkeeping", "excel", "quickbooks", "payroll", "accounting"],
  },
  {
    category: "design",
    keywords: ["design", "ux", "ui/ux", "graphic", "logo", "video editor", "motion graphics", "photo editor", "presentation"],
  },
  {
    category: "marketing",
    keywords: ["marketing", "seo", "social media", "ads specialist", "content marketing", "influencer", "growth"],
  },
  {
    category: "writing",
    keywords: ["writer", "writing", "copywriter", "content", "proofreader", "transcription", "script"],
  },
  {
    category: "sales-support",
    keywords: [
      "sales",
      "support",
      "customer",
      "cold caller",
      "telemarketer",
      "appointment setter",
      "chat support",
      "virtual assistant",
      "administrative",
      "admin ",
      "executive assistant",
      "lead generation",
      "e-commerce",
      "ecommerce",
      "order processing",
      "product listing",
      "amazon",
      "recruitment",
      "hr va",
      "real estate",
      "property management",
      "insurance",
      "medical va",
      "legal va",
      "healthcare",
    ],
  },
  { category: "finance", keywords: ["finance", "financial", "business analyst"] },
  { category: "education", keywords: ["tutor", "teacher", "esl", "academic", "course content"] },
];

export function classifyJobCategory(title: string, skills: string[] = []): JobCategory {
  const haystack = `${title} ${skills.join(" ")}`.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) return rule.category;
  }
  return "general";
}
