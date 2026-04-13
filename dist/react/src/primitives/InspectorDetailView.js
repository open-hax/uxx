import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
export function InspectorDetailView({ entity, renderDetail, title = 'Detail', }) {
    if (renderDetail) {
        return _jsx(_Fragment, { children: renderDetail(entity) });
    }
    return (_jsxs("div", { "data-component": "inspector-detail-view", "data-testid": "inspector-detail", style: {
            padding: `${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[1]}px`,
            background: tokens.colors.background.elevated,
        }, children: [_jsx("div", { style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.muted,
                    marginBottom: `${tokens.spacing[1]}px`,
                }, children: title }), _jsx("div", { style: {
                    fontSize: tokens.typography.body.fontSize,
                    fontWeight: tokens.fontWeight.medium,
                    color: tokens.colors.text.default,
                    marginBottom: `${tokens.spacing[2]}px`,
                }, children: entity.title || '' }), entity.type && (_jsx("div", { style: {
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.secondary,
                    textTransform: 'capitalize',
                    marginBottom: `${tokens.spacing[2]}px`,
                }, children: entity.type })), entity.text && (_jsx("div", { style: {
                    color: tokens.colors.text.secondary,
                    whiteSpace: 'pre-wrap',
                    fontFamily: tokens.fontFamily.mono,
                    fontSize: tokens.typography.bodySm.fontSize,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    padding: `${tokens.spacing[2]}px`,
                    background: tokens.colors.background.default,
                    border: `1px solid ${tokens.colors.border.default}`,
                    borderRadius: `${tokens.spacing[0.5]}px`,
                }, children: entity.text })), entity.time && (_jsxs("div", { style: {
                    marginTop: `${tokens.spacing[2]}px`,
                    fontSize: tokens.typography.bodySm.fontSize,
                    color: tokens.colors.text.muted,
                }, children: ["Observed ", entity.time] }))] }));
}
export default InspectorDetailView;
//# sourceMappingURL=InspectorDetailView.js.map