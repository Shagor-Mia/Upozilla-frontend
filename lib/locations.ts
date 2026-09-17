import { apiGet } from "@/lib/api-client";
import type { Hospital, Location, Market, Paginated, School } from "@/types/api";

/** The tenant's upazila + its unions (the tenant's whole subtree is small). */
export async function getUnions(): Promise<Location[]> {
  const upazilas = await apiGet<Location[]>("/locations", {
    revalidateSeconds: 3600,
    searchParams: { type: "upazila" },
  });
  const upazila = upazilas[0];
  if (!upazila) return [];

  return apiGet<Location[]>("/locations", {
    revalidateSeconds: 3600,
    searchParams: { type: "union", parent_id: upazila.id },
  });
}

/** All markets, for the "হাট-বাজার" nav dropdown (the tenant's market list is small). */
export async function getMarkets(): Promise<Market[]> {
  const { items } = await apiGet<Paginated<Market>>("/markets", { revalidateSeconds: 3600 });
  return items;
}

/** All hospitals, for the "হাসপাতাল" nav dropdown (the tenant's hospital list is small). */
export async function getHospitals(): Promise<Hospital[]> {
  const { items } = await apiGet<Paginated<Hospital>>("/hospitals", { revalidateSeconds: 3600 });
  return items;
}

/** All schools, for the "স্কুল" nav dropdown (the tenant's school list is small). */
export async function getSchools(): Promise<School[]> {
  const { items } = await apiGet<Paginated<School>>("/schools", { revalidateSeconds: 3600 });
  return items;
}

/** Upazila + its unions + their villages as select options (the tenant's whole subtree is small). */
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

  const villagesByUnion = await Promise.all(
    unions.map((union) =>
      apiGet<Location[]>("/locations", {
        revalidateSeconds: 3600,
        searchParams: { type: "village", parent_id: union.id },
      })
    )
  );

  return [
    { value: upazila.id, label: `${upazila.name} (Upazila)` },
    ...unions.flatMap((union, index) => [
      { value: union.id, label: `${union.name} (Union)` },
      ...villagesByUnion[index].map((village) => ({ value: village.id, label: `${village.name} (Village)` })),
    ]),
  ];
}
