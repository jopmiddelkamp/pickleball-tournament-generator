import { redirect } from "next/navigation";

/** The public side lives at /event/<slug>; the root is for organisers. */
export default function Home() {
  redirect("/organiser");
}
