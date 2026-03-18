import type { Meta, StoryObj } from '@storybook/angular';
import { SidebarComponent, SidebarItem } from './sidebar.component';

const items: SidebarItem[] = [
  { label: 'Dashboard', icon: 'home-outline',        route: '/dashboard' },
  { label: 'Users',     icon: 'people-outline',      route: '/users',    badge: 3 },
  { label: 'Analytics', icon: 'stats-chart-outline', route: '/analytics' },
  {
    label: 'Content',
    icon: 'document-text-outline',
    children: [
      { label: 'Posts',    icon: 'document-text-outline', route: '/content/posts' },
      { label: 'Media',    icon: 'document-text-outline', route: '/content/media' },
    ],
  },
  { label: 'Finance',   icon: 'cash-outline',         route: '/finance',  badge: 12 },
  { label: 'Security',  icon: 'shield-outline',       route: '/security'  },
  { label: 'Settings',  icon: 'settings-outline',     route: '/settings'  },
];

const meta: Meta<SidebarComponent> = {
  title: 'Admin/Sidebar',
  component: SidebarComponent,
  tags: ['autodocs'],
  argTypes: {
    collapsed:    { control: 'boolean' },
    activeRoute:  { control: 'text' },
    itemClick:    { action: 'itemClick' },
    collapsedChange: { action: 'collapsedChange' },
  },
};
export default meta;
type Story = StoryObj<SidebarComponent>;

export const Expanded: Story = {
  args: { items, collapsed: false, activeRoute: '/dashboard' },
  render: (args) => ({
    props: args,
    template: `<div style="height:520px;display:flex"><app-sidebar [items]="items" [collapsed]="collapsed" [activeRoute]="activeRoute" (itemClick)="itemClick($event)" (collapsedChange)="collapsedChange($event)" /></div>`,
  }),
};

export const Collapsed: Story = {
  args: { items, collapsed: true, activeRoute: '/users' },
  render: (args) => ({
    props: args,
    template: `<div style="height:520px;display:flex"><app-sidebar [items]="items" [collapsed]="collapsed" [activeRoute]="activeRoute" (itemClick)="itemClick($event)" (collapsedChange)="collapsedChange($event)" /></div>`,
  }),
};

export const WithBadges: Story = {
  args: {
    items: [
      { label: 'Dashboard',     icon: 'home-outline',          route: '/' },
      { label: 'Notifications', icon: 'notifications-outline', route: '/notifications', badge: 5 },
      { label: 'Users',         icon: 'people-outline',         route: '/users',        badge: 99 },
      { label: 'Finance',       icon: 'cash-outline',           route: '/finance',      badge: 1 },
      { label: 'Settings',      icon: 'settings-outline',       route: '/settings' },
    ],
    collapsed: false,
    activeRoute: '/',
  },
  render: (args) => ({
    props: args,
    template: `<div style="height:420px;display:flex"><app-sidebar [items]="items" [collapsed]="collapsed" [activeRoute]="activeRoute" /></div>`,
  }),
};

export const WithNestedItems: Story = {
  args: {
    items: [
      { label: 'Dashboard', icon: 'home-outline', route: '/' },
      {
        label: 'Content',
        icon: 'document-text-outline',
        children: [
          { label: 'Posts',     icon: 'document-text-outline', route: '/content/posts' },
          { label: 'Pages',     icon: 'document-text-outline', route: '/content/pages' },
          { label: 'Media',     icon: 'document-text-outline', route: '/content/media' },
        ],
      },
      {
        label: 'Users',
        icon: 'people-outline',
        badge: 3,
        children: [
          { label: 'All Users', icon: 'people-outline', route: '/users/all' },
          { label: 'Roles',     icon: 'shield-outline',  route: '/users/roles' },
        ],
      },
      { label: 'Settings', icon: 'settings-outline', route: '/settings' },
    ],
    collapsed: false,
    activeRoute: '/content/posts',
  },
  render: (args) => ({
    props: args,
    template: `<div style="height:520px;display:flex"><app-sidebar [items]="items" [collapsed]="collapsed" [activeRoute]="activeRoute" /></div>`,
  }),
};
