import { describe, expect, it } from "vitest";
import { buildHeadline } from "./headline";
import { forecastFrom, inputFromRows } from "./engine";
import { demoScenarioRows, type DemoScenario } from "./load";

const TODAY = "2026-11-05";
const forecast = (scenario: DemoScenario = {}) => forecastFrom(inputFromRows(demoScenarioRows("st_h", TODAY, scenario), "st_h", TODAY));

describe("buildHeadline", () => {
  it("reads the story's opening sentence word for word", () => {
    expect(buildHeadline(forecast())).toEqual({
      text: "Clear until Wednesday. On Thu 12 Nov you'll be $120 short: the bean order and rent land the same day.",
      tone: "short",
    });
  });

  it("says clear once Ivory & Vow pays, and names the big day", () => {
    const h = buildHeadline(forecast({ recovered: true }));
    expect(h.tone).toBe("covered");
    expect(h.text).toBe("Clear for the next 30 days. Thu 12 Nov is covered too, when rent and the bean order go out.");
  });

  it("speaks about today when today is the short day", () => {
    expect(buildHeadline({ ...forecast(), asOf: "2026-11-12" }).text).toBe("Today you're $120 short: the bean order and rent land the same day.");
  });
});
