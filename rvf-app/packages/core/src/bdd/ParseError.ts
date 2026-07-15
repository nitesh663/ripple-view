export type ParseErrorCode = 'PARSE_GHERKIN_ERROR' | 'PARSE_YAML_ERROR';

export class ParseError extends Error {
  readonly code: ParseErrorCode;
  readonly line: number | undefined;
  readonly file: string | undefined;

  constructor(opts: {
    code: ParseErrorCode;
    message: string;
    line?: number;
    file?: string;
    cause?: unknown;
  }) {
    super(opts.message, { cause: opts.cause });
    this.name = 'ParseError';
    this.code = opts.code;
    this.line = opts.line;
    this.file = opts.file;
  }
}
