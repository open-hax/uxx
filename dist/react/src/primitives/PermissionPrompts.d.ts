/**
 * PermissionPrompts Component
 *
 * Implements the permission-prompts.edn contract.
 * A panel for handling permission requests and input prompts from an AI agent or system,
 * with options for one-time approval, persistent approval, and rejection.
 */
import type { PermissionRequest, InputPrompt, PermissionResponse } from './PermissionPrompts.types.js';
export type { PermissionRequest, InputPrompt, PermissionResponse } from './PermissionPrompts.types.js';
export interface PermissionPromptsProps {
    /** Pending permission requests */
    permissions?: PermissionRequest[];
    /** Pending input prompts */
    prompts?: InputPrompt[];
    /** Callback for permission response */
    onPermissionResponse: (id: string, response: PermissionResponse) => void;
    /** Callback for input prompt response */
    onPromptResponse: (id: string, response: string) => void;
    /** Auto-focus input fields */
    autoFocusInput?: boolean;
    /** Show permission metadata */
    showMetadata?: boolean;
    /** Group prompts by session */
    groupBySession?: boolean;
}
/**
 * Panel for handling permission requests and input prompts.
 *
 * @example
 * ```tsx
 * <PermissionPrompts
 *   permissions={[{ id: 'perm-1', title: 'Read file', metadata: { path: '/src/core.ts' } }]}
 *   prompts={[{ id: 'prompt-1', title: 'Input', body: { prompt: 'Name?' } }]}
 *   onPermissionResponse={(id, resp) => handlePerm(id, resp)}
 *   onPromptResponse={(id, resp) => handlePrompt(id, resp)}
 * />
 * ```
 */
export declare function PermissionPrompts({ permissions, prompts, onPermissionResponse, onPromptResponse, autoFocusInput, showMetadata, groupBySession, }: PermissionPromptsProps): import("react/jsx-runtime").JSX.Element;
export default PermissionPrompts;
//# sourceMappingURL=PermissionPrompts.d.ts.map