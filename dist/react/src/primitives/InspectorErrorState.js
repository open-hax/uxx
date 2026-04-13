import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
export function InspectorErrorState({ error, onRetry, retryLabel = 'Retry', }) {
    const retryable = error.retryable ?? true;
    return (_jsxs("div", { "data-component": "inspector-error-state", "data-testid": "inspector-pane-error", style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: `${tokens.spacing[2]}px`,
            padding: `${tokens.spacing[2]}px`,
            border: `1px solid ${tokens.colors.accent.red}`,
            borderRadius: `${tokens.spacing[1]}px`,
            background: tokens.colors.alpha.red._12,
            color: tokens.colors.text.default,
        }, children: [_jsx("div", { "data-testid": "inspector-pane-error-message", style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    flex: 1,
                }, children: error.message }), retryable && onRetry && (_jsx("button", { type: "button", "data-testid": "inspector-pane-error-retry", onClick: onRetry, style: {
                    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
                    border: `1px solid ${tokens.colors.border.default}`,
                    borderRadius: `${tokens.spacing[0.5]}px`,
                    fontSize: tokens.typography.bodySm.fontSize,
                    background: tokens.colors.background.default,
                    color: tokens.colors.text.default,
                    cursor: 'pointer',
                }, children: retryLabel }))] }));
}
export default InspectorErrorState;
//# sourceMappingURL=InspectorErrorState.js.map