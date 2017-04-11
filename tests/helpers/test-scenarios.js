import { test } from 'ember-qunit';

export default function testScenarios(description, scenarios, testFn) {
  for (const scenarioName in scenarios) {
    test(`${description} | ${scenarioName}`, function(assert) {
      this.setProperties(scenarios[scenarioName]);
      return testFn.call(this, assert);
    });
  }
}
