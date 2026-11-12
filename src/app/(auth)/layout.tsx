export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-10">
      <main className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-sm">
        {children}
      </main>
    </div>
  );
}
