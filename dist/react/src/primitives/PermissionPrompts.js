import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PermissionPrompts Component
 *
 * Implements the permission-prompts.edn contract.
 * A panel for handling permission requests and input prompts from an AI agent or system,
 * with options for one-time approval, persistent approval, and rejection.
 */
import { tokens } from '@open-hax/uxx/tokens';
import { PermissionCard } from './PermissionCard.js';
import { PromptCard } from './PromptCard.js';
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
export function PermissionPrompts({ permissions = [], prompts = [], onPermissionResponse, onPromptResponse, autoFocusInput = true, showMetadata = true, groupBySession = false, }) {
    const pendingCount = permissions.length + prompts.length;
    const hasPending = pendingCount > 0;
    return (_jsxs("div", { "data-component": "permission-prompts", "data-pending-count": pendingCount, role: "region", "aria-label": "Pending requests", "aria-live": "polite", style: {
            padding: `${tokens.spacing[3]}px`,
            backgroundColor: tokens.colors.background.surface,
            minHeight: '100%',
        }, children: [_jsxs("div", { style: {
                    marginBottom: `${tokens.spacing[3]}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }, children: [_jsx("h3", { style: {
                            margin: 0,
                            fontSize: tokens.typography.bodySm.fontSize,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: tokens.colors.text.muted,
                        }, children: "Pending Requests" }), hasPending && (_jsx("span", { style: {
                            fontSize: tokens.typography.bodySm.fontSize,
                            color: tokens.colors.accent.green,
                            padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
                            background: tokens.colors.alpha.green._12,
                            borderRadius: `${tokens.spacing[0.5]}px`,
                        }, children: pendingCount }))] }), !hasPending && (_jsx("div", { "data-testid": "prompts-empty", style: {
                    padding: `${tokens.spacing[4]}px`,
                    textAlign: 'center',
                    color: tokens.colors.text.muted,
                    fontSize: tokens.typography.bodySm.fontSize,
                }, children: "No pending requests" })), permissions.length > 0 && (_jsx("div", { className: "permissions-section", children: permissions.map((permission) => (_jsx(PermissionCard, { permission: permission, onResponse: onPermissionResponse, showMetadata: showMetadata }, permission.id))) })), prompts.length > 0 && (_jsx("div", { className: "prompts-section", children: prompts.map((prompt, idx) => (_jsx(PromptCard, { prompt: prompt, onResponse: onPromptResponse, autoFocus: autoFocusInput && idx === 0 }, prompt.id))) }))] }));
}
export default PermissionPrompts;
//# sourceMappingURL=PermissionPrompts.js.map