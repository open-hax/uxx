/**
 * WhichKeyPopup Component
 *
 * Implements the which-key-popup.edn contract.
 * A popup that displays available keybindings when a prefix key is pressed,
 * following Emacs which-key conventions.
 */
export type WhichKeyPosition = 'bottom' | 'top' | 'auto';
export type WhichKeySortKey = 'key' | 'description' | 'none';
export interface BindingEntry {
    /** Key sequence to display */
    key: string;
    /** Description of the binding */
    description: string;
    /** Category for grouping */
    category?: string;
    /** Command identifier */
    command?: string;
    /** Whether this is a destructive action */
    destructive?: boolean;
}
export interface WhichKeyPopupProps {
    /** Whether the popup is currently visible */
    active?: boolean;
    /** The key sequence prefix that triggered the popup */
    prefix?: string[];
    /** List of available bindings */
    bindings: BindingEntry[];
    /** Where to position the popup relative to viewport */
    position?: WhichKeyPosition;
    /** Maximum number of columns to display */
    maxColumns?: number;
    /** How to sort the bindings */
    sortKey?: WhichKeySortKey;
    /** Whether to show category headers */
    showCategory?: boolean;
    /** Auto-dismiss timeout (0 = disabled) */
    timeoutMs?: number;
    /** Callback when a binding is selected */
    onSelect?: (binding: BindingEntry | null) => void;
}
/**
 * Popup component displaying available keybindings.
 *
 * @example
 * ```tsx
 * <WhichKeyPopup
 *   active={showPopup}
 *   prefix={["SPC", "f"]}
 *   bindings={[
 *     { key: "f", description: "Find file", category: "File" },
 *     { key: "s", description: "Save file", category: "File" },
 *     { key: "d", description: "Delete file", category: "File", destructive: true },
 *   ]}
 *   position="bottom"
 * />
 * ```
 */
export declare function WhichKeyPopup({ active, prefix, bindings, position, maxColumns, sortKey, showCategory, timeoutMs, onSelect, }: WhichKeyPopupProps): import("react/jsx-runtime").JSX.Element;
export default WhichKeyPopup;
//# sourceMappingURL=WhichKeyPopup.d.ts.map