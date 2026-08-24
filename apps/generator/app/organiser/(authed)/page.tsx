import { redirect } from "next/navigation";

/** The organiser's home is the event list. */
export default function OrganiserHome() {
  redirect("/organiser/event");
}
