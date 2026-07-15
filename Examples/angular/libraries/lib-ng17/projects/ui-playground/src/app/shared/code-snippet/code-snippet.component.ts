import { Component, Input } from '@angular/core';

/** Displays a read-only code block with a copy-to-clipboard button. */
@Component({
  selector: 'app-code-snippet',
  templateUrl: './code-snippet.component.html',
  styleUrls: ['./code-snippet.component.scss'],
})
export class CodeSnippetComponent {
  @Input() code = '';
  @Input() language = 'html';

  copied = false;

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code);
    } catch {
      // Fallback for browsers/contexts without the async clipboard API.
      const textarea = document.createElement('textarea');
      textarea.value = this.code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    this.copied = true;
    setTimeout(() => (this.copied = false), 1500);
  }
}
