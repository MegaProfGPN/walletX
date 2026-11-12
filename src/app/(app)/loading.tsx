export default function AppLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Memuat">
      <div className="h-7 w-40 animate-pulse rounded bg-line" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-line" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-xl bg-line" />
    </div>
  );
}
