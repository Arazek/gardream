import type { Meta, StoryObj } from '@storybook/angular';
import { CardComponent, CardVariant } from './card.component';

const meta: Meta<CardComponent> = {
  title: 'Shared/Layout/Card',
  component: CardComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['none', 'info', 'success', 'warning', 'danger'] satisfies CardVariant[] },
    clickable: { control: 'boolean' },
    flat: { control: 'boolean' },
    cardClick: { action: 'cardClick' },
  },
  render: (args) => ({
    props: args,
    template: `
      <app-card [variant]="variant" [clickable]="clickable" [flat]="flat" (cardClick)="cardClick()">
        <div style="padding:16px">
          <h3 style="margin:0 0 8px;color:var(--ion-text-color,#222)">Card Title</h3>
          <p style="margin:0;color:var(--ion-color-medium)">This is some card content. It can contain anything.</p>
        </div>
      </app-card>
    `,
  }),
};
export default meta;
type Story = StoryObj<CardComponent>;

export const Default: Story = { args: { variant: 'none', clickable: false, flat: false } };
export const Clickable: Story = { args: { variant: 'none', clickable: true, flat: false } };
export const Flat: Story = { args: { variant: 'none', clickable: false, flat: true } };

export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;max-width:320px;padding:16px">
        <app-card variant="info">
          <div style="padding:16px">
            <strong style="color:var(--ion-color-primary)">Info</strong>
            <p style="margin:4px 0 0;color:var(--ion-color-medium);font-size:14px">Informational card message.</p>
          </div>
        </app-card>
        <app-card variant="success">
          <div style="padding:16px">
            <strong style="color:var(--ion-color-success-shade)">Success</strong>
            <p style="margin:4px 0 0;color:var(--ion-color-medium);font-size:14px">Action completed successfully.</p>
          </div>
        </app-card>
        <app-card variant="warning">
          <div style="padding:16px">
            <strong style="color:var(--ion-color-warning-shade)">Warning</strong>
            <p style="margin:4px 0 0;color:var(--ion-color-medium);font-size:14px">Your subscription expires soon.</p>
          </div>
        </app-card>
        <app-card variant="danger">
          <div style="padding:16px">
            <strong style="color:var(--ion-color-danger)">Danger</strong>
            <p style="margin:4px 0 0;color:var(--ion-color-medium);font-size:14px">This account has been suspended.</p>
          </div>
        </app-card>
      </div>
    `,
  }),
};

export const WithRichContent: Story = {
  render: () => ({
    template: `
      <div style="max-width:320px">
        <app-card>
          <div style="padding:16px">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <div style="width:40px;height:40px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;color:white;font-weight:600">JD</div>
              <div>
                <div style="font-weight:600;color:var(--ion-text-color,#222)">John Doe</div>
                <div style="font-size:12px;color:var(--ion-color-medium)">2 hours ago</div>
              </div>
            </div>
            <p style="margin:0;color:var(--ion-text-color,#222)">Excited to share the new component library we have been building!</p>
          </div>
        </app-card>
      </div>
    `,
  }),
};
