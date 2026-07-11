"use client";

import { ContextMenuItem } from "@/components/MenuIcons";
import { useArtifactExport } from "@/components/artifacts/ArtifactExportContext";
import {
  copyCodeMenuIcon,
  copyVariantMenuIcon,
} from "@/components/artifacts/artifactHeaderMenuIcons";
import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import { showAppErrorToast, showAppToast } from "@/lib/appToastStore";
import { copyTextToClipboard } from "@/lib/artifactExport/clipboard";
import {
  generateCodeVariant,
  getCodeVariants,
} from "@/lib/artifactExport/codeGenerators";
import type { CodeVariant } from "@/lib/artifactExport/types";

export function ArtifactCopyCodeMenuItems({
  kind,
  payload,
  title,
  artifactId,
  onClose,
}: {
  kind: ArtifactKind;
  payload: ArtifactPayload;
  title: string;
  artifactId?: string;
  onClose?: () => void;
}) {
  const { buildExportContext } = useArtifactExport();
  const variants = getCodeVariants(kind, payload);

  const copyVariant = async (variant: CodeVariant) => {
    const ctx = buildExportContext(kind, payload, title, artifactId);
    const text = generateCodeVariant(ctx, variant.id);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      showAppToast(`Copied ${variant.label}`);
    } else {
      showAppErrorToast("Copy failed");
    }
    onClose?.();
  };

  if (variants.length === 0) return null;

  return (
    <>
      {variants.map((variant) => (
        <ContextMenuItem
          key={variant.id}
          icon={copyVariantMenuIcon()}
          label={variant.label}
          onClick={() => copyVariant(variant)}
        />
      ))}
    </>
  );
}

export function ArtifactCodeCopyMenuItem({ onClose }: { onClose?: () => void }) {
  const exportCtx = useArtifactExport();

  const handleCopy = async () => {
    const content = exportCtx.buildExportContext(
      "code",
      { type: "code", title: "", data: { files: [] } },
      "",
    ).codeActiveContent;
    if (!content) {
      showAppErrorToast("No code to copy");
      return;
    }
    const ok = await copyTextToClipboard(content);
    if (ok) {
      showAppToast("Copied code");
    } else {
      showAppErrorToast("Copy failed");
    }
    onClose?.();
  };

  return (
    <ContextMenuItem
      icon={copyCodeMenuIcon()}
      label="Copy code"
      onClick={handleCopy}
    />
  );
}
