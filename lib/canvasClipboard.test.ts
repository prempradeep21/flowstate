import { describe, expect, it } from "vitest";
import {
  buildCanvasClipboardPayload,
  canCopyCanvasSelection,
  cloneSessionArtifactDeep,
  computePastePosition,
  getCopyableSelectionItems,
  parseCanvasClipboardPayload,
} from "@/lib/canvasClipboard";
import type { CanvasNodesState } from "@/lib/canvasSelection";
import {
  appendArtifactVersion,
  createSessionArtifactFromPayload,
} from "@/lib/sessionArtifacts";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import type {
  CanvasArtifactNode,
  CanvasSkill,
  CanvasSkillNode,
} from "@/lib/store";

function baseCanvasState(
  patch: Partial<
    CanvasNodesState & {
      canvasSelection: {
        kind: "artifact" | "skill" | "asset" | "gif" | "label";
        id: string;
      }[];
      selectedFamilyRootIds: string[];
      selectedCanvasArtifactId?: string | null;
      selectedCanvasSkillId?: string | null;
    }
  > = {},
) {
  return {
    cards: {},
    cardOrder: [],
    connections: [],
    threads: {},
    threadOrder: [],
    canvasArtifactNodes: {},
    canvasArtifactOrder: [],
    sessionArtifacts: {},
    canvasAssets: {},
    canvasAssetNodes: {},
    canvasAssetOrder: [],
    canvasGifNodes: {},
    canvasGifOrder: [],
    canvasSkills: {},
    canvasSkillNodes: {},
    canvasSkillOrder: [],
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
    canvasSelection: [],
    selectedFamilyRootIds: [],
    ...patch,
  };
}

describe("cloneSessionArtifactDeep", () => {
  it("remaps all version ids and preserves version count", () => {
    let artifact = createSessionArtifactFromPayload(
      {
        type: "table",
        title: "Sales",
        data: { columns: [{ key: "a", label: "A" }], rows: [] },
      },
      "card_1",
    );
    const appended = appendArtifactVersion(
      artifact,
      {
        type: "table",
        title: "Sales v2",
        data: { columns: [{ key: "a", label: "A" }], rows: [{ a: "1" }] },
      },
      "card_2",
    );
    artifact = appended.artifact;

    const originalVersionIds = artifact.versions.map((v) => v.id);
    const { artifact: cloned, versionIdMap } = cloneSessionArtifactDeep(artifact);

    expect(cloned.id).not.toBe(artifact.id);
    expect(cloned.versions).toHaveLength(2);
    expect(cloned.versions.map((v) => v.id)).not.toEqual(originalVersionIds);
    expect(versionIdMap.get(originalVersionIds[0]!)).toBe(cloned.versions[0]!.id);
    expect(versionIdMap.get(originalVersionIds[1]!)).toBe(cloned.versions[1]!.id);
    expect(cloned.latestVersionId).toBe(cloned.versions[1]!.id);
  });
});

describe("getCopyableSelectionItems", () => {
  it("keeps artifacts and skills only", () => {
    const items = getCopyableSelectionItems(
      baseCanvasState({
        canvasSelection: [
          { kind: "artifact", id: "a1" },
          { kind: "skill", id: "s1" },
          { kind: "asset", id: "as1" },
          { kind: "label", id: "l1" },
        ],
      }),
    );
    expect(items).toEqual([
      { kind: "artifact", id: "a1" },
      { kind: "skill", id: "s1" },
    ]);
  });

  it("reports canCopy false when only cards are selected", () => {
    expect(
      canCopyCanvasSelection(
        baseCanvasState({
          selectedFamilyRootIds: ["thread_root"],
          canvasSelection: [],
        }),
      ),
    ).toBe(false);
  });

  it("falls back to legacy selectedCanvasArtifactId", () => {
    expect(
      getCopyableSelectionItems(
        baseCanvasState({
          canvasSelection: [],
          selectedCanvasArtifactId: "node_1",
        }),
      ),
    ).toEqual([{ kind: "artifact", id: "node_1" }]);
    expect(
      canCopyCanvasSelection(
        baseCanvasState({
          canvasSelection: [],
          selectedCanvasArtifactId: "node_1",
        }),
      ),
    ).toBe(true);
  });
});

describe("buildCanvasClipboardPayload", () => {
  it("includes permission-preview-only artifact nodes", () => {
    const node: CanvasArtifactNode = {
      id: "node_preview",
      artifactId: "",
      versionId: "",
      sourceCardId: "card_1",
      position: { x: 100, y: 200 },
      permissionPreview: {
        payload: {
          type: "repo",
          title: "Repo preview",
          data: {
            repoUrl: "https://github.com/acme/app",
            owner: "acme",
            repo: "app",
            displayTitle: "acme/app",
            explorer: {
              repoUrl: "https://github.com/acme/app",
              owner: "acme",
              name: "app",
              enrichmentStatus: "pending",
              overview: { status: "loading" },
              fileStructure: { status: "loading" },
              media: { status: "loading" },
              preview: { status: "loading" },
              techDetails: { status: "loading" },
              builtBy: { status: "loading" },
              fetchedAt: "2026-01-01T00:00:00.000Z",
            },
          },
        } satisfies ArtifactPayload,
        copy: "Connect repo?",
        status: "pending",
        kind: "repo",
        title: "Repo preview",
      },
    };

    const payload = buildCanvasClipboardPayload(
      baseCanvasState({
        canvasArtifactNodes: { [node.id]: node },
        canvasSelection: [{ kind: "artifact", id: node.id }],
      }),
      [{ kind: "artifact", id: node.id }],
    );

    expect(payload).not.toBeNull();
    expect(payload!.items).toHaveLength(1);
    const item = payload!.items[0];
    expect(item.kind).toBe("artifact");
    if (item.kind === "artifact") {
      expect(item.sessionArtifact.versions).toHaveLength(1);
      expect(item.container.permissionPreview?.title).toBe("Repo preview");
      expect(item.container.position).toEqual({ x: 100, y: 200 });
    }
  });

  it("preserves relative positions using anchor", () => {
    const art1 = createSessionArtifactFromPayload(
      { type: "todo", title: "List A", data: { items: [] } },
      "__manual__",
    );
    const art2 = createSessionArtifactFromPayload(
      { type: "todo", title: "List B", data: { items: [] } },
      "__manual__",
    );
    const node1: CanvasArtifactNode = {
      id: "n1",
      artifactId: art1.id,
      versionId: art1.latestVersionId,
      sourceCardId: "__manual__",
      position: { x: 10, y: 20 },
    };
    const node2: CanvasArtifactNode = {
      id: "n2",
      artifactId: art2.id,
      versionId: art2.latestVersionId,
      sourceCardId: "__manual__",
      position: { x: 110, y: 120 },
    };

    const payload = buildCanvasClipboardPayload(
      baseCanvasState({
        sessionArtifacts: { [art1.id]: art1, [art2.id]: art2 },
        canvasArtifactNodes: { [node1.id]: node1, [node2.id]: node2 },
        canvasSelection: [
          { kind: "artifact", id: node1.id },
          { kind: "artifact", id: node2.id },
        ],
      }),
    );

    expect(payload?.anchor).toEqual({ x: 10, y: 20 });
    const pasteWorld = { x: 300, y: 400 };
    const pos2 = computePastePosition(
      payload!.anchor,
      { x: 110, y: 120 },
      pasteWorld,
      1,
    );
    expect(pos2).toEqual({ x: 424, y: 524 });
  });

  it("includes skills with container bounds", () => {
    const skill: CanvasSkill = {
      id: "skill_1",
      canvasId: "canvas_a",
      ownerId: "user_1",
      title: "Reviewer",
      fileName: "reviewer.md",
      mimeType: "text/markdown",
      sizeBytes: 120,
      storagePath: "skills/reviewer.md",
      publicUrl: "https://example.com/reviewer.md",
      createdAt: 1,
    };
    const node: CanvasSkillNode = {
      id: "skillnode_1",
      skillId: skill.id,
      position: { x: 50, y: 60 },
    };

    const payload = buildCanvasClipboardPayload(
      baseCanvasState({
        canvasSkills: { [skill.id]: skill },
        canvasSkillNodes: { [node.id]: node },
        canvasSelection: [{ kind: "skill", id: node.id }],
      }),
    );

    expect(payload?.items[0]?.kind).toBe("skill");
  });
});

describe("parseCanvasClipboardPayload", () => {
  it("rejects invalid payloads", () => {
    expect(parseCanvasClipboardPayload("")).toBeNull();
    expect(parseCanvasClipboardPayload("{}")).toBeNull();
    expect(parseCanvasClipboardPayload('{"version":2,"items":[]}')).toBeNull();
  });
});
