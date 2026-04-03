import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
/**
 * Chat Component
 *
 * Implements the chat.edn contract.
 * AI conversation interface with messages, input, typing indicators, session context, and connection status.
 */
import { useState, useRef, useEffect, } from 'react';
import { tokens } from '@open-hax/uxx/tokens';
const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: `${tokens.spacing[3]}px`,
    backgroundColor: tokens.colors.background.default,
    fontFamily: tokens.fontFamily.sans,
    overflow: 'hidden',
};
const headerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
    borderBottom: `1px solid ${tokens.colors.border.default}`,
    fontSize: tokens.fontSize.sm,
    color: tokens.colors.text.muted,
};
const messagesContainerStyles = (maxHeight) => ({
    flex: 1,
    overflowY: 'auto',
    padding: `${tokens.spacing[3]}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${tokens.spacing[3]}px`,
    maxHeight,
    minHeight: '200px',
});
const messageBaseStyles = {
    display: 'flex',
    gap: `${tokens.spacing[2]}px`,
    maxWidth: '85%',
};
const messageUserStyles = {
    ...messageBaseStyles,
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
};
const messageAssistantStyles = {
    ...messageBaseStyles,
    alignSelf: 'flex-start',
};
const messageBubbleStyles = (isUser) => ({
    padding: `${tokens.spacing[3]}px`,
    borderRadius: `${tokens.spacing[2]}px`,
    backgroundColor: isUser ? tokens.colors.background.surface : 'transparent',
    fontSize: tokens.fontSize.sm,
    lineHeight: tokens.lineHeight.normal,
    color: tokens.colors.text.default,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
});
const avatarStyles = {
    width: `${tokens.spacing[8]}px`,
    height: `${tokens.spacing[8]}px`,
    borderRadius: '50%',
    backgroundColor: tokens.colors.background.elevated,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.text.muted,
    flexShrink: 0,
};
const inputAreaStyles = {
    display: 'flex',
    gap: `${tokens.spacing[2]}px`,
    padding: `${tokens.spacing[3]}px`,
    borderTop: `1px solid ${tokens.colors.border.default}`,
};
const inputStyles = {
    flex: 1,
    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
    border: `1px solid ${tokens.colors.border.default}`,
    borderRadius: `${tokens.spacing[2]}px`,
    backgroundColor: tokens.colors.background.surface,
    color: tokens.colors.text.default,
    fontFamily: tokens.fontFamily.sans,
    fontSize: tokens.fontSize.sm,
    resize: 'none',
    outline: 'none',
};
const sendButtonStyles = {
    padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
    border: 'none',
    borderRadius: `${tokens.spacing[2]}px`,
    backgroundColor: tokens.colors.button.primary.bg,
    color: tokens.colors.button.primary.fg,
    fontFamily: tokens.fontFamily.sans,
    fontSize: tokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    cursor: 'pointer',
};
const sendButtonDisabledStyles = {
    opacity: 0.5,
    cursor: 'not-allowed',
};
const typingIndicatorStyles = {
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.text.muted,
    fontStyle: 'italic',
    padding: `${tokens.spacing[1]}px ${tokens.spacing[3]}px`,
};
const emptyStateStyles = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colors.text.muted,
    fontSize: tokens.fontSize.sm,
    minHeight: '120px',
};
const timestampStyles = {
    fontSize: tokens.fontSize.xs,
    color: tokens.colors.text.muted,
    marginTop: `${tokens.spacing[1]}px`,
};
const pendingStyles = {
    opacity: 0.7,
};
function formatTimestamp(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
export function Chat({ messages, onSend, placeholder = 'Type a message...', loading = false, typingIndicator = true, avatar, userAvatar, maxHeight = '500px', showTimestamps = false, allowAttachments = false, allowMarkdown = true, emptyState, onMessageAction, sessionId, connected = true, pendingMessage, showHeader = false, }) {
    const [inputValue, setInputValue] = useState('');
    const [userWasAtBottom, setUserWasAtBottom] = useState(true);
    const containerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const isAtBottom = (threshold = 100) => {
        const el = containerRef.current;
        if (!el)
            return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    };
    useEffect(() => {
        if (userWasAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, pendingMessage, userWasAtBottom]);
    const handleScroll = () => {
        setUserWasAtBottom(isAtBottom());
    };
    const handleSend = (event) => {
        event.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed)
            return;
        onSend(trimmed);
        setInputValue('');
        setUserWasAtBottom(true);
    };
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend(event);
        }
    };
    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };
    const allMessages = pendingMessage ? [...messages, pendingMessage] : messages;
    return (_jsxs("div", { "data-component": "chat", "data-loading": loading || undefined, style: containerStyles, children: [showHeader && (_jsxs("div", { style: headerStyles, children: [_jsxs("span", { children: ["Chat", sessionId ? ` \u2022 session ${sessionId}` : ''] }), _jsx("span", { style: {
                            color: connected ? tokens.colors.status.alive : tokens.colors.status.eating,
                        }, children: connected ? 'connected' : 'disconnected' })] })), _jsxs("div", { ref: containerRef, onScroll: handleScroll, style: messagesContainerStyles(maxHeight), role: "log", "aria-live": "polite", "aria-label": "Chat conversation", children: [allMessages.length === 0 && !loading ? (_jsx("div", { style: emptyStateStyles, children: emptyState ?? 'No messages yet.' })) : (allMessages.map((msg) => {
                        const isUser = msg.role === 'user';
                        const bubbleStyle = isUser ? messageUserStyles : messageAssistantStyles;
                        return (_jsxs("div", { role: "article", "aria-label": `${isUser ? 'User' : 'Assistant'} message`, style: {
                                ...bubbleStyle,
                                ...(pendingMessage?.id === msg.id ? pendingStyles : {}),
                            }, children: [_jsx("div", { style: avatarStyles, children: isUser ? (userAvatar ?? 'U') : (avatar ?? 'A') }), _jsxs("div", { children: [msg.reasoningContent && (_jsxs("details", { style: { marginBottom: `${tokens.spacing[2]}px` }, children: [_jsx("summary", { style: { cursor: 'pointer', fontSize: tokens.fontSize.xs, color: tokens.colors.text.muted }, children: "Reasoning trace" }), _jsx("pre", { style: {
                                                        fontSize: tokens.fontSize.xs,
                                                        color: tokens.colors.text.muted,
                                                        backgroundColor: tokens.colors.background.elevated,
                                                        padding: `${tokens.spacing[2]}px`,
                                                        borderRadius: `${tokens.spacing[1]}px`,
                                                        overflow: 'auto',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                    }, children: msg.reasoningContent })] })), _jsx("div", { style: messageBubbleStyles(isUser), children: allowMarkdown ? msg.content : msg.content }), showTimestamps && msg.timestamp && (_jsx("div", { style: timestampStyles, children: formatTimestamp(msg.timestamp) })), onMessageAction && msg.actions && msg.actions.length > 0 && (_jsx("div", { style: { display: 'flex', gap: `${tokens.spacing[1]}px`, marginTop: `${tokens.spacing[1]}px` }, children: msg.actions.map((action) => (_jsx("button", { type: "button", style: {
                                                    fontSize: tokens.fontSize.xs,
                                                    background: 'none',
                                                    border: `1px solid ${tokens.colors.border.default}`,
                                                    borderRadius: `${tokens.spacing[1]}px`,
                                                    padding: `${tokens.spacing[0.5]}px ${tokens.spacing[1]}px`,
                                                    color: tokens.colors.text.muted,
                                                    cursor: 'pointer',
                                                }, onClick: () => onMessageAction(action, msg), children: action }, action))) }))] })] }, msg.id));
                    })), loading && typingIndicator && (_jsx("div", { style: typingIndicatorStyles, children: "AI is typing..." })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("form", { style: inputAreaStyles, onSubmit: handleSend, children: [_jsx("textarea", { ref: inputRef, style: inputStyles, value: inputValue, onChange: handleInputChange, onKeyDown: handleKeyDown, placeholder: placeholder, rows: 1, "aria-label": "Message input" }), _jsx("button", { type: "submit", style: {
                            ...sendButtonStyles,
                            ...(!inputValue.trim() ? sendButtonDisabledStyles : {}),
                        }, disabled: !inputValue.trim(), children: "Send" })] })] }));
}
export default Chat;
//# sourceMappingURL=Chat.js.map