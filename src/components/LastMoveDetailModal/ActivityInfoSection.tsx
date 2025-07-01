import { Badge } from '@/components/ui/badge';
import ActivityStats from './ActivityStats';
import ActivityEditForm from './ActivityEditForm';
import { ActivityInfoSectionProps } from './types';

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
      <div>
        <h3 className="text-lg font-semibold mb-2">{activity.title}</h3>
        {activity.category_name && (
          <Badge variant="secondary" className="mb-2">
            {activity.category_icon} {activity.category_name}
          </Badge>
        )}
        {activity.description && (
          <p className="text-sm text-muted-foreground">
            {activity.description}
          </p>
        )}
      </div>

      <ActivityStats activity={activity} />
    </div>
  );
}
