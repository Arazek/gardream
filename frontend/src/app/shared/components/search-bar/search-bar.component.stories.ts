import type { Meta, StoryObj } from '@storybook/angular';
import { SearchBarComponent } from './search-bar.component';

const meta: Meta<SearchBarComponent> = {
  title: 'Shared/Forms/SearchBar',
  component: SearchBarComponent,
  tags: ['autodocs'],
  argTypes: {
    search: { action: 'search' },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width:360px;padding:16px">
        <app-search-bar [placeholder]="placeholder" [debounceMs]="debounceMs" (search)="search($event)" />
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<SearchBarComponent>;

export const Default: Story = {
  args: { placeholder: 'Search...', debounceMs: 300 },
};

export const CustomPlaceholder: Story = {
  args: { placeholder: 'Search people...', debounceMs: 300 },
};

export const InstantSearch: Story = {
  args: { placeholder: 'Filter items...', debounceMs: 0 },
};
