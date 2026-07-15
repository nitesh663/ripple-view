import { UntypedFormControl } from '@angular/forms';
import { OpCcMultiselectDropdownComponent } from '@op/core-controls';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { sharedModuleMetadata } from '../shared-imports';

const SKILL_OPTIONS = [
  { label: 'Angular', value: 'ng' },
  { label: 'TypeScript', value: 'ts' },
  { label: 'RxJS', value: 'rxjs' },
  { label: 'SCSS', value: 'scss' },
  { label: 'PrimeNG', value: 'pn' },
];

const meta: Meta<OpCcMultiselectDropdownComponent & { initialValue?: unknown[] }> = {
  title: 'Core Controls/Multi-Select',
  component: OpCcMultiselectDropdownComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata(sharedModuleMetadata)],
  argTypes: {
    options: { control: 'object', description: 'Selectable options (SelectItem[])' },
    display: {
      control: 'inline-radio',
      options: ['comma', 'chip'],
      description: 'How selected values render',
    },
    showToggleAll: { control: 'boolean', description: 'Show the select-all toggle' },
    filter: { control: 'boolean', description: 'Enable the filter box' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    initialValue: { table: { disable: true } },
  },
  args: {
    label: 'Skills',
    placeholder: 'Select skills',
    options: SKILL_OPTIONS,
    display: 'comma',
    showToggleAll: true,
    filter: true,
    initialValue: [],
  },
  render: (args) => ({
    props: { ...args, control: new UntypedFormControl(args.initialValue ?? []) },
    template: `
      <div class="op-story-canvas">
        <op-cc-multiselect-dropdown
          [control]="control"
          [options]="options"
          [label]="label"
          [placeholder]="placeholder"
          [display]="display"
          [showToggleAll]="showToggleAll"
          [filter]="filter"
        ></op-cc-multiselect-dropdown>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<OpCcMultiselectDropdownComponent & { initialValue?: unknown[] }>;

export const Default: Story = {};

export const ChipDisplayPrefilled: Story = {
  name: 'Chip display (prefilled)',
  args: {
    display: 'chip',
    initialValue: ['ng', 'ts'],
  },
};
