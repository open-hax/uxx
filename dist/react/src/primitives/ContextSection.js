import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
function ContextItem({ entity, onSelect, renderItem, }) {
    if (renderItem) {
        return (_jsx("div", { style: { cursor: onSelect ? 'pointer' : undefined }, onClick: () => onSelect?.(entity), children: renderItem(entity) }));
    }
    return (_jsx("div", { "data-testid": "inspector-context-item", onClick: () => onSelect?.(entity), style: {
            marginTop: `${tokens.spacing[2]}px`,
            padding: `${tokens.spacing[2]}px`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            background: tokens.colors.background.default,
            color: tokens.colors.text.secondary,
            fontSize: tokens.typography.bodySm.fontSize,
            cursor: onSelect ? 'pointer' : undefined,
        }, children: entity.title || 'Untitled' }));
}
export function ContextSection({ context, onContextSelect, renderContextItem, title = 'Context', emptyMessage = 'No related context', }) {
    return (_jsxs("div", { "data-component": "context-section", "data-testid": "inspector-context", style: {
            padding: `${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[1]}px`,
            background: tokens.colors.background.elevated,
        }, children: [_jsx("div", { style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.muted,
                    marginBottom: `${tokens.spacing[1]}px`,
                }, children: title }), context.length > 0 ? (_jsx("div", { className: "context-list", children: context.map((entity) => (_jsx(ContextItem, { entity: entity, onSelect: onContextSelect, renderItem: renderContextItem }, entity.key || entity.id))) })) : (_jsx("div", { style: {
                    marginTop: `${tokens.spacing[2]}px`,
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.muted,
                }, children: emptyMessage }))] }));
}
export default ContextSection;
//# sourceMappingURL=ContextSection.js.map