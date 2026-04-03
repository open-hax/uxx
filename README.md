# @open-hax/uxx Component Library

A multi-framework UI component library with design tokens, React components, and Reagent (ClojureScript) components. Designed for KMS/CMS/IDE and agentic workflows.

## Quick Start

### React

```bash
cd orgs/open-hax/uxx/react
npm install
npm run storybook  # Open http://localhost:6006
```

### Reagent

```bash
cd orgs/open-hax/uxx/reagent
npm install
npm run watch      # shadow-cljs watch
```

## Packages

### @open-hax/uxx/tokens

Design tokens for consistent styling across frameworks.

```typescript
import { colors, spacing, typography, motion, shadow } from '@open-hax/uxx/tokens';

const buttonStyle = {
  backgroundColor: colors.button.primary.bg,
  padding: `${spacing[2]}px ${spacing[4]}px`,
  fontSize: typography.bodySm.fontSize,
  transition: motion.transitions.colors,
  boxShadow: shadow.sm,
};
```

### @open-hax/uxx

React components implementing the contracts.

```tsx
import { 
  Button, Badge, Spinner, Card, 
  Modal, Tooltip, Input, Progress,
  // AI/IDE Components
  CommandPalette, Chat, Toast, FileTree, Tabs,
  // KMS/CMS Components
  Feed, Markdown, CodeBlock, DiffViewer,
  // Text Editors
  MarkdownEditor, RichTextEditor
} from '@open-hax/uxx';

function MyComponent() {
  return (
    <Card variant="elevated" title="Status">
      <Badge variant="success">Active</Badge>
      <Input placeholder="Enter name" />
      <Progress value={60} showValue />
      <Button variant="primary" onClick={() => alert('Hi!')}>
        Click me
      </Button>
      <Spinner size="lg" />
    </Card>
  );
}
```

### @open-hax/uxx-reagent

Reagent (ClojureScript) components with matching API.

```clojure
(ns my.app
  (:require [devel.ui.core :as ui]))

[:div
 [ui/card {:variant :elevated :title "Status"}
  [ui/badge {:variant :success} "Active"]
  [ui/input {:placeholder "Enter name"}]
  [ui/progress {:value 60 :show-value true}]
  [ui/button {:variant :primary :on-click #(js/alert "Hi!")}
   "Click me"]
  [ui/spinner {:size :lg}]]
```

## Components

### Base Primitives

| Component | React | Reagent | Contract | Stories |
|-----------|-------|---------|----------|---------|
| Button    | ✅    | ✅      | button.edn | 9 |
| Badge     | ✅    | ✅      | badge.edn | 8 |
| Spinner   | ✅    | ✅      | spinner.edn | 8 |
| Card      | ✅    | ✅      | card.edn | 9 |
| Modal     | ✅    | ✅      | modal.edn | 14 |
| Tooltip   | ✅    | ✅      | tooltip.edn | 9 |
| Input     | ✅    | ✅      | input.edn | 10 |
| Progress  | ✅    | ✅      | progress.edn | 8 |

### AI/IDE Components

| Component | React | Contract | Stories |
|-----------|-------|----------|---------|
| CommandPalette | ✅ | command-palette.edn | 4 |
| Chat | ✅ | chat.edn | 7 |
| Toast | ✅ | toast.edn | 5 |
| FileTree | ✅ | file-tree.edn | 7 |
| Tabs | ✅ | tabs.edn | 11 |

### KMS/CMS Components

| Component | React | Contract | Stories |
|-----------|-------|----------|---------|
| Feed | ✅ | feed.edn | 9 |
| Markdown | ✅ | markdown.edn | 9 |
| CodeBlock | ✅ | code-block.edn | 16 |
| DiffViewer | ✅ | diff-viewer.edn | 12 |

### Text Editors

| Component | React | Contract | Stories |
|-----------|-------|----------|---------|
| MarkdownEditor | ✅ | markdown-editor.edn | 13 |
| RichTextEditor | ✅ | rich-text-editor.edn | 13 |

**Total: 19 components, 185+ stories**

---

## AI/IDE Components

### CommandPalette

Fuzzy search command palette with keyboard navigation.

```tsx
<CommandPalette
  commands={[
    { id: 'save', label: 'Save File', shortcut: 'Ctrl+S', action: () => save() },
    { id: 'open', label: 'Open File', shortcut: 'Ctrl+O', action: () => open() },
  ]}
  groups={[
    { id: 'file', label: 'File Operations' },
    { id: 'edit', label: 'Edit Actions' },
  ]}
  placeholder="Type a command..."
/>
```

Features: Fuzzy search, keyboard navigation (↑↓, Enter, Escape), grouping, recent items

### Chat

AI chat interface with message streaming support.

```tsx
<Chat
  messages={[
    { id: '1', role: 'user', content: 'Hello!' },
    { id: '2', role: 'assistant', content: 'Hi! How can I help?' },
  ]}
  onSend={(msg) => sendMessage(msg)}
  placeholder="Ask anything..."
  showTimestamps
  showAvatars
/>
```

Features: Markdown rendering, typing indicator, timestamps, avatars, file attachments, message actions

### Toast

Toast notification system with positioning.

```tsx
<ToastProvider position="top-right">
  <MyApp />
</ToastProvider>

// In components:
const { addToast } = useToast();
addToast({ type: 'success', message: 'Saved!', duration: 3000 });
```

Features: 4 types (info, success, warning, error), 6 positions, actions, persistence, stacking

### FileTree

Hierarchical file navigation with search.

```tsx
<FileTree
  items={fileItems}
  selectedId={selectedFile}
  onSelect={(item) => setSelectedFile(item.id)}
  onDoubleClick={(item) => openFile(item)}
  search={searchQuery}
  showSize
/>
```

Features: Hierarchical navigation, search highlighting, file sizes, badges, context menus

### Tabs

Tabbed content organization with multiple variants.

```tsx
<Tabs
  items={[
    { id: 'edit', label: 'Edit', content: <Editor /> },
    { id: 'preview', label: 'Preview', content: <Preview /> },
  ]}
  variant="enclosed"
  showClose
  onClose={(id) => closeTab(id)}
/>
```

Variants: `default`, `pills`, `underline`, `enclosed`
Features: Icons, badges, closable, addable, vertical orientation

---

## KMS/CMS Components

### Feed

Activity stream for displaying chronological events.

```tsx
<Feed
  items={[
    {
      id: '1',
      type: 'commit',
      title: 'New commit pushed',
      content: 'feat: Add user preferences',
      timestamp: new Date(),
      author: { name: 'Alice', avatar: '...' },
      file: { name: 'prefs.tsx', path: 'src/', status: 'added' },
      diff: { additions: 50, deletions: 0 },
    },
  ]}
  variant="timeline"
  groupBy="date"
  onItemAction={(action, item) => handleAction(action, item)}
/>
```

Variants: `timeline`, `cards`, `list`, `compact`
Features: Grouping, relative time, file changes, diff stats, actions

### Markdown

Markdown rendering with syntax highlighting.

```tsx
<Markdown
  content={markdownText}
  lineNumbers
  copyButton
  maxLines={50}
  onHeadingClick={(id, text) => scrollToHeading(id)}
/>
```

Features: GFM support, syntax highlighting, line numbers, copy button, heading navigation

### CodeBlock

Syntax highlighted code with file extension awareness.

```tsx
<CodeBlock
  code={sourceCode}
  filename="Button.tsx"  // Auto-detects TypeScript
  lineNumbers
  highlightLines={[1, 2, 3]}
  showCopy
  collapsible
/>
```

Features: 40+ language support, extension detection, shebang detection, line highlighting, diff mode

### DiffViewer

Unified and split diff visualization.

```tsx
<DiffViewer
  original={oldCode}
  modified={newCode}
  filename="Button.tsx"
  mode="unified"  // or "split"
  showStats
  onLineClick={(line, side) => selectLine(line)}
/>
```

Modes: `unified`, `split`
Features: Line numbers, stats, hunk headers, line highlighting

---

## Text Editors

### MarkdownEditor

Split-pane markdown editor with live preview.

```tsx
<MarkdownEditor
  value={markdown}
  previewMode="split"
  previewRatio={0.5}
  toolbar
  statusBar
  lineNumbers
  onChange={(value) => setMarkdown(value)}
  onSave={(value) => saveContent(value)}
/>
```

Preview modes: `split`, `preview-only`, `editor-only`, `tabbed`
Features: Toolbar, status bar, line numbers, keyboard shortcuts, autosave

### RichTextEditor

WYSIWYG rich text editor with toolbar.

```tsx
<RichTextEditor
  value={content}
  format="markdown"
  toolbar
  mentions={{
    items: [{ id: 'alice', name: 'Alice Chen', avatar: '...' }],
    trigger: '@',
  }}
  onChange={(value) => setContent(value)}
  onSave={(value) => saveContent(value)}
/>
```

Formats: `markdown`, `html`, `json`
Features: Toolbar, @mentions, image upload, keyboard shortcuts

---

## Base Components

### Button

```tsx
<Button variant="primary" size="lg" loading>
  Submit
</Button>
```

Variants: `primary`, `secondary`, `ghost`, `danger`
Sizes: `sm`, `md`, `lg`

### Badge

```tsx
<Badge variant="success" dot rounded>
  Active
</Badge>
```

Variants: `default`, `success`, `warning`, `error`, `info`
Features: `dot` indicator, `rounded` (pill), `outline` style

### Spinner

```tsx
<Spinner size="lg" label="Loading content..." />
```

Sizes: `sm`, `md`, `lg`, `xl`

### Card

```tsx
<Card 
  variant="elevated" 
  title="Card Title"
  footer={<Button>Action</Button>}
>
  Card content
</Card>
```

Variants: `default`, `outlined`, `elevated`
Slots: `header`, `title`, `extra`, `children`, `footer`
Features: `interactive` mode, configurable `padding` and `radius`

### Modal

```tsx
<Modal open={open} onClose={() => setOpen(false)} title="Confirm">
  Are you sure?
  <Button onClick={() => setOpen(false)}>Cancel</Button>
</Modal>
```

Sizes: `sm`, `md`, `lg`, `xl`, `full`
Features: Focus trap, scroll lock, backdrop click, escape key

### Tooltip

```tsx
<Tooltip content="Helpful info" placement="top">
  <Button>Hover me</Button>
</Tooltip>
```

Placements: `top`, `bottom`, `left`, `right`, `top-start`, `top-end`, `bottom-start`, `bottom-end`
Triggers: `hover`, `focus`, `hover-focus`, `click`

### Input

```tsx
<Input 
  type="email" 
  placeholder="Enter email"
  error
  errorMessage="Invalid email"
/>
```

Types: `text`, `password`, `email`, `number`, `search`, `url`, `tel`
Variants: `default`, `filled`, `unstyled`
Features: `leftIcon`, `rightIcon`, validation states

### Progress

```tsx
<Progress value={60} showValue />
<Progress indeterminate />
```

Variants: `default`, `success`, `warning`, `error`, `gradient`
Sizes: `sm`, `md`, `lg`
Features: Indeterminate mode, animated transitions

---

## Dependencies

The React package uses these runtime dependencies:

- **prism-react-renderer** - Syntax highlighting for CodeBlock component with support for 40+ languages

## Contracts

Each component has an EDN contract defining its API:

```
orgs/open-hax/uxx/contracts/
├── button.edn
├── badge.edn
├── spinner.edn
├── card.edn
├── modal.edn
├── tooltip.edn
├── input.edn
├── progress.edn
├── command-palette.edn
├── chat.edn
├── toast.edn
├── file-tree.edn
├── tabs.edn
├── feed.edn
├── markdown.edn
├── code-block.edn
├── diff-viewer.edn
├── markdown-editor.edn
└── rich-text-editor.edn
```

Contracts specify:
- **Props**: Types, defaults, descriptions
- **Slots**: Children and named content areas
- **Accessibility**: ARIA roles, keyboard behavior
- **Styling**: Data attributes, token references
- **Behavior**: State transitions, event handling

---

## Design Tokens

### Colors

Monokai-based palette with semantic aliases:

```typescript
// Component colors
colors.button.{primary,secondary,ghost,danger}
colors.badge.{default,success,warning,error,info}
colors.border.{default,subtle,focus,error}

// Accent colors
monokai.accent.{cyan,blue,red,orange}

// Status colors
colors.status.{alive,dead,open,closed,merged}
```

### Spacing

4px base unit scale:

```typescript
spacing[1]  // 4px
spacing[2]  // 8px
spacing[3]  // 12px
spacing[4]  // 16px
spacing[6]  // 24px
spacing[8]  // 32px
```

### Typography

```typescript
fontFamily.sans  // Inter, system-ui, ...
fontFamily.mono  // JetBrains Mono, Fira Code, ...

fontSize.{xs,sm,base,lg,xl,2xl,3xl,4xl,5xl}
fontWeight.{normal,medium,semibold,bold}

typography.{h1,h2,h3,h4,h5,h6,body,bodySm,label,caption,code}
```

### Motion

```typescript
duration.{instant,fast,normal,slow,slower,slowest}
easing.{linear,easeIn,easeOut,easeInOut,standard,bounce}
transitions.{all,colors,opacity,transform}
```

### Shadows & Elevation

```typescript
shadow.{xs,sm,md,lg,xl,2xl,focus,focusError}
zIndex.{hide,base,dropdown,modal,popover,tooltip,toast,top}
```

---

## Build

```bash
# Build tokens
cd orgs/open-hax/uxx/tokens
npm run build

# Build React
cd orgs/open-hax/uxx/react
npm run build

# Run Storybook
cd orgs/open-hax/uxx/react
npm run storybook

# Build Reagent
cd orgs/open-hax/uxx/reagent
npm run build
```

## Project Structure

```
orgs/open-hax/uxx/
├── tokens/
│   ├── src/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── typography.ts
│   │   ├── motion.ts
│   │   ├── shadows.ts
│   │   └── index.ts
│   └── dist/
│
├── react/
│   ├── src/primitives/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Input.tsx
│   │   ├── Progress.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── Chat.tsx
│   │   ├── Toast.tsx
│   │   ├── FileTree.tsx
│   │   ├── Tabs.tsx
│   │   ├── Feed.tsx
│   │   ├── Markdown.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── DiffViewer.tsx
│   │   ├── MarkdownEditor.tsx
│   │   └── RichTextEditor.tsx
│   ├── .storybook/
│   └── dist/
│
├── reagent/
│   └── src/devel/ui/primitives/
│
└── contracts/
    ├── button.edn
    ├── badge.edn
    └── ... (19 contracts)
```

## Analysis Tools

Located in `tools/ui-audit/`:

- `discover.mjs` — Scan codebase for TSX/JSX/CLJS files
- `analyze-components.mjs` — AST-level component usage analysis
- `classify-components.mjs` — Tier classification (primitive/composite/app-specific)
- `EXTRACTION_REPORT.md` — Detailed extraction plan

## License

GPL-3.0-or-later
