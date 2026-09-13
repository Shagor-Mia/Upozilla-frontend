import type { ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/** The list-page table shell shared by every admin screen: bordered/rounded
 * card wrapper, header row, and an empty-state row spanning every column.
 * Row markup stays with each caller since cell content differs per entity. */
export function AdminTable({
  headings,
  isEmpty,
  emptyMessage,
  children,
}: {
  headings: ReactNode[];
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 rounded-xl border border-border-muted bg-surface-container-lowest shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-gray">
            {headings.map((heading, index) => (
              <TableHead key={index}>{heading}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isEmpty ? (
            <TableRow>
              <TableCell colSpan={headings.length} className="py-6 text-center text-on-surface-variant">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            children
          )}
        </TableBody>
      </Table>
    </div>
  );
}
