import { A } from '@ember/array';
import ArrayProxy from '@ember/array/proxy';
import { Promise } from 'rsvp';
import Ember from 'ember';
import { test } from 'ember-qunit';
import DS from 'ember-data';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

const {
  PromiseArray
} = DS;

export function testScenarios(description, scenarios, template, testFn, preRenderTestFn, setValuesBeforeRender) {
  for (const scenarioName in scenarios) {
    const scenario = scenarios[scenarioName];

    test(`${description} | ${scenarioName}`, async function(assert) {
      for (let key in scenario) {
        const value = typeof scenario[key] === 'function' ? scenario[key]() : scenario[key];
        this.set(key, value);
      }

      // An extra function to set values before render. Mostly to set the closure actions
      if (setValuesBeforeRender) {
        await setValuesBeforeRender.call(this, assert);
      }

      await this.render(template);

      if (preRenderTestFn) {
        await preRenderTestFn.call(this, assert);
      } else if(testFn) {
        await wait();
        await testFn.call(this, assert);
      }
    });
  }
}

export const dynamicSimpleScenarioFor = generateScenario('Dynamic Standard Array', {});
export const dynamicEmberArrayScenarioFor = generateScenario('Dynamic Ember Array', {}, A);
export const dynamicArrayProxyScenarioFor = generateScenario('Dynamic ArrayProxy', {}, createArrayProxy);
export const dynamicPromiseArrayScenarioFor = generateScenario('Dynamic PromiseArray', {}, createPromiseArrayFunction);

export const staticSimpleScenarioFor = generateScenario('Static Standard Array', { staticHeight: true });
export const staticEmberArrayScenarioFor = generateScenario('Static Standard Array', { staticHeight: true }, A);
export const staticArrayProxyScenarioFor = generateScenario('Static ArrayProxy', { staticHeight: true }, createArrayProxy);
export const staticPromiseArrayScenarioFor = generateScenario('Static PromiseArray', { staticHeight: true }, createPromiseArrayFunction);

export const simpleScenariosFor = mergeScenarioGenerators(
  dynamicSimpleScenarioFor,
  staticSimpleScenarioFor
);

export const standardScenariosFor = mergeScenarioGenerators(
  dynamicSimpleScenarioFor,
  dynamicEmberArrayScenarioFor,
  dynamicArrayProxyScenarioFor,

  staticSimpleScenarioFor,
  staticEmberArrayScenarioFor,
  staticArrayProxyScenarioFor
);

export const scenariosFor = mergeScenarioGenerators(
  dynamicSimpleScenarioFor,
  dynamicEmberArrayScenarioFor,
  dynamicArrayProxyScenarioFor,
  dynamicPromiseArrayScenarioFor,

  staticSimpleScenarioFor,
  staticEmberArrayScenarioFor,
  staticArrayProxyScenarioFor,
  staticPromiseArrayScenarioFor
);

export const standardTemplate = hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection items
      estimateHeight=(either-or estimateHeight 20)
      staticHeight=staticHeight
      bufferSize=(either-or bufferSize 0)
      renderAll=renderAll
      debugVis=(either-or debugVis false)
      debugCSS=(either-or debugCSS false)

      renderFromLast=renderFromLast
      idForFirstItem=idForFirstItem

      firstVisibleChanged=firstVisibleChanged
      lastVisibleChanged=lastVisibleChanged
      firstReached=firstReached
      lastReached=lastReached

      key=(either-or key "@identity")

      as |item i|}}
      <div
        class="vertical-item"
        style={{html-safe (join-strings "height:" (either-or itemHeight (either-or estimateHeight 20)) "px;")}}
      >
        {{item.number}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
`;

function createArrayProxy(items) {
  return ArrayProxy.create({ content: A(items) });
}

function createPromiseArrayFunction(items) {
  return function() {
    const promise = new Promise((resolve) => setTimeout(() => resolve(A(items.slice())), 10));

    return PromiseArray.create({ promise });
  };
}

function generateScenario(name, defaultOptions, initializer) {
  return function(baseItems, options) {
    const items = initializer ? initializer(baseItems.slice()) : baseItems.slice();
    const scenario = { items };

    Ember.assign(scenario, options); // eslint-disable-line ember/new-module-imports
    Ember.assign(scenario, defaultOptions); // eslint-disable-line ember/new-module-imports

    return { [name]: scenario };
  };
}

function mergeScenarioGenerators(...scenarioGenerators) {
  return function(items, options) {
    return scenarioGenerators.reduce((scenarios, generator) => {
      return Ember.assign(scenarios, generator(items, options)); // eslint-disable-line ember/new-module-imports
    }, {});
  };
}
