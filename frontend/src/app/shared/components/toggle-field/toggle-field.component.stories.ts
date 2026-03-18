import type { Meta, StoryObj } from '@storybook/angular';
import { ToggleFieldComponent } from './toggle-field.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

const meta: Meta<ToggleFieldComponent> = {
  title: 'Shared/Forms/ToggleField',
  component: ToggleFieldComponent,
  tags: ['autodocs'],
  render: (args) => ({
    props: { ...args, control: new FormControl(false) },
    template: `
      <div style="width:360px">
        <app-toggle-field [label]="label" [description]="description" [control]="control" />
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<ToggleFieldComponent>;

export const Default: Story = {
  args: { label: 'Enable notifications', description: '' },
};

export const WithDescription: Story = {
  args: { label: 'Dark mode', description: 'Switch between light and dark theme' },
};

export const Enabled: Story = {
  render: () => ({
    props: { control: new FormControl(true) },
    imports: [ReactiveFormsModule],
    template: `
      <div style="width:360px">
        <app-toggle-field label="Push notifications" description="Receive alerts on your device" [control]="control" />
      </div>
    `,
  }),
};

export const SettingsList: Story = {
  render: () => ({
    props: {
      notifications: new FormControl(true),
      darkMode: new FormControl(false),
      analytics: new FormControl(true),
      marketing: new FormControl(false),
    },
    imports: [ReactiveFormsModule],
    template: `
      <div style="width:360px">
        <app-toggle-field label="Notifications" description="Receive push notifications" [control]="notifications" />
        <app-toggle-field label="Dark mode" description="Use dark color scheme" [control]="darkMode" />
        <app-toggle-field label="Usage analytics" description="Help us improve the app" [control]="analytics" />
        <app-toggle-field label="Marketing emails" [control]="marketing" />
      </div>
    `,
  }),
};
