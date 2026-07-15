import { UntypedFormControl } from '@angular/forms';
import { OpCcInputComponent } from '@op/core-controls';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { sharedModuleMetadata } from '../shared-imports';

const meta: Meta<OpCcInputComponent> = {
  title: 'Core Controls/Input',
  component: OpCcInputComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata(sharedModuleMetadata)],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number'],
      description: 'Native input type',
    },
    maxLength: { control: 'number', description: 'Maximum characters' },
    placeholder: { control: 'text' },
    isMandatory: { control: 'boolean', description: 'Mandatory marker + required validator' },
    disabled: { control: 'boolean' },
    floating: { control: 'boolean', description: 'Floating label behaviour' },
    label: { control: 'text' },
  },
  args: {
    label: 'Full name',
    placeholder: 'Enter your name',
    type: 'text',
    maxLength: 40,
    isMandatory: false,
    disabled: false,
    floating: false,
  },
  render: (args) => ({
    props: { ...args, control: new UntypedFormControl('') },
    template: `
      <div class="op-story-canvas">
        <op-cc-input
          [control]="control"
          [label]="label"
          [placeholder]="placeholder"
          [type]="type"
          [maxLength]="maxLength"
          [isMandatory]="isMandatory"
          [disabled]="disabled"
          [floating]="floating"
        ></op-cc-input>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<OpCcInputComponent>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Full name (disabled)',
  },
};
