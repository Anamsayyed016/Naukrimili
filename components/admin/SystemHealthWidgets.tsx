"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

type MetricKey = "cpu" | "memory" | "disk" | "responseTime";
interface MetricThreshold { warning: number; critical: number; unit: string; description: string }
type SystemThresholds = Record<MetricKey, MetricThreshold>;
interface ServiceStatus { name: string; status: "up" | "down" | "degraded"; uptime: number; lastIncident?: string }
interface PerformanceSample { timestamp: string; responseTime: number; errorRate: number; requestCount: number }
interface SystemHealth {
  status: "healthy" | "warning" | "critical";
  metrics: { cpuUsage: number; memoryUsage: number; diskSpace: number; responseTime: number };
  services: ServiceStatus[];
  performanceHistory: PerformanceSample[];
}
const THRESHOLDS: SystemThresholds = {
  cpu: { warning: 75, critical: 85, unit: "%", description: "CPU utilization" },
  memory: { warning: 85, critical: 92, unit: "%", description: "Memory usage" },
  disk: { warning: 80, critical: 90, unit: "%", description: "Disk space used" },
  responseTime: { warning: 500, critical: 1000, unit: "ms", description: "Avg API response" },
};
function metricStatus(v: number, k: MetricKey) { const t = THRESHOLDS[k]; return v >= t.critical ? "critical" : v >= t.warning ? "warning" : "healthy"; }
function statusColor(s: string) { switch (s) { case "healthy": case "up": return "bg-green-100 text-green-700 border-green-300"; case "warning": case "degraded": return "bg-amber-100 text-amber-800 border-amber-300"; case "critical": case "down": return "bg-red-100 text-red-700 border-red-300"; default: return "bg-gray-100 text-gray-700 border-gray-300"; } }
function statusIcon(s: string) { switch (s) { case "healthy": case "up": return <CheckCircle2 className="h-4 w-4 text-green-600" />; case "warning": case "degraded": return <AlertTriangle className="h-4 w-4 text-amber-600" />; case "critical": case "down": return <AlertCircle className="h-4 w-4 text-red-600" />; default: return null; } }
export default function SystemHealthWidgets() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/system/health", { cache: "no-store" });
      if (!r.ok) throw new Error(`Request failed (${r.status})`);
      const d: SystemHealth = await r.json();
      setHealth(d);
      setError(null);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to load system health");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);
  if (loading) return (<div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => (<Card key={i} className="p-4"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-20" /></Card>))}</div><Card className="p-4"><Skeleton className="h-[300px]" /></Card></div>);
  if (error) return (<Alert className="border border-red-300 bg-red-50 text-red-700 flex gap-2 p-3"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-sm">{error}</AlertDescription></Alert>);
  if (!health) return null;
  return (<div className="space-y-6">
    <div>
      <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-semibold">System Health</h2><div className="text-sm text-muted-foreground">Last updated: {lastUpdated?.toLocaleTimeString()}</div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="CPU Usage" value={health.metrics.cpuUsage} unit={THRESHOLDS.cpu.unit} status={metricStatus(health.metrics.cpuUsage, "cpu")} />
        <MetricCard title="Memory Usage" value={health.metrics.memoryUsage} unit={THRESHOLDS.memory.unit} status={metricStatus(health.metrics.memoryUsage, "memory")} />
        <MetricCard title="Disk Space" value={health.metrics.diskSpace} unit={THRESHOLDS.disk.unit} status={metricStatus(health.metrics.diskSpace, "disk")} />
        <MetricCard title="Response Time" value={health.metrics.responseTime} unit={THRESHOLDS.responseTime.unit} status={metricStatus(health.metrics.responseTime, "responseTime")} />
      </div>
    </div>
    <Card className="p-4"><h3 className="text-lg font-medium mb-4">System Performance</h3><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={health.performanceHistory}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString()} minTickGap={32} /><YAxis yAxisId="left" /><YAxis yAxisId="right" orientation="right" /><Tooltip formatter={(v: any, n: string) => [v, n === "errorRate" ? "Error Rate (%)" : n === "responseTime" ? "Response Time (ms)" : n]} contentStyle={{ backgroundColor: "rgba(255,255,255,0.9)", border: "1px solid #e5e7eb" }} /><ReferenceLine y={THRESHOLDS.responseTime.warning} yAxisId="left" stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Warning", position: "insideTopLeft" }} /><ReferenceLine y={THRESHOLDS.responseTime.critical} yAxisId="left" stroke="#dc2626" strokeDasharray="3 3" label={{ value: "Critical", position: "insideTopLeft" }} /><Line yAxisId="left" type="monotone" dataKey="responseTime" stroke="#6366f1" name="responseTime" dot={false} strokeWidth={2} /><Line yAxisId="right" type="monotone" dataKey="errorRate" stroke="#10b981" name="errorRate" dot={false} strokeWidth={2} /></LineChart></ResponsiveContainer></div></Card>
    <Card className="p-4"><h3 className="text-lg font-medium mb-4">Service Status</h3><div className="space-y-4">{health.services.map(s => (<div key={s.name} className="flex items-center justify-between"><div><div className="font-medium">{s.name}</div><div className="text-xs text-muted-foreground">Uptime: {Math.round(s.uptime)}%{s.lastIncident && <span className="ml-2">Last incident: {new Date(s.lastIncident).toLocaleDateString()}</span>}</div></div><Badge className={statusColor(s.status)}>{s.status}</Badge></div>))}</div></Card>
  </div>);
}
interface MetricCardProps { title: string; value: number; unit: string; status: "healthy" | "warning" | "critical" }
function MetricCard({ title, value, unit, status }: MetricCardProps) { return (<Card className={`p-4 border-l-4 ${statusColor(status)}`}><div className="flex justify-between items-start mb-2"><h3 className="text-sm font-medium">{title}</h3>{statusIcon(status)}</div><div className="text-2xl font-bold">{value}{unit}</div></Card>); }