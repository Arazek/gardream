import type { Meta, StoryObj } from '@storybook/angular';
import { BadgeComponent } from './badge.component';

const meta: Meta<BadgeComponent> = {
  title: 'Shared/DataDisplay/Badge',
  component: BadgeComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'success', 'warning', 'danger', 'medium'] },
  },
  render: (args) => ({
    props: args,
    template: `<app-badge [variant]="variant">{{ variant }}</app-badge>`,
  }),
};
export default meta;
type Story = StoryObj<BadgeComponent>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Success: Story = { args: { variant: 'success' } };
export const Warning: Story = { args: { variant: 'warning' } };
export const Danger:  Story = { args: { variant: 'danger' } };
export const Medium:  Story = { args: { variant: 'medium' } };

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding:16px">
        <app-badge variant="primary">Active</app-badge>
        <app-badge variant="success">Completed</app-badge>
        <app-badge variant="warning">Pending</app-badge>
        <app-badge variant="danger">Failed</app-badge>
        <app-badge variant="medium">Draft</app-badge>
      </div>
    `,
  }),
};
