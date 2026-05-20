export interface IIssue {
  id?: number;
  title: string;
  description: string;
  type: "bug" | "feature_request";
  priority: "low" | "medium" | "high";
  status?: "open" | "in_progress" | "resolved";
  creator_id: number; 
  assigned_to?: number | null;
  created_at?: Date;
  updated_at?: Date;
}