import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Shop } from "@/types/api";

export function ShopGrid({
  shops,
  emptyMessage,
  independentLabel,
}: {
  shops: Shop[];
  emptyMessage: string;
  independentLabel: string;
}) {
  if (shops.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
        <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shops.map((shop) => (
        <Link key={shop.id} href={`/shops/${shop.id}`}>
          <Card className="h-full shadow-card transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-headline-md">{shop.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{shop.category_name}</Badge>
                {shop.is_featured && <Badge variant="secondary">★</Badge>}
              </div>
            </CardHeader>
            <CardContent className="text-body-md text-on-surface-variant">
              {shop.market_name ?? independentLabel}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
