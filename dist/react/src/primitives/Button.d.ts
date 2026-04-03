/**
 * Button Component
 *
 * Implements the button.edn contract.
 * Provides consistent button styling across React applications.
 */
import { type ButtonHTMLAttributes, type ReactNode } from 'react';
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style' | 'className'> {
    /** Visual style variant */
    variant?: ButtonVariant;
    /** Size of the button */
    size?: ButtonSize;
    /** Disabled state */
    disabled?: boolean;
    /** Loading state - shows spinner and disables click */
    loading?: boolean;
    /** Full width button */
    fullWidth?: boolean;
    /** Icon before text */
    iconStart?: ReactNode;
    /** Icon after text */
    iconEnd?: ReactNode;
    /** Button content */
    children?: ReactNode;
}
/**
 * Button component with variants, sizes, and loading state.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={() => alert('Clicked!')}>
 *   Click me
 * </Button>
 *
 * <Button variant="danger" loading>
 *   Deleting...
 * </Button>
 * ```
 */
export declare const Button: import("react").ForwardRefExoticComponent<ButtonProps & import("react").RefAttributes<HTMLButtonElement>>;
export default Button;
//# sourceMappingURL=Button.d.ts.map