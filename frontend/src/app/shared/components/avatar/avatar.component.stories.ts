import type { Meta, StoryObj } from '@storybook/angular';
import { AvatarComponent } from './avatar.component';

const meta: Meta<AvatarComponent> = {
  title: 'Shared/DataDisplay/Avatar',
  component: AvatarComponent,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
  },
};
export default meta;
type Story = StoryObj<AvatarComponent>;

export const WithImage: Story = {
  args: { src: 'https://i.pravatar.cc/150?img=3', name: 'Jane Doe', size: 'md' },
};

export const Initials: Story = {
  args: { src: '', name: 'Jane Doe', size: 'md' },
};

export const SingleName: Story = {
  args: { src: '', name: 'Alice', size: 'md' },
};

export const Small: Story = { args: { src: '', name: 'Tom Smith', size: 'sm' } };
export const Large: Story = { args: { src: '', name: 'Tom Smith', size: 'lg' } };
export const XLarge: Story = { args: { src: '', name: 'Tom Smith', size: 'xl' } };
