import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/dal";
import { PUBLIC_ASSETS_BUCKET, supabaseAdmin } from "@/lib/supabase/admin";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

// Shared upload endpoint for profile photos and company logos — both are
// public-read images owned by the uploading user, so one route covers both
// (see CLAUDE.md §8, public-assets bucket).
export async function POST(request: Request) {
  const session = await requireSession();

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const extension = file.type.split("/")[1];
  const path = `${session.uid}/${Date.now()}.${extension}`;

  const { error } = await supabaseAdmin()
    .storage.from(PUBLIC_ASSETS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabaseAdmin().storage.from(PUBLIC_ASSETS_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
