const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-accent/10 text-accent",
  in_progress: "bg-accent/10 text-accent",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  draft: "bg-secondary text-muted-foreground",
  unpaid: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
  active: "bg-success/10 text-success",
  inactive: "bg-secondary text-muted-foreground",
};

const formatLabel = (status: string) => status.replace(/_/g, " ");

interface Props {
  status: string;
  className?: string;
}

const StatusBadge = ({ status, className = "" }: Props) => {
  const key = status?.toLowerCase() ?? "unknown";
  const styles = STATUS_STYLES[key] ?? "bg-secondary text-muted-foreground";
  return (
    <span
      role="status"
      aria-label={`Status: ${formatLabel(status)}`}
      className={`text-[11px] font-medium px-2.5 py-1 rounded-md capitalize ${styles} ${className}`}
    >
      {formatLabel(status)}
    </span>
  );
};

export default StatusBadge;
