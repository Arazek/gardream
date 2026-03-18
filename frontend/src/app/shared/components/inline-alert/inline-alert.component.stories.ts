import type { Meta, StoryObj } from '@storybook/angular';
import { InlineAlertComponent } from './inline-alert.component';

const meta: Meta<InlineAlertComponent> = {
  title: 'Shared/Feedback/InlineAlert',
  component: InlineAlertComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['info', 'warning', 'error', 'success'] },
  },
  decorators: [],
  render: (args) => ({
    props: args,
    styles: [`.wrapper { width: 360px; padding: 16px; }`],
    template: `<div class="wrapper"><app-inline-alert [variant]="variant" [title]="title" [message]="message" /></div>`,
  }),
};
export default meta;
type Story = StoryObj<InlineAlertComponent>;

export const Info: Story = {
  args: { variant: 'info', title: 'Heads up', message: 'This will take a few minutes to process.' },
};

export const Warning: Story = {
  args: { variant: 'warning', title: 'Unsaved changes', message: 'Leave this page? Your changes will be lost.' },
};

export const Error: Story = {
  args: { variant: 'error', title: 'Submission failed', message: 'Please fix the errors below and try again.' },
};

export const Success: Story = {
  args: { variant: 'success', title: 'Profile updated', message: 'Your changes have been saved successfully.' },
};

export const MessageOnly: Story = {
  args: { variant: 'info', title: '', message: 'Read-only mode is active.' },
};
