"use client";

import { CodeCardBody } from "@/components/cards/CodeCardBody";
import { CustomCardBody } from "@/components/cards/CustomCardBody";
import { ImageCardBody } from "@/components/cards/ImageCardBody";
import { TableCardBody } from "@/components/cards/TableCardBody";
import { TextCardBody } from "@/components/cards/TextCardBody";
import { ThreeDCardBody } from "@/components/cards/ThreeDCardBody";
import { VideoCardBody } from "@/components/cards/VideoCardBody";
import type { Card } from "@/lib/store";

interface CardAnswerBodyProps {
  card: Card;
  isStreaming?: boolean;
  clampStyle?: React.CSSProperties;
  plainClamp?: boolean;
  hideImages?: boolean;
}

export function CardAnswerBody({
  card,
  isStreaming,
  clampStyle,
  plainClamp,
  hideImages,
}: CardAnswerBodyProps) {
  const type = card.responseType ?? "text";

  switch (type) {
    case "image":
      return (
        <ImageCardBody
          card={card}
          isStreaming={isStreaming}
          hideImages={hideImages}
        />
      );
    case "table":
      return <TableCardBody card={card} isStreaming={isStreaming} />;
    case "video":
      return <VideoCardBody card={card} isStreaming={isStreaming} />;
    case "code":
      return <CodeCardBody card={card} isStreaming={isStreaming} />;
    case "custom":
      return <CustomCardBody card={card} isStreaming={isStreaming} />;
    case "3d":
      return <ThreeDCardBody card={card} isStreaming={isStreaming} />;
    default:
      return (
        <TextCardBody
          card={card}
          isStreaming={isStreaming}
          clampStyle={clampStyle}
          plainClamp={plainClamp}
        />
      );
  }
}
