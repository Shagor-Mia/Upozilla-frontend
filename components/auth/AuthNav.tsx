"use client";

import { MessageSquare, Sparkles, Tag, UserCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/button";
import { onAuthChanged } from "@/lib/auth-events";
import { isStaff } from "@/lib/roles";

interface Session {
  userId: string;
  tenantId: string | null;
  role: string | null;
  roles: string[];
  phoneVerified: boolean;
}

export function AuthNav() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    function fetchSession() {
      fetch("/api/session")
        .then((res) => res.json())
        .then((data: { session: Session | null }) => {
          if (!cancelled) setSession(data.session);
        })
        .catch(() => {
          if (!cancelled) setSession(null);
        });
    }

    fetchSession();
    const unsubscribe = onAuthChanged(fetchSession);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const staff = session ? isStaff(session.roles ?? [session.role]) : false;

  return (
    <div className="flex min-w-[88px] items-center justify-end gap-1.5">
      {session === undefined ? null : session ? (
        <>
          {staff && (
            <Button render={<Link href="/admin" />} nativeButton={false} variant="ghost" size="sm">
              Admin
            </Button>
          )}
          <Button
            render={<Link href="/messages" aria-label="Messages" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
          >
            <MessageSquare />
          </Button>
          <Button
            render={<Link href="/ask" aria-label="Ask AI" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
          >
            <Sparkles />
          </Button>
          <Button
            render={<Link href="/account" aria-label="Account" />}
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
          >
            <UserCircle />
          </Button>
          <Button render={<Link href="/sell" />} nativeButton={false} size="sm">
            <Tag data-icon="inline-start" />
            Sell
          </Button>
          <LogoutButton />
        </>
      ) : (
        <>
          <Button render={<Link href="/login" />} nativeButton={false} variant="ghost" size="sm">
            Sign in
          </Button>
          <Button render={<Link href="/register" />} nativeButton={false} size="sm">
            Register
          </Button>
        </>
      )}
    </div>
  );
}
