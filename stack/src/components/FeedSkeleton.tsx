function PostSkeleton() {
  return (
    <div className="rounded-xl border bg-white p-4 space-y-3 animate-pulse" aria-hidden>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-gray-200" />
          <div className="h-2.5 w-20 rounded bg-gray-100" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-11/12 rounded bg-gray-200" />
        <div className="h-3 w-2/3 rounded bg-gray-200" />
      </div>
      <div className="flex gap-4 border-t pt-3">
        <div className="h-4 w-10 rounded bg-gray-100" />
        <div className="h-4 w-10 rounded bg-gray-100" />
        <div className="h-4 w-10 rounded bg-gray-100" />
        <div className="h-4 w-6 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading posts">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}