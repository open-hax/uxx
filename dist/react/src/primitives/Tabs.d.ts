/**
 * Tabs Component
 *
 * Implements the tabs.edn contract.
 * Tabbed content organization with keyboard navigation.
 */
import { type ReactNode } from 'react';
export type TabsVariant = 'default' | 'pills' | 'underline' | 'enclosed';
export type TabsSize = 'sm' | 'md' | 'lg';
export type TabsOrientation = 'horizontal' | 'vertical';
export interface TabItem {
    id: string;
    label: string;
    icon?: ReactNode;
    content?: ReactNode;
    disabled?: boolean;
    badge?: string;
    closable?: boolean;
}
export interface TabsProps {
    /** ID of currently active tab (controlled) */
    value?: string;
    /** ID of default active tab (uncontrolled) */
    defaultValue?: string;
    /** Callback when tab changes */
    onChange?: (value: string) => void;
    /** List of tab items */
    items: TabItem[];
    /** Visual style variant */
    variant?: TabsVariant;
    /** Size of tabs */
    size?: TabsSize;
    /** Orientation of tabs */
    orientation?: TabsOrientation;
    /** Whether to lazy render tab content */
    lazy?: boolean;
    /** Whether to keep inactive tabs mounted */
    keepMounted?: boolean;
    /** Whether to show close button */
    showClose?: boolean;
    /** Callback when tab close button is clicked */
    onClose?: (tabId: string) => void;
    /** Whether to show add button */
    addable?: boolean;
    /** Callback when add button is clicked */
    onAdd?: () => void;
}
/**
 * Tabbed content organization.
 *
 * @example
 * ```tsx
 * const tabs = [
 *   { id: 'tab1', label: 'Overview', content: <div>Overview content</div> },
 *   { id: 'tab2', label: 'Settings', content: <div>Settings content</div> },
 * ];
 *
 * <Tabs items={tabs} />
 * ```
 */
export declare function Tabs({ value: controlledValue, defaultValue, onChange, items, variant, size, orientation, lazy, keepMounted, showClose, onClose, addable, onAdd, }: TabsProps): import("react/jsx-runtime").JSX.Element;
export default Tabs;
//# sourceMappingURL=Tabs.d.ts.map