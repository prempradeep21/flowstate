"use client";

import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleBand, scaleLinear, scaleOrdinal } from "@visx/scale";
import {
  AreaClosed,
  Bar,
  LinePath,
  Pie,
  Stack,
} from "@visx/shape";
import { useMemo } from "react";
import type { ChartArtifactData } from "@/lib/chartTypes";
import type { ChartStyleOption } from "@/lib/chartTypes";
import { getChartPalette, withAlpha } from "@/lib/echartsTheme";
import {
  buildStreamRows,
  getMaxY,
  getSeriesKeys,
  getStreamOffset,
  getVisxCurve,
} from "@/lib/visxChartProps";
import { useCanvasStore } from "@/lib/store";

const MARGIN = { top: 20, right: 20, bottom: 44, left: 48 };

function VisxChartInner({
  data,
  style,
  width,
  height,
}: {
  data: ChartArtifactData;
  style: ChartStyleOption;
  width: number;
  height: number;
}) {
  const canvasTheme = useCanvasStore((s) => s.canvasTheme);
  const palette = getChartPalette(canvasTheme === "dark");

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

  const categories = data.categories ?? [];
  const series = data.series ?? [];
  const firstSeries = series[0];

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: categories,
        range: [0, innerWidth],
        padding: 0.25,
      }),
    [categories, innerWidth],
  );

  const xLinear = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, Math.max(categories.length - 1, 1)],
        range: [0, innerWidth],
      }),
    [categories.length, innerWidth],
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, getMaxY(data)],
        range: [innerHeight, 0],
        nice: true,
      }),
    [data, innerHeight],
  );

  const getX = (_: unknown, i: number) =>
    style.chartType === "bar"
      ? (xScale(categories[i]) ?? 0) + xScale.bandwidth() / 2
      : xLinear(i) ?? 0;

  const getY = (v: number) => yScale(v) ?? 0;

  if (style.chartType === "pie") {
    return (
      <PieChart
        data={data}
        palette={palette}
        width={width}
        height={height}
      />
    );
  }

  if (style.chartType === "stream") {
    return (
      <StreamChart
        data={data}
        style={style}
        palette={palette}
        width={width}
        height={height}
        innerWidth={innerWidth}
        innerHeight={innerHeight}
      />
    );
  }

  return (
    <svg width={width} height={height} style={{ background: "transparent" }}>
      <Group left={MARGIN.left} top={MARGIN.top}>
        <GridRows
          scale={yScale}
          width={innerWidth}
          stroke={withAlpha(palette.muted, 0.2)}
          strokeDasharray="2,4"
        />
        {style.chartType === "bar" &&
          series.map((s, si) =>
            s.data.map((v, i) => {
              const barW = xScale.bandwidth() / series.length;
              const x = (xScale(categories[i]) ?? 0) + si * barW;
              const barH = innerHeight - (yScale(v) ?? innerHeight);
              return (
                <Bar
                  key={`${s.name}-${i}`}
                  x={x}
                  y={yScale(v) ?? innerHeight}
                  width={barW - 2}
                  height={barH}
                  fill={palette.series[si % palette.series.length]}
                  rx={4}
                />
              );
            }),
          )}
        {style.chartType === "line" &&
          series.map((s, si) => (
            <LinePath
              key={s.name}
              data={s.data}
              curve={getVisxCurve(style)}
              x={(_, i) => getX(_, i)}
              y={(v) => getY(v)}
              stroke={palette.series[si % palette.series.length]}
              strokeWidth={2}
              strokeOpacity={1}
            />
          ))}
        {style.chartType === "area" &&
          firstSeries &&
          series.slice(0, 1).map((s) => (
            <AreaClosed
              key={s.name}
              data={s.data}
              curve={getVisxCurve(style)}
              x={(_, i) => getX(_, i)}
              y={(v) => getY(v)}
              yScale={yScale}
              fill={withAlpha(palette.accent, 0.16)}
              stroke={palette.accent}
              strokeWidth={2}
            />
          ))}
        <AxisLeft
          scale={yScale}
          stroke={palette.muted}
          tickStroke={palette.muted}
          tickLabelProps={() => ({
            fill: palette.muted,
            fontSize: 10,
            textAnchor: "end",
            dy: "0.33em",
          })}
        />
        <AxisBottom
          top={innerHeight}
          scale={xScale}
          stroke={palette.muted}
          tickStroke={palette.muted}
          tickLabelProps={() => ({
            fill: palette.muted,
            fontSize: 10,
            textAnchor: "middle",
          })}
        />
      </Group>
    </svg>
  );
}

function StreamChart({
  data,
  style,
  palette,
  width,
  height,
  innerWidth,
  innerHeight,
}: {
  data: ChartArtifactData;
  style: ChartStyleOption;
  palette: ReturnType<typeof getChartPalette>;
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
}) {
  const rows = buildStreamRows(data);
  const keys = getSeriesKeys(data);

  const xScale = scaleLinear<number>({
    domain: [0, Math.max(rows.length - 1, 1)],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear<number>({
    domain: [-getMaxY(data) * 0.6, getMaxY(data) * 0.6],
    range: [innerHeight, 0],
  });

  const colorScale = scaleOrdinal<string, string>({
    domain: keys,
    range: palette.series,
  });

  const xBand = scaleBand<string>({
    domain: data.categories ?? [],
    range: [0, innerWidth],
    padding: 0.1,
  });

  return (
    <svg width={width} height={height} style={{ background: "transparent" }}>
      <Group left={MARGIN.left} top={MARGIN.top}>
        <Stack
          data={rows}
          keys={keys}
          value={(d, k) => Number(d[k] ?? 0)}
          offset={getStreamOffset(style)}
          curve={getVisxCurve(style)}
          x={(_, i) => xScale(i) ?? 0}
          y0={(d) => yScale(d[0]) ?? 0}
          y1={(d) => yScale(d[1]) ?? 0}
        >
          {({ stacks, path }) =>
            stacks.map((stack) => (
              <path
                key={stack.key}
                d={path(stack) ?? ""}
                fill={colorScale(stack.key)}
                fillOpacity={0.72}
                stroke={colorScale(stack.key)}
                strokeWidth={0.5}
              />
            ))
          }
        </Stack>
        <AxisBottom
          top={innerHeight}
          scale={xBand}
          stroke={palette.muted}
          tickStroke={palette.muted}
          tickLabelProps={() => ({
            fill: palette.muted,
            fontSize: 10,
            textAnchor: "middle",
          })}
        />
      </Group>
    </svg>
  );
}

function PieChart({
  data,
  palette,
  width,
  height,
}: {
  data: ChartArtifactData;
  palette: ReturnType<typeof getChartPalette>;
  width: number;
  height: number;
}) {
  const slices = data.slices ?? [];
  const radius = Math.min(width, height) / 2 - 24;
  const centerX = width / 2;
  const centerY = height / 2 - 8;

  const colorScale = scaleOrdinal<string, string>({
    domain: slices.map((s) => s.name),
    range: palette.series,
  });

  return (
    <svg width={width} height={height} style={{ background: "transparent" }}>
      <Group top={centerY} left={centerX}>
        <Pie
          data={slices}
          pieValue={(d) => d.value}
          outerRadius={radius}
          padAngle={0.02}
        >
          {(pie) =>
            pie.arcs.map((arc) => (
              <g key={`arc-${arc.data.name}`}>
                <path
                  d={pie.path(arc) ?? ""}
                  fill={colorScale(arc.data.name)}
                  stroke={palette.border}
                  strokeWidth={1}
                />
              </g>
            ))
          }
        </Pie>
      </Group>
    </svg>
  );
}

export function VisxRenderer({
  data,
  style,
  height,
}: {
  data: ChartArtifactData;
  style: ChartStyleOption;
  height: number;
}) {
  return (
    <div style={{ height, width: "100%", background: "transparent" }}>
      <ParentSize>
        {({ width }) =>
          width > 0 ? (
            <VisxChartInner
              data={data}
              style={style}
              width={width}
              height={height}
            />
          ) : null
        }
      </ParentSize>
    </div>
  );
}
