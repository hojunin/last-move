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
      <div className="flex items-center gap-2">
        {activity.category_name && (
          <Badge variant="secondary">
            {activity.category_icon} {activity.category_name}
          </Badge>
        )}
      </div>

      <ActivityStats activity={activity} />
    </div>
  );
}
