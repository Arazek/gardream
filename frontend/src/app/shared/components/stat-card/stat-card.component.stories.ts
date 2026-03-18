import type { Meta, StoryObj } from '@storybook/angular';
import { StatCardComponent, StatCardColor } from './stat-card.component';

const meta: Meta<StatCardComponent> = {
  title: 'Admin/StatCard',
  component: StatCardComponent,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'select', options: ['primary', 'success', 'warning', 'danger'] satisfies StatCardColor[] },
    trend: { control: 'number' },
    icon: { control: 'text' },
    value: { control: 'text' },
    label: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<StatCardComponent>;

export const Default: Story = {
  args: { label: 'Total Users', value: '12,430', icon: 'people-outline', color: 'primary', trend: 8.2 },
  render: (args) => ({
    props: args,
    template: `<div style="width:220px"><app-stat-card [label]="label" [value]="value" [icon]="icon" [color]="color" [trend]="trend" /></div>`,
  }),
};

export const NegativeTrend: Story = {
  args: { label: 'Revenue', value: '$48,210', icon: 'cash-outline', color: 'danger', trend: -3.4 },
  render: (args) => ({
    props: args,
    template: `<div style="width:220px"><app-stat-card [label]="label" [value]="value" [icon]="icon" [color]="color" [trend]="trend" /></div>`,
  }),
};

export const NoTrend: Story = {
  args: { label: 'Orders', value: '1,042', icon: 'cart-outline', color: 'warning' },
  render: (args) => ({
    props: args,
    template: `<div style="width:220px"><app-stat-card [label]="label" [value]="value" [icon]="icon" [color]="color" /></div>`,
  }),
};

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display:grid;grid-template-columns:repeat(4,220px);gap:16px;padding:16px">
        <app-stat-card label="Total Users"   value="12,430" icon="people-outline"       color="primary" [trend]="8.2"  />
        <app-stat-card label="Revenue"       value="$48.2k" icon="cash-outline"         color="success" [trend]="12.1" />
        <app-stat-card label="Pending"       value="74"     icon="alert-circle-outline"  color="warning" [trend]="-2.5" />
        <app-stat-card label="Churned"       value="23"     icon="trending-down-outline" color="danger"  [trend]="-18"  />
      </div>
    `,
  }),
};

export const NoIcon: Story = {
  render: () => ({
    template: `
      <div style="display:grid;grid-template-columns:repeat(3,200px);gap:16px;padding:16px">
        <app-stat-card label="Page Views"   value="94,321" color="primary" [trend]="5.1"  />
        <app-stat-card label="Bounce Rate"  value="38.7%"  color="warning" [trend]="-1.2" />
        <app-stat-card label="Conversions" value="2.4%"   color="success" [trend]="0.3"  />
      </div>
    `,
  }),
};
