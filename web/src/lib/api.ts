export type QueueStatus = 'WAITING' | 'HOLD' | 'READY' | 'SEATED' | 'NO_SHOW' | 'CANCELLED';

export type QueueEntry = {
  id: string;
  status: QueueStatus;
  party_size: number;
  name?: string;
  eta_minutes?: number;
  eta_range_minutes?: [number, number];
  version: number;
  ai_risk_bucket?: 'LOW' | 'MED' | 'HIGH';
};

export type QueueResponse = {
  location_id: string;
  as_of: string;
  entries: QueueEntry[];
};

export type AnalyticsSummary = {
  location_id: string;
  kpis: {
    total_checkins: number;
    avg_wait_minutes: number;
    no_show_rate: number;
    sms_sent: number;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    },
    cache: 'no-store'
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function getQueue(locationId: string) {
  return request<QueueResponse>(`/locations/${locationId}/queue`);
}

export function getAnalyticsSummary(locationId: string) {
  const to = new Date().toISOString();
  const from = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  return request<AnalyticsSummary>(`/locations/${locationId}/analytics/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

export function takeQueueAction(locationId: string, entryId: string, action: string, expectedVersion: number) {
  return request(`/locations/${locationId}/queue/${entryId}/actions`, {
    method: 'POST',
    body: JSON.stringify({ action, expected_version: expectedVersion, payload: {} })
  });
}

export function sendNotify(locationId: string, entryId: string, type: 'READY' | 'ETA_UPDATE') {
  return request(`/locations/${locationId}/queue/${entryId}/notify`, {
    method: 'POST',
    body: JSON.stringify({ type, channel: 'SMS', dry_run: false })
  });
}

export function runEtaPrediction(locationId: string) {
  return request(`/ai/locations/${locationId}/eta/predict`, {
    method: 'POST',
    body: JSON.stringify({ as_of: new Date().toISOString(), queue_entries: [], context: {} })
  });
}

export function runNoShowRisk(locationId: string, entryId: string) {
  return request(`/ai/locations/${locationId}/sms/compose`, {
    method: 'POST',
    body: JSON.stringify({ event: 'ETA_UPDATE', guest: { entry_id: entryId }, constraints: { include_opt_out: true } })
  });
}
