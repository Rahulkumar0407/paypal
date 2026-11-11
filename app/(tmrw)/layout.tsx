import { Plus_Jakarta_Sans } from "next/font/google";
import "@/components/tmrw/tmrw.css";

/** The wordmark face: Plus Jakarta Sans ExtraBold Italic (SPEC section 5). */
const wordmark = Plus_Jakarta_Sans({ subsets: ["latin"], weight: "800", style: "italic", variable: "--font-jakarta", display: "swap" });

/** The tmrw laptop flow: one fixed frame, no page scroll. */
export default function TmrwLayout({ children }: { children: React.ReactNode }) {
  return <div className={wordmark.variable}>{children}</div>;
}
