import { describe, expect, it } from "vitest";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import {
  buildPlugConnectorPath,
  connectorMarkerSizes,
  connectorPlugCirclePath,
  offsetPlugAnchorOutward,
  plugAnchorAt,
  resolveConnectionAnchors,
} from "@/lib/plugConnector";

describe("connector markers", () => {
  it("builds a closed circle path for the source plug", () => {
    const d = connectorPlugCirclePath(100, 200, 5);
    expect(d).toContain("M 95 200");
    expect(d).toContain("a 5 5");
  });

  it("matches the DOM plug: 10px ring, 2px border, a fixed world size at every zoom", () => {
    const atRest = {
      plugRadius: 4,
      plugRingWidth: 2,
      plugOuterRadius: 5,
    };
    expect(connectorMarkerSizes(1)).toEqual(atRest);
    // Zoomed out it shrinks with the cards instead of ballooning over them.
    expect(connectorMarkerSizes(0.2)).toEqual(atRest);
    expect(connectorMarkerSizes(2)).toEqual(atRest);
  });
});

describe("offsetPlugAnchorOutward", () => {
  it("moves each side's anchor out of the card", () => {
    const top = plugAnchorAt(0, 100, 420, 200, "top");
    expect(offsetPlugAnchorOutward(top, "top", 10).py).toBe(90);
    const right = plugAnchorAt(0, 100, 420, 200, "right");
    expect(offsetPlugAnchorOutward(right, "right", 10).px).toBe(430);
  });

  it("starts and ends the stroke at the outside of both plug rings", () => {
    const from = { px: 0, py: 0, tx: 1, ty: 0 };
    const to = { px: 500, py: 0, tx: -1, ty: 0 };
    const { d } = buildPlugConnectorPath(from, to, "right", "left", "straight", {
      startInset: 5,
      endInset: 5,
    });
    expect(d).toBe("M 5 0 L 495 0");
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

  it("uses full card vertical centre for conversation branch targets", () => {
    const tuning = RESOLVED_CANVAS_TUNING;

    const from = {
      id: "parent",
      position: { x: 0, y: 0 },
      size: { w: 420, h: 200 },
      status: "done",
    };
    const to = {
      id: "branch",
      position: { x: 840, y: 0 },
      size: { w: 420, h: 400 },
      status: "done",
      cardKind: "conversation" as const,
    };

    const { toAnchor } = resolveConnectionAnchors(
      { fromSide: "right", toSide: "left" },
      from,
      to,
      tuning,
    );

    expect(toAnchor.py).toBe(200);
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

describe("straight routing", () => {
  it("draws a single segment with no curves", () => {
    const from = plugAnchorAt(100, 50, 420, 300, "right");
    const to = plugAnchorAt(940, 400, 420, 300, "left");
    const { d } = buildPlugConnectorPath(from, to, "right", "left", "straight");
    expect(d).toMatch(/^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/);
    expect(d).not.toContain("C");
    expect(d).not.toContain("Q");
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

describe("curvy routing", () => {
  it("leaves both plugs flat with handles at half the horizontal span", () => {
    const from = { px: 0, py: 0, tx: 1, ty: 0 };
    const to = { px: 540, py: 444, tx: -1, ty: 0 };
    const { d, midX, midY } = buildPlugConnectorPath(
      from,
      to,
      "right",
      "left",
      "curvy",
    );
    expect(d).toBe("M 0 0 C 270 0, 270 444, 540 444");
    expect(midX).toBe(270);
    expect(midY).toBe(222);
  });

  it("loops out instead of cutting back when the target sits behind", () => {
    const from = { px: 400, py: 0, tx: 1, ty: 0 };
    const to = { px: 0, py: 300, tx: -1, ty: 0 };
    const { d } = buildPlugConnectorPath(from, to, "right", "left", "curvy");
    expect(d).toBe("M 400 0 C 525 0, -125 300, 0 300");
  });

  it("aims a drag-preview end into the opposite side, not back on itself", () => {
    const from = { px: 0, py: 0, tx: 1, ty: 0 };
    const cursor = { px: 300, py: 100, tx: 1, ty: 0 };
    const { d } = buildPlugConnectorPath(from, cursor, "right", "left", "curvy");
    expect(d).toBe("M 0 0 C 150 0, 150 100, 300 100");
  });
});
