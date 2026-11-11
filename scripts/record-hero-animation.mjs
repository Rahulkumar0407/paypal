import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/home/rahul/.gemini/antigravity/brain/222af5b9-0e6c-41ef-92d9-c3849439dfb2";
const VIDEO_DIR = path.join(ARTIFACT_DIR, "hero_animation_videos");

if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

async function run() {
  console.log("Launching browser for Hero Animation recording...");
  const browser = await chromium.launch({
    headless: true,
  });

  // 1. DESKTOP RECORDING (1280x800)
  console.log("Recording desktop hero animation...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 800 },
    },
  });

  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto("http://localhost:3000/v2", { waitUntil: "networkidle" });

  // Capture timeline screenshots
  const heroElement = await desktopPage.locator(".hero-cinematic-stage");
  await heroElement.waitFor({ state: "visible" });

  // t = 0.5s: Initial scene
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, "hero_anim_t0_establish.png"),
    clip: await heroElement.boundingBox(),
  });

  // Wait until t = 1.65s (blink moment)
  await desktopPage.waitForTimeout(1150);
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, "hero_anim_t1_blink.png"),
    clip: await heroElement.boundingBox(),
  });

  // Wait until t = 2.6s (calendar marker reveal moment)
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, "hero_anim_t2_calendar_reveal.png"),
    clip: await heroElement.boundingBox(),
  });

  // Wait until t = 4.0s (resting settled state)
  await desktopPage.waitForTimeout(1400);
  await desktopPage.screenshot({
    path: path.join(ARTIFACT_DIR, "hero_anim_t3_settled.png"),
    clip: await heroElement.boundingBox(),
  });

  // Wait 1.5s more to capture smooth idle
  await desktopPage.waitForTimeout(1500);

  await desktopContext.close();
  const desktopVideoFile = fs.readdirSync(VIDEO_DIR).find(f => f.endsWith(".webm"));
  if (desktopVideoFile) {
    const src = path.join(VIDEO_DIR, desktopVideoFile);
    const dest = path.join(ARTIFACT_DIR, "hero_animation_desktop.webm");
    fs.copyFileSync(src, dest);
    console.log("Saved desktop video:", dest);
    fs.unlinkSync(src);
  }

  // 2. MOBILE RECORDING (390x844)
  console.log("Recording mobile hero animation...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
    isMobile: true,
    hasTouch: true,
    recordVideo: {
      dir: VIDEO_DIR,
      size: { width: 390, height: 844 },
    },
  });

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000/v2", { waitUntil: "networkidle" });
  const mobileHero = await mobilePage.locator(".hero-cinematic-stage");
  await mobileHero.waitFor({ state: "visible" });

  await mobilePage.waitForTimeout(4200);

  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, "hero_mobile_settled.png"),
    clip: await mobileHero.boundingBox(),
  });

  await mobileContext.close();
  const mobileVideoFile = fs.readdirSync(VIDEO_DIR).find(f => f.endsWith(".webm"));
  if (mobileVideoFile) {
    const src = path.join(VIDEO_DIR, mobileVideoFile);
    const dest = path.join(ARTIFACT_DIR, "hero_animation_mobile.webm");
    fs.copyFileSync(src, dest);
    console.log("Saved mobile video:", dest);
    fs.unlinkSync(src);
  }

  // 3. REDUCED MOTION DEMONSTRATION
  console.log("Recording reduced motion verification...");
  const reducedContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto("http://localhost:3000/v2", { waitUntil: "networkidle" });
  const reducedHero = await reducedPage.locator(".hero-cinematic-stage");
  await reducedHero.waitFor({ state: "visible" });

  await reducedPage.screenshot({
    path: path.join(ARTIFACT_DIR, "hero_reduced_motion_settled.png"),
    clip: await reducedHero.boundingBox(),
  });
  await reducedContext.close();

  await browser.close();
  console.log("All recordings and verification screenshots captured successfully.");
}

run().catch(console.error);

