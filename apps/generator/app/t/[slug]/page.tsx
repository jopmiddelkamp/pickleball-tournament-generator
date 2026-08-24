import { redirect } from "next/navigation";

/** The public page moved to /event/<slug>; links shared before the move land here. */
export default async function LegacyPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/event/${slug}`);
}
