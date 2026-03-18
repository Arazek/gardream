import type { Meta, StoryObj } from '@storybook/angular';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline,
  checkmarkCircleOutline,
  warningOutline,
  closeCircleOutline,
  documentsOutline,
  searchOutline,
} from 'ionicons/icons';
import { EmptyStateComponent, EmptyStateVariant } from './empty-state.component';

addIcons({ informationCircleOutline, checkmarkCircleOutline, warningOutline, closeCircleOutline, documentsOutline, searchOutline });

const meta: Meta<EmptyStateComponent> = {
  title: 'Shared/Feedback/EmptyState',
  component: EmptyStateComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'info', 'success', 'warning', 'danger'] satisfies EmptyStateVariant[] },
    action: { action: 'action clicked' },
  },
};
export default meta;
type Story = StoryObj<EmptyStateComponent>;

export const Default: Story = {
  args: {
    icon: 'alert-circle-outline',
    title: 'Nothing here yet',
    message: 'Add your first item to get started.',
    actionLabel: '',
  },
};

export const WithAction: Story = {
  args: {
    icon: 'documents-outline',
    title: 'No documents',
    message: 'Upload a document to see it here.',
    actionLabel: 'Upload document',
  },
};

export const SearchEmpty: Story = {
  args: {
    icon: 'search-outline',
    title: 'No results',
    message: 'Try a different search term.',
    actionLabel: '',
  },
};

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:8px">
        <app-empty-state variant="info"    icon="information-circle-outline" title="Did you know?"      message="You can invite teammates from the settings page." />
        <app-empty-state variant="success" icon="checkmark-circle-outline"   title="All caught up!"    message="There is nothing left to review." />
        <app-empty-state variant="warning" icon="warning-outline"            title="Attention needed"  message="Some items require your review before proceeding." />
        <app-empty-state variant="danger"  icon="close-circle-outline"       title="Access restricted" message="You do not have permission to view this content." />
      </div>
    `,
  }),
};
