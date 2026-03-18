import type { Meta, StoryObj } from '@storybook/angular';
import { LoadingSkeletonComponent } from './loading-skeleton.component';

const meta: Meta<LoadingSkeletonComponent> = {
  title: 'Shared/Feedback/LoadingSkeleton',
  component: LoadingSkeletonComponent,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<LoadingSkeletonComponent>;

export const Default: Story = {
  args: { count: 4, showAvatar: true },
};

export const NoAvatar: Story = {
  args: { count: 3, showAvatar: false },
};

export const Single: Story = {
  args: { count: 1, showAvatar: true },
};
