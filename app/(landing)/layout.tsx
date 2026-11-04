import "./landing.css";
import { LandingFelt } from "@/components/landing/Weather";

/**
 * The public landing page's frame (P1-13): the whole page is the green felt counting mat, with no till and no
 * visitor store. Nothing here touches the database; the owner app lives under /today.
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <LandingFelt>{children}</LandingFelt>;
}
