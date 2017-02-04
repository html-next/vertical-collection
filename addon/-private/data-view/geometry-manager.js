import SkipList from '../../-private/data-view/skip-list';

const SCALAR_MEASURED = 1;
const MARGIN_BEFORE_ESTIMATED = 2;
const MARGIN_AFTER_ESTIMATED = 4;
const MARGIN_BEFORE_MEASURED = 8;
const MARGIN_AFTER_MEASURED = 16;

/* The `GeometryManager` has one job, which is to tell a collection what it's boundaries are. For
 * the fixed dimenension strategy this is very simple, but for arbitrary dimensions it becomes much
 * more complicated.
 *
 * The flow from a collection's point of view is pretty straightforward:
 *
 * 1. Before updating, call `getBounds` with the new positions to figure out which items will need
 *    to be rendered. `getBounds` returns all information the component needs to render correctly
 *    unless adjustments are discovered in the `remeasure` phase.
 *
 * 2. After updating, call `remeasure` with all VirtualComponents. There are 3 measurements
 *    that MUST be made on a VC to get all information about it:
 *
 *      1. Scalar
 *      2. Margin Before
 *      3. Margin After
 *
 *    Due to margin collapse, the before and after margins can only be measured on the first and
 *    last VCs rendered, respectively. We can however measure the distance between two VCs, knowing
 *    it will be equal to at least one of their margins, and gte to the other. This comes at a very
 *    minor perf penalty, so we take that for the increased accuracy.
 *
 *    Each item therefore has 5 state flags. Once all are flipped, we know the complete shape of the
 *    item and will not need to re-measure it again.
 *
 * As a further perf optimization, the GeometryManager can append/prepend a fixed number of items.
 * This allows it to update its internal state to match changes to the external data without
 * recalculating for items that have already been seen.
 */

export default class GeometryManager {
  constructor(length, minValue) {

    const scalars = new Uint16Array(new ArrayBuffer(length * 2));
    const beforeMargins = new Uint16Array(new ArrayBuffer(length * 2));
    const afterMargins = new Uint16Array(new ArrayBuffer(length * 2));
    const measureStates = new Uint8Array(new ArrayBuffer(length));

    scalars.fill(minValue);

    this.skipList = new SkipList(scalars.slice(), minValue);

    this.scalars = scalars;
    this.beforeMargins = beforeMargins;
    this.afterMargins = afterMargins;
    this.measureStates = measureStates;

    this.length = length;
    this.minValue = minValue;
  }

  getBounds(totalIndexes, firstVisibleValue, lastVisibleValue) {
    const { total, values } = this.skipList;
    const maxIndex = this.length - 1;
    const middleVisibleValue = firstVisibleValue + ((lastVisibleValue - firstVisibleValue) / 2);

    let {
      totalBefore,
      totalAfter,
      index: middleItemIndex
    } = this.skipList.get(middleVisibleValue);

    let firstItemIndex, lastItemIndex, firstVisibleIndex, lastVisibleIndex;

    firstItemIndex = lastItemIndex = middleItemIndex;

    // Middle out algorithm. It should give us a range with a static number of indexes,
    // the total offsets before and after that range, and the indexes within that range
    // which are the boundaries of the visible indexes.
    while (true) {
      if (lastItemIndex < maxIndex) {
        lastItemIndex++;
        totalAfter -= values[lastItemIndex];

        if (!lastVisibleIndex && total - totalAfter >= lastVisibleValue) {
          lastVisibleIndex = lastItemIndex - 1;
        }

        if (lastItemIndex - firstItemIndex === totalIndexes - 1) {
          break;
        }
      }

      if (firstItemIndex > 0) {
        firstItemIndex--;
        totalBefore -= values[firstItemIndex];

        if (!firstVisibleIndex && totalBefore <= firstVisibleValue) {
          firstVisibleIndex = firstItemIndex;
        }

        if (lastItemIndex - firstItemIndex === totalIndexes - 1) {
          break;
        }
      }
    }

    return {
      firstItemIndex,
      lastItemIndex,
      firstVisibleIndex,
      lastVisibleIndex,
      totalBefore,
      totalAfter
    };
  }

  remeasure(components, firstVisibleIndex) {
    let scrollBefore = 0;
    let scrollAfter = 0;

    const {
      measureStates,
      afterMargins,
      beforeMargins,
      scalars,
      skipList: { values }
    } = this;

    const firstIndex = components[0].index;
    const lastIndex = components[components.length - 1].index;

    const affectedIndexes = [];

    for (let index = firstIndex, i = 0; index <= lastIndex; index++, i++) {
      const prevIndex = Math.max(index - 1, 0);
      const nextIndex = Math.min(index + 1, this.length - 1);

      const component = components[i];
      const prevComponent = components[i - 1];
      const nextComponent = components[i + 1];

      let measureState = measureStates[index];
      let prevMeasureState = measureStates[prevIndex];
      let nextMeasureState = measureStates[nextIndex];

      if (!(measureState & SCALAR_MEASURED)) {
        scalars[index] = measureScalar(component);
        measureState = measureState | SCALAR_MEASURED;
      }

      if (index === firstIndex && !(measureState & MARGIN_BEFORE_MEASURED)) {
        let margin = measureMarginBefore(component);
        beforeMargins[index] = margin;

        affectedIndexes.push(prevIndex, index);

        measureState = measureState | MARGIN_BEFORE_MEASURED;
        measureState = measureState | MARGIN_BEFORE_ESTIMATED;

        if (!(prevMeasureState & MARGIN_AFTER_ESTIMATED)) {
          afterMargins[prevIndex] = margin;
        }
      }

      if (index === lastIndex && !(measureState & MARGIN_AFTER_MEASURED)) {
        let margin = measureMarginAfter(component);
        afterMargins[index] = margin;

        affectedIndexes.push(index, nextIndex);

        measureState = measureState | MARGIN_AFTER_MEASURED;
        measureState = measureState | MARGIN_AFTER_ESTIMATED;

        if (!(nextMeasureState & MARGIN_BEFORE_ESTIMATED)) {
          beforeMargins[nextIndex] = margin;
        }
      }

      if (index !== firstIndex && !(measureState & MARGIN_BEFORE_ESTIMATED)) {
        let margin = estimateMarginBefore(component, prevComponent);

        beforeMargins[index] = margin;
        affectedIndexes.push(index);

        measureState = measureState | MARGIN_BEFORE_ESTIMATED;

        if (!(prevMeasureState & MARGIN_AFTER_ESTIMATED)) {
          afterMargins[prevIndex] = margin;
          affectedIndexes.push(prevIndex);

          prevMeasureState = prevMeasureState | MARGIN_AFTER_ESTIMATED;
        }
      }

      if (index !== lastIndex && !(measureState & MARGIN_AFTER_ESTIMATED)) {
        let margin = estimateMarginAfter(component, nextComponent);

        afterMargins[index] = margin;
        affectedIndexes.push(index);

        measureState = measureState | MARGIN_AFTER_ESTIMATED;

        if (!(nextMeasureState & MARGIN_BEFORE_ESTIMATED)) {
          beforeMargins[nextIndex] = margin;
          affectedIndexes.push(nextIndex);

          nextMeasureState = nextMeasureState | MARGIN_BEFORE_ESTIMATED;
        }
      }

      measureStates[index] = measureState;
      measureStates[prevIndex] = prevMeasureState;
      measureStates[nextIndex] = nextMeasureState;
    }

    let deltaScroll = 0;
    let deltaBefore = 0;
    let deltaAfter = 0;

    for (let i = 0; i < affectedIndexes.length; i++) {
      let index = affectedIndexes[i];
      let delta = this._recalculateHeight(index);

      if (index >= firstIndex  && index < firstVisibleIndex && delta > 0) {
        deltaScroll += delta;
      } else if (index < firstIndex) {
        deltaBefore = delta;
      } else if (index > lastIndex) {
        deltaAfter = delta;
      }
    }

    return {
      deltaBefore,
      deltaAfter,
      deltaScroll
    };
  }

  _recalculateHeight(index) {
    const scalar = this.scalars[index];
    const marginBefore = this.beforeMargins[index];
    const marginAfter = index === this.length - 1 ? 0 : this.afterMargins[index] - this.beforeMargins[index + 1];

    const oldHeight = this.skipList.values[index];
    const newHeight = scalar + Math.max(marginBefore, 0) + Math.max(marginAfter, 0);

    this.skipList.set(index, newHeight);

    return newHeight - oldHeight;
  }

  prepend(numPrepended) {
    const {
      scalars,
      afterMargins,
      beforeMargins,
      measureStates,
      length: prevLength,
      minValue
    } = this;

    const { values } = this.skipList;

    const newLength = numPrepended + prevLength;

    const newScalars = new Uint16Array(new ArrayBuffer(newLength * 2));
    const newValues = new Uint16Array(new ArrayBuffer(newLength * 2));

    const newBeforeMargins = new Uint16Array(new ArrayBuffer(newLength * 2));
    const newAfterMargins = new Uint16Array(new ArrayBuffer(newLength * 2));
    const newMeasureStates = new Uint8Array(new ArrayBuffer(newLength));

    newScalars.set(scalars, numPrepended);
    newScalars.fill(minValue, 0, numPrepended);

    newValues.set(values, numPrepended);
    newValues.fill(minValue, 0, numPrepended);

    newAfterMargins.set(afterMargins, numPrepended);
    newBeforeMargins.set(beforeMargins, numPrepended);
    newMeasureStates.set(measureStates, numPrepended);

    this.scalars = newScalars;
    this.beforeMargins = newBeforeMargins;
    this.afterMargins = newAfterMargins;
    this.measureStates = newMeasureStates;
    this.skipList = new SkipList(newValues);
    this.length = newLength;
  }

  append(numAppended) {
    const {
      scalars,
      afterMargins,
      beforeMargins,
      measureStates,
      length: prevLength,
      minValue
    } = this;

    const { values } = this.skipList;

    const newLength = numAppended + prevLength;

    const newScalars = new Uint16Array(new ArrayBuffer(newLength * 2));
    const newValues = new Uint16Array(new ArrayBuffer(newLength * 2));

    const newBeforeMargins = new Uint16Array(new ArrayBuffer(newLength * 2));
    const newAfterMargins = new Uint16Array(new ArrayBuffer(newLength * 2));
    const newMeasureStates = new Uint8Array(new ArrayBuffer(newLength));

    newScalars.set(scalars);
    newScalars.fill(minValue, prevLength);

    newValues.set(values);
    newValues.fill(minValue, prevLength);

    newAfterMargins.set(afterMargins);
    newBeforeMargins.set(beforeMargins);
    newMeasureStates.set(measureStates);

    this.scalars = newScalars;
    this.beforeMargins = newBeforeMargins;
    this.afterMargins = newAfterMargins;
    this.measureStates = newMeasureStates;
    this.skipList = new SkipList(newValues);
    this.length = newLength;
  }
}

function measureScalar(component) {
  return component.getBoundingClientRect().height;
}

function measureMarginBefore(component) {
  const { top } = component.getBoundingClientRect();
  const { top: parentTop } = component.parentElement.getBoundingClientRect();

  const paddingTop = +component.parentElement.style.paddingTop.slice(0, -2) || 0;

  const containerTop = parentTop + paddingTop;

  return top - containerTop;
}

function measureMarginAfter(component) {
  const { bottom } = component.getBoundingClientRect();
  const { bottom: parentBottom } = component.parentElement.getBoundingClientRect();

  const paddingBottom = +component.parentElement.style.paddingBottom.slice(0, -2) || 0;

  const containerBottom = parentBottom - paddingBottom;

  return containerBottom - bottom;
}

function estimateMarginBefore(component, prevComponent) {
  let { top } = component.getBoundingClientRect();
  let { bottom: prevBottom } = prevComponent.getBoundingClientRect();

  return top - prevBottom;
}

function estimateMarginAfter(component, nextComponent) {
  let { bottom } = component.getBoundingClientRect();
  let { top: nextTop } = nextComponent.getBoundingClientRect();

  return nextTop - bottom;
}
