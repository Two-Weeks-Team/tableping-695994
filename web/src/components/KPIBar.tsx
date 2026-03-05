import type { AnalyticsSummary } from '@/lib/api';

export default function KPIBar({ analytics, waitingCount }: { analytics: AnalyticsSummary; waitingCount: number }) {
  return (
    <div className="card kpi-grid">
      <div className="kpi-item"><p>Parties Waiting</p><h3>{waitingCount}</h3></div>
      <div className="kpi-item"><p>Avg Wait</p><h3>{analytics.kpis.avg_wait_minutes.toFixed(1)}m</h3></div>
      <div className="kpi-item"><p>No-show Rate</p><h3>{(analytics.kpis.no_show_rate * 100).toFixed(1)}%</h3></div>
      <div className="kpi-item"><p>SMS Sent (7d)</p><h3>{analytics.kpis.sms_sent}</h3></div>
    </div>
  );
}
