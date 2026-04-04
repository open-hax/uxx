import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
const rootStyles = {
    padding: `${tokens.spacing[3]}px`,
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: `${tokens.spacing[1]}px`,
    background: tokens.colors.background.default,
    marginBottom: `${tokens.spacing[2]}px`,
};
const titleStyles = {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: tokens.fontWeight.medium,
    color: tokens.colors.text.default,
    marginBottom: `${tokens.spacing[2]}px`,
};
const mutedStyles = {
    fontSize: tokens.typography.bodySm.fontSize,
    color: tokens.colors.text.muted,
    marginBottom: `${tokens.spacing[2]}px`,
};
const metadataStyles = {
    fontSize: tokens.typography.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    marginBottom: `${tokens.spacing[2]}px`,
    fontFamily: tokens.fontFamily.mono,
};
const actionsStyles = {
    display: 'flex',
    gap: `${tokens.spacing[2]}px`,
    flexWrap: 'wrap',
};
function renderMetadata(metadata) {
    if (!metadata)
        return null;
    if (typeof metadata.path === 'string')
        return _jsxs("span", { children: ["Path: ", metadata.path] });
    if (typeof metadata.command === 'string')
        return _jsxs("span", { children: ["Command: ", metadata.command] });
    return _jsx("span", { children: JSON.stringify(metadata) });
}
export function PermissionCard({ permission, onResponse, showMetadata = true, style, className }) {
    const defaultResponse = permission.defaultResponse || 'once';
    return (_jsxs("div", { "data-component": "permission-card", "data-testid": "permission-card", "data-permission-id": permission.id, style: { ...rootStyles, ...style }, className: className, children: [_jsx("div", { style: titleStyles, children: permission.title || 'Permission Request' }), showMetadata && permission.metadata && _jsx("div", { style: metadataStyles, children: renderMetadata(permission.metadata) }), permission.sessionId && _jsxs("div", { style: mutedStyles, children: ["Session: ", permission.sessionId] }), permission.timeoutMs && _jsxs("div", { style: mutedStyles, children: ["Expires in ", Math.floor(permission.timeoutMs / 1000), "s"] }), _jsxs("div", { style: actionsStyles, children: [_jsx("button", { type: "button", "data-testid": "permission-btn-once", onClick: () => onResponse(permission.id, 'once'), style: {
                            flex: 1,
                            minWidth: '80px',
                            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
                            border: `1px solid ${tokens.colors.border.default}`,
                            borderRadius: `${tokens.spacing[0.5]}px`,
                            fontSize: tokens.typography.bodySm.fontSize,
                            background: defaultResponse === 'once' ? tokens.colors.background.elevated : tokens.colors.background.default,
                            color: tokens.colors.text.default,
                            cursor: 'pointer',
                        }, children: "Allow Once" }), _jsx("button", { type: "button", "data-testid": "permission-btn-always", onClick: () => onResponse(permission.id, 'always'), style: {
                            flex: 1,
                            minWidth: '80px',
                            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
                            border: `1px solid ${tokens.colors.accent.green}`,
                            borderRadius: `${tokens.spacing[0.5]}px`,
                            fontSize: tokens.typography.bodySm.fontSize,
                            background: defaultResponse === 'always' ? tokens.colors.accent.green : 'transparent',
                            color: defaultResponse === 'always' ? tokens.colors.background.default : tokens.colors.accent.green,
                            cursor: 'pointer',
                        }, children: "Always Allow" }), _jsx("button", { type: "button", "data-testid": "permission-btn-reject", onClick: () => onResponse(permission.id, 'reject'), style: {
                            flex: 1,
                            minWidth: '80px',
                            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
                            border: `1px solid ${tokens.colors.accent.red}`,
                            borderRadius: `${tokens.spacing[0.5]}px`,
                            fontSize: tokens.typography.bodySm.fontSize,
                            background: defaultResponse === 'reject' ? tokens.colors.accent.red : 'transparent',
                            color: defaultResponse === 'reject' ? tokens.colors.background.default : tokens.colors.accent.red,
                            cursor: 'pointer',
                        }, children: "Reject" })] })] }));
}
export default PermissionCard;
//# sourceMappingURL=PermissionCard.js.map