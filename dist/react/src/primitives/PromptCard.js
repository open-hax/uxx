import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
import { getPromptText } from './PermissionPrompts.types.js';
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
const textStyles = {
    fontSize: tokens.typography.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    marginBottom: `${tokens.spacing[2]}px`,
};
const inputBaseStyles = {
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
};
export function PromptCard({ prompt, onResponse, autoFocus = false, submitLabel = 'Submit', style, className }) {
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
    return (_jsxs("div", { "data-component": "prompt-card", "data-testid": "prompt-card", "data-prompt-id": prompt.id, style: { ...rootStyles, ...style }, className: className, children: [_jsx("div", { style: titleStyles, children: prompt.title || 'Input Required' }), _jsx("div", { style: textStyles, children: promptText }), prompt.sessionId && _jsxs("div", { style: { ...textStyles, color: tokens.colors.text.muted }, children: ["Session: ", prompt.sessionId] }), multiline ? (_jsx("textarea", { "data-testid": "prompt-input", value: inputValue, onChange: (e) => setInputValue(e.target.value), placeholder: prompt.placeholder || 'Enter response...', autoFocus: autoFocus, rows: 3, style: { ...inputBaseStyles, minHeight: '60px', resize: 'vertical' } })) : (_jsx("input", { type: "text", "data-testid": "prompt-input", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyDown: handleKeyDown, placeholder: prompt.placeholder || 'Enter response...', autoFocus: autoFocus, style: inputBaseStyles })), _jsx("button", { type: "button", "data-testid": "prompt-submit", onClick: handleSubmit, disabled: !inputValue.trim(), style: {
                    marginTop: `${tokens.spacing[2]}px`,
                    width: '100%',
                    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
                    border: `1px solid ${tokens.colors.accent.green}`,
                    borderRadius: `${tokens.spacing[0.5]}px`,
                    fontSize: tokens.typography.bodySm.fontSize,
                    background: !inputValue.trim() ? tokens.colors.background.elevated : tokens.colors.accent.green,
                    color: !inputValue.trim() ? tokens.colors.text.muted : tokens.colors.background.default,
                    cursor: !inputValue.trim() ? 'not-allowed' : 'pointer',
                }, children: submitLabel })] }));
}
export default PromptCard;
//# sourceMappingURL=PromptCard.js.map