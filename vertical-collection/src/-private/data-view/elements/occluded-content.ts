import { DEBUG } from '@glimmer/env';

import document from '../../utils/document-shim.ts';

let OC_IDENTITY = 0;

export default class OccludedContent {
  id: string;
  readonly isOccludedContent = true;
  element: HTMLElement | null;
  upperBound: Text | null = null;
  lowerBound: Text | null = null;
  rendered: boolean;

  constructor(tagName: string) {
    this.id = `OC-${OC_IDENTITY++}`;

    // We check to see if the document exists in Fastboot. Since RAF won't run in
    // Fastboot, we'll never have to use these text nodes for measurements, so they
    // can be empty
    if (document !== undefined) {
      this.element = document.createElement(tagName);
      this.element.className += 'occluded-content';

      this.upperBound = document.createTextNode('');
      this.lowerBound = document.createTextNode('');
    } else {
      this.element = null;
    }

    this.rendered = false;

    if (DEBUG) {
      Object.preventExtensions(this);
    }
  }

  getBoundingClientRect(): DOMRect | undefined {
    if (this.element !== null) {
      return this.element.getBoundingClientRect();
    }
  }

  addEventListener(event: string, listener: EventListener): void {
    if (this.element !== null) {
      this.element.addEventListener(event, listener);
    }
  }

  removeEventListener(event: string, listener: EventListener): void {
    if (this.element !== null) {
      this.element.removeEventListener(event, listener);
    }
  }

  get realUpperBound(): Text | null {
    return this.upperBound;
  }

  get realLowerBound(): Text | null {
    return this.lowerBound;
  }

  get parentNode(): ParentNode | null {
    return this.element !== null ? this.element.parentNode : null;
  }

  get style(): CSSStyleDeclaration | Partial<CSSStyleDeclaration> {
    return this.element !== null ? this.element.style : {};
  }

  set innerHTML(value: string) {
    if (this.element !== null) {
      this.element.innerHTML = value;
    }
  }

  destroy(): void {
    this.element = null;
  }
}
