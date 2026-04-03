/**
 * CommandPalette Component
 *
 * Implements the command-palette.edn contract.
 * Quick action search palette with keyboard navigation and fuzzy search.
 */
import { type ReactNode } from 'react';
export interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon?: ReactNode;
    shortcut?: string;
    category?: string;
    action?: () => void;
    disabled?: boolean;
}
export interface CommandGroup {
    id: string;
    label: string;
    items: CommandItem[];
}
export interface CommandPaletteProps {
    /** Whether the palette is currently open */
    open?: boolean;
    /** Callback fired when palette should close */
    onClose: () => void;
    /** Callback fired when an item is selected */
    onSelect: (item: CommandItem) => void;
    /** Placeholder text for search input */
    placeholder?: string;
    /** List of command items */
    items: CommandItem[];
    /** Optional grouping of commands */
    groups?: CommandGroup[];
    /** Recently used items shown at top */
    recentItems?: CommandItem[];
    /** Maximum number of results */
    maxResults?: number;
    /** Content to show when no results */
    emptyState?: ReactNode;
    /** Whether commands are loading */
    loading?: boolean;
    /** Keyboard shortcut hint */
    shortcut?: string;
}
/**
 * Command palette for quick actions and search.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <CommandPalette
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   onSelect={(item) => { item.action?.(); setOpen(false); }}
 *   items={[
 *     { id: 'new', label: 'New File', shortcut: '⌘N', icon: <FileIcon /> },
 *     { id: 'open', label: 'Open File', shortcut: '⌘O', icon: <FolderIcon /> },
 *   ]}
 * />
 * ```
 */
export declare function CommandPalette({ open, onClose, onSelect, placeholder, items, groups, recentItems, maxResults, emptyState, loading, shortcut, }: CommandPaletteProps): import("react").ReactPortal | null;
export default CommandPalette;
//# sourceMappingURL=CommandPalette.d.ts.map