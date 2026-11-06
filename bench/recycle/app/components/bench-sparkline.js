import Component from '@glimmer/component';
import { cached } from '@glimmer/tracking';

export default class BenchSparkline extends Component {
  @cached
  get path() {
    const { points } = this.args;
    const max = Math.max(...points) || 1;
    return points.map((y, x) => `${x ? 'L' : 'M'}${(x * 100) / points.length} ${32 - (y / max) * 32}`).join(' ');
  }
}
