import Component from '@glimmer/component';
import snippets from '../snippets';

export default class extends Component {
  get snippet() {
    const snippet = snippets[this.args.name]?.content.split('\n');
    const indentAmount = snippet[0].length - snippet[0].trimStart().length;

    return snippet.map((line) => line.substring(indentAmount)).join('\n');
  }

  get language() {
    const filenameParts = snippets[this.args.name]?.source.split('.');
    return filenameParts[filenameParts.length - 1];
  }
}
