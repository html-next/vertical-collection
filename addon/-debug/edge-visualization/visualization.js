/* global document */
import Container from '../../-private';

const SYS_WIDTH = 250;

export default class Visualization {
  constructor(component) {
    this.component = component;
    this.minimumMovement = Math.floor(component.get('_minHeight') / 2);
    this.radar = component._radar;
    this.satellites = [];
    this.cache = [];
  }

  setupViewport() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'vertical-collection-visual-debugger';

    this.container = document.createElement('div');
    this.container.className = 'vc_visualization-container';
    this.wrapper.appendChild(this.container);

    this.sky = document.createElement('div');
    this.sky.className = 'vc_visualization-skyline';
    this.container.appendChild(this.sky);

    this.telescope = document.createElement('div');
    this.telescope.className = 'vc_visualization-telescope';
    this.container.appendChild(this.telescope);

    this.visAbove = document.createElement('div');
    this.visAbove.className = 'vc_visualization-visible';
    this.container.appendChild(this.visAbove);

    this.visBelow = document.createElement('div');
    this.visBelow.className = 'vc_visualization-visible';
    this.container.appendChild(this.visBelow);

    this.screen = document.createElement('div');
    this.screen.className = 'vc_visualization-screen';
    this.container.appendChild(this.screen);

    document.body.appendChild(this.wrapper);
  }

  currentOffsetAdjustment() {
    let currOffsets = this.radar.currentOffsets;

    if (currOffsets !== null) {
      const scrollY = currOffsets.top;
      const scrollX = currOffsets.left;
      const _scrollY = this.radar.scrollY;
      const _scrollX = this.radar.scrollX;
      const dY = scrollY - _scrollY;
      const dX = scrollX - _scrollX;

      return { dY, dX };
    }

    return { dY: 0, dX: 0 };
  }

  applySatelliteStyles(element, geography) {
    const adj = this.currentOffsetAdjustment();
    const left = SYS_WIDTH;

    element.style.height = `${geography.height}px`;
    element.style.top = `${geography.top - adj.dY}px`;
    element.style.left = `${left}px`;
  }

  applySatelliteMirrorStyles(element, componentElement, compare) {
    const adj = this.currentOffsetAdjustment();
    const geography = componentElement ? componentElement.getBoundingClientRect() : compare;
    const left = 2 * SYS_WIDTH;
    let errorLevel = false;

    element.style.height = `${geography.height}px`;
    element.style.top = `${geography.top}px`;
    element.style.left = `${left}px`;

    let diff = Math.abs(geography.top - compare.top + adj.dY);

    if (diff > this.minimumMovement) {
      errorLevel = true;
    }

    element.setAttribute('hasErrors', errorLevel ? 'true' : 'false');
  }

  static applyVerticalStyles(element, geography) {
    element.style.height = `${geography.height}px`;
    element.style.top = `${geography.top}px`;
  }

  static applyStyles(element, geography) {
    Visualization.applyVerticalStyles(element, geography);
    element.style.width = `${geography.width}px`;
    element.style.left = `${geography.left}px`;
  }

  styleViewport() {
    const {
      _itemContainer,
      _scrollContainer
    } = this.radar;
    this.container.style.height = `${_scrollContainer.getBoundingClientRect().height}px`;

    Visualization.applyVerticalStyles(this.telescope, _scrollContainer.getBoundingClientRect());
    Visualization.applyVerticalStyles(this.sky, _itemContainer.getBoundingClientRect());

    Visualization.applyVerticalStyles(this.screen, Container.getBoundingClientRect());

    // Visualization.applyVerticalStyles(this.visAbove, {
    //   top: edges.bufferedTop,
    //   height: edges.visibleTop - edges.visibleTop
    // });

    // Visualization.applyVerticalStyles(this.visBelow, {
    //   top: edges.visibleBottom,
    //   height: edges.bufferedBottom - edges.visibleBottom
    // });
  }

  makeSatellite() {
    let satellite, mirror;

    if (this.cache.length) {
      satellite = this.cache.pop();
    } else {
      satellite = document.createElement('div');
      satellite.className = 'vc_visualization-satellite';
    }
    if (satellite.mirrorSatellite) {
      mirror = satellite.mirrorSatellite;
    } else {
      mirror = document.createElement('div');
      mirror.className = 'vc_visualization-mirror';
      mirror.siblingSatellite = satellite;
      satellite.mirrorSatellite = mirror;
    }
    this.satellites.push(satellite);
    this.sky.append(satellite);
    // this.container.insertBefore(mirror, this.container.firstElementChild);
  }

  makeSatellites() {
    const {
      totalItems,
      orderedComponents: { length }
    } = this.radar;
    const { satellites } = this;

    const lengthWithBuffer = Math.min(length + 20, totalItems);

    const isShrinking = satellites.length > lengthWithBuffer;

    while (satellites.length !== lengthWithBuffer) {
      if (isShrinking) {
        const satellite = satellites.pop();

        satellite.parentNode.removeChild(satellite);
        satellite.mirrorSatellite.parentNode.removeChild(satellite.mirrorSatellite);
        this.cache.push(satellite);
      } else {
        this.makeSatellite();
      }
    }
    this.styleSatellites();
  }

  styleSatellites() {
    const { satellites: sats } = this;
    let {
      firstItemIndex,
      lastItemIndex,
      items: { length },
      totalBefore,
      totalAfter,
      skipList: { values }
    } = this.radar;

    const totalVisualizedItems = sats.length;
    let firstVisualizedIndex = firstItemIndex - 10;
    let lastVisualizedIndex = lastItemIndex + 10;

    if (firstVisualizedIndex < 0) {
      firstVisualizedIndex = 0;
      lastVisualizedIndex = totalVisualizedItems - 1;
    }

    if (lastVisualizedIndex > length - 1) {
      lastVisualizedIndex = length - 1;
      firstVisualizedIndex = length - totalVisualizedItems;
    }

    for (let itemIndex = firstVisualizedIndex, i = 0; itemIndex <= lastVisualizedIndex; itemIndex++, i++) {
      const element = sats[i];

      element.style.height = `${values[itemIndex]}px`;
      element.setAttribute('index', String(itemIndex));
      element.innerText = String(itemIndex);

      if (itemIndex < firstItemIndex) {
        element.setAttribute('viewState', 'culled');
        totalBefore -= values[itemIndex];
      } else if (itemIndex > lastItemIndex) {
        element.setAttribute('viewState', 'culled');
        totalAfter -= values[itemIndex];
      } else {
        // this.applySatelliteMirrorStyles(element.mirrorSatellite, elements);
        // element.mirrorSatellite.setAttribute('index', String(itemIndex));
        // element.mirrorSatellite.innerText = String(itemIndex);
        element.setAttribute('viewState', 'visible');
      }
    }

    this.sky.style.paddingTop = `${totalBefore}px`;
    this.sky.style.paddingBottom = `${totalAfter}px`;
  }

  render() {
    this.styleViewport();
    this.makeSatellites();
  }

  destroy() {
    this.wrapper.parentNode.removeChild(this.wrapper);
    this.wrapper = null;
    this.radar = null;
    this.component = null;
    /*
    this.satellites.forEach((satellite) => {
      satellite.mirrorSatellite = null;
      satellite.siblingSatellite = null;
      if (satellite.parentNode) {
        satellite.parentNode.removeChild(satellite);
      }
    });
    this.satellites = null;
    this.cache.forEach((satellite) => {
      satellite.mirrorSatellite = null;
      satellite.siblingSatellite = null;
      if (satellite.parentNode) {
        satellite.parentNode.removeChild(satellite);
      }
    });
    */
    this.cache = null;
  }

}
