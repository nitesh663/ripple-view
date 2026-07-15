import { UntypedFormControl } from '@angular/forms';
import { OpCcDropdownComponent } from '@op/core-controls';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { sharedModuleMetadata } from '../shared-imports';

const COUNTRY_OPTIONS = [
  { label: 'India', value: 'in' },
  { label: 'United States', value: 'us' },
  { label: 'Germany', value: 'de' },
  { label: 'Brazil', value: 'br' },
];

const meta: Meta<OpCcDropdownComponent> = {
  title: 'Core Controls/Dropdown',
  component: OpCcDropdownComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata(sharedModuleMetadata)],
  argTypes: {
    options: { control: 'object', description: 'Selectable options (SelectItem[])' },
    showClear: { control: 'boolean', description: 'Show PrimeNG built-in clear icon' },
    editable: { control: 'boolean', description: 'Allow free-text editing' },
    isMandatory: {
      control: 'boolean',
      description: 'Show the mandatory marker + required validator',
    },
    disabled: { control: 'boolean', description: 'Disable the control' },
    floating: { control: 'boolean', description: 'Floating label behaviour' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    isFilter: { control: 'boolean', description: 'Enable the filter box' },
  },
  args: {
    label: 'Country',
    placeholder: 'Select a country',
    options: COUNTRY_OPTIONS,
    showClear: false,
    editable: false,
    isMandatory: false,
    disabled: false,
    floating: false,
    isFilter: true,
  },
  render: (args) => ({
    props: { ...args, control: new UntypedFormControl(null) },
    template: `
      <div class="op-story-canvas">
        <op-cc-dropdown
          [control]="control"
          [options]="options"
          [label]="label"
          [placeholder]="placeholder"
          [editable]="editable"
          [showClear]="showClear"
          [isFilter]="isFilter"
          [isMandatory]="isMandatory"
          [disabled]="disabled"
          [floating]="floating"
        ></op-cc-dropdown>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<OpCcDropdownComponent>;

export const Default: Story = {};

export const Mandatory: Story = {
  args: {
    isMandatory: true,
    label: 'Country (required)',
  },
};
