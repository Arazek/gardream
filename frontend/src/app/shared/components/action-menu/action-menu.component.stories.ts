import type { Meta, StoryObj } from '@storybook/angular';
import { ActionMenuComponent, ActionMenuItem } from './action-menu.component';

const defaultActions: ActionMenuItem[] = [
  { label: 'View',    icon: 'eye-outline',     handler: () => alert('View') },
  { label: 'Edit',    icon: 'create-outline',  handler: () => alert('Edit') },
  { label: 'Copy',    icon: 'copy-outline',    handler: () => alert('Copy') },
  { label: 'Archive', icon: 'archive-outline', handler: () => alert('Archive') },
];

const withDangerActions: ActionMenuItem[] = [
  { label: 'Edit',   icon: 'create-outline', handler: () => alert('Edit') },
  { label: 'Delete', icon: 'trash-outline',  color: 'danger', handler: () => alert('Delete') },
];

const withDisabled: ActionMenuItem[] = [
  { label: 'Edit',    icon: 'create-outline',  handler: () => alert('Edit') },
  { label: 'Share',   icon: 'share-outline',   disabled: true, handler: () => {} },
  { label: 'Delete',  icon: 'trash-outline',   color: 'danger', handler: () => alert('Delete') },
];

const triggerButton = `
  <button style="
    display:inline-flex;align-items:center;gap:6px;
    padding:6px 12px;border-radius:8px;border:1px solid var(--ion-color-light-shade);
    background:var(--ion-item-background);color:var(--ion-text-color);
    font-size:13px;cursor:pointer
  ">
    ⋯ Actions
  </button>
`;

const meta: Meta<ActionMenuComponent> = {
  title: 'Admin/ActionMenu',
  component: ActionMenuComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<ActionMenuComponent>;

export const Default: Story = {
  render: () => ({
    props: { actions: defaultActions },
    template: `
      <div style="padding:32px;display:flex;justify-content:center">
        <app-action-menu [actions]="actions">
          ${triggerButton}
        </app-action-menu>
      </div>
    `,
  }),
};

export const WithDangerAction: Story = {
  render: () => ({
    props: { actions: withDangerActions },
    template: `
      <div style="padding:32px;display:flex;justify-content:center">
        <app-action-menu [actions]="actions">
          ${triggerButton}
        </app-action-menu>
      </div>
    `,
  }),
};

export const WithDisabledAction: Story = {
  render: () => ({
    props: { actions: withDisabled },
    template: `
      <div style="padding:32px;display:flex;justify-content:center">
        <app-action-menu [actions]="actions">
          ${triggerButton}
        </app-action-menu>
      </div>
    `,
  }),
};

export const IconTrigger: Story = {
  render: () => ({
    props: { actions: defaultActions },
    template: `
      <div style="padding:32px;display:flex;justify-content:center">
        <app-action-menu [actions]="actions">
          <button style="
            width:32px;height:32px;border-radius:8px;border:none;
            background:var(--ion-item-background);cursor:pointer;
            display:flex;align-items:center;justify-content:center;
            font-size:18px;color:var(--ion-color-medium)
          ">⋮</button>
        </app-action-menu>
      </div>
    `,
  }),
};
