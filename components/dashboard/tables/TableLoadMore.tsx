// components/tables/TableLoadMore.tsx
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface TableLoadMoreProps {
  loading: boolean;
  hasMore: boolean;
  onClick: () => void;
}

export function TableLoadMore({ loading, hasMore, onClick }: TableLoadMoreProps) {
  
  return (
    <div className="flex justify-center p-4">
      {hasMore && (
        <Button
          variant="outline"
          onClick={onClick}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Load More
        </Button>
      )}
    </div>
  );
}
