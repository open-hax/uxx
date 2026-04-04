import { type CSSProperties } from 'react';
import { type InputPrompt } from './PermissionPrompts.types.js';
export interface PromptCardProps {
    prompt: InputPrompt;
    onResponse: (id: string, response: string) => void;
    autoFocus?: boolean;
    submitLabel?: string;
    style?: CSSProperties;
    className?: string;
}
export declare function PromptCard({ prompt, onResponse, autoFocus, submitLabel, style, className }: PromptCardProps): import("react/jsx-runtime").JSX.Element;
export default PromptCard;
//# sourceMappingURL=PromptCard.d.ts.map