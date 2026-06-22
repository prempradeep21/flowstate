import type { Viewport } from "next";

/**
 * Minimal layout for all /m/ routes (the iOS WKWebView artifact renderer).
 * Overrides the root layout's viewport and injects mobile-specific CSS so
 * artifact components shared with the web canvas behave correctly in WKWebView.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow up to 5× pinch-zoom; the render page sets user-scalable=yes so the
  // zoom level the user picks stays locked until they change it.
  maximumScale: 5,
  userScalable: true,
  // Cover the full screen including the notch / home indicator safe area.
  viewportFit: "cover",
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/*
        Scoped CSS overrides for the WKWebView renderer. These target classes
        shared with the web canvas app and adapt them for a phone viewport.
      */}
      <style>{`
        /* Generic scroll containers: enable momentum scrolling on iOS. */
        [data-canvas-scroll] {
          -webkit-overflow-scrolling: touch;
        }

        /* Tables: make wide tables scroll horizontally instead of squeezing
           every column to fit the screen.

           The web component uses table-fixed + w-full so columns distribute to
           the container width (right for the desktop canvas). On mobile that
           makes columns unreadably narrow and there's nothing to scroll. We
           switch to auto layout at natural width with non-wrapping cells, so
           each column takes a legible width and the table overflows → the user
           can swipe right. min-width:100% keeps narrow tables filling the
           screen. The stylesheet !important overrides the inline <col> widths. */
        [data-canvas-scroll] {
          overflow-x: auto !important;
        }
        [data-canvas-scroll] table {
          table-layout: auto !important;
          width: max-content !important;
          min-width: 100% !important;
        }
        [data-canvas-scroll] col {
          width: auto !important;
        }
        [data-canvas-scroll] th,
        [data-canvas-scroll] td {
          white-space: nowrap;
        }

        /* Remove the canvas-specific rounded corners from the artifact stage
           so content fills edge-to-edge in the mobile viewport. */
        .artifact-content-stage {
          border-radius: 0 !important;
        }
      `}</style>
      {children}
    </>
  );
}
