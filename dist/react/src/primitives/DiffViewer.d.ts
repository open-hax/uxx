import React from 'react';
import { type ThemePreference } from '@open-hax/uxx/tokens';
interface DiffLine {
    type: 'unchanged' | 'added' | 'removed';
    content: string;
    oldLine?: number;
    newLine?: number;
}
interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    header: string;
    lines: DiffLine[];
}
export interface DiffViewerProps {
    original: string;
    modified: string;
    filename?: string;
    language?: string;
    mode?: 'unified' | 'split';
    theme?: ThemePreference;
    lineNumbers?: boolean;
    showStats?: boolean;
    showFilename?: boolean;
    foldThreshold?: number;
    highlightLines?: {
        original?: number[];
        modified?: number[];
    };
    onLineClick?: (line: DiffLine, side: 'original' | 'modified') => void;
    onHunkClick?: (hunk: DiffHunk) => void;
    className?: string;
}
export declare const DiffViewer: React.FC<DiffViewerProps>;
export default DiffViewer;
//# sourceMappingURL=DiffViewer.d.ts.map