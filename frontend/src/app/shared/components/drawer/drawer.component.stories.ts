import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { IonButton } from '@ionic/angular/standalone';
import { DrawerComponent } from './drawer.component';

const meta: Meta<DrawerComponent> = {
  title: 'Admin/Drawer',
  component: DrawerComponent,
  tags: ['autodocs'],
  argTypes: {
    open:   { control: 'boolean' },
    title:  { control: 'text' },
    width:  { control: 'text' },
    closed: { action: 'closed' },
  },
};
export default meta;
type Story = StoryObj<DrawerComponent>;

export const Controlled: Story = {
  args: { open: true, title: 'User Details', width: '400px' },
  render: (args) => ({
    props: args,
    template: `
      <app-drawer [open]="open" [title]="title" [width]="width" (closed)="closed()">
        <p style="color:var(--ion-text-color)">Drawer body content goes here.</p>
        <p style="color:var(--ion-color-medium);font-size:14px">Use the Controls panel to toggle open/closed.</p>
      </app-drawer>
    `,
  }),
};

export const Closed: Story = {
  args: { open: false, title: 'Details', width: '400px' },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding:24px;color:var(--ion-color-medium)">
        Drawer is closed. Toggle "open" in Controls to see it.
      </div>
      <app-drawer [open]="open" [title]="title" [width]="width" (closed)="closed()">
        <p style="color:var(--ion-text-color)">Content</p>
      </app-drawer>
    `,
  }),
};

@Component({
  selector: 'story-drawer-interactive',
  standalone: true,
  imports: [DrawerComponent, IonButton],
  template: `
    <div style="padding:24px">
      <ion-button (click)="open.set(true)">Open Drawer</ion-button>
    </div>
    <app-drawer [open]="open()" title="Edit User" width="440px" (closed)="open.set(false)">
      <form style="display:flex;flex-direction:column;gap:16px">
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:var(--ion-color-medium);margin-bottom:6px">Full Name</label>
          <input type="text" value="Alice Martin" style="
            width:100%;padding:10px 12px;border-radius:8px;
            border:1px solid rgba(var(--ion-color-medium-rgb),0.3);
            background:var(--ion-item-background);color:var(--ion-text-color);
            font-size:14px;box-sizing:border-box
          " />
        </div>
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:var(--ion-color-medium);margin-bottom:6px">Email</label>
          <input type="email" value="alice@example.com" style="
            width:100%;padding:10px 12px;border-radius:8px;
            border:1px solid rgba(var(--ion-color-medium-rgb),0.3);
            background:var(--ion-item-background);color:var(--ion-text-color);
            font-size:14px;box-sizing:border-box
          " />
        </div>
        <div>
          <label style="display:block;font-size:13px;font-weight:600;color:var(--ion-color-medium);margin-bottom:6px">Role</label>
          <select style="
            width:100%;padding:10px 12px;border-radius:8px;
            border:1px solid rgba(var(--ion-color-medium-rgb),0.3);
            background:var(--ion-item-background);color:var(--ion-text-color);
            font-size:14px;box-sizing:border-box
          ">
            <option>Admin</option>
            <option selected>Editor</option>
            <option>Viewer</option>
          </select>
        </div>
      </form>
      <div slot="footer" style="display:flex;gap:8px;justify-content:flex-end">
        <ion-button fill="outline" (click)="open.set(false)">Cancel</ion-button>
        <ion-button (click)="open.set(false)">Save Changes</ion-button>
      </div>
    </app-drawer>
  `,
})
class DrawerInteractiveStory {
  open = signal(false);
}

export const Interactive: StoryObj = {
  render: () => ({
    moduleMetadata: { imports: [DrawerInteractiveStory] },
    template: `<story-drawer-interactive />`,
  }),
};
