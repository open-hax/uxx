import React, { useState, useMemo, useCallback } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { tokens } from '@open-hax/uxx/tokens';

// Language detection from file extension
const EXTENSION_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.clj': 'clojure',
  '.cljs': 'clojure',
  '.cljc': 'clojure',
  '.edn': 'clojure',
  '.java': 'java',
  '.kt': 'kotlin',
  '.swift': 'swift',
  '.scala': 'scala',
  '.rb': 'ruby',
  '.php': 'php',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'c',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.html': 'markup',
  '.htm': 'markup',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'markup',
  '.sql': 'sql',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.dockerfile': 'docker',
  '.makefile': 'makefile',
  '.md': 'markdown',
  '.mdx': 'mdx',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.proto': 'protobuf',
  '.diff': 'diff',
  '.patch': 'diff',
};

// Shebang detection
const SHEBANG_MAP: Record<string, string> = {
  'node': 'javascript',
  'python': 'python',
  'python3': 'python',
  'bash': 'bash',
  'sh': 'bash',
  'zsh': 'bash',
  'ruby': 'ruby',
  'perl': 'perl',
  'php': 'php',
};

function detectLanguage(code: string, filename?: string, explicitLanguage?: string): string {
  // Explicit language takes precedence
  if (explicitLanguage) return explicitLanguage;
  
  // Try filename extension
  if (filename) {
    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    if (EXTENSION_MAP[ext]) return EXTENSION_MAP[ext];
  }
  
  // Try shebang
  const firstLine = code.split('\n')[0];
  if (firstLine.startsWith('#!')) {
    const match = firstLine.match(/#!\s*(?:\/usr\/bin\/env\s+)?(\w+)/);
    if (match && SHEBANG_MAP[match[1]]) {
      return SHEBANG_MAP[match[1]];
    }
  }
  
  return 'text';
}

// Map detected language to Prism language
const PRISM_LANG_MAP: Record<string, string> = {
  'typescript': 'typescript',
  'tsx': 'tsx',
  'javascript': 'javascript',
  'jsx': 'jsx',
  'python': 'python',
  'rust': 'rust',
  'go': 'go',
  'clojure': 'clojure',
  'java': 'java',
  'kotlin': 'kotlin',
  'swift': 'swift',
  'scala': 'scala',
  'ruby': 'ruby',
  'php': 'php',
  'c': 'c',
  'cpp': 'cpp',
  'csharp': 'csharp',
  'markup': 'markup',
  'html': 'markup',
  'css': 'css',
  'scss': 'scss',
  'json': 'json',
  'yaml': 'yaml',
  'bash': 'bash',
  'sql': 'sql',
  'graphql': 'graphql',
  'markdown': 'markdown',
  'diff': 'diff',
};

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  theme?: 'dark' | 'light' | 'auto';
  lineNumbers?: boolean;
  highlightLines?: number[];
  startLine?: number;
  maxLines?: number;
  showCopy?: boolean;
  showLanguage?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  wrap?: boolean;
  tabSize?: number;
  diff?: 'none' | 'add' | 'remove';
  onCopy?: () => void;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language: explicitLanguage,
  filename,
  theme = 'dark',
  lineNumbers = true,
  highlightLines = [],
  startLine = 1,
  maxLines,
  showCopy = true,
  showLanguage = true,
  collapsible = false,
  defaultCollapsed = false,
  wrap = false,
  diff = 'none',
  onCopy,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showAll, setShowAll] = useState(false);
  
  const language = useMemo(
    () => detectLanguage(code, filename, explicitLanguage),
    [code, filename, explicitLanguage]
  );
  
  const prismLanguage = useMemo(
    () => PRISM_LANG_MAP[language] || language,
    [language]
  );
  
  const lines = useMemo(() => code.split('\n'), [code]);
  
  const visibleLines = useMemo(() => {
    if (!maxLines || showAll) return lines;
    return lines.slice(0, maxLines);
  }, [lines, maxLines, showAll]);
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code, onCopy]);
  
  // Diff styles
  const diffStyle = useMemo((): React.CSSProperties => {
    if (diff === 'add') {
      return {
        backgroundColor: 'rgba(102, 217, 239, 0.08)',
        borderLeft: '3px solid rgb(102, 217, 239)',
      };
    }
    if (diff === 'remove') {
      return {
        backgroundColor: 'rgba(249, 38, 114, 0.08)',
        borderLeft: '3px solid rgb(249, 38, 114)',
      };
    }
    return {};
  }, [diff]);
  
  if (collapsed) {
    return (
      <div
        className={className}
        data-component="code-block"
        data-language={language}
        data-collapsed
        onClick={() => setCollapsed(false)}
        style={{
          background: tokens.colors.background.elevated,
          padding: '8px 12px',
          borderRadius: tokens.spacing[2],
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          color: tokens.colors.text.muted,
          ...diffStyle,
        }}
      >
        <span>▶</span>
        <span>{filename || language}</span>
        <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
          {lines.length} lines
        </span>
      </div>
    );
  }
  
  return (
    <div
      className={className}
      data-component="code-block"
      data-language={language}
      data-diff={diff}
      style={{
        background: tokens.colors.background.elevated,
        borderRadius: tokens.spacing[2],
        overflow: 'hidden',
        position: 'relative',
        ...diffStyle,
      }}
    >
      {/* Header */}
      {(showLanguage || showCopy || collapsible) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: `1px solid ${tokens.colors.border.subtle}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {collapsible && (
              <button
                onClick={() => setCollapsed(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: tokens.colors.text.muted,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: 12,
                }}
              >
                ▼
              </button>
            )}
            {showLanguage && (
              <span
                style={{
                  fontSize: 12,
                  color: tokens.colors.text.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {filename || language}
              </span>
            )}
          </div>
          
          {showCopy && (
            <button
              onClick={handleCopy}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? tokens.monokai.accent.cyan : tokens.colors.text.muted,
                cursor: 'pointer',
                fontSize: 12,
                padding: '4px 8px',
                borderRadius: 4,
                transition: 'color 0.2s',
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          )}
        </div>
      )}
      
      {/* Code with syntax highlighting */}
      <Highlight
        theme={themes.vsDark}
        code={visibleLines.join('\n')}
        language={prismLanguage}
      >
        {({ className: highlightClass, style, tokens: prismTokens, getLineProps, getTokenProps }) => (
          <pre
            className={highlightClass}
            style={{
              ...style,
              margin: 0,
              padding: tokens.spacing[4],
              overflow: maxLines ? 'auto' : 'auto',
              maxHeight: maxLines ? `${maxLines * 20 + 32}px` : undefined,
              whiteSpace: wrap ? 'pre-wrap' : 'pre',
              wordBreak: wrap ? 'break-all' : undefined,
              background: 'transparent',
            }}
          >
            {prismTokens.map((line, index) => {
              const lineNumber = startLine + index;
              const isHighlighted = highlightLines.includes(lineNumber);
              
              return (
                <div
                  key={index}
                  {...getLineProps({ line })}
                  style={{
                    display: 'flex',
                    backgroundColor: isHighlighted
                      ? 'rgba(102, 217, 239, 0.1)'
                      : 'transparent',
                    borderLeft: isHighlighted
                      ? '2px solid rgb(102, 217, 239)'
                      : '2px solid transparent',
                  }}
                >
                  {lineNumbers && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: 40,
                        marginRight: 16,
                        textAlign: 'right',
                        color: tokens.colors.text.subtle,
                        userSelect: 'none',
                        opacity: 0.5,
                      }}
                    >
                      {lineNumber}
                    </span>
                  )}
                  <span style={{ flex: 1 }}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
      
      {/* Show more button */}
      {maxLines && lines.length > maxLines && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: 'none',
            borderTop: `1px solid ${tokens.colors.border.subtle}`,
            color: tokens.colors.text.muted,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Show {lines.length - maxLines} more lines
        </button>
      )}
    </div>
  );
};

export default CodeBlock;
