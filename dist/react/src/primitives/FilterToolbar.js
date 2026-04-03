import { jsx as _jsx } from "react/jsx-runtime";
import { tokens } from '@open-hax/uxx/tokens';
const baseStyles = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: `${tokens.spacing[2]}px`,
    padding: `${tokens.spacing[2]}px 0`,
};
const denseStyles = {
    gap: `${tokens.spacing[1.5]}px`,
    padding: `${tokens.spacing[1]}px 0`,
};
export function FilterToolbar({ children, dense = false }) {
    return (_jsx("div", { "data-component": "filter-toolbar", "data-dense": dense || undefined, style: { ...baseStyles, ...(dense ? denseStyles : {}) }, children: children }));
}
export default FilterToolbar;
//# sourceMappingURL=FilterToolbar.js.map