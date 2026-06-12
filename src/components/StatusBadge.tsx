import { STATUS_LABELS, STATUS_STYLES } from "@/lib/site";

export default function StatusBadge({ status, detail }: { status: string; detail?: string | null }) {
  return (
    <span
      className={`inline-block border rounded-sm px-2 py-0.5 font-mono text-2xs uppercase tracking-wider ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 border-slate-300"
      }`}
      title={detail ?? undefined}
    >
      {detail ?? STATUS_LABELS[status] ?? status}
    </span>
  );
}
