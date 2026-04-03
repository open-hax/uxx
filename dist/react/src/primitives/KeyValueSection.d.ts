/**
 * KeyValueSection Component
 *
 * Implements the key-value-section.spec.md contract.
 * Displays key-value pairs in structured layouts with consistent formatting.
 */
import { type ReactNode } from 'react';
export type KeyValueLayout = 'vertical' | 'grid' | 'inline';
export type KeyValueGap = 'sm' | 'md' | 'lg';
export type KeyValueTitleSize = 'sm' | 'md' | 'lg';
export interface KeyValueEntry {
    /** Label text */
    label: string;
    /** Value - can be string, number, or ReactNode for complex rendering */
    value: ReactNode;
    /** Optional icon before label */
    icon?: ReactNode;
    /** Optional badge after value */
    badge?: string;
    /** Optional tooltip for label */
    tooltip?: string;
    /** Whether to hide if value is empty/null */
    hideIfEmpty?: boolean;
    /** Optional key for React list rendering */
    key?: string;
}
export interface KeyValueSectionProps {
    /** Key-value entries */
    entries: KeyValueEntry[];
    /** Layout direction */
    layout?: KeyValueLayout;
    /** Number of columns for grid layout */
    columns?: number;
    /** Whether to show dividers between entries */
    dividers?: boolean;
    /** Label width for inline layout */
    labelWidth?: string | number;
    /** Gap between entries */
    gap?: KeyValueGap;
    /** Section title (optional) */
    title?: string;
    /** Section title size */
    titleSize?: KeyValueTitleSize;
    /** Empty state message when no entries */
    emptyMessage?: string;
    /** Custom class name */
    className?: string;
}
/**
 * KeyValueSection - displays key-value pairs in structured layouts.
 *
 * @example
 * ```tsx
 * <KeyValueSection
 *   title="Actor Information"
 *   entries={[
 *     { label: "ID", value: actor.id },
 *     { label: "Status", value: actor.status },
 *     { label: "Uptime", value: "2d 4h" },
 *   ]}
 * />
 *
 * <KeyValueSection
 *   layout="grid"
 *   columns={2}
 *   entries={[
 *     { label: "CPU", value: "45%", icon: <CpuIcon /> },
 *     { label: "Memory", value: "2.1 GB", icon: <MemoryIcon /> },
 *   ]}
 * />
 * ```
 */
export declare function KeyValueSection({ entries, layout, columns, dividers, labelWidth, gap, title, titleSize, emptyMessage, className, }: KeyValueSectionProps): import("react/jsx-runtime").JSX.Element;
export default KeyValueSection;
//# sourceMappingURL=KeyValueSection.d.ts.map