import { deleteArtefactAction } from "@/app/actions/artefacts";

type Artefact = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  blobUrl: string;
  contentType: string | null;
  sizeBytes: number | null;
  uploadedBy?: { name: string | null; email: string } | null;
  createdAt: Date;
};

export default function ArtefactList({
  artefacts,
  canManage,
  empty = "No documents attached.",
}: {
  artefacts: Artefact[];
  canManage: boolean;
  empty?: string;
}) {
  if (artefacts.length === 0) {
    return (
      <p className="rounded border border-dashed border-line-strong bg-surface-1 p-3 text-xs text-muted">
        {empty}
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {artefacts.map((a) => (
        <li
          key={a.id}
          className="flex items-start justify-between rounded border border-line bg-surface-1 px-3 py-2 text-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-xs">
                {a.kind}
              </span>
              <a
                href={a.blobUrl}
                target="_blank"
                rel="noopener"
                className="truncate font-medium hover:underline"
              >
                {a.title}
              </a>
            </div>
            {a.description && (
              <p className="mt-1 text-xs text-muted">{a.description}</p>
            )}
            <p className="mt-1 text-xs text-soft">
              {formatBytes(a.sizeBytes)}
              {a.contentType ? ` · ${a.contentType}` : ""}
              {a.uploadedBy ? ` · uploaded by ${a.uploadedBy.name ?? a.uploadedBy.email}` : ""}
            </p>
          </div>
          {canManage && (
            <form action={deleteArtefactAction}>
              <input type="hidden" name="id" value={a.id} />
              <button className="ml-3 text-xs text-rose-600 hover:underline">Delete</button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}

function formatBytes(n: number | null | undefined): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
