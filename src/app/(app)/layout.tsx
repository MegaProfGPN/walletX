import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/current-user";
import { BottomNav, SideNav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Pengguna";

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <SideNav name={name} onSignOut={signOut} />

      <div className="flex flex-1 flex-col pb-16 md:pb-0">
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
          <span className="text-base font-semibold text-brand-700">Catatan Uang</span>
          <form action={signOut}>
            <button type="submit" className="min-h-11 text-sm text-muted underline">
              Keluar
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
