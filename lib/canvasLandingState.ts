import type { Card } from "@/lib/store";



/** Landing overlay width — keep in sync with CanvasLanding layout. */

export const LANDING_STACK_WIDTH = 680;



/** Approximate landing stack height (title, pills, composer, tips) for viewport centering. */

export const LANDING_STACK_HEIGHT = 520;



export interface CanvasLandingInput {

  cards: Record<string, Card>;

  cardOrder: string[] | undefined;

  canvasArtifactOrder?: string[];

  canvasAssetOrder?: string[];

  canvasGifOrder?: string[];

  canvasSkillOrder?: string[];

  canvasTextLabelOrder?: string[];

}



/** Empty home card to attach the landing composer (first empty root, else first empty). */

export function getLandingCardId(

  cards: Record<string, Card>,

  cardOrder: string[] | undefined,

): string | null {

  const order = cardOrder ?? [];

  const emptyIds = order.filter((id) => cards[id]?.status === "empty");

  if (emptyIds.length === 0) return null;



  const emptyRoot = emptyIds.find((id) => cards[id]?.parentCardId === null);

  if (emptyRoot) return emptyRoot;



  if (emptyIds.length === 1) return emptyIds[0] ?? null;



  return null;

}



function hasCanvasContentBeyondHomeCard(input: CanvasLandingInput): boolean {

  if ((input.canvasArtifactOrder?.length ?? 0) > 0) return true;

  if ((input.canvasAssetOrder?.length ?? 0) > 0) return true;

  if ((input.canvasGifOrder?.length ?? 0) > 0) return true;

  if ((input.canvasSkillOrder?.length ?? 0) > 0) return true;

  if ((input.canvasTextLabelOrder?.length ?? 0) > 0) return true;

  return false;

}



/**

 * True while the canvas is still at the pre-conversation home state: one empty

 * home card and no other canvas content. Dismisses when the user starts a

 * question, places another card, or adds any artifact/asset/text/etc.

 */

export function shouldShowCanvasLanding(input: CanvasLandingInput): boolean {

  const order = input.cardOrder ?? [];

  if (order.length === 0) return true;

  if (hasCanvasContentBeyondHomeCard(input)) return false;

  if (order.length > 1) return false;

  return order.every((id) => input.cards[id]?.status === "empty");

}



export function pickCanvasLandingInput(

  state: CanvasLandingInput,

): CanvasLandingInput {

  return {

    cards: state.cards,

    cardOrder: state.cardOrder,

    canvasArtifactOrder: state.canvasArtifactOrder,

    canvasAssetOrder: state.canvasAssetOrder,

    canvasGifOrder: state.canvasGifOrder,

    canvasSkillOrder: state.canvasSkillOrder,

    canvasTextLabelOrder: state.canvasTextLabelOrder,

  };

}


