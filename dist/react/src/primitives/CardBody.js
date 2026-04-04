import { jsx as _jsx } from "react/jsx-runtime";
const baseStyles = {
    flex: 1,
    minHeight: 0,
};
export function CardBody({ children, style, className }) {
    return (_jsx("div", { "data-component": "card-body", style: { ...baseStyles, ...style }, className: className, children: children }));
}
export default CardBody;
//# sourceMappingURL=CardBody.js.map