"use client";

import { ReactNode, useCallback, useRef, useState } from "react";
import {
  ConnectorStyle,
  useCanvasStore,
} from "@/lib/store";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { ConnectorPathGroup } from "@/components/ConnectorPathGroup";
import {
  buildPlugConnectorPath,
  connectorMarkerSizes,
  resolveConnectionAnchors,
} from "@/lib/plugConnector";
import { compensatedStrokeWidth } from "@/lib/zoomDisplay";


const STROKE_FALLBACK = "#B8B5AE";

const BASE_STROKE_SCREEN = 1.75;

const HIT_STROKE_SCREEN = 14;



function CurvyIcon() {

  return (

    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none">

      <path

        d="M2.5 11.5C2.5 6.5 5 3.5 8 3.5s5.5 3 5.5 8"

        stroke="currentColor"

        strokeWidth="1.25"

        strokeLinecap="round"

      />

    </svg>

  );

}



function PipelineIcon() {

  return (

    <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none">

      <path

        d="M3 4.5h4.5V8H12.5V11.5"

        stroke="currentColor"

        strokeWidth="1.25"

        strokeLinecap="round"

        strokeLinejoin="round"

      />

    </svg>

  );

}



function ConnectorStylePicker({

  x,

  y,

  scale,

  activeStyle,

  onSelect,

  onHoverChange,

}: {

  x: number;

  y: number;

  scale: number;

  activeStyle: ConnectorStyle;

  onSelect: (style: ConnectorStyle) => void;

  onHoverChange: (hovered: boolean) => void;

}) {

  const options: { style: ConnectorStyle; label: string; icon: ReactNode }[] =

    [

      { style: "curvy", label: "Curved connectors", icon: <CurvyIcon /> },

      {

        style: "orthogonal",

        label: "Pipeline connectors",

        icon: <PipelineIcon />,

      },

    ];



  return (

    <div

      role="toolbar"

      aria-label="Connector style"

      className="pointer-events-auto absolute z-20 flex items-center gap-0.5 rounded-lg border border-canvas-border bg-canvas-card p-0.5 shadow-card"

      style={{

        left: x,

        top: y,

        transform: `translate(-50%, calc(-100% - 10px)) scale(${1 / scale})`,

        transformOrigin: "bottom center",

      }}

      onPointerEnter={() => onHoverChange(true)}

      onPointerLeave={() => onHoverChange(false)}

    >

      {options.map(({ style, label, icon }) => {

        const active = activeStyle === style;

        return (

          <button

            key={style}

            type="button"

            aria-label={label}

            aria-pressed={active}

            title={label}

            onClick={() => onSelect(style)}

            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${

              active

                ? "bg-canvas-ink/10 text-canvas-ink"

                : "text-canvas-muted hover:bg-canvas-ink/5 hover:text-canvas-ink"

            }`}

          >

            {icon}

          </button>

        );

      })}

    </div>

  );

}



interface HoverState {

  connId: string;

  midX: number;

  midY: number;

}



export function Connections() {

  const cards = useCanvasStore((s) => s.cards);

  const connections = useCanvasStore((s) => s.connections);

  const threads = useCanvasStore((s) => s.threads);

  const viewportSettledScale = useCanvasStore((s) => s.viewportSettledScale);

  const connectorStyle = useCanvasStore((s) => s.connectorStyle);

  const setConnectorStyle = useCanvasStore((s) => s.setConnectorStyle);

  const tuning = RESOLVED_CANVAS_TUNING;



  const [hover, setHover] = useState<HoverState | null>(null);

  const pickerHoveredRef = useRef(false);

  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  const clearHideTimer = useCallback(() => {

    if (hideTimerRef.current !== null) {

      clearTimeout(hideTimerRef.current);

      hideTimerRef.current = null;

    }

  }, []);



  const scheduleHide = useCallback(() => {

    clearHideTimer();

    hideTimerRef.current = setTimeout(() => {

      if (!pickerHoveredRef.current) setHover(null);

    }, 120);

  }, [clearHideTimer]);



  const showPicker = useCallback(

    (connId: string, midX: number, midY: number) => {

      clearHideTimer();

      setHover({ connId, midX, midY });

    },

    [clearHideTimer],

  );



  const strokeWidth = compensatedStrokeWidth(

    BASE_STROKE_SCREEN,

    viewportSettledScale,

    BASE_STROKE_SCREEN,

  );

  const hitWidth = compensatedStrokeWidth(

    HIT_STROKE_SCREEN,

    viewportSettledScale,

    HIT_STROKE_SCREEN,

  );



  return (

    <>

      <svg

        className="absolute left-0 top-0"

        style={{ overflow: "visible" }}

        width={1}

        height={1}

      >

        {connections.map((conn) => {

          const from = cards[conn.from];

          const to = cards[conn.to];

          if (!from || !to) return null;



          const {
            fromAnchor: a,
            toAnchor: b,
            fromSide,
            toSide,
          } = resolveConnectionAnchors(conn, from, to, tuning);

          const { arrowSize } = connectorMarkerSizes(viewportSettledScale);
          const { d, midX, midY } = buildPlugConnectorPath(
            a,
            b,
            fromSide,
            toSide,
            connectorStyle,
            { trimTargetArrowInset: arrowSize * 1.35 },
          );



          const stroke =

            threads[from.threadId]?.accentColour ?? STROKE_FALLBACK;

          const isHovered = hover?.connId === conn.id;

          const midPointX = midX ?? (a.px + b.px) / 2;

          const midPointY = midY ?? (a.py + b.py) / 2;



          return (
            <g key={conn.id}>
              <ConnectorPathGroup
                d={d}
                stroke={stroke}
                strokeWidth={strokeWidth}
                fromAnchor={a}
                toAnchor={b}
                toSide={toSide}
                viewportScale={viewportSettledScale}
                opacity={isHovered ? 0.95 : 0.85}
                hitWidth={hitWidth}
                onPointerEnter={() =>
                  showPicker(conn.id, midPointX, midPointY)
                }
                onPointerLeave={scheduleHide}
              />
            </g>
          );

        })}

      </svg>



      {hover && (

        <ConnectorStylePicker

          x={hover.midX}

          y={hover.midY}

          scale={viewportSettledScale}

          activeStyle={connectorStyle}

          onSelect={setConnectorStyle}

          onHoverChange={(hovered) => {

            pickerHoveredRef.current = hovered;

            if (hovered) clearHideTimer();

            else scheduleHide();

          }}

        />

      )}

    </>

  );

}

