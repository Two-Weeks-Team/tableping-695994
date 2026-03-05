import type { QueueEntry } from '@/lib/api';

type Props = {
  entries: QueueEntry[];
  loading: boolean;
  busyId: string | null;
  onAction: (entryId: string, action: 'SEAT' | 'HOLD' | 'NO_SHOW' | 'MARK_READY') => void;
  onRunAi: (entryId: string) => void;
};

export default function QueueTable({ entries, loading, busyId, onAction, onRunAi }: Props) {
  return (
    <div className="card">
      <h3>Live Waitlist</h3>
      {loading ? <p>Loading queue...</p> : null}
      <table>
        <thead>
          <tr>
            <th>Guest</th>
            <th>Party</th>
            <th>Status</th>
            <th>ETA</th>
            <th>AI Risk</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td>{e.name || 'Walk-in'}</td>
              <td>{e.party_size}</td>
              <td>{e.status}</td>
              <td>{e.eta_range_minutes ? `${e.eta_range_minutes[0]}-${e.eta_range_minutes[1]}m` : '--'}</td>
              <td>{e.ai_risk_bucket || 'N/A'}</td>
              <td>
                <div className="actions">
                  <button disabled={busyId === e.id} onClick={() => onAction(e.id, 'MARK_READY')}>Ready+SMS</button>
                  <button disabled={busyId === e.id} onClick={() => onAction(e.id, 'SEAT')}>Seat</button>
                  <button disabled={busyId === e.id} onClick={() => onAction(e.id, 'HOLD')}>Hold</button>
                  <button disabled={busyId === e.id} onClick={() => onAction(e.id, 'NO_SHOW')}>No-show</button>
                  <button disabled={busyId === e.id} onClick={() => onRunAi(e.id)}>AI Re-score</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
