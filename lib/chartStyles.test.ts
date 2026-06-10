import { describe, expect, it } from "vitest";
import {
  getDefaultStyleForChartType,
  getStylesForUIChartType,
  isChartTypeCompatible,
} from "@/lib/chartStyles";

describe("chartStyles", () => {
  it("defaults line to visx curve", () => {
    expect(getDefaultStyleForChartType("line")).toBe("visx-line-curve");
  });

  it("defaults area to visx area closed", () => {
    expect(getDefaultStyleForChartType("area")).toBe("visx-area-closed");
  });

  it("offers stream styles", () => {
    const styles = getStylesForUIChartType("stream");
    expect(styles.some((s) => s.id === "visx-stream-silhouette")).toBe(true);
  });

  it("stream needs 2+ series", () => {
    expect(
      isChartTypeCompatible("stream", {
        chartType: "area",
        series: [{ name: "A", data: [1, 2] }],
      }),
    ).toBe(false);
    expect(
      isChartTypeCompatible("stream", {
        chartType: "area",
        series: [
          { name: "A", data: [1, 2] },
          { name: "B", data: [3, 4] },
        ],
      }),
    ).toBe(true);
  });
});
