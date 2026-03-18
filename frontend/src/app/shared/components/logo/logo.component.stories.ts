import type { Meta, StoryObj } from '@storybook/angular';
import { LogoComponent } from './logo.component';

const meta: Meta<LogoComponent> = {
  title: 'Shared/Auth/Logo',
  component: LogoComponent,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) => ({
    props: args,
    template: `<app-logo [src]="src" [appName]="appName" [size]="size" />`,
  }),
};
export default meta;
type Story = StoryObj<LogoComponent>;

export const InitialFallback: Story = {
  args: { src: '', appName: 'MyApp', size: 'md' },
};

export const Small: Story = { args: { src: '', appName: 'MyApp', size: 'sm' } };
export const Large: Story = { args: { src: '', appName: 'MyApp', size: 'lg' } };

export const WithImage: Story = {
  args: { src: 'https://picsum.photos/72/72', appName: 'MyApp', size: 'lg' },
};

export const AllSizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;align-items:center;gap:24px;padding:16px">
        <app-logo appName="A" size="sm" />
        <app-logo appName="A" size="md" />
        <app-logo appName="A" size="lg" />
      </div>
    `,
  }),
};
