import { describe, expect, it } from "vitest";

import { shouldShowCanvasLanding } from "@/lib/canvasLandingState";

import type { Card } from "@/lib/store";



const emptyRoot: Card = {

  id: "root",

  threadId: "t1",

  question: "",

  answer: "",

  status: "empty",

  position: { x: 0, y: 0 },

  parentCardId: null,

  parentConversationId: null,

};



const base = {

  cards: { root: emptyRoot },

  cardOrder: ["root"],

};



describe("shouldShowCanvasLanding", () => {

  it("shows on a single empty home card with no other canvas content", () => {

    expect(shouldShowCanvasLanding(base)).toBe(true);

  });



  it("hides once the home question has been submitted", () => {

    expect(

      shouldShowCanvasLanding({

        ...base,

        cards: {

          root: { ...emptyRoot, question: "Hi", status: "thinking" },

        },

      }),

    ).toBe(false);

  });



  it("hides when a second question card is placed elsewhere", () => {

    expect(

      shouldShowCanvasLanding({

        cards: {

          root: emptyRoot,

          other: {

            ...emptyRoot,

            id: "other",

            position: { x: 500, y: 200 },

          },

        },

        cardOrder: ["root", "other"],

      }),

    ).toBe(false);

  });



  it("hides when canvas artifacts exist (e.g. paste URL)", () => {

    expect(

      shouldShowCanvasLanding({

        ...base,

        canvasArtifactOrder: ["art-1"],

      }),

    ).toBe(false);

  });



  it("hides when pasted images spawn canvas assets", () => {

    expect(

      shouldShowCanvasLanding({

        ...base,

        canvasAssetOrder: ["asset-1"],

      }),

    ).toBe(false);

  });



  it("hides when a canvas text label is added", () => {

    expect(

      shouldShowCanvasLanding({

        ...base,

        canvasTextLabelOrder: ["label-1"],

      }),

    ).toBe(false);

  });

});


