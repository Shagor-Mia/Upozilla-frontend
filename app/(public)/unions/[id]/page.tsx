import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api-client";
import { config } from "@/lib/config";
import type { Location, Paginated, Representative } from "@/types/api";

const POSITION_LABEL: Record<string, string> = {
  chairman: "চেয়ারম্যান",
  women_member: "সংরক্ষিত মহিলা সদস্য",
  ward_member: "ওয়ার্ড সদস্য",
};

// There's no GET /locations/{id} detail endpoint - the union's own name comes
// from the small upazila -> unions listing (same two-call shape as
// frontend/lib/locations.ts's getLocationOptions), not a dedicated fetch.
async function getUnion(id: string): Promise<Location | null> {
  const upazilas = await apiGet<Location[]>("/locations", {
    revalidateSeconds: 3600,
    searchParams: { type: "upazila" },
  });
  const upazila = upazilas[0];
  if (!upazila) return null;
  const unions = await apiGet<Location[]>("/locations", {
    revalidateSeconds: 3600,
    searchParams: { type: "union", parent_id: upazila.id },
  });
  return unions.find((u) => u.id === id) ?? null;
}

export async function generateMetadata(props: PageProps<"/unions/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const union = await getUnion(id);
  if (!union) return {};
  return { title: union.name, description: `${union.name} — ${config.siteName}` };
}

export default async function UnionDetailPage(props: PageProps<"/unions/[id]">) {
  const { id } = await props.params;
  const union = await getUnion(id);
  if (!union) notFound();

  const [villages, representatives] = await Promise.all([
    apiGet<Location[]>("/locations", { revalidateSeconds: 3600, searchParams: { type: "village", parent_id: id } }),
    apiGet<Paginated<Representative>>("/representatives", {
      revalidateSeconds: 300,
      searchParams: { location_id: id },
    }),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <h1 className="text-headline-lg text-on-surface">{union.name}</h1>

      {representatives.items.length > 0 && (
        <div className="mt-6">
          <h2 className="text-headline-md text-on-surface">প্রতিনিধিবৃন্দ</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {representatives.items.map((rep) => (
              <div
                key={rep.id}
                className="rounded-xl border border-border-muted bg-surface-container-lowest p-4 shadow-card"
              >
                <p className="text-body-md font-semibold text-on-surface">{rep.full_name}</p>
                <Badge variant="secondary" className="mt-1 w-fit">
                  {POSITION_LABEL[rep.position] ?? rep.position}
                </Badge>
                {rep.phone && <p className="mt-2 text-body-md text-on-surface-variant">{rep.phone}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-headline-md text-on-surface">গ্রামের তালিকা</h2>
        {villages.length === 0 ? (
          <p className="mt-4 text-body-md text-on-surface-variant">এখনও কোনো গ্রাম যুক্ত করা হয়নি।</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {villages.map((village) => (
              <Link key={village.id} href={`/unions/${id}/villages/${village.id}`}>
                <Card className="h-full shadow-card transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-headline-md">{village.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
