"use client";

import { Drawer } from "@base-ui/react/drawer";
import type { ReactNode } from "react";

/**
 * Off-canvas drawer for mobile navigation, built on Base UI's Drawer
 * primitive (`@base-ui/react` - already a dependency for `Button`, no new
 * package needed). Anchored to the logical end edge (right in LTR, left in
 * RTL) via `end-0`, so bn/en/ar all get a correctly-positioned drawer without
 * separate RTL handling (see the i18n localization memory).
 */
export const Sheet = Drawer.Root;
export const SheetTrigger = Drawer.Trigger;
export const SheetClose = Drawer.Close;

export function SheetContent({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Drawer.Portal>
      <Drawer.Backdrop className="fixed inset-0 z-50 bg-inverse-surface/50 transition-opacity duration-300 ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <Drawer.Viewport className="fixed inset-0 z-50 flex items-stretch justify-end">
        <Drawer.Popup className="end-0 flex h-full w-[85vw] max-w-[320px] flex-col overflow-y-auto border-s border-border-muted bg-surface-container-lowest p-4 text-on-surface shadow-xl outline-none transition-transform duration-300 ease-out [transform:translateX(var(--drawer-swipe-movement-x))] data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <Drawer.Content className="flex flex-1 flex-col">{children}</Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  );
}
