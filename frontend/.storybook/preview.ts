import { Preview, applicationConfig, Decorator } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideIonicAngular } from '@ionic/angular/standalone';

const withTheme: Decorator = (storyFn, context) => {
  const theme = context.globals['theme'] ?? 'light';

  document.body.classList.toggle('dark', theme === 'dark');
  document.body.style.backgroundColor = theme === 'dark' ? '#121212' : '#f4f5f8';

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
  },
  globals: {
    theme: 'light',
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
