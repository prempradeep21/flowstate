import { describe, expect, it } from "vitest";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import {
  buildPlugConnectorPath,
  connectorArrowPath,
  connectorPlugCirclePath,
  plugAnchorAt,
  resolveConnectionAnchors,
  trimPlugAnchorForArrow,
} from "@/lib/plugConnector";

describe("connector markers", () => {
  it("builds a closed circle path for the source plug", () => {
    const d = connectorPlugCirclePath(100, 200, 5);
    expect(d).toContain("M 95 200");
    expect(d).toContain("a 5 5");
  });

  it("builds arrow paths for each card side", () => {
    expect(connectorArrowPath(0, 0, "top", 5)).toContain("Z");
    expect(connectorArrowPath(0, 0, "bottom", 5)).toContain("Z");
    expect(connectorArrowPath(0, 0, "left", 5)).toContain("Z");
    expect(connectorArrowPath(0, 0, "right", 5)).toContain("Z");
  });
});

describe("trimPlugAnchorForArrow", () => {
  it("moves top anchor downward by inset", () => {
    const a = plugAnchorAt(0, 100, 420, 200, "top");
    const trimmed = trimPlugAnchorForArrow(a, "top", 10);
    expect(trimmed.py).toBe(110);
  });
});

describe("resolveConnectionAnchors", () => {
  it("uses question-band center for lateral branch target plugs", () => {
    const tuning = RESOLVED_CANVAS_TUNING;

    const from = {
      id: "parent",
      position: { x: 0, y: 0 },
      size: { w: 420, h: 400 },
      status: "done",
    };
    const to = {
      id: "branch",
      position: { x: 840, y: 0 },
      size: { w: 420, h: 600 },
      status: "done",
    };

    const { fromAnchor, toAnchor } = resolveConnectionAnchors(
      { fromSide: "right", toSide: "left" },
      from,
      to,
      tuning,
    );

    expect(fromAnchor.py).toBe(200);
    expect(toAnchor.py).toBe(60);
    expect(toAnchor.py).not.toBe(300);
  });

  it("leaves vertical follow-up target at card top", () => {
    const tuning = RESOLVED_CANVAS_TUNING;

    const from = {
      id: "parent",
      position: { x: 0, y: 0 },
      size: { w: 420, h: 400 },
      status: "done",
    };
    const to = {
      id: "child",
      position: { x: 0, y: 440 },
      size: { w: 420, h: 200 },
      status: "done",
    };

    const { toAnchor } = resolveConnectionAnchors(
      { fromSide: "bottom", toSide: "top" },
      from,
      to,
      tuning,
    );

    expect(toAnchor.py).toBe(440);
  });
});

describe("plugAnchorAt pyOverride", () => {
  it("honours pyOverride on lateral sides", () => {
    const left = plugAnchorAt(0, 0, 420, 600, "left", { pyOverride: 88 });
    const right = plugAnchorAt(0, 0, 420, 600, "right", { pyOverride: 88 });
    expect(left.py).toBe(88);
    expect(right.py).toBe(88);
  });
});

describe("orthogonal routing", () => {
  it("uses a straight segment for aligned vertical follow-ups", () => {
    const from = plugAnchorAt(100, 50, 420, 300, "bottom");
    const to = plugAnchorAt(100, 390, 420, 180, "top");
    const { d } = buildPlugConnectorPath(
      from,
      to,
      "bottom",
      "top",
      "orthogonal",
    );
    expect(d).toMatch(/^M 310 350 L 310 390/);
  });

  it("uses a straight segment for aligned horizontal branches", () => {
    const from = plugAnchorAt(100, 200, 420, 300, "right");
    const to = plugAnchorAt(940, 200, 420, 300, "left");
    const { d } = buildPlugConnectorPath(
      from,
      to,
      "right",
      "left",
      "orthogonal",
    );
    expect(d).toMatch(/^M 520 350 L 940 350/);
  });
});
