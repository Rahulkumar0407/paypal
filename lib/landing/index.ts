/**
 * lib/landing: the public landing page's story. Server only, no database: the SIMULATED
 * Dunder Mifflin & Co. preview from lib/forecast, judged by the real Guard rules. See story.ts.
 */
export { buildLandingStory } from "./story";
export type { LandingStory, StoryDay, StoryMove } from "./story";
export { judgeYourFix, type YourFixVerdict } from "./yours";
