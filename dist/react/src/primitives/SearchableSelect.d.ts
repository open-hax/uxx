/**
 * SearchableSelect Component
 *
 * Implements searchable-select-core.spec.md and searchable-select-keyboard.spec.md contracts.
 * Text input with dropdown suggestions, filtering, selection, and keyboard navigation.
 */
export type SearchableSelectSize = 'sm' | 'md' | 'lg';
export interface SearchableSelectProps<T = string> {
    /** Options to search and select from */
    options: T[];
    /** Currently selected value */
    value?: T | null;
    /** Callback when selection changes */
    onChange: (value: T) => void;
    /** Function to get display string from option */
    getOptionLabel?: (option: T) => string;
    /** Function to get unique key from option */
    getOptionKey?: (option: T) => string;
    /** Placeholder text for input */
    placeholder?: string;
    /** Whether the select is disabled */
    disabled?: boolean;
    /** Whether to show clear button */
    clearable?: boolean;
    /** Maximum number of suggestions to show */
    maxSuggestions?: number;
    /** Input size */
    size?: SearchableSelectSize;
    /** Custom empty state message */
    noOptionsMessage?: string;
    /** Custom class name */
    className?: string;
    /** Accessible label for the combobox */
    ariaLabel?: string;
    /** ID of element that describes the combobox */
    ariaDescribedBy?: string;
    /** Recent selections (shown at top) */
    recentOptions?: T[];
    /** Maximum recent options to show */
    maxRecentOptions?: number;
    /** Whether to highlight matching text in options */
    highlightMatches?: boolean;
}
/**
 * SearchableSelect - text input with dropdown suggestions and keyboard navigation.
 *
 * @example
 * ```tsx
 * // String options
 * <SearchableSelect
 *   options={['apple', 'banana', 'cherry']}
 *   value={selected}
 *   onChange={setSelected}
 *   placeholder="Select a fruit..."
 * />
 *
 * // Object options
 * <SearchableSelect
 *   options={users}
 *   value={selectedUser}
 *   onChange={setSelectedUser}
 *   getOptionLabel={user => user.name}
 *   getOptionKey={user => user.id}
 *   placeholder="Select a user..."
 *   clearable
 * />
 * ```
 */
export declare function SearchableSelect<T = string>({ options, value, onChange, getOptionLabel, getOptionKey, placeholder, disabled, clearable, maxSuggestions, size, noOptionsMessage, className, ariaLabel, ariaDescribedBy, recentOptions, maxRecentOptions, highlightMatches, }: SearchableSelectProps<T>): import("react/jsx-runtime").JSX.Element;
export default SearchableSelect;
//# sourceMappingURL=SearchableSelect.d.ts.map