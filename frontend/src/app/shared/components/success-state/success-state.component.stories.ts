import type { Meta, StoryObj } from '@storybook/angular';
import { SuccessStateComponent } from './success-state.component';

const meta: Meta<SuccessStateComponent> = {
  title: 'Shared/Feedback/SuccessState',
  component: SuccessStateComponent,
  tags: ['autodocs'],
  argTypes: {
    action: { action: 'action clicked' },
  },
};
export default meta;
type Story = StoryObj<SuccessStateComponent>;

export const Default: Story = {
  args: { title: 'Done!', message: 'Your changes have been saved.', actionLabel: '' },
};

export const WithAction: Story = {
  args: { title: 'Payment successful', message: 'Your order has been placed.', actionLabel: 'View order' },
};
