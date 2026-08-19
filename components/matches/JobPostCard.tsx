"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/nav/Avatar";
import { ScoreRing } from "@/components/matches/ScoreRing";
import { Chip } from "@/components/ui/Chip";
import { ApplyButton } from "@/components/applications/ApplyButton";
import { Card } from "@/components/ui/Card";
import { CategoryBanner } from "@/components/matches/CategoryBanner";
import { VerifiedBadgeIcon } from "@/components/ui/icons";

export function JobPostCard({
  jobId,
  title,
  companyName,
  companyLogoUrl,
  companyVerified,
  bannerUrl,
  location,
  remote,
  score,
  skills,
  description,
  alreadyApplied,
}: {
  jobId: string;
  title: string;
  companyName: string;
  companyLogoUrl?: string | null;
  companyVerified?: boolean;
  bannerUrl?: string | null;
  location: string;
  remote: boolean;
  score: number;
  skills: string[];
  description: string;
  alreadyApplied: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  // Preview the intro paragraph only, not an arbitrary character cutoff —
  // slicing raw characters can land mid-bullet or mid-sentence once the
  // description has real structure (paragraphs + a bullet list).
  const paragraphs = description.split(/\n{2,}/);
  const hasMore = paragraphs.length > 1;
  const shownText = expanded || !hasMore ? description : paragraphs[0];

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar name={companyName} photoUrl={companyLogoUrl} size={44} />
          <div>
            <Link href={`/applicant/jobs/${jobId}`} className="font-semibold text-ink hover:underline">
              {title}
            </Link>
            <p className="flex items-center gap-1 text-xs text-muted">
              {companyName}
              {companyVerified && (
                <span title="Verified business">
                  <VerifiedBadgeIcon className="h-3.5 w-3.5 shrink-0 text-brand" />
                </span>
              )}
              {" · "}
              {location}
              {remote ? " · Remote-friendly" : ""}
            </p>
          </div>
        </div>
        <ScoreRing score={score} size={48} />
      </div>

      <div className="whitespace-pre-wrap px-4 pb-3 text-sm leading-relaxed text-ink">
        {shownText}
        {hasMore && (
          <>
            {" "}
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="font-medium text-brand hover:underline"
            >
              {expanded ? "See less" : "See more"}
            </button>
          </>
        )}
      </div>

      <CategoryBanner jobId={jobId} title={title} skills={skills} bannerUrl={bannerUrl} className="h-44 w-full" />

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {skills.slice(0, 6).map((skill) => (
            <Chip key={skill} tone="brand">{skill}</Chip>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line p-4">
        <Link href={`/applicant/jobs/${jobId}`} className="text-sm font-medium text-brand hover:underline">
          View match breakdown
        </Link>
        {alreadyApplied ? (
          <span className="text-sm font-medium text-muted">Applied</span>
        ) : (
          <ApplyButton jobId={jobId} />
        )}
      </div>
    </Card>
  );
}
