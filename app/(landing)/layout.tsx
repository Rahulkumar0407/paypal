import "./landing.css";

/**
 * The public landing page's frame (P1-13): warm paper, ink text, no till and no visitor store. Nothing here touches
 * the database; the owner app lives under /today.
 */
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <div className="landing-page">{children}</div>;
}
