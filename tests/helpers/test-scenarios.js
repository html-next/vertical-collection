import { A } from '@ember/array';
import ArrayProxy from '@ember/array/proxy';
import { Promise } from 'rsvp';
import { test } from 'qunit';
import DS from 'ember-data';
import hbs from 'htmlbars-inline-precompile';
import { settled } from '@ember/test-helpers';

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

      let renderCompletionPromise = this.render(template);

      if (preRenderTestFn) {
        await preRenderTestFn.call(this, assert);
      } else if(testFn) {
        await settled();
        await testFn.call(this, assert);
      }

      await renderCompletionPromise;
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
    {{#vertical-collection this.items
      estimateHeight=(either-or this.estimateHeight 20)
      staticHeight=this.staticHeight
      bufferSize=(either-or this.bufferSize 0)
      renderAll=this.renderAll
      debugVis=(either-or this.debugVis false)
      debugCSS=(either-or this.debugCSS false)

      renderFromLast=this.renderFromLast
      idForFirstItem=this.idForFirstItem

      firstVisibleChanged=this.firstVisibleChanged
      lastVisibleChanged=this.lastVisibleChanged
      firstReached=this.firstReached
      lastReached=this.lastReached

      key=(either-or this.key "@identity")

      as |item i|}}
      <div
        class="vertical-item"
        style={{html-safe (join-strings "height:" (either-or this.itemHeight (either-or this.estimateHeight 20)) "px;")}}
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

    Object.assign(scenario, options);
    Object.assign(scenario, defaultOptions);

    return { [name]: scenario };
  };
}

function mergeScenarioGenerators(...scenarioGenerators) {
  return function(items, options) {
    return scenarioGenerators.reduce((scenarios, generator) => {
      return Object.assign(scenarios, generator(items, options));
    }, {});
  };
}
