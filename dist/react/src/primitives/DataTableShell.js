import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
import { Spinner } from './Spinner.js';
const tableWrapStyles = {
    overflowX: 'auto',
};
const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: tokens.fontFamily.sans,
    fontSize: tokens.fontSize.sm,
};
const denseTableStyles = {
    fontSize: tokens.fontSize.xs,
};
const wideTableStyles = {
    minWidth: '800px',
};
const thStyles = {
    textAlign: 'left',
    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.muted,
    fontSize: 'inherit',
    borderBottom: `1px solid ${tokens.colors.border.default}`,
    whiteSpace: 'nowrap',
};
const stickyThStyles = {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: tokens.colors.background.surface,
};
const tdStyles = {
    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
    borderBottom: `1px solid ${tokens.colors.border.subtle}`,
    color: tokens.colors.text.default,
    verticalAlign: 'middle',
};
const denseTdStyles = {
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
};
const emptyStateStyles = {
    textAlign: 'center',
    padding: `${tokens.spacing[8]}px ${tokens.spacing[4]}px`,
    color: tokens.colors.text.muted,
    fontSize: tokens.fontSize.sm,
};
const loadingOverlayStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${tokens.spacing[8]}px`,
    color: tokens.colors.text.muted,
};
export function DataTableShell({ columns, rows, rowKey, loading = false, emptyState, wide = false, dense = false, stickyHeader = true, maxHeight, }) {
    const wrapStyle = {
        ...tableWrapStyles,
        ...(maxHeight ? { maxHeight, overflowY: 'auto' } : {}),
    };
    const tableStyle = {
        ...tableStyles,
        ...(wide ? wideTableStyles : {}),
        ...(dense ? denseTableStyles : {}),
    };
    if (loading) {
        return (_jsx("div", { "data-component": "data-table-shell", "data-state": "loading", style: loadingOverlayStyles, children: _jsx(Spinner, { size: "md", label: "Loading data\u2026" }) }));
    }
    if (rows.length === 0) {
        return (_jsx("div", { "data-component": "data-table-shell", "data-state": "empty", style: emptyStateStyles, children: emptyState ?? 'No data available.' }));
    }
    return (_jsx("div", { "data-component": "data-table-shell", "data-wide": wide || undefined, "data-dense": dense || undefined, style: wrapStyle, children: _jsxs("table", { style: tableStyle, children: [_jsx("thead", { children: _jsx("tr", { children: columns.map((col) => (_jsx("th", { style: {
                                ...thStyles,
                                ...(stickyHeader ? stickyThStyles : {}),
                                ...(col.width ? { width: col.width } : {}),
                                ...(col.align ? { textAlign: col.align } : {}),
                            }, children: col.header }, col.key))) }) }), _jsx("tbody", { children: rows.map((row, index) => (_jsx("tr", { children: columns.map((col) => (_jsx("td", { style: {
                                ...tdStyles,
                                ...(dense ? denseTdStyles : {}),
                                ...(col.align ? { textAlign: col.align } : {}),
                            }, children: col.render ? col.render(row) : row[col.key] }, col.key))) }, rowKey(row, index)))) })] }) }));
}
export default DataTableShell;
//# sourceMappingURL=DataTableShell.js.map