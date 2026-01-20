// @ts-expect-error ???
import registerWaiter from 'ember-raf-scheduler/test-support/register-waiter';
import config from 'test-app/config/environment';

let didRegister = false;

export function initialize() {
  // The vertical-collection test suite relies on async work scheduled via rAF.
  // Registering this waiter makes `settled()` and other test helpers wait for
  // pending rAF-scheduler work, matching the dummy app test harness.
  if (didRegister) {
    return;
  }

  if ((config as { environment?: string }).environment === 'test') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    registerWaiter();
    didRegister = true;
  }
}

export default {
  initialize,
};
