/**
 * lib/landing: the public landing page's story. Server only, no database: the SIMULATED Dunder Mifflin & Co. preview
 * from lib/forecast, judged by the real Guard rules. See story.ts.
 */
export { buildLandingStory, DAYS_SHOWN } from "./story";
export type { FoundPayment, LandingFix, LandingStory, StoryClash, StoryDay, StoryMove, StoryReceipt, StoryRecovery } from "./story";
export { judgeYourFix, type YourFixVerdict } from "./yours";
