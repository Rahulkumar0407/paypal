import { redirect } from "next/navigation";

/** The landing page comes last. Until then "/" opens the app itself (its "Try it now" will link to /app). */
export default function Home(): never {
  redirect("/app");
}
