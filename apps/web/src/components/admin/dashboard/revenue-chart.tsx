"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

export interface RevenueByMonth {
  month: string;
  year: number;
  totalPaise: number;
}

interface RevenueChartProps {
  data: RevenueByMonth[];
  loading?: boolean;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function formatCompactInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(paise / 100);
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  const periodTotal = data.reduce((sum, m) => sum + m.totalPaise, 0);
  const hasRevenue = data.some((m) => m.totalPaise > 0);

  const chartData = data.map((entry) => ({
    month: entry.month,
    year: entry.year,
    label: `${entry.month} ${entry.year}`,
    revenue: entry.totalPaise,
  }));

  return (
    <Card className="lg:col-span-4 overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </span>
            Revenue Overview
          </CardTitle>
          <CardDescription>Last 12 months</CardDescription>
        </div>
        {!loading && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Period total</p>
            <p className="font-heading text-lg font-semibold tracking-tight">
              {formatPrice(periodTotal)}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <Skeleton className="h-[280px] w-full rounded-xl" />
        ) : !hasRevenue ? (
          <div className="flex h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
            <TrendingUp className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No revenue yet</p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Confirmed orders will appear here
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => formatCompactInr(value)}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload as
                        | { label?: string }
                        | undefined;
                      return item?.label ?? "";
                    }}
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-8">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium text-foreground tabular-nums">
                          {formatPrice(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="revenue"
                fill="var(--color-revenue)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
