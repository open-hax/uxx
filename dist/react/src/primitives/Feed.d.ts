import React from 'react';
export interface FeedItem {
    id: string;
    type: 'message' | 'file' | 'commit' | 'agent' | 'system' | 'user' | 'notification';
    title?: string;
    content: string;
    timestamp: Date | string;
    author?: {
        name: string;
        avatar?: string;
        role?: string;
    };
    icon?: React.ReactNode;
    badge?: string;
    actions?: string[];
    meta?: Record<string, unknown>;
    read?: boolean;
    file?: {
        name: string;
        path: string;
        status?: 'added' | 'modified' | 'deleted' | 'renamed';
    };
    diff?: {
        additions: number;
        deletions: number;
    };
}
export interface FeedProps {
    items: FeedItem[];
    variant?: 'timeline' | 'cards' | 'list' | 'compact';
    groupBy?: 'none' | 'date' | 'hour' | 'session' | 'agent';
    showTimestamp?: boolean;
    relativeTime?: boolean;
    infiniteScroll?: boolean;
    onLoadMore?: () => void;
    onItemClick?: (item: FeedItem) => void;
    onItemAction?: (action: string, item: FeedItem) => void;
    emptyState?: React.ReactNode;
    loading?: boolean;
    markRead?: (itemIds: string[]) => void;
    className?: string;
}
export declare const Feed: React.FC<FeedProps>;
export default Feed;
//# sourceMappingURL=Feed.d.ts.map