import type { Meta, StoryObj } from '@storybook/angular';
import { PageHeaderComponent } from './page-header.component';

const meta: Meta<PageHeaderComponent> = {
  title: 'Shared/Layout/PageHeader',
  component: PageHeaderComponent,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  render: (args) => ({
    props: args,
    template: `
      <app-page-header [title]="title" [showBack]="showBack" [backHref]="backHref" [translucent]="translucent" />
    `,
  }),
};
export default meta;
type Story = StoryObj<PageHeaderComponent>;

export const Default: Story = {
  args: { title: 'My Page', showBack: false, backHref: '/', translucent: true },
};

export const WithBackButton: Story = {
  args: { title: 'Detail View', showBack: true, backHref: '/home', translucent: true },
};

export const NotTranslucent: Story = {
  args: { title: 'Settings', showBack: true, backHref: '/', translucent: false },
};
