import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SearchableSelect Component
 *
 * Implements searchable-select-core.spec.md and searchable-select-keyboard.spec.md contracts.
 * Text input with dropdown suggestions, filtering, selection, and keyboard navigation.
 */
import { useState, useRef, useMemo, useCallback, useEffect, useId, } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
// Size styles
const sizeStyles = {
    sm: {
        padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
        fontSize: tokens.fontSize.sm,
    },
    md: {
        padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
        fontSize: tokens.fontSize.base,
    },
    lg: {
        padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
        fontSize: tokens.fontSize.lg,
    },
};
// Base styles
const containerStyles = {
    position: 'relative',
    width: '100%',
    fontFamily: tokens.fontFamily.sans,
};
const inputStyles = {
    width: '100%',
    fontFamily: tokens.fontFamily.sans,
    color: tokens.colors.text.default,
    backgroundColor: tokens.colors.background.surface,
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: `${tokens.spacing[1.5]}px`,
    outline: 'none',
    transition: tokens.transitions.colors,
    cursor: 'text',
};
const inputFocusStyles = {
    borderColor: tokens.colors.border.focus,
    boxShadow: `0 0 0 2px ${tokens.colors.border.focus}33`,
};
const inputDisabledStyles = {
    backgroundColor: tokens.colors.background.surface,
    color: tokens.colors.text.muted,
    cursor: 'not-allowed',
    opacity: 0.7,
};
const dropdownStyles = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: `${tokens.spacing[1]}px`,
    backgroundColor: tokens.colors.background.elevated,
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: `${tokens.spacing[1.5]}px`,
    boxShadow: tokens.shadow.lg,
    zIndex: tokens.zIndex.dropdown,
    maxHeight: '240px',
    overflow: 'auto',
};
const optionBaseStyles = {
    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
    cursor: 'pointer',
    transition: tokens.transitions.colors,
    color: tokens.colors.text.default,
};
const optionSelectedStyles = {
    backgroundColor: tokens.colors.background.elevated,
    fontWeight: tokens.fontWeight.medium,
};
const optionHighlightedStyles = {
    backgroundColor: tokens.colors.background.surface,
    outline: `2px solid ${tokens.colors.border.focus}`,
    outlineOffset: '-2px',
};
const emptyStateStyles = {
    padding: `${tokens.spacing[4]}px ${tokens.spacing[3]}px`,
    textAlign: 'center',
    color: tokens.colors.text.muted,
    fontSize: tokens.fontSize.sm,
};
const srOnlyStyles = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
};
const sectionLabelStyles = {
    padding: `${tokens.spacing[1]}px ${tokens.spacing[3]}px`,
    fontSize: tokens.fontSize.xs,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};
const dividerStyles = {
    height: '1px',
    backgroundColor: tokens.colors.border.default,
    margin: `${tokens.spacing[1]}px 0`,
};
const highlightStyles = {
    fontWeight: tokens.fontWeight.semibold,
};
const clearButtonStyles = {
    position: 'absolute',
    right: `${tokens.spacing[2]}px`,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: `${tokens.spacing[1]}px`,
    color: tokens.colors.text.muted,
    fontSize: '16px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: tokens.transitions.colors,
};
// Default functions
const defaultGetOptionLabel = (option) => {
    if (typeof option === 'string')
        return option;
    if (typeof option === 'number')
        return String(option);
    if (typeof option === 'object' && option !== null) {
        const obj = option;
        if ('label' in obj && typeof obj.label === 'string')
            return obj.label;
        if ('name' in obj && typeof obj.name === 'string')
            return obj.name;
    }
    return String(option);
};
const defaultGetOptionKey = (option) => {
    if (typeof option === 'string')
        return option;
    if (typeof option === 'number')
        return String(option);
    if (typeof option === 'object' && option !== null) {
        const obj = option;
        if ('id' in obj)
            return String(obj.id);
        if ('key' in obj)
            return String(obj.key);
        if ('value' in obj)
            return String(obj.value);
    }
    return defaultGetOptionLabel(option);
};
/**
 * Highlights matching text in an option label.
 */
function highlightMatch(text, query) {
    if (!query)
        return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1)
        return text;
    return (_jsxs(_Fragment, { children: [text.slice(0, index), _jsx("strong", { style: highlightStyles, children: text.slice(index, index + query.length) }), text.slice(index + query.length)] }));
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
export function SearchableSelect({ options, value, onChange, getOptionLabel = defaultGetOptionLabel, getOptionKey = defaultGetOptionKey, placeholder = 'Search...', disabled = false, clearable = false, maxSuggestions = 10, size = 'md', noOptionsMessage = 'No options found', className, ariaLabel, ariaDescribedBy, recentOptions, maxRecentOptions = 5, highlightMatches = false, }) {
    const [inputValue, setInputValue] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [announcement, setAnnouncement] = useState('');
    const inputRef = useRef(null);
    const optionRefs = useRef([]);
    // Filter function
    const matchesFilter = useCallback((option, input) => {
        if (!input)
            return true;
        return getOptionLabel(option).toLowerCase().includes(input.toLowerCase());
    }, [getOptionLabel]);
    // Filter recent options
    const filteredRecent = useMemo(() => {
        if (!recentOptions)
            return [];
        return recentOptions
            .filter(opt => matchesFilter(opt, inputValue))
            .slice(0, maxRecentOptions);
    }, [recentOptions, inputValue, maxRecentOptions, matchesFilter]);
    // Filter all options (excluding recent)
    const filteredAll = useMemo(() => {
        const recentKeys = new Set(filteredRecent.map(getOptionKey));
        return options
            .filter(opt => matchesFilter(opt, inputValue))
            .filter(opt => !recentKeys.has(getOptionKey(opt)))
            .slice(0, maxSuggestions);
    }, [options, inputValue, maxSuggestions, filteredRecent, getOptionKey, matchesFilter]);
    // Combined options for keyboard navigation
    const allFilteredOptions = useMemo(() => {
        return [...filteredRecent, ...filteredAll];
    }, [filteredRecent, filteredAll]);
    // Generate unique IDs for ARIA
    const id = useId();
    const listboxId = `${id}-listbox`;
    const getOptionId = (index) => `${id}-option-${index}`;
    // Reset highlight when filter changes
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [inputValue]);
    // Sync input with value
    useEffect(() => {
        if (value !== null && value !== undefined) {
            setInputValue(getOptionLabel(value));
        }
    }, [value, getOptionLabel]);
    // Scroll highlighted option into view
    useEffect(() => {
        if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
            optionRefs.current[highlightedIndex]?.scrollIntoView({
                block: 'nearest',
            });
        }
    }, [highlightedIndex]);
    // Announce option count when dropdown opens
    useEffect(() => {
        if (showDropdown && allFilteredOptions.length > 0) {
            setAnnouncement(`${allFilteredOptions.length} option${allFilteredOptions.length === 1 ? '' : 's'} available`);
        }
    }, [showDropdown, allFilteredOptions.length]);
    // Handle selection
    const handleSelect = useCallback((option) => {
        const label = getOptionLabel(option);
        setInputValue(label);
        setShowDropdown(false);
        setHighlightedIndex(-1);
        setAnnouncement(`Selected ${label}`);
        onChange(option);
    }, [getOptionLabel, onChange]);
    // Handle clear
    const handleClear = useCallback(() => {
        setInputValue('');
        setHighlightedIndex(-1);
        inputRef.current?.focus();
    }, []);
    // Handle input change
    const handleInputChange = useCallback((e) => {
        setInputValue(e.target.value);
        setShowDropdown(true);
    }, []);
    // Handle focus
    const handleFocus = useCallback(() => {
        if (!disabled) {
            setShowDropdown(true);
            setIsFocused(true);
        }
    }, [disabled]);
    // Handle blur
    const handleBlur = useCallback(() => {
        // Delay to allow click to register on dropdown options
        setTimeout(() => {
            setShowDropdown(false);
            setIsFocused(false);
            setHighlightedIndex(-1);
        }, 100);
    }, []);
    // Handle keyboard navigation
    const handleKeyDown = useCallback((e) => {
        if (disabled)
            return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!showDropdown) {
                    setShowDropdown(true);
                }
                else if (highlightedIndex < allFilteredOptions.length - 1) {
                    setHighlightedIndex(i => i + 1);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (showDropdown && highlightedIndex > 0) {
                    setHighlightedIndex(i => i - 1);
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && allFilteredOptions[highlightedIndex]) {
                    handleSelect(allFilteredOptions[highlightedIndex]);
                }
                else if (allFilteredOptions.length > 0) {
                    handleSelect(allFilteredOptions[0]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setShowDropdown(false);
                setHighlightedIndex(-1);
                break;
            case 'Tab':
                if (highlightedIndex >= 0 && allFilteredOptions[highlightedIndex]) {
                    handleSelect(allFilteredOptions[highlightedIndex]);
                }
                break;
        }
    }, [disabled, showDropdown, highlightedIndex, allFilteredOptions, handleSelect]);
    // Get selected key for comparison
    const selectedKey = value !== null && value !== undefined
        ? getOptionKey(value)
        : null;
    // Compute input styles
    const computedInputStyles = {
        ...inputStyles,
        ...sizeStyles[size],
        ...(isFocused ? inputFocusStyles : {}),
        ...(disabled ? inputDisabledStyles : {}),
        paddingRight: clearable && value ? `${tokens.spacing[8]}px` : undefined,
    };
    return (_jsxs("div", { role: "combobox", "aria-expanded": showDropdown, "aria-haspopup": "listbox", style: containerStyles, className: className, "data-component": "searchable-select", "data-size": size, "data-disabled": disabled, children: [_jsx("input", { ref: inputRef, type: "text", value: inputValue, placeholder: placeholder, disabled: disabled, style: computedInputStyles, onChange: handleInputChange, onFocus: handleFocus, onBlur: handleBlur, onKeyDown: handleKeyDown, "aria-label": ariaLabel || placeholder, "aria-describedby": ariaDescribedBy, "aria-autocomplete": "list", "aria-controls": showDropdown ? listboxId : undefined, "aria-activedescendant": highlightedIndex >= 0
                    ? getOptionId(highlightedIndex)
                    : undefined }), _jsx("div", { role: "status", "aria-live": "polite", style: srOnlyStyles, children: announcement }), clearable && value && !disabled && (_jsx("button", { type: "button", style: clearButtonStyles, onClick: handleClear, "aria-label": "Clear selection", tabIndex: -1, children: "\u00D7" })), showDropdown && allFilteredOptions.length > 0 && (_jsxs("ul", { role: "listbox", id: listboxId, style: dropdownStyles, "data-component": "searchable-select-dropdown", children: [filteredRecent.length > 0 && (_jsxs(_Fragment, { children: [_jsx("li", { role: "presentation", style: sectionLabelStyles, children: "Recent" }), filteredRecent.map((option, index) => {
                                const key = getOptionKey(option);
                                const label = getOptionLabel(option);
                                const isSelected = key === selectedKey;
                                const isHighlighted = index === highlightedIndex;
                                return (_jsx("li", { ref: el => { optionRefs.current[index] = el; }, id: getOptionId(index), role: "option", "aria-selected": isSelected, style: {
                                        ...optionBaseStyles,
                                        ...(isSelected ? optionSelectedStyles : {}),
                                        ...(isHighlighted ? optionHighlightedStyles : {}),
                                    }, onClick: () => handleSelect(option), onMouseEnter: () => setHighlightedIndex(index), onMouseLeave: () => setHighlightedIndex(-1), children: highlightMatches ? highlightMatch(label, inputValue) : label }, key));
                            }), filteredAll.length > 0 && (_jsx("li", { role: "presentation", style: dividerStyles }))] })), filteredAll.map((option, index) => {
                        const actualIndex = filteredRecent.length + index;
                        const key = getOptionKey(option);
                        const label = getOptionLabel(option);
                        const isSelected = key === selectedKey;
                        const isHighlighted = actualIndex === highlightedIndex;
                        return (_jsx("li", { ref: el => { optionRefs.current[actualIndex] = el; }, id: getOptionId(actualIndex), role: "option", "aria-selected": isSelected, style: {
                                ...optionBaseStyles,
                                ...(isSelected ? optionSelectedStyles : {}),
                                ...(isHighlighted ? optionHighlightedStyles : {}),
                            }, onClick: () => handleSelect(option), onMouseEnter: () => setHighlightedIndex(actualIndex), onMouseLeave: () => setHighlightedIndex(-1), children: highlightMatches ? highlightMatch(label, inputValue) : label }, key));
                    })] })), showDropdown && allFilteredOptions.length === 0 && (_jsx("div", { style: dropdownStyles, children: _jsx("div", { style: emptyStateStyles, children: noOptionsMessage }) }))] }));
}
export default SearchableSelect;
//# sourceMappingURL=SearchableSelect.js.map