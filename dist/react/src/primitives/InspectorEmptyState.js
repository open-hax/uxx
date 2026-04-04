import { jsx as _jsx } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
export function InspectorEmptyState({ message = 'Select an item to inspect details and context.', }) {
    return (_jsx("div", { "data-component": "inspector-empty-state", "data-testid": "inspector-empty", style: {
            padding: `${tokens.spacing[4]}px`,
            textAlign: 'center',
            color: tokens.colors.text.muted,
            fontSize: tokens.typography.bodySm.fontSize,
        }, children: message }));
}
export default InspectorEmptyState;
//# sourceMappingURL=InspectorEmptyState.js.map