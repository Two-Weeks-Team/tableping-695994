'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getQueue,
  getAnalyticsSummary,
  runEtaPrediction,
  runNoShowRisk,
  sendNotify,
  takeQueueAction,
  type QueueEntry,
  type AnalyticsSummary
} from '@/lib/api';
import QueueTable from '@/components/QueueTable';
import KPIBar from '@/components/KPIBar';
import AiOpsPanel from '@/components/AiOpsPanel';

const LOCATION_ID = process.env.NEXT_PUBLIC_DEMO_LOCATION_ID || 'demo-location-id';

export default function Page() {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const waitingCount = useMemo(() => queue.filter((q) => ['WAITING', 'HOLD', 'READY'].includes(q.status)).length, [queue]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [q, a] = await Promise.all([getQueue(LOCATION_ID), getAnalyticsSummary(LOCATION_ID)]);
      setQueue(q.entries);
      setAnalytics(a);
    } catch (e) {
      setError((e as Error).message || 'Failed to load queue data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onAction(entryId: string, action: 'SEAT' | 'HOLD' | 'NO_SHOW' | 'MARK_READY') {
    const entry = queue.find((e) => e.id === entryId);
    if (!entry) return;

    setBusyId(entryId);
    try {
      await takeQueueAction(LOCATION_ID, entryId, action, entry.version);
      if (action === 'MARK_READY') {
        await sendNotify(LOCATION_ID, entryId, 'READY');
      }
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function onRunAi(entryId: string) {
    setBusyId(entryId);
    try {
      await runEtaPrediction(LOCATION_ID);
      await runNoShowRisk(LOCATION_ID, entryId);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="page">
      {error ? <div className="error">{error}</div> : null}
      {analytics ? <KPIBar analytics={analytics} waitingCount={waitingCount} /> : null}
      <AiOpsPanel onRecomputeAll={() => runEtaPrediction(LOCATION_ID).then(refresh)} />
      <QueueTable entries={queue} loading={loading} busyId={busyId} onAction={onAction} onRunAi={onRunAi} />
    </section>
  );
}
