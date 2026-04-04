import type { Preview } from '@storybook/react';
import { UxxThemeProvider } from '../src/UxxThemeProvider';

const preview: Preview = {
  globalTypes: {
    uxxTheme: {
      name: 'UXX Theme',
      description: 'Global theme pack for UXX components',
      defaultValue: 'monokai',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'monokai', title: 'Monokai' },
          { value: 'proxyConsole', title: 'Proxy Console' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'transparent',
      values: [
        { name: 'transparent', value: 'transparent' },
      ],
    },
  },
  decorators: [
    (Story, context) => (
      <UxxThemeProvider
        theme={context.globals.uxxTheme ?? 'monokai'}
        style={{
          minHeight: '100vh',
          padding: '1rem',
          background: 'var(--uxx-colors-background-default)',
          color: 'var(--uxx-colors-text-default)',
        }}
      >
        <Story />
      </UxxThemeProvider>
    ),
  ],
};

export default preview;
