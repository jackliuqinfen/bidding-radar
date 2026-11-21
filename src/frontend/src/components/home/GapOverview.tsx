import type { CompanyGapRow } from "@/backend";
import { dashboardSearch } from "@/lib/dashboardSearch";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

const COLUMNS: {
  key: keyof CompanyGapRow["counts"];
  label: string;
  tone: string;
}[] = [
  { key: "missing", label: "待补", tone: "text-status-missing-foreground" },
  {
    key: "pendingReview",
    label: "待核",
    tone: "text-status-pending-foreground",
  },
  {
    key: "verified",
    label: "已核实",
    tone: "text-status-verified-foreground",
  },
  {
    key: "nearExpiry",
    label: "临近到期",
    tone: "text-status-expiring-foreground",
  },
  { key: "expired", label: "已过期", tone: "text-status-expired-foreground" },
];

/** Company-wide gap counts, one row per company, linking into the dashboard. */
export function GapOverview({ rows }: { rows: CompanyGapRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th scope="col" className="px-2 py-2 text-left font-medium">
              公司
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-2 py-2 text-right font-medium"
              >
                {col.label}
              </th>
            ))}
            <th scope="col" className="w-8 px-1 py-2">
              <span className="sr-only">查看</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.companyId.toString()}
              data-ocid={`home.overview.row.${index + 1}`}
              className="border-b border-border/60 last:border-0"
            >
              <td className="max-w-[12rem] px-2 py-2">
                <Link
                  to="/dashboard"
                  search={(prev) => ({
                    status: prev.status,
                    expiry: prev.expiry,
                    category: prev.category,
                    owner: prev.owner,
                    company: row.companyId.toString(),
                  })}
                  data-ocid={`home.overview.link.${index + 1}`}
                  className="block truncate font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  {row.companyName}
                </Link>
              </td>
              {COLUMNS.map((col) => {
                const value = row.counts[col.key];
                return (
                  <td
                    key={col.key}
                    className={`num-tabular px-2 py-2 text-right ${
                      value > 0n ? col.tone : "text-muted-foreground/60"
                    }`}
                  >
                    {value.toString()}
                  </td>
                );
              })}
              <td className="px-1 py-2 text-right">
                <Link
                  to="/dashboard"
                  search={(prev) => ({
                    status: prev.status,
                    expiry: prev.expiry,
                    category: prev.category,
                    owner: prev.owner,
                    company: row.companyId.toString(),
                  })}
                  aria-label={`查看 ${row.companyName} 的缺口明细`}
                  className="inline-flex text-muted-foreground hover:text-primary"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
