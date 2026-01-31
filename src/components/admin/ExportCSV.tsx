import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportCSVProps<T> {
  data: T[] | undefined;
  filename: string;
  columns: { key: keyof T | string; header: string; accessor?: (item: T) => string }[];
}

function ExportCSV<T>({ data, filename, columns }: ExportCSVProps<T>) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    const headers = columns.map(col => col.header);
    const rows = data.map(item =>
      columns.map(col => {
        if (col.accessor) {
          return col.accessor(item);
        }
        const value = item[col.key as keyof T];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      })
    );

    const csvContent = [
      headers.join(","),
      ...rows.map(row =>
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma or newline
          const escaped = String(cell).replace(/"/g, '""');
          return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}

export default ExportCSV;
