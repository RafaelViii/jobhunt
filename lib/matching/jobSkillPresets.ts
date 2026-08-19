import { EXPERIENCE_TITLE_CATEGORIES } from "@/lib/matching/experienceTitles";

// Keys must match EXPERIENCE_TITLE_CATEGORIES exactly — used together to
// auto-fill "Required skills" when a recruiter picks a predefined title.
const CATEGORY_SKILL_PRESETS: Record<string, string[]> = {
  "Administrative & Virtual Assistant": ["Calendar Management", "Email Management", "Data Entry", "Google Workspace", "Communication"],
  "Data Entry & Data Management": ["Data Entry", "Excel", "Attention to Detail", "Data Validation"],
  "Customer Service": ["Customer Service", "Zendesk", "Communication", "Conflict Resolution"],
  "Sales & Business Development": ["Sales", "Lead Generation", "CRM", "Cold Calling", "Negotiation"],
  "Graphic Design": ["Adobe Photoshop", "Adobe Illustrator", "Branding", "Layout Design"],
  "Video & Multimedia": ["Adobe Premiere Pro", "After Effects", "Video Editing", "Color Grading"],
  "Web Development": ["HTML", "CSS", "JavaScript", "WordPress", "Responsive Design"],
  "Software & Application Development": ["JavaScript", "Python", "Java", "Git", "REST APIs"],
  "QA & Software Testing": ["Manual Testing", "Test Cases", "Bug Tracking", "Regression Testing"],
  "IT & Technical Support": ["Troubleshooting", "Technical Support", "Ticketing Systems", "Networking Basics"],
  "AI & Automation": ["Prompt Engineering", "AI Tools", "Workflow Automation", "Data Labeling"],
  "Social Media": ["Social Media Strategy", "Content Calendar", "Community Management", "Analytics"],
  "Digital Marketing": ["SEO", "Google Ads", "Meta Ads", "Email Marketing", "Analytics"],
  "Writing & Content": ["Content Writing", "SEO Writing", "Editing", "Research"],
  "E-Commerce": ["Shopify", "Product Listing", "Order Processing", "Customer Support"],
  "Finance & Accounting": ["QuickBooks", "Bookkeeping", "Excel", "Accounts Payable"],
  "Business & Data Analysis": ["Excel", "SQL", "Data Visualization", "Reporting"],
  "Healthcare & Medical": ["Medical Terminology", "HIPAA", "Patient Scheduling", "Medical Billing"],
  "Real Estate": ["MLS", "Property Listings", "Lead Generation", "CRM"],
  "Legal & Professional Services": ["Legal Research", "Document Review", "Contract Administration", "Compliance"],
  "HR & Recruitment": ["Recruiting", "Applicant Tracking Systems", "Onboarding", "Interview Scheduling"],
  "Education & Tutoring": ["Lesson Planning", "Communication", "Zoom", "Curriculum Development"],
  "Operations & Management": ["Project Management", "Process Improvement", "Team Coordination", "Workflow Management"],
  "Logistics & Supply Chain": ["Inventory Management", "Shipping Coordination", "Vendor Management", "Excel"],
  "Hospitality & Travel": ["Reservation Systems", "Guest Relations", "Travel Booking", "Customer Service"],
  "Retail & Store": ["POS Systems", "Inventory Management", "Customer Service", "Merchandising"],
  "BPO & Call Center": ["Customer Service", "Call Handling", "CRM", "Quality Assurance"],
  "Content Creation": ["Content Creation", "Video Editing", "Social Media", "Canva"],
  "Freelance & Remote Work": ["Time Management", "Self-Direction", "Client Communication", "Remote Collaboration Tools"],
  "Technical & Engineering": ["CAD", "Technical Drawing", "Prototyping", "Documentation"],
  "CRM & Customer Management": ["CRM Software", "Data Entry", "Customer Relations", "Follow-Up"],
  "Research": ["Online Research", "Data Collection", "Fact-Checking", "Report Writing"],
  "Quality Control & Compliance": ["Quality Assurance", "Auditing", "Documentation", "Process Compliance"],
  "Product & Marketplace": ["Product Listing", "Marketplace Management", "SEO Titles", "Data Entry"],
  "Specialized Online Support": ["Remote Support", "Virtual Assistance", "Communication", "Time Management"],
};

const titleToCategory = new Map<string, string>();
for (const [category, titles] of Object.entries(EXPERIENCE_TITLE_CATEGORIES)) {
  for (const title of titles) {
    // First category wins on cross-listed titles — stable since object key
    // order in experience-titles.json is fixed.
    if (!titleToCategory.has(title.toLowerCase())) {
      titleToCategory.set(title.toLowerCase(), category);
    }
  }
}

// Only fires for an exact predefined-title match, not free text — a
// mistyped or custom title shouldn't silently apply an unrelated preset.
export function suggestedSkillsForTitle(title: string): string[] {
  const category = titleToCategory.get(title.trim().toLowerCase());
  if (!category) return [];
  return CATEGORY_SKILL_PRESETS[category] ?? [];
}
