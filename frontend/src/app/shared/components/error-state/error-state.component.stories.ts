import type { Meta, StoryObj } from '@storybook/angular';
import { addIcons } from 'ionicons';
import { wifiOutline } from 'ionicons/icons';
import { ErrorStateComponent } from './error-state.component';

const meta: Meta<ErrorStateComponent> = {
  title: 'Shared/Feedback/ErrorState',
  component: ErrorStateComponent,
  tags: ['autodocs'],
  argTypes: {
    retry: { action: 'retry clicked' },
  },
};
export default meta;
type Story = StoryObj<ErrorStateComponent>;

export const Default: Story = {
  args: {
    title: 'Something went wrong',
    message: 'Please check your connection and try again.',
    retryLabel: 'Try again',
  },
};

export const NetworkError: Story = {
  decorators: [(story) => { addIcons({ wifiOutline }); return story(); }],
  args: {
    icon: 'wifi-outline',
    title: 'No internet connection',
    message: 'Connect to the internet and retry.',
    retryLabel: 'Retry',
  },
};

export const NoRetry: Story = {
  args: {
    title: 'Access denied',
    message: 'You do not have permission to view this.',
    retryLabel: '',
  },
};
