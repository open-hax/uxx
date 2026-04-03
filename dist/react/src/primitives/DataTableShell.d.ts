import type { ReactNode } from 'react';
export interface DataTableColumn<T> {
    readonly key: string;
    readonly header: string;
    readonly render?: (row: T) => ReactNode;
    readonly width?: string;
    readonly align?: 'left' | 'center' | 'right';
}
export interface DataTableShellProps<T> {
    readonly columns: readonly DataTableColumn<T>[];
    readonly rows: readonly T[];
    readonly rowKey: (row: T, index: number) => string;
    readonly loading?: boolean;
    readonly emptyState?: ReactNode;
    readonly wide?: boolean;
    readonly dense?: boolean;
    readonly stickyHeader?: boolean;
    readonly maxHeight?: string;
}
export declare function DataTableShell<T>({ columns, rows, rowKey, loading, emptyState, wide, dense, stickyHeader, maxHeight, }: DataTableShellProps<T>): import("react/jsx-runtime").JSX.Element;
export default DataTableShell;
//# sourceMappingURL=DataTableShell.d.ts.map