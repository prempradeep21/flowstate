import { describe, expect, it } from "vitest";
import {
  normalizeChartArtifactData,
  validateChartEmit,
} from "@/lib/chartArtifact";

describe("normalizeChartArtifactData", () => {
  it("normalizes bar chart series", () => {
    const data = normalizeChartArtifactData({
      chartType: "bar",
      categories: ["A", "B"],
      series: [{ name: "X", data: [1, 2] }],
    });
    expect(data.chartType).toBe("bar");
    expect(data.series).toHaveLength(1);
    expect(data.categories).toEqual(["A", "B"]);
  });

  it("normalizes pie slices", () => {
    const data = normalizeChartArtifactData({
      chartType: "pie",
      slices: [
        { name: "Rest", value: 40 },
        { name: "Work", value: 60 },
      ],
    });
    expect(data.slices).toHaveLength(2);
  });

  it("normalizes gauge", () => {
    const data = normalizeChartArtifactData({
      chartType: "gauge",
      gaugeValue: 70,
      gaugeMax: 100,
      gaugeLabel: "Goal",
    });
    expect(data.gaugeValue).toBe(70);
    expect(data.gaugeMax).toBe(100);
  });
});

describe("validateChartEmit", () => {
  it("rejects empty bar chart", () => {
    const data = normalizeChartArtifactData({ chartType: "bar", series: [] });
    expect(validateChartEmit(data)).toMatch(/requires/);
  });

  it("accepts valid gauge", () => {
    const data = normalizeChartArtifactData({
      chartType: "gauge",
      gaugeValue: 4,
      gaugeMax: 10,
    });
    expect(validateChartEmit(data)).toBeNull();
  });
});
