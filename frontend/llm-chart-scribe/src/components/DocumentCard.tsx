import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  filename: string;
  uploadedAt: string;
  status: "processing" | "completed" | "error";
  onClick?: () => void;
}

export const DocumentCard = ({ filename, uploadedAt, status, onClick }: DocumentCardProps) => {
  const statusConfig = {
    processing: {
      label: "Processing",
      className: "bg-warning/10 text-warning border-warning/20",
    },
    completed: {
      label: "Completed",
      className: "bg-success/10 text-success border-success/20",
    },
    error: {
      label: "Error",
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  };

  const config = statusConfig[status];

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all duration-300 hover:shadow-card bg-gradient-card",
        "hover:scale-[1.02] active:scale-[0.98]"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">{filename}</h4>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {uploadedAt}
            </div>
          </div>
        </div>

        <Badge variant="outline" className={cn("shrink-0", config.className)}>
          {config.label}
        </Badge>
      </div>
    </Card>
  );
};
