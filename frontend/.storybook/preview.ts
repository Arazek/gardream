import { Preview, applicationConfig, Decorator } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideIonicAngular } from '@ionic/angular/standalone';

const withTheme: Decorator = (storyFn, context) => {
  const theme = context.globals['theme'] ?? 'light';
  const accent = context.globals['accent'] ?? 'none';

  document.body.classList.toggle('dark', theme === 'dark');
  document.body.style.backgroundColor = theme === 'dark' ? '#121212' : '#f4f5f8';

  document.body.removeAttribute('data-accent');
  if (accent !== 'none') {
    document.body.setAttribute('data-accent', accent);
  }

  return storyFn();
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    accent: {
      description: 'Accent color',
      toolbar: {
        title: 'Accent',
        icon: 'paintbrush',
        items: [
          { value: 'none', title: 'Default (blue)' },
          { value: 'clay', title: 'Clay' },
          { value: 'moss', title: 'Moss' },
          { value: 'dune', title: 'Dune' },
          { value: 'slate', title: 'Slate' },
        ],
        dynamicTitle: true,
      },
    },
  },
  globals: {
    theme: 'light',
    accent: 'none',
  },
  decorators: [
    withTheme,
    applicationConfig({
      providers: [provideAnimations(), provideIonicAngular()],
    }),
  ],
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    backgrounds: { disable: true },
  },
};

export default preview;
