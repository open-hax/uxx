/**
 * Select Component
 *
 * Styled dropdown select matching the Input component's visual style.
 */
import { type SelectHTMLAttributes } from 'react';
export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectVariant = 'default' | 'filled' | 'unstyled';
export interface SelectOption {
    readonly value: string;
    readonly label: string;
    readonly disabled?: boolean;
}
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    /** Size of the select */
    size?: SelectSize;
    /** Visual style variant */
    variant?: SelectVariant;
    /** Whether the select has an error */
    error?: boolean;
    /** Error message to display */
    errorMessage?: string;
    /** Options to render */
    options?: readonly SelectOption[];
    /** Placeholder option text (renders as first disabled option) */
    placeholder?: string;
}
export declare const Select: import("react").ForwardRefExoticComponent<SelectProps & import("react").RefAttributes<HTMLSelectElement>>;
export default Select;
//# sourceMappingURL=Select.d.ts.map