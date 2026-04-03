/**
 * Chat Component
 *
 * Implements the chat.edn contract.
 * AI conversation interface with messages, input, typing indicators, session context, and connection status.
 */
import { type ReactNode } from 'react';
export type ChatRole = 'user' | 'assistant' | 'system';
export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    timestamp?: Date;
    attachments?: File[];
    metadata?: Record<string, unknown>;
    actions?: string[];
    reasoningContent?: string;
}
export interface ChatProps {
    messages: readonly ChatMessage[];
    onSend: (message: string, attachments?: File[]) => void;
    placeholder?: string;
    loading?: boolean;
    typingIndicator?: boolean;
    avatar?: ReactNode;
    userAvatar?: ReactNode;
    maxHeight?: string;
    showTimestamps?: boolean;
    allowAttachments?: boolean;
    allowMarkdown?: boolean;
    emptyState?: ReactNode;
    onMessageAction?: (action: string, message: ChatMessage) => void;
    sessionId?: string;
    connected?: boolean;
    pendingMessage?: ChatMessage;
    showHeader?: boolean;
}
export declare function Chat({ messages, onSend, placeholder, loading, typingIndicator, avatar, userAvatar, maxHeight, showTimestamps, allowAttachments, allowMarkdown, emptyState, onMessageAction, sessionId, connected, pendingMessage, showHeader, }: ChatProps): import("react/jsx-runtime").JSX.Element;
export default Chat;
//# sourceMappingURL=Chat.d.ts.map