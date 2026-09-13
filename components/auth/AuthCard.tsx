import type { LucideIcon } from "lucide-react";

export function AuthCard({
  icon: Icon,
  title,
  description,
  children,
  footer,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-surface-gray px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border-muted bg-surface-container-lowest p-8 shadow-card">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container">
            <Icon className="text-on-primary-container" size={28} />
          </div>
          <h1 className="text-headline-lg text-on-surface">{title}</h1>
          <p className="text-body-md mt-2 max-w-[280px] text-on-surface-variant">{description}</p>
        </div>

        <div className="mt-8">{children}</div>

        {footer && <div className="text-body-md mt-6 text-center text-on-surface-variant">{footer}</div>}
      </div>
    </div>
  );
}
