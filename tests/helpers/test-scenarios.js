import { test } from 'ember-qunit';

export default function testScenarios(description, scenarios, testFn) {
  for (const scenarioName in scenarios) {
    test(`${description} | ${scenarioName}`, function(assert) {
      return testFn.call(this, scenarios[scenarioName], assert);
    });
  }
}
