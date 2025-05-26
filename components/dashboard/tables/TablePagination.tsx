// components/tables/TablePagination.tsx
import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ page, totalPages, onPageChange }: TablePaginationProps) {
  return (
    <div className="flex items-center justify-end gap-2 p-2">
      <Button
        variant="outline"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </Button>
      <span>
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </div>
  );
}
