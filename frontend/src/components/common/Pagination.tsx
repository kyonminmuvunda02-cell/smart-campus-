import { Button } from 'react-bootstrap';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="px-4 py-3 border-top d-flex align-items-center justify-content-between bg-light-subtle">
      <div className="text-secondary small fw-medium">
        Showing <span className="text-navy fw-bold">{startIdx} - {endIdx}</span> of {totalItems}
      </div>
      
      <div className="d-flex gap-1 align-items-center">
        <Button
          variant="white"
          size="sm"
          className="border shadow-none me-2"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="ti ti-chevron-left" />
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant={currentPage === 1 ? 'purple' : 'white'}
              size="sm"
              className={`border shadow-none px-2`}
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="text-muted px-1">...</span>}
          </>
        )}

        {pages.map(p => (
          <Button
            key={p}
            variant={currentPage === p ? 'purple' : 'white'}
            size="sm"
            className={`border shadow-none px-2 ${currentPage === p ? 'text-white' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-muted px-1">...</span>}
            <Button
              variant={currentPage === totalPages ? 'purple' : 'white'}
              size="sm"
              className={`border shadow-none px-2`}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="white"
          size="sm"
          className="border shadow-none ms-2"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i className="ti ti-chevron-right" />
        </Button>
      </div>
    </div>
  );
}
