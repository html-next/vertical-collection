import Component from '@glimmer/component';

const format = new Intl.NumberFormat('en', { maximumFractionDigits: 1, style: 'unit', unit: 'kilometer' });

export default class BenchCell extends Component {
  get formatted() {
    return format.format(this.args.value);
  }

  get isLarge() {
    return this.args.value > 5000;
  }
}
