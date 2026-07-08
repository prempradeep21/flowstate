"use client";

/**
 * The stickman SVG. Pure structure — every limb is a <g> with a fixed joint
 * `transform-origin`, and all motion (run cycle, dance, breathing, rest)
 * comes from CSS keyframes in stickman.css keyed off the `data-pose`
 * attribute set on an ancestor by the engine. React never re-renders this
 * component during motion.
 */
export function StickmanFigure({
  color,
  size,
}: {
  color: string;
  size: number;
}) {
  return (
    <svg
      viewBox="0 0 24 48"
      width={size / 2}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      className="sm-figure"
      aria-hidden
    >
      {/* rest-pose snooze mark */}
      <text
        className="sm-zzz"
        x={17}
        y={4}
        fontSize={7}
        stroke="none"
        fill={color}
      >
        z
      </text>
      <g className="sm-body">
        {/* head */}
        <circle cx={12} cy={6.5} r={4.3} />
        {/* torso */}
        <line x1={12} y1={11} x2={12} y2={28} />
        {/* arms pivot at the shoulder (12, 13.5) */}
        <g className="sm-arm sm-arm-l">
          <line x1={12} y1={13.5} x2={5.5} y2={22} />
        </g>
        <g className="sm-arm sm-arm-r">
          <line x1={12} y1={13.5} x2={18.5} y2={22} />
        </g>
        {/* legs pivot at the hip (12, 28) */}
        <g className="sm-leg sm-leg-l">
          <line x1={12} y1={28} x2={7} y2={44} />
        </g>
        <g className="sm-leg sm-leg-r">
          <line x1={12} y1={28} x2={17} y2={44} />
        </g>
      </g>
    </svg>
  );
}
