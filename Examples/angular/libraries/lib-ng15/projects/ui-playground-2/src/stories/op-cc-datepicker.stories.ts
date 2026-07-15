import { UntypedFormControl } from '@angular/forms';
import { OpCcDatepickerComponent } from '@op/core-controls';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { sharedModuleMetadata } from '../shared-imports';

const meta: Meta<OpCcDatepickerComponent & { initialValue?: Date | Date[] | null }> = {
  title: 'Core Controls/Date Picker',
  component: OpCcDatepickerComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata(sharedModuleMetadata)],
  argTypes: {
    selectionMode: {
      control: 'inline-radio',
      options: ['single', 'range', 'multiple'],
      description: 'Date selection mode',
    },
    dateFormat: { control: 'text', description: 'PrimeNG date format' },
    showTime: { control: 'boolean' },
    showIcon: { control: 'boolean' },
    minDate: { control: 'date', description: 'Minimum selectable date' },
    maxDate: { control: 'date', description: 'Maximum selectable date' },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    initialValue: { table: { disable: true } },
  },
  args: {
    label: 'Date of birth',
    placeholder: 'Pick a date',
    selectionMode: 'single',
    dateFormat: 'mm/dd/yy',
    showTime: false,
    showIcon: true,
    initialValue: null,
  },
  render: (args) => ({
    props: { ...args, control: new UntypedFormControl(args.initialValue ?? null) },
    template: `
      <div class="op-story-canvas">
        <op-cc-datepicker
          [control]="control"
          [label]="label"
          [placeholder]="placeholder"
          [selectionMode]="selectionMode"
          [dateFormat]="dateFormat"
          [showTime]="showTime"
          [showIcon]="showIcon"
          [minDate]="minDate"
          [maxDate]="maxDate"
        ></op-cc-datepicker>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<OpCcDatepickerComponent & { initialValue?: Date | Date[] | null }>;

export const Default: Story = {};

export const Prefilled: Story = {
  args: {
    label: 'Date of birth (prefilled)',
    initialValue: new Date(1995, 4, 23),
  },
};
