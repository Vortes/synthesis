"use client";

import { usePathname } from "next/navigation";
import { UserButton, useClerk } from "@clerk/nextjs";
import { AppShell } from "@curate/ui";

const pageTitles: Record<string, string> = {
  "/library": "Library",
  "/collections": "Collections",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "Curate";
  const { signOut } = useClerk();

  return (
    <AppShell
      activePath={pathname}
      pageTitle={pageTitle}
      userButton={<UserButton afterSignOutUrl="/" />}
      onSignOut={() => signOut({ redirectUrl: "/sign-in" })}
    >
      {children}
    </AppShell>
  );
}
