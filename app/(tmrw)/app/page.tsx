import type { Metadata } from "next";
import { Stage } from "@/components/tmrw/Stage";

export const metadata: Metadata = {
  title: { absolute: "tmrw" },
  description: "Know tomorrow before it arrives. Your shop's month, on one page, inside PayPal.",
};

export default function TmrwPage() {
  return <Stage />;
}
