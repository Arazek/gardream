import type { Meta, StoryObj } from '@storybook/angular';
import { SelectFieldComponent } from './select-field.component';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

const COUNTRY_OPTIONS = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Canada', value: 'ca' },
  { label: 'Australia', value: 'au' },
  { label: 'Germany', value: 'de' },
];

const meta: Meta<SelectFieldComponent> = {
  title: 'Shared/Forms/SelectField',
  component: SelectFieldComponent,
  tags: ['autodocs'],
  render: (args) => ({
    props: { ...args, control: new FormControl('') },
    template: `
      <div style="width:320px;padding:16px">
        <app-select-field [label]="label" [placeholder]="placeholder" [options]="options" [control]="control" />
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<SelectFieldComponent>;

export const Default: Story = {
  args: { label: 'Country', placeholder: 'Select a country', options: COUNTRY_OPTIONS },
};

export const WithValidationError: Story = {
  render: () => {
    const control = new FormControl('', [Validators.required]);
    control.markAsTouched();
    return {
      props: { control, options: COUNTRY_OPTIONS },
      imports: [ReactiveFormsModule],
      template: `
        <div style="width:320px;padding:16px">
          <app-select-field label="Country" placeholder="Select a country" [options]="options" [control]="control" />
        </div>
      `,
    };
  },
};

export const RoleSelector: Story = {
  args: {
    label: 'Role',
    placeholder: 'Choose a role',
    options: [
      { label: 'Admin', value: 'admin' },
      { label: 'Editor', value: 'editor' },
      { label: 'Viewer', value: 'viewer' },
    ],
  },
};
