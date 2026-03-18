import type { Meta, StoryObj } from '@storybook/angular';
import { ImageWithFallbackComponent } from './image-with-fallback.component';

const meta: Meta<ImageWithFallbackComponent> = {
  title: 'Shared/Media/ImageWithFallback',
  component: ImageWithFallbackComponent,
  tags: ['autodocs'],
  argTypes: {
    fit: { control: 'select', options: ['cover', 'contain'] },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="width:300px;height:200px">
        <app-image-with-fallback [src]="src" [alt]="alt" [fit]="fit" />
      </div>
    `,
  }),
};
export default meta;
type Story = StoryObj<ImageWithFallbackComponent>;

export const Default: Story = {
  args: { src: 'https://picsum.photos/300/200', alt: 'Sample image', fit: 'cover' },
};

export const Contain: Story = {
  args: { src: 'https://picsum.photos/300/200', alt: 'Sample image', fit: 'contain' },
};

export const BrokenUrl: Story = {
  args: { src: 'https://broken.example.com/image.jpg', alt: 'Broken image', fit: 'cover' },
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:16px;flex-wrap:wrap;padding:16px">
        <div style="width:120px;height:120px">
          <app-image-with-fallback src="https://picsum.photos/120/120?random=1" alt="Small" fit="cover" />
        </div>
        <div style="width:200px;height:150px">
          <app-image-with-fallback src="https://picsum.photos/200/150?random=2" alt="Medium" fit="cover" />
        </div>
        <div style="width:300px;height:200px">
          <app-image-with-fallback src="https://broken.url/nope.jpg" alt="Broken" fit="cover" />
        </div>
      </div>
    `,
  }),
};
