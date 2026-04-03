/**
 * CollapsiblePanel Component
 *
 * Implements the collapsible-panel.spec.md contract.
 * Expandable/collapsible content section with animated header.
 */
import { type ReactNode } from 'react';
export type CollapsiblePanelVariant = 'default' | 'outlined' | 'elevated';
export interface CollapsiblePanelStat {
    /** Stat label */
    label: string;
    /** Stat value */
    value: string | number;
    /** Optional color override */
    color?: string;
}
export interface CollapsiblePanelProps {
    /** Panel title */
    title: string;
    /** Optional count badge */
    count?: number;
    /** Whether panel starts collapsed */
    defaultCollapsed?: boolean;
    /** Controlled collapse state */
    collapsed?: boolean;
    /** Callback when collapse state changes */
    onCollapseChange?: (collapsed: boolean) => void;
    /** Panel content */
    children: ReactNode;
    /** Optional header content (replaces default) */
    headerContent?: ReactNode;
    /** Optional extra header content (renders after title/count) */
    extraHeaderContent?: ReactNode;
    /** Stats summary in header */
    stats?: CollapsiblePanelStat[];
    /** Maximum height of content area */
    maxHeight?: number | string;
    /** Visual variant */
    variant?: CollapsiblePanelVariant;
    /** Whether to animate expand/collapse */
    animate?: boolean;
    /** Custom class name */
    className?: string;
    /** Custom header class name */
    headerClassName?: string;
    /** Custom content class name */
    contentClassName?: string;
}
/**
 * CollapsiblePanel - expandable/collapsible content section.
 *
 * @example
 * ```tsx
 * <CollapsiblePanel title="Events" count={events.length}>
 *   <EventList events={events} />
 * </CollapsiblePanel>
 *
 * <CollapsiblePanel
 *   title="Statistics"
 *   stats={[
 *     { label: 'Total', value: 42 },
 *     { label: 'Active', value: 17 },
 *   ]}
 *   variant="outlined"
 * >
 *   <StatsDetail />
 * </CollapsiblePanel>
 * ```
 */
export declare function CollapsiblePanel({ title, count, defaultCollapsed, collapsed: controlledCollapsed, onCollapseChange, children, headerContent, extraHeaderContent, stats, maxHeight, variant, animate, className, headerClassName, contentClassName, }: CollapsiblePanelProps): import("react/jsx-runtime").JSX.Element;
export default CollapsiblePanel;
//# sourceMappingURL=CollapsiblePanel.d.ts.map