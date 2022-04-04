import { ViewportContainer } from '../../-private';

function applyVerticalStyles(element, geography, orientation) {
  if( orientation === 'horizontal' )
    {
      element.style.width = `${geography.width}px`;
      element.style.left = `${geography.left}px`;
    }
    else
    {
      element.style.height = `${geography.height}px`;
      element.style.top = `${geography.top}px`;
    }
}

export default class Visualization {
  constructor(radar) {
    this.radar = radar;
    this.satellites = [];
    this.cache = [];

    this.wrapper = document.createElement('div');
    this.wrapper.className = `virtual-collection-visual-debugger${this.get('orientation') === 'horizontal' ? ' horizontal' : ''}`;

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
    const { _scrollContainer } = this.radar;
    this.container.style[this.get( 'orientation' ) === 'horizontal' ? 'width' : 'height'] = `${_scrollContainer.getBoundingClientRect()[this.get( 'orientation' ) === 'horizontal' ? 'width' : 'height']}px`;

    applyVerticalStyles(this.scrollContainer, _scrollContainer.getBoundingClientRect());
    applyVerticalStyles(this.screen, ViewportContainer.getBoundingClientRect());
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
      _calculatedEstimateSize
    } = this.radar;

    const isDynamic = !!skipList;
    const itemSizes = isDynamic && skipList.values;

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

      const itemSize = isDynamic ? itemSizes[itemIndex] : _calculatedEstimateSize;

      element.style[this.get( 'orientation' ) === 'horizontal' ? 'width' : 'height'] = `${itemSize}px`;
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

    this.itemContainer.style[this.get( 'orientation' ) === 'horizontal' ? 'paddingLeft' : 'paddingTop'] = `${totalBefore}px`;
    this.itemContainer.style[this.get( 'orientation' ) === 'horizontal' ? 'paddingRight' : 'paddingBottom'] = `${totalAfter}px`;
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
