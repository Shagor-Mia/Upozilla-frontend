import { apiGet } from "@/lib/api-client";
import type { Location } from "@/types/api";

/** Upazila + its unions as select options (the tenant's whole subtree is small). */
export async function getLocationOptions(): Promise<{ value: string; label: string }[]> {
  const upazilas = await apiGet<Location[]>("/locations", {
    revalidateSeconds: 3600,
    searchParams: { type: "upazila" },
  });
  const upazila = upazilas[0];
  if (!upazila) return [];

  const unions = await apiGet<Location[]>("/locations", {
    revalidateSeconds: 3600,
    searchParams: { type: "union", parent_id: upazila.id },
  });

  return [
    { value: upazila.id, label: `${upazila.name} (Upazila)` },
    ...unions.map((union) => ({ value: union.id, label: `${union.name} (Union)` })),
  ];
}
