import type { Meta, StoryObj } from '@storybook/angular';
import { SidebarComponent, SidebarItem } from './sidebar.component';

const items: SidebarItem[] = [
  { label: 'Dashboard', icon: 'home',        route: '/dashboard' },
  { label: 'Users',     icon: 'person',      route: '/users',    badge: 3 },
  { label: 'Analytics', icon: 'monitoring', route: '/analytics' },
  {
    label: 'Content',
    icon: 'description',
    children: [
      { label: 'Posts',    icon: 'description', route: '/content/posts' },
      { label: 'Media',    icon: 'description', route: '/content/media' },
    ],
  },
  { label: 'Finance',   icon: 'payments',         route: '/finance',  badge: 12 },
  { label: 'Security',  icon: 'shield',       route: '/security'  },
  { label: 'Settings',  icon: 'settings',     route: '/settings'  },
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
      { label: 'Dashboard',     icon: 'home',          route: '/' },
      { label: 'Notifications', icon: 'notifications', route: '/notifications', badge: 5 },
      { label: 'Users',         icon: 'person',         route: '/users',        badge: 99 },
      { label: 'Finance',       icon: 'payments',           route: '/finance',      badge: 1 },
      { label: 'Settings',      icon: 'settings',       route: '/settings' },
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
      { label: 'Dashboard', icon: 'home', route: '/' },
      {
        label: 'Content',
        icon: 'description',
        children: [
          { label: 'Posts',     icon: 'description', route: '/content/posts' },
          { label: 'Pages',     icon: 'description', route: '/content/pages' },
          { label: 'Media',     icon: 'description', route: '/content/media' },
        ],
      },
      {
        label: 'Users',
        icon: 'person',
        badge: 3,
        children: [
          { label: 'All Users', icon: 'person', route: '/users/all' },
          { label: 'Roles',     icon: 'shield',  route: '/users/roles' },
        ],
      },
      { label: 'Settings', icon: 'settings', route: '/settings' },
    ],
    collapsed: false,
    activeRoute: '/content/posts',
  },
  render: (args) => ({
    props: args,
    template: `<div style="height:520px;display:flex"><app-sidebar [items]="items" [collapsed]="collapsed" [activeRoute]="activeRoute" /></div>`,
  }),
};
