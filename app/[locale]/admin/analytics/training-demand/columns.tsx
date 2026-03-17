import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export interface TrainingDemandColumn {
  trainingName: string;
  staffName: string;
  unit: string;
  gap: number;
  competency: string;
}

export const getTrainingDemandColumns = (): ColumnDef<TrainingDemandColumn>[] => [
  {
    accessorKey: "trainingName",
    header: "Recommended Training",
    cell: ({ row }) => {
      const training = row.getValue("trainingName") as string;
      return <div className="font-medium">{training}</div>;
    },
  },
  {
    accessorKey: "staffName",
    header: "Staff Name",
  },
  {
    accessorKey: "unit",
    header: "Department",
  },
  {
    accessorKey: "competency",
    header: "Deficient Competency",
  },
  {
    accessorKey: "gap",
    header: "Calculated Gap",
    cell: ({ row }) => {
      const gap = row.getValue("gap") as number;
      
      // Color coding based on gap size
      let badgeVariant: "default" | "secondary" | "outline" | "destructive" = "default";
      if (gap >= 2) badgeVariant = "destructive";
      else if (gap >= 1.5) badgeVariant = "secondary";
      
      return (
        <Badge variant={badgeVariant}>
          {gap.toFixed(2)}
        </Badge>
      );
    },
  },
];
