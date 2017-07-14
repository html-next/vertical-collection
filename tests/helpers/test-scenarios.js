import { test } from 'ember-qunit';
import Ember from 'ember';
import DS from 'ember-data';
import hbs from 'htmlbars-inline-precompile';

const {
  A,
  ArrayProxy,
  RSVP: {
    Promise
  }
} = Ember;

const {
  PromiseArray
} = DS;

export default function testScenarios(description, template, scenarios, testFn) {
  for (const scenarioName in scenarios) {
    const scenario = scenarios[scenarioName];

    test(`${description} | ${scenarioName}`, function(assert) {
      for (let key in scenario) {
        const value = typeof scenario[key] === 'function' ? scenario[key]() : scenario[key];
        this.set(key, value);
      }

      this.render(template);

      return testFn.call(this, assert);
    });
  }
}

export function standardDynamicScenariosFor(items, options = { }) {
  const scenarios = {
    dynamicStandardArray: { items: items.slice() },
    dynamicEmberArray: { items: A(items.slice()) },
    dynamicArrayProxy: { items: ArrayProxy.create({ content: A(items.slice()) }) }
  };

  assignOptions(scenarios, options);

  return scenarios;
}

export function promiseDynamicScenariosFor(items, options = { }) {
  const scenarios = {
    dynamicPromiseArray: {
      items() {
        return PromiseArray.create({ promise: new Promise((resolve) => setTimeout(() => resolve(A(items.slice())), 10)) });
      }
    }
  };

  assignOptions(scenarios, options);

  return scenarios;
}

export function standardStaticScenariosFor(items, options = { }) {
  const scenarios = {
    staticStandardArray: { items: items.slice(), staticHeight: true },
    staticEmberArray: { items: A(items.slice()), staticHeight: true },
    staticArrayProxy: { items: ArrayProxy.create({ content: A(items.slice()) }), staticHeight: true }
  };

  assignOptions(scenarios, options);

  return scenarios;
}

export function promiseStaticScenariosFor(items, options = { }) {
  const scenarios = {
    staticPromiseArray: {
      items() {
        return PromiseArray.create({ promise: new Promise((resolve) => setTimeout(() => resolve(A(items.slice())), 10)) });
      },
      staticHeight: true
    }
  };

  assignOptions(scenarios, options);

  return scenarios;
}

export function dynamicScenariosFor(items, options) {
  return mergeScenarios(standardDynamicScenariosFor(items, options), promiseDynamicScenariosFor(items, options));
}

export function staticScenariosFor(items, options) {
  return mergeScenarios(standardStaticScenariosFor(items, options), promiseStaticScenariosFor(items, options));
}

export function standardScenariosFor(items, options) {
  return mergeScenarios(standardDynamicScenariosFor(items, options), standardStaticScenariosFor(items, options));
}

export function promiseScenariosFor(items, options) {
  return mergeScenarios(promiseDynamicScenariosFor(items, options), promiseStaticScenariosFor(items, options));
}

export function scenariosFor(items, options) {
  return mergeScenarios(dynamicScenariosFor(items, options), staticScenariosFor(items, options));
}

export const standardTemplate = hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      estimateHeight=(either-or estimateHeight 20)
      staticHeight=staticHeight
      bufferSize=(either-or bufferSize 5)

      renderFromLast=renderFromLast
      idForFirstItem=idForFirstItem

      firstVisibleChanged=firstVisibleChanged
      lastVisibleChanged=lastVisibleChanged
      firstReached=firstReached
      lastReached=lastReached

      key=key

      as |item i|}}
      <div style={{html-safe (join-strings "height:" (either-or itemHeight (either-or estimateHeight 20)) "px;")}}>
        {{item.number}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
`;

export function mergeScenarios(...scenariosToCombine) {
  const scenarios = {};

  Object.assign(scenarios, ...scenariosToCombine);

  return scenarios;
}

function assignOptions(scenarios, options) {
  for (let scenario in scenarios) {
    Object.assign(scenarios[scenario], options);
  }
}

