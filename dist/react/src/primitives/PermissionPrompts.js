import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PermissionPrompts Component
 *
 * Implements the permission-prompts.edn contract.
 * A panel for handling permission requests and input prompts from an AI agent or system,
 * with options for one-time approval, persistent approval, and rejection.
 */
import { useState } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
/**
 * Extract prompt text from body object.
 */
function getPromptText(body) {
    if (!body)
        return 'Enter input';
    if (typeof body === 'string')
        return body;
    return body.prompt || 'Enter input';
}
/**
 * Render a single permission request card.
 */
function PermissionCard({ permission, onResponse, showMetadata, }) {
    const defaultResponse = permission.defaultResponse || 'once';
    return (_jsxs("div", { "data-testid": "permission-card", "data-permission-id": permission.id, style: {
            padding: `${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[1]}px`,
            background: tokens.colors.background.default,
            marginBottom: `${tokens.spacing[2]}px`,
        }, children: [_jsx("div", { style: {
                    fontSize: tokens.typography.body.fontSize,
                    fontWeight: tokens.fontWeight.medium,
                    color: tokens.colors.text.default,
                    marginBottom: `${tokens.spacing[2]}px`,
                }, children: permission.title || 'Permission Request' }), showMetadata && permission.metadata && (_jsxs("div", { style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.secondary,
                    marginBottom: `${tokens.spacing[2]}px`,
                    fontFamily: tokens.fontFamily.mono,
                }, children: [typeof permission.metadata.path === 'string' && _jsxs("span", { children: ["Path: ", permission.metadata.path] }), typeof permission.metadata.command === 'string' && _jsxs("span", { children: ["Command: ", permission.metadata.command] }), !permission.metadata.path && !permission.metadata.command && (_jsx("span", { children: JSON.stringify(permission.metadata) }))] })), permission.sessionId && (_jsxs("div", { style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.muted,
                    marginBottom: `${tokens.spacing[2]}px`,
                }, children: ["Session: ", permission.sessionId] })), permission.timeoutMs && (_jsxs("div", { style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.muted,
                    marginBottom: `${tokens.spacing[2]}px`,
                }, children: ["Expires in ", Math.floor(permission.timeoutMs / 1000), "s"] })), _jsxs("div", { style: {
                    display: 'flex',
                    gap: `${tokens.spacing[2]}px`,
                    flexWrap: 'wrap',
                }, children: [_jsx("button", { type: "button", "data-testid": "permission-btn-once", onClick: () => onResponse(permission.id, 'once'), style: {
                            flex: 1,
                            minWidth: '80px',
                            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
                            border: `1px solid ${tokens.colors.border.default}`,
                            borderRadius: `${tokens.spacing[0.5]}px`,
                            fontSize: tokens.typography.bodySm.fontSize,
                            background: defaultResponse === 'once'
                                ? tokens.colors.background.elevated
                                : tokens.colors.background.default,
                            color: tokens.colors.text.default,
                            cursor: 'pointer',
                        }, children: "Allow Once" }), _jsx("button", { type: "button", "data-testid": "permission-btn-always", onClick: () => onResponse(permission.id, 'always'), style: {
                            flex: 1,
                            minWidth: '80px',
                            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
                            border: `1px solid ${tokens.colors.accent.green}`,
                            borderRadius: `${tokens.spacing[0.5]}px`,
                            fontSize: tokens.typography.bodySm.fontSize,
                            background: defaultResponse === 'always'
                                ? tokens.colors.accent.green
                                : 'transparent',
                            color: defaultResponse === 'always'
                                ? tokens.colors.background.default
                                : tokens.colors.accent.green,
                            cursor: 'pointer',
                        }, children: "Always Allow" }), _jsx("button", { type: "button", "data-testid": "permission-btn-reject", onClick: () => onResponse(permission.id, 'reject'), style: {
                            flex: 1,
                            minWidth: '80px',
                            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
                            border: `1px solid ${tokens.colors.accent.red}`,
                            borderRadius: `${tokens.spacing[0.5]}px`,
                            fontSize: tokens.typography.bodySm.fontSize,
                            background: defaultResponse === 'reject'
                                ? tokens.colors.accent.red
                                : 'transparent',
                            color: defaultResponse === 'reject'
                                ? tokens.colors.background.default
                                : tokens.colors.accent.red,
                            cursor: 'pointer',
                        }, children: "Reject" })] })] }));
}
/**
 * Render a single input prompt card.
 */
function PromptCard({ prompt, onResponse, autoFocus, }) {
    const [inputValue, setInputValue] = useState('');
    const multiline = prompt.multiline || false;
    const promptText = getPromptText(prompt.body);
    const handleSubmit = () => {
        if (inputValue.trim()) {
            onResponse(prompt.id, inputValue);
            setInputValue('');
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !multiline && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };
    return (_jsxs("div", { "data-testid": "prompt-card", "data-prompt-id": prompt.id, style: {
            padding: `${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[1]}px`,
            background: tokens.colors.background.default,
            marginBottom: `${tokens.spacing[2]}px`,
        }, children: [_jsx("div", { style: {
                    fontSize: tokens.typography.body.fontSize,
                    fontWeight: tokens.fontWeight.medium,
                    color: tokens.colors.text.default,
                    marginBottom: `${tokens.spacing[2]}px`,
                }, children: prompt.title || 'Input Required' }), _jsx("div", { style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.secondary,
                    marginBottom: `${tokens.spacing[2]}px`,
                }, children: promptText }), prompt.sessionId && (_jsxs("div", { style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.muted,
                    marginBottom: `${tokens.spacing[2]}px`,
                }, children: ["Session: ", prompt.sessionId] })), multiline ? (_jsx("textarea", { "data-testid": "prompt-input", value: inputValue, onChange: (e) => setInputValue(e.target.value), placeholder: prompt.placeholder || 'Enter response...', autoFocus: autoFocus, rows: 3, style: {
                    width: '100%',
                    padding: `${tokens.spacing[2]}px`,
                    border: `1px solid ${tokens.colors.border.default}`,
                    borderRadius: `${tokens.spacing[0.5]}px`,
                    fontSize: tokens.typography.bodySm.fontSize,
                    fontFamily: tokens.fontFamily.mono,
                    background: tokens.colors.background.elevated,
                    color: tokens.colors.text.default,
                    boxSizing: 'border-box',
                    outline: 'none',
                    minHeight: '60px',
                    resize: 'vertical',
                } })) : (_jsx("input", { type: "text", "data-testid": "prompt-input", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyDown: handleKeyDown, placeholder: prompt.placeholder || 'Enter response...', autoFocus: autoFocus, style: {
                    width: '100%',
                    padding: `${tokens.spacing[2]}px`,
                    border: `1px solid ${tokens.colors.border.default}`,
                    borderRadius: `${tokens.spacing[0.5]}px`,
                    fontSize: tokens.typography.bodySm.fontSize,
                    fontFamily: tokens.fontFamily.mono,
                    background: tokens.colors.background.elevated,
                    color: tokens.colors.text.default,
                    boxSizing: 'border-box',
                    outline: 'none',
                } })), _jsx("button", { type: "button", "data-testid": "prompt-submit", onClick: handleSubmit, disabled: !inputValue.trim(), style: {
                    marginTop: `${tokens.spacing[2]}px`,
                    width: '100%',
                    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
                    border: `1px solid ${tokens.colors.accent.green}`,
                    borderRadius: `${tokens.spacing[0.5]}px`,
                    fontSize: tokens.typography.bodySm.fontSize,
                    background: !inputValue.trim()
                        ? tokens.colors.background.elevated
                        : tokens.colors.accent.green,
                    color: !inputValue.trim()
                        ? tokens.colors.text.muted
                        : tokens.colors.background.default,
                    cursor: !inputValue.trim() ? 'not-allowed' : 'pointer',
                }, children: "Submit" })] }));
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