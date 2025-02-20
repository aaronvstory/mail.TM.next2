export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-medium">Loading your inbox...</h2>
        <p className="text-sm text-muted-foreground">
          This may take a few seconds
        </p>
      </div>
    </div>
  );
}
