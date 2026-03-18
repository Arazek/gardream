import type { Meta, StoryObj } from '@storybook/angular';
import { DividerComponent } from './divider.component';

const meta: Meta<DividerComponent> = {
  title: 'Shared/Layout/Divider',
  component: DividerComponent,
  tags: ['autodocs'],
  render: (args) => ({
    props: args,
    template: `
      <div style="width:360px;padding:16px">
        <app-divider [label]="label" />
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<DividerComponent>;

export const Default: Story = { args: { label: '' } };
export const WithLabel: Story = { args: { label: 'or continue with' } };
export const SectionDivider: Story = { args: { label: 'Today' } };

export const InContext: Story = {
  render: () => ({
    template: `
      <div style="width:360px;padding:16px">
        <div style="padding:8px 0;color:#444">Sign in with email</div>
        <app-divider label="or" />
        <div style="padding:8px 0;color:#444">Sign in with social</div>
      </div>
    `,
  }),
};
