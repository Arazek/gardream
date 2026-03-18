import type { Meta, StoryObj } from '@storybook/angular';
import { ChipComponent, ChipVariant } from './chip.component';

const meta: Meta<ChipComponent> = {
  title: 'Shared/DataDisplay/Chip',
  component: ChipComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'info', 'success', 'warning', 'danger'] satisfies ChipVariant[] },
    selected: { control: 'boolean' },
    removable: { control: 'boolean' },
    remove: { action: 'remove' },
  },
  render: (args) => ({
    props: args,
    template: `<app-chip [variant]="variant" [selected]="selected" [removable]="removable" (remove)="remove()">Label</app-chip>`,
  }),
};
export default meta;
type Story = StoryObj<ChipComponent>;

export const Default: Story = { args: { variant: 'default', selected: false, removable: false } };
export const Selected: Story = { args: { variant: 'default', selected: true, removable: false } };
export const Removable: Story = { args: { variant: 'default', selected: false, removable: true } };
export const SelectedAndRemovable: Story = { args: { variant: 'default', selected: true, removable: true } };

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding:16px;background:var(--ion-background-color,#f4f5f8);border-radius:8px">
        <app-chip variant="default">Default</app-chip>
        <app-chip variant="info">Info</app-chip>
        <app-chip variant="success">Success</app-chip>
        <app-chip variant="warning">Warning</app-chip>
        <app-chip variant="danger">Danger</app-chip>
      </div>
    `,
  }),
};

export const Group: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding:16px;background:var(--ion-background-color,#f4f5f8);border-radius:8px">
        <app-chip [selected]="true">Design</app-chip>
        <app-chip>Development</app-chip>
        <app-chip [removable]="true">Marketing</app-chip>
        <app-chip [selected]="true" [removable]="true">Product</app-chip>
      </div>
    `,
  }),
};
