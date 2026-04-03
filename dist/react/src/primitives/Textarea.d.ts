/**
 * Textarea Component
 *
 * Styled multi-line text input matching the Input component's visual style.
 */
import { type TextareaHTMLAttributes } from 'react';
export type TextareaSize = 'sm' | 'md' | 'lg';
export type TextareaVariant = 'default' | 'filled' | 'unstyled';
export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
    /** Size of the textarea */
    size?: TextareaSize;
    /** Visual style variant */
    variant?: TextareaVariant;
    /** Whether the textarea has an error */
    error?: boolean;
    /** Error message to display */
    errorMessage?: string;
}
export declare const Textarea: import("react").ForwardRefExoticComponent<TextareaProps & import("react").RefAttributes<HTMLTextAreaElement>>;
export default Textarea;
//# sourceMappingURL=Textarea.d.ts.map