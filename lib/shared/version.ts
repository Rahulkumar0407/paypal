/**
 * Reliable build and deployment version resolution.
 * Detects running Git commit SHA from Render, CI/CD, or local Git.
 */
export function getBuildCommitSha(): string {
  if (process.env.RENDER_GIT_COMMIT) {
    return process.env.RENDER_GIT_COMMIT.slice(0, 7);
  }
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  if (process.env.NEXT_PUBLIC_GIT_COMMIT_SHA) {
    return process.env.NEXT_PUBLIC_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require("child_process");
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "local";
  }
}
