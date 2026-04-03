import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Pagination Component
 *
 * Implements the pagination.edn contract.
 * Page navigation controls with previous/next buttons and status display.
 */
import { tokens } from '@open-hax/uxx/tokens';
const containerStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: `${tokens.spacing[3]}px`,
    padding: `${tokens.spacing[3]}px`,
    borderTop: `1px solid ${tokens.colors.border.default}`,
    backgroundColor: tokens.colors.background.surface,
};
const buttonStyles = {
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
    borderRadius: `${tokens.spacing[1]}px`,
    border: `1px solid ${tokens.colors.border.default}`,
    backgroundColor: tokens.colors.background.default,
    color: tokens.colors.text.default,
    fontFamily: tokens.fontFamily.sans,
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
};
const buttonDisabledStyles = {
    ...buttonStyles,
    cursor: 'not-allowed',
    color: tokens.colors.text.muted,
    opacity: 0.6,
};
const statusStyles = {
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.secondary,
    fontFamily: tokens.fontFamily.sans,
};
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
export function Pagination({ page, totalPages, onPageChange, disabled = false, showStatus = true, previousLabel = 'Previous', nextLabel = 'Next', }) {
    const canGoPrevious = page > 1 && !disabled;
    const canGoNext = page < totalPages && !disabled;
    const handlePrevious = () => {
        if (canGoPrevious) {
            onPageChange(page - 1);
        }
    };
    const handleNext = () => {
        if (canGoNext) {
            onPageChange(page + 1);
        }
    };
    if (totalPages <= 1) {
        return null;
    }
    return (_jsxs("div", { "data-component": "pagination", "data-page": page, "data-total-pages": totalPages, style: containerStyles, role: "navigation", "aria-label": "Pagination", children: [_jsx("button", { "data-testid": "pagination-prev", onClick: handlePrevious, disabled: !canGoPrevious || disabled, style: canGoPrevious ? buttonStyles : buttonDisabledStyles, "aria-label": "Go to previous page", children: previousLabel }), showStatus && (_jsxs("span", { "data-testid": "pagination-status", style: statusStyles, "aria-live": "polite", children: ["Page ", page, " of ", totalPages] })), _jsx("button", { "data-testid": "pagination-next", onClick: handleNext, disabled: !canGoNext || disabled, style: canGoNext ? buttonStyles : buttonDisabledStyles, "aria-label": "Go to next page", children: nextLabel })] }));
}
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
export function paginateItems(items, page, pageSize) {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const offset = (safePage - 1) * safePageSize;
    return items.slice(offset, offset + safePageSize);
}
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
export function calculateTotalPages(totalItems, pageSize) {
    if (pageSize <= 0)
        return 1;
    return Math.max(1, Math.ceil(totalItems / pageSize));
}
//# sourceMappingURL=Pagination.js.map