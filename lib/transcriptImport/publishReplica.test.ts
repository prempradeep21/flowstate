import { describe, expect, it } from "vitest";
import {
  CANVAS_SNAPSHOT_VERSION,
  normalizeCanvasSnapshot,
} from "@/lib/canvasSnapshot";
import { TRANSCRIPT_IMPORT_CANVASES } from "@/lib/buildTranscriptImportPlaygroundSnapshot";

/**
 * The "publish to canvas" CTA hands buildSnapshot()'s output straight to
 * createCanvasFromSnapshot, which stores it as JSON in canvases.state and reads
 * it back through normalizeCanvasSnapshot. Anything that does not survive that
 * trip is silently missing from the published copy — and a chapter heading or a
 * cardKind going missing looks like a layout bug, not a persistence bug.
 */
describe("transcript canvases survive the publish round-trip", () => {
  for (const def of TRANSCRIPT_IMPORT_CANVASES) {
    describe(def.id, () => {
      const built = def.buildSnapshot();
      const round = normalizeCanvasSnapshot(
        JSON.parse(JSON.stringify(built)) as unknown,
      );

      it("is a current-version snapshot with content", () => {
        expect(built.version).toBe(CANVAS_SNAPSHOT_VERSION);
        expect(built.cardOrder.length).toBeGreaterThan(0);
        expect(Object.keys(built.groups).length).toBeGreaterThan(0);
      });

      it("keeps every card, including its conversation kind", () => {
        expect(Object.keys(round.cards).sort()).toEqual(
          Object.keys(built.cards).sort(),
        );
        expect(round.cardOrder).toEqual(built.cardOrder);
        for (const [id, card] of Object.entries(built.cards)) {
          expect(round.cards[id]!.cardKind).toBe(card.cardKind);
          expect(round.cards[id]!.question).toBe(card.question);
          expect(round.cards[id]!.answer).toBe(card.answer);
          expect(round.cards[id]!.parentConversationId).toBe(
            card.parentConversationId,
          );
        }
      });

      it("keeps the chapter groups with their headings and dividers", () => {
        expect(Object.keys(round.groups).sort()).toEqual(
          Object.keys(built.groups).sort(),
        );
        for (const [id, group] of Object.entries(built.groups)) {
          expect(round.groups[id]!.headingText).toBe(group.headingText);
          expect(round.groups[id]!.dividerY).toBe(group.dividerY);
          expect(round.groups[id]!.cardIds).toEqual(group.cardIds);
        }
      });

      it("keeps every artifact and its placement", () => {
        expect(Object.keys(round.sessionArtifacts).sort()).toEqual(
          Object.keys(built.sessionArtifacts).sort(),
        );
        expect(round.canvasArtifactOrder).toEqual(built.canvasArtifactOrder);
        for (const [id, node] of Object.entries(
          built.canvasArtifactNodes ?? {},
        )) {
          expect(round.canvasArtifactNodes![id]!.position).toEqual(
            node.position,
          );
          expect(round.canvasArtifactNodes![id]!.size).toEqual(node.size);
        }
      });

      it("carries canvas memory for every thread", () => {
        // Gists are only ever written by a real exchange, so if an imported
        // canvas ships without them nothing will ever backfill it.
        const threadsWithCards = new Set(
          Object.values(built.cards).map((card) => card.threadId),
        );
        for (const threadId of built.threadOrder) {
          // A thread carrying no cards contributes nothing to canvas memory and
          // has no title to show, so it is not required to have a gist.
          if (!threadsWithCards.has(threadId)) continue;
          const gist = round.threadGists?.[threadId];
          expect(gist, `missing gist for ${threadId}`).toBeDefined();
          expect(gist!.gist.trim().length).toBeGreaterThan(0);
          // MAX_GIST_CHARS in lib/memory/canvasMemory.ts truncates past this.
          expect(gist!.gist.length).toBeLessThanOrEqual(400);
        }
      });

      it("has no dangling artifact node", () => {
        // A node pointing at an artifact or version that is not in the snapshot
        // renders as an empty tile on the published canvas — the failure mode
        // that looks like a layout bug and is actually a missing payload.
        for (const [id, node] of Object.entries(
          built.canvasArtifactNodes ?? {},
        )) {
          const artifact = built.sessionArtifacts[node.artifactId];
          expect(artifact, `node ${id} has no artifact`).toBeDefined();
          expect(
            artifact!.versions.some((v) => v.id === node.versionId),
            `node ${id} points at a version that is not there`,
          ).toBe(true);
        }
      });

      it("has no card or group pointing at something missing", () => {
        for (const group of Object.values(built.groups)) {
          for (const cardId of group.cardIds ?? []) {
            expect(built.cards[cardId], `group card ${cardId}`).toBeDefined();
          }
        }
        for (const card of Object.values(built.cards)) {
          expect(built.threads[card.threadId]).toBeDefined();
        }
      });
    });
  }
});
