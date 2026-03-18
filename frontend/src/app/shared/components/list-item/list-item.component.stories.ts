import type { Meta, StoryObj } from '@storybook/angular';
import { ListItemComponent } from './list-item.component';

const meta: Meta<ListItemComponent> = {
  title: 'Shared/Lists/ListItem',
  component: ListItemComponent,
  tags: ['autodocs'],
  argTypes: {
    lines: { control: 'select', options: ['full', 'inset', 'none'] },
    itemClick: { action: 'itemClick' },
  },
  render: (args) => ({
    props: args,
    template: `
      <app-list-item
        [title]="title"
        [subtitle]="subtitle"
        [meta]="meta"
        [avatarSrc]="avatarSrc"
        [avatarName]="avatarName"
        [clickable]="clickable"
        [showChevron]="showChevron"
        [lines]="lines"
        (itemClick)="itemClick()"
      />
    `,
  }),
};
export default meta;
type Story = StoryObj<ListItemComponent>;

export const Default: Story = {
  args: { title: 'John Doe', subtitle: 'Software Engineer', avatarName: 'John Doe', lines: 'inset' },
};

export const WithMeta: Story = {
  args: { title: 'Jane Smith', subtitle: 'Product Designer', meta: '2h ago', avatarName: 'Jane Smith', lines: 'inset' },
};

export const Clickable: Story = {
  args: {
    title: 'Alex Johnson',
    subtitle: 'Engineering Manager',
    avatarName: 'Alex Johnson',
    clickable: true,
    showChevron: true,
    lines: 'inset',
  },
};

export const TitleOnly: Story = {
  args: { title: 'Settings', lines: 'inset' },
};

export const WithAvatar: Story = {
  args: {
    title: 'Profile Photo',
    subtitle: 'Avatar from URL',
    avatarSrc: 'https://i.pravatar.cc/64?img=3',
    lines: 'inset',
  },
};

export const ListGroup: Story = {
  render: () => ({
    template: `
      <div style="max-width:360px">
        <app-list-item title="Notifications" subtitle="Manage your alerts" [clickable]="true" [showChevron]="true" lines="inset" />
        <app-list-item title="Privacy" subtitle="Control your data" [clickable]="true" [showChevron]="true" lines="inset" />
        <app-list-item title="Appearance" subtitle="Theme and display" [clickable]="true" [showChevron]="true" lines="none" />
      </div>
    `,
  }),
};
