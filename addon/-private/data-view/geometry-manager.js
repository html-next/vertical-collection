import SkipList from '../../-private/data-view/skip-list';

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

    // Middle out algorithm :P
    while (true) {
      if (lastItemIndex < maxIndex) {
        totalAfter -= values[lastItemIndex];
        lastItemIndex++;

        if (!lastVisibleIndex && total - totalAfter >= lastVisibleValue) {
          lastVisibleIndex = lastItemIndex - 1;
        }
      }

      if (lastItemIndex - firstItemIndex === totalIndexes - 1) {
        break;
      }

      if (firstItemIndex > 0) {
        firstItemIndex--;
        totalBefore -= values[firstItemIndex];

        if (!firstVisibleIndex && totalBefore < firstVisibleValue) {
          firstVisibleIndex = firstItemIndex;
        }
      }

      if (lastItemIndex - firstItemIndex === totalIndexes - 1) {
        break;
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
    let i, length, component;

    let scrollBefore = 0;
    let scrollAfter = 0;

    const { measureStates, scalars, skipList } = this;

    for (i = 0, length = components.length; i < length; i++) {
      component = components[i];

      // We only need to remeasure immediately if we're scrolling backwards, maybe we can defer this
      if (!measureStates[component.index]) {
        if (component.index <= firstVisibleIndex) {
          scrollBefore += scalars[component.index];
        }

        component.updateDimensions();

        let { index, height } = component;

        skipList.set(index, height);
        scalars[component.index] = component.height;

        if (component.index <= firstVisibleIndex) {
          scrollAfter += scalars[component.index];
        }
      }
    }

    return {
      deltaBefore: 0,
      deltaAfter: 0,
      deltaScroll: scrollAfter - scrollBefore
    };
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
