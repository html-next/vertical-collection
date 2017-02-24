export default class Geography {

  constructor(element, state) {
    this.element = element;

    this.setState(state);
  }

  setState(state) {
    state = state || this.element.getBoundingClientRect();

    // copying over ensures we preserve shape from outside sources
    // and enables write ops as ClientRect can't be written
    this.top = state.top || 0;
    this.bottom = state.bottom || 0;
    this.left = state.left || 0;
    this.right = state.right || 0;
    this.width = state.width || 0;
    this.height = state.height || 0;
  }

  getState() {
    return {
      top: this.top,
      bottom: this.bottom,
      left: this.left,
      right: this.right,
      width: this.width,
      height: this.height
    };
  }

  destroy() {
    this.element = undefined;
  }
}
