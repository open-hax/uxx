/**
 * Input Component
 *
 * Implements the input.edn contract.
 * Text input field with validation states, icons, and sizing.
 */
import { type ChangeEvent, type FocusEvent } from 'react';
export type InputType = 'text' | 'password' | 'email' | 'number' | 'search' | 'url' | 'tel';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'unstyled';
export interface InputProps {
    /** Type of input */
    type?: InputType;
    /** Current value */
    value?: string;
    /** Default value for uncontrolled input */
    defaultValue?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Size of the input */
    size?: InputSize;
    /** Visual style variant */
    variant?: InputVariant;
    /** Whether the input is disabled */
    disabled?: boolean;
    /** Whether the input is read-only */
    readonly?: boolean;
    /** Whether the input is required */
    required?: boolean;
    /** Whether the input has an error */
    error?: boolean;
    /** Error message to display */
    errorMessage?: string;
    /** Icon to display on the left */
    leftIcon?: React.ReactNode;
    /** Icon to display on the right */
    rightIcon?: React.ReactNode;
    /** Change event handler */
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    /** Focus event handler */
    onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
    /** Blur event handler */
    onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
    /** Input name */
    name?: string;
    /** Input ID */
    id?: string;
    /** Auto focus */
    autoFocus?: boolean;
    /** Auto complete */
    autoComplete?: string;
    /** Max length */
    maxLength?: number;
    /** Min length */
    minLength?: number;
    /** Pattern */
    pattern?: string;
}
/**
 * Text input field with validation states, icons, and sizing.
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter your name" />
 *
 * <Input
 *   type="email"
 *   placeholder="Email"
 *   leftIcon={<EmailIcon />}
 *   error
 *   errorMessage="Invalid email format"
 * />
 * ```
 */
export declare const Input: import("react").ForwardRefExoticComponent<InputProps & import("react").RefAttributes<HTMLInputElement>>;
export default Input;
//# sourceMappingURL=Input.d.ts.map