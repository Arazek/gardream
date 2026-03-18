import type { Meta, StoryObj } from '@storybook/angular';
import { DataTableComponent } from './data-table.component';

interface User {
  name: string;
  email: string;
  role: string;
  status: string;
  joined: string;
}

const columns = [
  { key: 'name'   as const, label: 'Name',   sortable: true  },
  { key: 'email'  as const, label: 'Email',  sortable: true  },
  { key: 'role'   as const, label: 'Role'                    },
  { key: 'status' as const, label: 'Status', align: 'center' as const },
  { key: 'joined' as const, label: 'Joined', sortable: true  },
];

const rows: User[] = [
  { name: 'Alice Martin',  email: 'alice@example.com',  role: 'Admin',  status: 'Active',   joined: '2024-01-12' },
  { name: 'Bob Torres',    email: 'bob@example.com',    role: 'Editor', status: 'Active',   joined: '2024-03-05' },
  { name: 'Carol Smith',   email: 'carol@example.com',  role: 'Viewer', status: 'Inactive', joined: '2023-11-20' },
  { name: 'David Kim',     email: 'david@example.com',  role: 'Editor', status: 'Active',   joined: '2024-06-18' },
  { name: 'Eva Rossi',     email: 'eva@example.com',    role: 'Admin',  status: 'Active',   joined: '2023-09-01' },
];

const meta: Meta<DataTableComponent> = {
  title: 'Admin/DataTable',
  component: DataTableComponent,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    emptyLabel: { control: 'text' },
    sortChange: { action: 'sortChange' },
  },
};
export default meta;
type Story = StoryObj<DataTableComponent>;

export const Default: Story = {
  render: (args) => ({
    props: { ...args, columns, rows },
    template: `<div style="padding:16px"><app-data-table [columns]="columns" [rows]="rows" (sortChange)="sortChange($event)" /></div>`,
  }),
};

export const Loading: Story = {
  render: () => ({
    props: { columns, rows: [], loading: true },
    template: `<div style="padding:16px"><app-data-table [columns]="columns" [rows]="rows" [loading]="loading" /></div>`,
  }),
};

export const Empty: Story = {
  render: () => ({
    props: { columns, rows: [], loading: false, emptyLabel: 'No users found' },
    template: `<div style="padding:16px"><app-data-table [columns]="columns" [rows]="rows" [loading]="loading" [emptyLabel]="emptyLabel" /></div>`,
  }),
};

export const WithActions: Story = {
  render: () => ({
    props: { columns, rows },
    template: `
      <div style="padding:16px">
        <app-data-table [columns]="columns" [rows]="rows">
          <ng-template #actionsTemplate let-row>
            <button style="font-size:12px;padding:4px 10px;border:1px solid var(--ion-color-primary);border-radius:6px;color:var(--ion-color-primary);background:none;cursor:pointer">
              Edit
            </button>
          </ng-template>
        </app-data-table>
      </div>
    `,
  }),
};
