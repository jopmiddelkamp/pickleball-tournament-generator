import { redirect } from "next/navigation";

/** The public side lives at /t/<slug> (slice 2); the root is for organisers. */
export default function Home() {
  redirect("/organiser");
}
