import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { FormFieldComponent } from './form-field.component';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';

const meta: Meta<FormFieldComponent> = {
  title: 'Shared/Forms/FormField',
  component: FormFieldComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [provideAnimations()] }),
  ],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'number', 'tel'] },
  },
  render: (args) => ({
    props: { ...args, control: new FormControl('') },
    template: `
      <div style="width:320px;padding:16px">
        <app-form-field
          [label]="label"
          [placeholder]="placeholder"
          [type]="type"
          [required]="required"
          [control]="control"
        />
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<FormFieldComponent>;

export const Default: Story = {
  args: { label: 'Full Name', placeholder: 'Enter your name', type: 'text', required: false },
};

export const Email: Story = {
  args: { label: 'Email', placeholder: 'you@example.com', type: 'email', required: true },
};

export const Password: Story = {
  args: { label: 'Password', placeholder: '••••••••', type: 'password', required: true },
};

export const WithValidationError: Story = {
  render: () => {
    const control = new FormControl('', [Validators.required, Validators.email]);
    control.markAsTouched();
    return {
      props: { control },
      imports: [ReactiveFormsModule],
      template: `
        <div style="width:320px;padding:16px">
          <app-form-field label="Email" placeholder="you@example.com" type="email" [required]="true" [control]="control" />
        </div>
      `,
    };
  },
};

export const AllTypes: Story = {
  render: () => ({
    props: {
      textControl: new FormControl(''),
      emailControl: new FormControl(''),
      passwordControl: new FormControl(''),
      telControl: new FormControl(''),
    },
    imports: [ReactiveFormsModule],
    template: `
      <div style="width:320px;padding:16px;display:flex;flex-direction:column;gap:16px">
        <app-form-field label="Full Name" placeholder="John Doe" [control]="textControl" />
        <app-form-field label="Email" placeholder="you@example.com" type="email" [control]="emailControl" />
        <app-form-field label="Password" placeholder="••••••••" type="password" [control]="passwordControl" />
        <app-form-field label="Phone" placeholder="+1 234 567 8900" type="tel" [control]="telControl" />
      </div>
    `,
  }),
};
