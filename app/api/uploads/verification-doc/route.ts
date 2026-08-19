import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/dal";
import { VERIFICATION_DOCS_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// Business permits/IDs, unlike photos and logos, go to a private bucket —
// this route returns a storage path, never a public URL. Recruiter-only:
// only recruiters have a verification requirement to satisfy.
export async function POST(request: Request) {
  const session = await requireSession("recruiter");

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type — use PNG, JPG, WEBP, or PDF" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const extension = EXTENSION_BY_TYPE[file.type];
  const path = `${session.uid}/${Date.now()}.${extension}`;

  const { error } = await supabaseAdmin()
    .storage.from(VERIFICATION_DOCS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path });
}
