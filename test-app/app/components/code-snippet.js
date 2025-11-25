import Component from '@glimmer/component';
import snippets from '../snippets';

export default class extends Component {
  get snippet() {
    return snippets[this.args.name]?.content;
  }
}
