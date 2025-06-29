import { SelectContent, SelectItem } from "@/components/ui/select";
import { getCategories } from "@/lib/actions";

export default async function CategorySelect() {
  const categories = await getCategories();

  return (
    <SelectContent>
      {categories.map((category) => (
        <SelectItem key={category.id} value={category.id.toString()}>
          <div className="flex items-center gap-2">
            <span>{category.icon}</span>
            <span>{category.name}</span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  );
}
