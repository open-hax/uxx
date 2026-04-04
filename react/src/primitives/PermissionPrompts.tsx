/**
 * PermissionPrompts Component
 *
 * Implements the permission-prompts.edn contract.
 * A panel for handling permission requests and input prompts from an AI agent or system,
 * with options for one-time approval, persistent approval, and rejection.
 */

import { type ReactNode, useState } from 'react';
import { tokens } from '@open-hax/uxx/tokens';

// Types derived from contract
export interface PermissionRequest {
  /** Unique identifier */
  id: string;
  /** Display title */
  title?: string;
  /** Session identifier */
  sessionId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Timeout in milliseconds */
  timeoutMs?: number;
  /** Default response */
  defaultResponse?: 'once' | 'always' | 'reject';
}

export interface InputPrompt {
  /** Unique identifier */
  id: string;
  /** Display title */
  title?: string;
  /** Prompt body (string or object with prompt key) */
  body?: string | { prompt: string };
  /** Input placeholder */
  placeholder?: string;
  /** Multiline input */
  multiline?: boolean;
  /** Session identifier */
  sessionId?: string;
}

export type PermissionResponse = 'once' | 'always' | 'reject';

export interface PermissionPromptsProps {
  /** Pending permission requests */
  permissions?: PermissionRequest[];
  /** Pending input prompts */
  prompts?: InputPrompt[];
  /** Callback for permission response */
  onPermissionResponse: (id: string, response: PermissionResponse) => void;
  /** Callback for input prompt response */
  onPromptResponse: (id: string, response: string) => void;
  /** Auto-focus input fields */
  autoFocusInput?: boolean;
  /** Show permission metadata */
  showMetadata?: boolean;
  /** Group prompts by session */
  groupBySession?: boolean;
}

/**
 * Extract prompt text from body object.
 */
function getPromptText(body?: string | { prompt: string }): string {
  if (!body) return 'Enter input';
  if (typeof body === 'string') return body;
  return body.prompt || 'Enter input';
}

/**
 * Render a single permission request card.
 */
function PermissionCard({
  permission,
  onResponse,
  showMetadata,
}: {
  permission: PermissionRequest;
  onResponse: (id: string, response: PermissionResponse) => void;
  showMetadata: boolean;
}) {
  const defaultResponse = permission.defaultResponse || 'once';

  return (
    <div
      data-testid="permission-card"
      data-permission-id={permission.id}
      style={{
        padding: `${tokens.spacing[3]}px`,
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: `${tokens.spacing[1]}px`,
        background: tokens.colors.background.default,
        marginBottom: `${tokens.spacing[2]}px`,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: tokens.typography.body.fontSize,
          fontWeight: tokens.fontWeight.medium,
          color: tokens.colors.text.default,
          marginBottom: `${tokens.spacing[2]}px`,
        }}
      >
        {permission.title || 'Permission Request'}
      </div>

      {/* Metadata (optional) */}
      {showMetadata && permission.metadata && (
        <div
          style={{
            fontSize: tokens.typography.bodySm.fontSize,
            color: tokens.colors.text.secondary,
            marginBottom: `${tokens.spacing[2]}px`,
            fontFamily: tokens.fontFamily.mono,
          }}
        >
          {typeof permission.metadata.path === 'string' && <span>Path: {permission.metadata.path}</span>}
          {typeof permission.metadata.command === 'string' && <span>Command: {permission.metadata.command}</span>}
          {!permission.metadata.path && !permission.metadata.command && (
            <span>{JSON.stringify(permission.metadata)}</span>
          )}
        </div>
      )}

      {/* Session ID (optional) */}
      {permission.sessionId && (
        <div
          style={{
            fontSize: tokens.typography.bodySm.fontSize,
            color: tokens.colors.text.muted,
            marginBottom: `${tokens.spacing[2]}px`,
          }}
        >
          Session: {permission.sessionId}
        </div>
      )}

      {/* Timeout indicator (optional) */}
      {permission.timeoutMs && (
        <div
          style={{
            fontSize: tokens.typography.bodySm.fontSize,
            color: tokens.colors.text.muted,
            marginBottom: `${tokens.spacing[2]}px`,
          }}
        >
          Expires in {Math.floor(permission.timeoutMs / 1000)}s
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: 'flex',
          gap: `${tokens.spacing[2]}px`,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          data-testid="permission-btn-once"
          onClick={() => onResponse(permission.id, 'once')}
          style={{
            flex: 1,
            minWidth: '80px',
            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.border.default}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            background:
              defaultResponse === 'once'
                ? tokens.colors.background.elevated
                : tokens.colors.background.default,
            color: tokens.colors.text.default,
            cursor: 'pointer',
          }}
        >
          Allow Once
        </button>
        <button
          type="button"
          data-testid="permission-btn-always"
          onClick={() => onResponse(permission.id, 'always')}
          style={{
            flex: 1,
            minWidth: '80px',
            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.accent.green}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            background:
              defaultResponse === 'always'
                ? tokens.colors.accent.green
                : 'transparent',
            color:
              defaultResponse === 'always'
                ? tokens.colors.background.default
                : tokens.colors.accent.green,
            cursor: 'pointer',
          }}
        >
          Always Allow
        </button>
        <button
          type="button"
          data-testid="permission-btn-reject"
          onClick={() => onResponse(permission.id, 'reject')}
          style={{
            flex: 1,
            minWidth: '80px',
            padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
            border: `1px solid ${tokens.colors.accent.red}`,
            borderRadius: `${tokens.spacing[0.5]}px`,
            fontSize: tokens.typography.bodySm.fontSize,
            background:
              defaultResponse === 'reject'
                ? tokens.colors.accent.red
                : 'transparent',
            color:
              defaultResponse === 'reject'
                ? tokens.colors.background.default
                : tokens.colors.accent.red,
            cursor: 'pointer',
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

/**
 * Render a single input prompt card.
 */
function PromptCard({
  prompt,
  onResponse,
  autoFocus,
}: {
  prompt: InputPrompt;
  onResponse: (id: string, response: string) => void;
  autoFocus: boolean;
}) {
  const [inputValue, setInputValue] = useState('');
  const multiline = prompt.multiline || false;
  const promptText = getPromptText(prompt.body);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onResponse(prompt.id, inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      data-testid="prompt-card"
      data-prompt-id={prompt.id}
      style={{
        padding: `${tokens.spacing[3]}px`,
        border: `1px solid ${tokens.colors.border.default}`,
        borderRadius: `${tokens.spacing[1]}px`,
        background: tokens.colors.background.default,
        marginBottom: `${tokens.spacing[2]}px`,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: tokens.typography.body.fontSize,
          fontWeight: tokens.fontWeight.medium,
          color: tokens.colors.text.default,
          marginBottom: `${tokens.spacing[2]}px`,
        }}
      >
        {prompt.title || 'Input Required'}
      </div>

      {/* Prompt text */}
      <div
        style={{
          fontSize: tokens.typography.bodySm.fontSize,
          color: tokens.colors.text.secondary,
          marginBottom: `${tokens.spacing[2]}px`,
        }}
      >
        {promptText}
      </div>

      {/* Session ID (optional) */}
      {prompt.sessionId && (
        <div
          style={{
            fontSize: tokens.typography.bodySm.fontSize,
            color: tokens.colors.text.muted,
            marginBottom: `${tokens.spacing[2]}px`,
          }}
        >
          Session: {prompt.sessionId}
        </div>
      )}

      {/* Input field */}
      {multiline ? (
        <textarea
          data-testid="prompt-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={prompt.placeholder || 'Enter response...'}
          autoFocus={autoFocus}
          rows={3}
          style={{
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
            minHeight: '60px',
            resize: 'vertical',
          }}
        />
      ) : (
        <input
          type="text"
          data-testid="prompt-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={prompt.placeholder || 'Enter response...'}
          autoFocus={autoFocus}
          style={{
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
          }}
        />
      )}

      {/* Submit button */}
      <button
        type="button"
        data-testid="prompt-submit"
        onClick={handleSubmit}
        disabled={!inputValue.trim()}
        style={{
          marginTop: `${tokens.spacing[2]}px`,
          width: '100%',
          padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
          border: `1px solid ${tokens.colors.accent.green}`,
          borderRadius: `${tokens.spacing[0.5]}px`,
          fontSize: tokens.typography.bodySm.fontSize,
          background: !inputValue.trim()
            ? tokens.colors.background.elevated
            : tokens.colors.accent.green,
          color: !inputValue.trim()
            ? tokens.colors.text.muted
            : tokens.colors.background.default,
          cursor: !inputValue.trim() ? 'not-allowed' : 'pointer',
        }}
      >
        Submit
      </button>
    </div>
  );
}

/**
 * Panel for handling permission requests and input prompts.
 *
 * @example
 * ```tsx
 * <PermissionPrompts
 *   permissions={[{ id: 'perm-1', title: 'Read file', metadata: { path: '/src/core.ts' } }]}
 *   prompts={[{ id: 'prompt-1', title: 'Input', body: { prompt: 'Name?' } }]}
 *   onPermissionResponse={(id, resp) => handlePerm(id, resp)}
 *   onPromptResponse={(id, resp) => handlePrompt(id, resp)}
 * />
 * ```
 */
export function PermissionPrompts({
  permissions = [],
  prompts = [],
  onPermissionResponse,
  onPromptResponse,
  autoFocusInput = true,
  showMetadata = true,
  groupBySession = false,
}: PermissionPromptsProps) {
  const pendingCount = permissions.length + prompts.length;
  const hasPending = pendingCount > 0;

  return (
    <div
      data-component="permission-prompts"
      data-pending-count={pendingCount}
      role="region"
      aria-label="Pending requests"
      aria-live="polite"
      style={{
        padding: `${tokens.spacing[3]}px`,
        backgroundColor: tokens.colors.background.surface,
        minHeight: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: `${tokens.spacing[3]}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: tokens.typography.bodySm.fontSize,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: tokens.colors.text.muted,
          }}
        >
          Pending Requests
        </h3>
        {hasPending && (
          <span
            style={{
              fontSize: tokens.typography.bodySm.fontSize,
              color: tokens.colors.accent.green,
              padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
              background: tokens.colors.alpha.green._12,
              borderRadius: `${tokens.spacing[0.5]}px`,
            }}
          >
            {pendingCount}
          </span>
        )}
      </div>

      {/* Empty state */}
      {!hasPending && (
        <div
          data-testid="prompts-empty"
          style={{
            padding: `${tokens.spacing[4]}px`,
            textAlign: 'center',
            color: tokens.colors.text.muted,
            fontSize: tokens.typography.bodySm.fontSize,
          }}
        >
          No pending requests
        </div>
      )}

      {/* Permission requests */}
      {permissions.length > 0 && (
        <div className="permissions-section">
          {permissions.map((permission) => (
            <PermissionCard
              key={permission.id}
              permission={permission}
              onResponse={onPermissionResponse}
              showMetadata={showMetadata}
            />
          ))}
        </div>
      )}

      {/* Input prompts */}
      {prompts.length > 0 && (
        <div className="prompts-section">
          {prompts.map((prompt, idx) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onResponse={onPromptResponse}
              autoFocus={autoFocusInput && idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PermissionPrompts;
