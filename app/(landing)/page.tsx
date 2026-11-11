import { redirect } from "next/navigation";

/**
 * The public landing page is being redesigned for tmrw. Until it lands, "/" shows the cleaner /v2 page.
 */
export default function LandingPage(): never {
  redirect("/v2");
}
