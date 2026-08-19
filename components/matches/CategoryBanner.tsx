import { bannerGradient } from "@/lib/utils/bannerGradient";
import { classifyJobCategory, type JobCategory } from "@/lib/utils/jobCategory";
import {
  BriefcaseIcon,
  ChartIcon,
  CodeIcon,
  CompassIcon,
  DeviceIcon,
  GearIcon,
  HeadsetIcon,
  MegaphoneIcon,
  PaletteIcon,
  ServerIcon,
} from "@/components/ui/icons";

const CATEGORY_ICON: Record<JobCategory, typeof BriefcaseIcon> = {
  frontend: CodeIcon,
  backend: ServerIcon,
  mobile: DeviceIcon,
  data: ChartIcon,
  design: PaletteIcon,
  devops: GearIcon,
  marketing: MegaphoneIcon,
  writing: CompassIcon,
  "sales-support": HeadsetIcon,
  finance: ChartIcon,
  education: CompassIcon,
  general: BriefcaseIcon,
};

// A gradient plus a category watermark, not a stock photo — Picsum's random
// image-per-seed had no notion of job content, so a healthcare iOS listing
// could land on an animal close-up. This always "matches" because the icon
// is chosen from the job's own title/skills, not fetched from anywhere.
export function CategoryBanner({
  jobId,
  title,
  skills,
  className = "",
}: {
  jobId: string;
  title: string;
  skills?: string[];
  className?: string;
}) {
  const category = classifyJobCategory(title, skills);
  const Icon = CATEGORY_ICON[category];

  return (
    <div className={`relative flex items-center justify-end overflow-hidden ${className}`} style={{ backgroundImage: bannerGradient(jobId) }}>
      <Icon className="mr-4 h-16 w-16 shrink-0 text-white/25 sm:h-20 sm:w-20" />
    </div>
  );
}
