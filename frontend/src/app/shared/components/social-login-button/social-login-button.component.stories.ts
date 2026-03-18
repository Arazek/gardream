import type { Meta, StoryObj } from '@storybook/angular';
import { SocialLoginButtonComponent } from './social-login-button.component';

const meta: Meta<SocialLoginButtonComponent> = {
  title: 'Shared/Auth/SocialLoginButton',
  component: SocialLoginButtonComponent,
  tags: ['autodocs'],
  argTypes: {
    provider: { control: 'select', options: ['google', 'facebook', 'apple'] },
    login: { action: 'login' },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width:320px;padding:16px">
        <app-social-login-button [provider]="provider" (login)="login($event)" />
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<SocialLoginButtonComponent>;

export const Google: Story = { args: { provider: 'google' } };
export const Facebook: Story = { args: { provider: 'facebook' } };
export const Apple: Story = { args: { provider: 'apple' } };

export const AllProviders: Story = {
  render: () => ({
    template: `
      <div style="width:320px;padding:16px;display:flex;flex-direction:column;gap:12px">
        <app-social-login-button provider="google" />
        <app-social-login-button provider="facebook" />
        <app-social-login-button provider="apple" />
      </div>
    `,
  }),
};
