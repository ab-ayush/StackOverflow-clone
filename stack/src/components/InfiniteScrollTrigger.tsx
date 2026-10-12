import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollTriggerProps {
  hasMore: boolean;
  loading: boolean;
  failed: boolean;
  onLoadMore: () => void;
}

export default function InfiniteScrollTrigger({
  hasMore,
  loading,
  failed,
  onLoadMore,
}: InfiniteScrollTriggerProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(onLoadMore);
  loadMoreRef.current = onLoadMore;

  // observing stops while a page is loading or after a failure
  const active = hasMore && !loading && !failed;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !active) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "600px 0px" }
    );
    // observe() reports the current state straight away, so a short page keeps
    // loading until the screen is filled
    observer.observe(node);
    return () => observer.disconnect();
  }, [active]);

  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} className="flex justify-center py-6 min-h-[64px]">
      {loading ? (
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      ) : failed ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 active:scale-95"
        >
          Couldn't load more. Try again
        </button>
      ) : null}
    </div>
  );
}