import type { Meta, StoryObj } from '@storybook/angular';
import { SectionComponent } from './section.component';

const meta: Meta<SectionComponent> = {
  title: 'Shared/Layout/Section',
  component: SectionComponent,
  tags: ['autodocs'],
  argTypes: {
    seeAll: { action: 'seeAll' },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width:360px;padding:16px;background:var(--ion-background-color,#f4f5f8)">
        <app-section [title]="title" [seeAllLabel]="seeAllLabel" (seeAll)="seeAll()">
          <div style="padding:8px 0;color:var(--ion-color-medium)">Section content goes here.</div>
        </app-section>
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<SectionComponent>;

export const Default: Story = { args: { title: 'Recent Activity', seeAllLabel: '' } };
export const WithSeeAll: Story = { args: { title: 'Recent Activity', seeAllLabel: 'See all' } };
export const NoTitle: Story = { args: { title: '', seeAllLabel: '' } };

export const WithListContent: Story = {
  render: () => ({
    template: `
      <div style="width:360px;padding:16px;background:var(--ion-background-color,#f4f5f8)">
        <app-section title="Team Members" seeAllLabel="View all">
          <div style="display:flex;flex-direction:column;gap:8px">
            <div style="padding:8px;background:var(--ion-item-background,#fff);border-radius:8px;color:var(--ion-text-color,#222)">Alice — Designer</div>
            <div style="padding:8px;background:var(--ion-item-background,#fff);border-radius:8px;color:var(--ion-text-color,#222)">Bob — Engineer</div>
            <div style="padding:8px;background:var(--ion-item-background,#fff);border-radius:8px;color:var(--ion-text-color,#222)">Charlie — PM</div>
          </div>
        </app-section>
      </div>
    `,
  }),
};
