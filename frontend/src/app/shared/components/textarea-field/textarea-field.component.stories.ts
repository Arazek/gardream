import type { Meta, StoryObj } from '@storybook/angular';
import { TextareaFieldComponent } from './textarea-field.component';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

const meta: Meta<TextareaFieldComponent> = {
  title: 'Shared/Forms/TextareaField',
  component: TextareaFieldComponent,
  tags: ['autodocs'],
  render: (args) => ({
    props: { ...args, control: new FormControl('') },
    template: `
      <div style="width:320px;padding:16px">
        <app-textarea-field
          [label]="label"
          [placeholder]="placeholder"
          [rows]="rows"
          [autoGrow]="autoGrow"
          [required]="required"
          [control]="control"
        />
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<TextareaFieldComponent>;

export const Default: Story = {
  args: { label: 'Bio', placeholder: 'Tell us about yourself...', rows: 3, autoGrow: false, required: false },
};

export const AutoGrow: Story = {
  args: { label: 'Message', placeholder: 'Type your message...', rows: 2, autoGrow: true, required: false },
};

export const Required: Story = {
  args: { label: 'Description', placeholder: 'Required field', rows: 4, autoGrow: false, required: true },
};

export const WithValidationError: Story = {
  render: () => {
    const control = new FormControl('', [Validators.required]);
    control.markAsTouched();
    return {
      props: { control },
      imports: [ReactiveFormsModule],
      template: `
        <div style="width:320px;padding:16px">
          <app-textarea-field label="Description" placeholder="Required field" [required]="true" [control]="control" />
        </div>
      `,
    };
  },
};
