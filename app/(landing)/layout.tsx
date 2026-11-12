import { Plus_Jakarta_Sans } from "next/font/google";
import "./landing.css";
import "./home.css";

/** tmrw's wordmark face (design/tmrw-handoff/SPEC.md section 5); the landing page also sets its headings in it. */
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["700", "800"], style: ["normal", "italic"], variable: "--font-jakarta", display: "swap" });

/**
 * The public pages' frame (the landing page and /try). Nothing here touches the database; the app lives at /app.
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className={`landing-page ${jakarta.variable}`}>{children}</div>;
}
