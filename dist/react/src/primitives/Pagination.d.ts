/**
 * Pagination Component
 *
 * Implements the pagination.edn contract.
 * Page navigation controls with previous/next buttons and status display.
 */
export interface PaginationProps {
    /** Current page number (1-indexed) */
    page: number;
    /** Total number of pages */
    totalPages: number;
    /** Callback when page changes */
    onPageChange: (page: number) => void;
    /** Whether pagination is disabled */
    disabled?: boolean;
    /** Whether to show 'Page X of Y' status */
    showStatus?: boolean;
    /** Label for previous button */
    previousLabel?: string;
    /** Label for next button */
    nextLabel?: string;
}
/**
 * Pagination controls for navigating through paged content.
 *
 * @example
 * ```tsx
 * <Pagination
 *   page={currentPage}
 *   totalPages={10}
 *   onPageChange={setCurrentPage}
 * />
 * ```
 */
export declare function Pagination({ page, totalPages, onPageChange, disabled, showStatus, previousLabel, nextLabel, }: PaginationProps): import("react/jsx-runtime").JSX.Element | null;
/**
 * Utility function to paginate items.
 * Returns a slice of items for the given page.
 *
 * @param items - Array of items to paginate
 * @param page - Current page (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Paginated slice of items
 *
 * @example
 * ```tsx
 * const pageItems = paginateItems(allItems, 2, 10);
 * // Returns items 11-20
 * ```
 */
export declare function paginateItems<T>(items: T[], page: number, pageSize: number): T[];
/**
 * Utility function to calculate total pages.
 *
 * @param totalItems - Total number of items
 * @param pageSize - Number of items per page
 * @returns Total number of pages (minimum 1)
 *
 * @example
 * ```tsx
 * const totalPages = calculateTotalPages(95, 10);
 * // Returns 10
 * ```
 */
export declare function calculateTotalPages(totalItems: number, pageSize: number): number;
//# sourceMappingURL=Pagination.d.ts.map