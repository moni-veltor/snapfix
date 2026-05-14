import { addLogEntryAction } from "@/app/actions/exercises";

type Entry = {
  id: string;
  dDayTime: string;
  kind: string;
  body: string;
  author: string;
  createdAt: string;
};

export default function IncidentLogPanel({
  exerciseId,
  dDayHHMM,
  entries,
}: {
  exerciseId: string;
  dDayHHMM: string;
  entries: Entry[];
}) {
  return (
    <div className="space-y-3">
      <ul className="space-y-1 text-sm">
        {entries.length === 0 && (
          <li className="rounded border border-dashed border-line-strong bg-surface-1 p-3 text-center text-muted">
            No log entries yet.
          </li>
        )}
        {entries.map((e) => (
          <li key={e.id} className="rounded border border-line bg-surface-1 px-3 py-2">
            <span className="font-mono text-xs text-muted">{e.dDayTime}</span>
            <span className="mx-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs">{e.kind}</span>
            <span className="text-ink">{e.body}</span>
            <div className="text-xs text-soft">— {e.author}</div>
          </li>
        ))}
      </ul>
      <form action={addLogEntryAction} className="grid grid-cols-6 gap-2 rounded-md border border-dashed border-line-strong bg-surface-1 p-3 text-sm">
        <input type="hidden" name="exerciseId" value={exerciseId} />
        <input
          name="dDayTime"
          defaultValue={dDayHHMM}
          required
          pattern="[0-9]{2}:[0-9]{2}"
          className="col-span-1 rounded border border-line-strong px-2 py-1"
        />
        <select name="kind" required className="col-span-1 rounded border border-line-strong px-2 py-1">
          <option>DECISION</option>
          <option>ACTION</option>
          <option>CHALLENGE</option>
          <option>RESOURCE</option>
          <option>NOTE</option>
        </select>
        <input
          name="body"
          required
          placeholder="What happened / decision made / action taken"
          className="col-span-3 rounded border border-line-strong px-2 py-1"
        />
        <button className="col-span-1 rounded-md bg-slate-900 px-2 py-1 text-white">Log</button>
      </form>
    </div>
  );
}
