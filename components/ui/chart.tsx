// (File previously contained a duplicated implementation block that has been removed.)
"use client";
import * as React from "react";
import * as Recharts from "recharts";
import { cn } from "@/lib/utils";

// Supported themes mapping (prefix is used in selector)
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfigEntry = {
  label?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string; // fallback color across themes
  theme?: Partial<Record<keyof typeof THEMES, string>>; // theme specific overrides
};
export type ChartConfig = Record<string, ChartConfigEntry>;

interface ChartContextValue {
  config: ChartConfig;
}
const ChartContext = React.createContext<ChartContextValue | null>(null);

export function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within ChartContainer");
  return ctx;
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  config: ChartConfig;
  children: React.ReactNode;
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, config, className, children, ...rest }, ref) => {
    const uid = React.useId().replace(/:/g, "");
    const chartId = `chart-${id || uid}`;
    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          data-chart={chartId}
          className={cn(
            // Base sizing & layout
            "flex aspect-video justify-center text-xs", 
            // Recharts element theming via attribute selectors
            "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
            "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
            "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
            "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
            "[&_.recharts-layer]:outline-none",
            "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border",
            "[&_.recharts-radial-bar-background-sector]:fill-muted",
            "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted",
            "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border",
            "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
            "[&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
            className
          )}
          {...rest}
        >
          <ChartStyle id={chartId} config={config} />
          <Recharts.ResponsiveContainer>
            {/* Recharts typings expect a single ReactElement; wrap children safely */}
            {children as any}
          </Recharts.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  }
);
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = Recharts.Tooltip;

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  payload?: any[];
  label?: any;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
  formatter?: (value: any, name: any, item: any, index: number) => React.ReactNode;
  labelFormatter?: (label: any, payload?: any[]) => React.ReactNode;
  color?: string;
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      payload = [],
      label,
      className,
      hideLabel,
      hideIndicator,
      indicator = "dot",
      nameKey,
      labelKey,
      formatter,
      labelFormatter,
      color,
      ...rest
    },
    ref
  ) => {
    const { config } = useChart();
    if (!active || !payload.length) return null;
    const first = payload[0];
    const resolvedLabelKey = labelKey || first?.dataKey || first?.name;
    const labelConfig = resolvedLabelKey && config[resolvedLabelKey];
    const finalLabel = hideLabel
      ? null
      : labelFormatter
      ? labelFormatter(label, payload)
      : labelConfig?.label || label;
    const single = payload.length === 1 && indicator !== "dot";
    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
        {...rest}
      >
        {!single && finalLabel ? <div className="font-medium">{finalLabel}</div> : null}
        <div className="grid gap-1.5">
          {payload.map((item, i) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const cfg = config[key];
            const indicatorColor = color || item.payload?.fill || item.color;
            const valueNode = formatter
              ? formatter(item.value, item.name, item, i)
              : item.value?.toLocaleString?.();
            return (
              <div
                key={item.dataKey || i}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2",
                  indicator === "dot" && "items-center"
                )}
              >
                {cfg?.icon ? (
                  <cfg.icon className="h-2.5 w-2.5 text-muted-foreground" />
                ) : !hideIndicator ? (
                  <div
                    className={cn(
                      "shrink-0 rounded-[2px]",
                      indicator === "dot" && "h-2.5 w-2.5",
                      indicator === "line" && "w-1 h-2.5",
                      indicator === "dashed" && "w-0 border-[1.5px] border-dashed"
                    )}
                    style={{ backgroundColor: indicatorColor, borderColor: indicatorColor }}
                  />
                ) : null}
                <div
                  className={cn(
                    "flex flex-1 justify-between leading-none",
                    single && "items-end",
                    !single && "items-center"
                  )}
                >
                  <div className="grid gap-1.5">
                    {single && finalLabel ? <div className="font-medium">{finalLabel}</div> : null}
                    <span className="text-muted-foreground">{cfg?.label || item.name}</span>
                  </div>
                  {item.value != null && (
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {valueNode}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartLegend = Recharts.Legend;
interface ChartLegendContentProps extends React.HTMLAttributes<HTMLDivElement> {
  payload?: any[];
  hideIcon?: boolean;
  nameKey?: string;
  verticalAlign?: "top" | "bottom";
}
const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ payload = [], hideIcon, nameKey, verticalAlign = "bottom", className, ...rest }, ref) => {
    const { config } = useChart();
    if (!payload.length) return null;
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
        {...rest}
      >
        {payload.map((item, i) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const cfg = config[key];
          return (
            <div key={item.value || i} className="flex items-center gap-1.5">
              {cfg?.icon && !hideIcon ? (
                <cfg.icon className="h-3 w-3 text-muted-foreground" />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span>{cfg?.label || item.value || item.dataKey}</span>
            </div>
          );
        })}
      </div>
    );
  }
);
ChartLegendContent.displayName = "ChartLegendContent";

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorEntries = Object.entries(config).filter(([, v]) => v.color || v.theme);
  if (!colorEntries.length) return null;
  const css = Object.entries(THEMES)
    .map(([theme, prefix]) => {
      const lines = colorEntries
        .map(([key, entry]) => {
          const color = entry.theme?.[theme as keyof typeof entry.theme] || entry.color;
          return color ? `  --color-${key}: ${color};` : null;
        })
        .filter(Boolean)
        .join("\n");
      if (!lines) return null;
      return `${prefix} [data-chart='${id}'] {\n${lines}\n}`;
    })
    .filter(Boolean)
    .join("\n");
  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};