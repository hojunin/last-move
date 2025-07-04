import { Badge } from "@/components/ui/badge";
import ActivityStats from "./ActivityStats";
import ActivityEditForm from "./ActivityEditForm";
import { ActivityInfoSectionProps } from "./types";

export default function ActivityInfoSection({
  activity,
  isEditing,
  onActivityUpdate,
  categories,
}: ActivityInfoSectionProps) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <ActivityEditForm
          activity={activity}
          categories={categories}
          onSubmit={onActivityUpdate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ActivityStats activity={activity} />
    </div>
  );
}
