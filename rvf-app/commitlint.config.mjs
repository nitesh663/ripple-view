export default {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^([A-Z]+-\d+): (\w*)(?:\(([\w$.\-*/ ]*)\))?!?: (.*)$/,
      headerCorrespondence: ['ticket', 'type', 'scope', 'subject'],
    },
  },
  plugins: [
    {
      rules: {
        'story-id-required': ({ header }) => [
          /^[A-Z]+-\d+: /.test(header ?? ''),
          'Commit must follow Conventional Commits, e.g. feat: description',
        ],
      },
    },
  ],
  rules: {
    'story-id-required': [2, 'always'],
  },
};
