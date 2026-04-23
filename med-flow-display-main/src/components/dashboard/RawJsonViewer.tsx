import { useState } from "react";
import { Code, ChevronDown, ChevronUp } from "lucide-react";

interface RawJsonViewerProps {
  rawJson: string;
  parseErrors: number;
}

export function RawJsonViewer({ rawJson, parseErrors }: RawJsonViewerProps) {
  const [open, setOpen] = useState(false);

  let formatted = rawJson;
  try {
    formatted = JSON.stringify(JSON.parse(rawJson), null, 2);
  } catch {
    // keep raw
  }

  return (
    <div className="vital-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground w-full"
      >
        <Code className="w-4 h-4 text-neon-secondary" />
        <span>Raw JSON</span>
        {parseErrors > 0 && (
          <span className="text-xs text-destructive ml-2">({parseErrors} parse errors)</span>
        )}
        <span className="ml-auto">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {open && (
        <pre className="mt-3 p-3 rounded-lg bg-muted text-xs font-mono text-card-foreground overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-all">
          {formatted || "No data received yet..."}
        </pre>
      )}
    </div>
  );
}
