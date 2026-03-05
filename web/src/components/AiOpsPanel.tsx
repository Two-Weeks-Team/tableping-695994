export default function AiOpsPanel({ onRecomputeAll }: { onRecomputeAll: () => void }) {
  return (
    <div className="card">
      <h3>AI Operations</h3>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        TablePing uses AI to predict ETA ranges and help hosts reduce no-shows in real time.
      </p>
      <button onClick={onRecomputeAll}>Recompute ETA for Entire Queue</button>
    </div>
  );
}
