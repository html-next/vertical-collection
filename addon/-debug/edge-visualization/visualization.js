/* global document */
import { Container } from '../../-private';

function applyVerticalStyles(element, geography) {
  element.style.height = `${geography.height}px`;
  element.style.top = `${geography.top}px`;
}

export default class Visualization {
  constructor(radar) {
    this.radar = radar;
    this.satellites = [];
    this.cache = [];

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'vertical-collection-visual-debugger';

    this.container = document.createElement('div');
    this.container.className = 'vc_visualization-container';
    this.wrapper.appendChild(this.container);

    this.itemContainer = document.createElement('div');
    this.itemContainer.className = 'vc_visualization-item-container';
    this.container.appendChild(this.itemContainer);

    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = 'vc_visualization-scroll-container';
    this.container.appendChild(this.scrollContainer);

    this.screen = document.createElement('div');
    this.screen.className = 'vc_visualization-screen';
    this.container.appendChild(this.screen);

    document.body.appendChild(this.wrapper);
  }

  render() {
    this.styleViewport();
    this.updateSatellites();
  }

  styleViewport() {
    const {
      itemContainer,
      scrollContainer
    } = this.radar;
    this.container.style.height = `${scrollContainer.getBoundingClientRect().height}px`;

    applyVerticalStyles(this.scrollContainer, scrollContainer.getBoundingClientRect());
    applyVerticalStyles(this.itemContainer, itemContainer.getBoundingClientRect());
    applyVerticalStyles(this.screen, Container.getBoundingClientRect());
  }

  makeSatellite() {
    let satellite;

    if (this.cache.length) {
      satellite = this.cache.pop();
    } else {
      satellite = document.createElement('div');
      satellite.className = 'vc_visualization-virtual-component';
    }

    this.satellites.push(satellite);
    this.itemContainer.append(satellite);
  }

  updateSatellites() {
    const { satellites: sats } = this;
    let {
      firstItemIndex,
      lastItemIndex,

      totalItems,

      totalBefore,
      totalAfter,
      skipList,
      _estimateHeight
    } = this.radar;

    const isDynamic = !!skipList;
    const itemHeights = isDynamic && skipList.values;

    const firstVisualizedIndex = Math.max(firstItemIndex - 10, 0);
    const lastVisualizedIndex = Math.min(lastItemIndex + 10, totalItems - 1);

    const lengthWithBuffer = lastVisualizedIndex - firstVisualizedIndex + 1;
    const isShrinking = sats.length > lengthWithBuffer;

    while (sats.length !== lengthWithBuffer) {
      if (isShrinking) {
        const satellite = sats.pop();

        satellite.parentNode.removeChild(satellite);
        this.cache.push(satellite);
      } else {
        this.makeSatellite();
      }
    }

    for (let itemIndex = firstVisualizedIndex, i = 0; itemIndex <= lastVisualizedIndex; itemIndex++, i++) {
      const element = sats[i];

      const itemHeight = isDynamic ? itemHeights[itemIndex] : _estimateHeight;

      element.style.height = `${itemHeight}px`;
      element.setAttribute('index', String(itemIndex));
      element.innerText = String(itemIndex);

      if (itemIndex < firstItemIndex) {
        element.classList.add('culled');
        totalBefore -= itemHeight;
      } else if (itemIndex > lastItemIndex) {
        element.classList.add('culled');
        totalAfter -= itemHeight;
      } else {
        element.classList.remove('culled');
      }
    }

    this.itemContainer.style.paddingTop = `${totalBefore}px`;
    this.itemContainer.style.paddingBottom = `${totalAfter}px`;
  }

  destroy() {
    this.wrapper.parentNode.removeChild(this.wrapper);
    this.wrapper = null;
    this.radar = null;
    this.component = null;
    this.satellites.forEach((satellite) => {
      if (satellite.parentNode) {
        satellite.parentNode.removeChild(satellite);
      }
    });
    this.satellites = null;
    this.cache = null;
  }
}
