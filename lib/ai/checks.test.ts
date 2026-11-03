import { describe, expect, it } from "vitest";
import { allowedFrom, problemWith } from "./checks";

describe("checking AI text", () => {
  const allowed = allowedFrom([{ day: "Thu 12 Nov", shortBy: "$90", balance: "$1,410" }], [80_793]);
  it("accepts numbers that were given, in any of the usual ways of writing them", () => {
    expect(problemWith("On Thu 12 Nov you're $90 short, with $1,410 above the minimum.", allowed)).toBeNull();
    expect(problemWith("Monday ends at $808, exactly $807.93.", allowed)).toBeNull();
    expect(problemWith("That's $1410.", allowed)).toBeNull();
  });
  it("rejects new numbers, exclamation marks, emoji and banned words", () => {
    expect(problemWith("You'll have $950.", allowed)).toContain("$950");
    expect(problemWith("Thu 12 Nov is $90 short!", allowed)).toBe("exclamation mark");
    expect(problemWith("All good on Thu 12 Nov 🎉", allowed)).toBe("emoji");
    expect(problemWith("Unlock your cash on Thu 12 Nov.", allowed)).toContain("unlock");
    expect(problemWith("  ", allowed)).toBe("empty");
  });
});
