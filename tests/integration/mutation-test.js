import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import getNumbers from 'dummy/lib/get-numbers';
import wait from 'dummy/tests/helpers/wait';
import testScenarios from 'dummy/tests/helpers/test-scenarios';
import { paddingBefore, containerHeight } from 'dummy/tests/helpers/measurement';

moduleForComponent('vertical-collection', 'Integration | Mutation Tests', {
  integration: true
});

const commonTemplate = hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=minHeight
      staticHeight=staticHeight

      as |item i|}}
      <div style="height:20px;">
        {{item.number}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
`;

const staticScenario = { staticHeight: true, minHeight: 20 };
const dynamicScenario = { staticHeight: false, minHeight: 20 };

testScenarios('Collection prepends via array replacement correctly', { staticScenario, dynamicScenario }, function(assert) {
  assert.expect(8);
  this.set('items', getNumbers(0, 100));

  this.render(commonTemplate);

  const scrollContainer = this.$('.scrollable');
  const itemContainer = this.$('vertical-collection');

  return wait().then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before prepend');
    assert.equal(scrollContainer.find('div:last').text().trim(), '30 30', 'last item rendered correctly before prepnd');
    assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct before prepend');
    assert.equal(containerHeight(itemContainer), 2000, 'itemContainer height is correct before prepend');

    const newNumbers = getNumbers(-20, 20).concat(this.get('items'));
    this.set('items', newNumbers);

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '-10 10', 'first item rendered correctly after prepend');
    assert.equal(scrollContainer.find('div:last').text().trim(), '20 40', 'last item rendered correctly after prepend');
    assert.equal(scrollContainer.scrollTop(), 400, 'scrollTop is correct after prepend');
    assert.equal(containerHeight(itemContainer), 2400, 'itemContainer height is correct after prepend');
  });
});

testScenarios('Collection appends via array replacement correctly', { staticScenario, dynamicScenario }, function(assert) {
  assert.expect(8);
  this.set('items', getNumbers(0, 100));

  this.render(commonTemplate);

  const scrollContainer = this.$('.scrollable');
  const itemContainer = this.$('vertical-collection');

  return wait().then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before append');
    assert.equal(scrollContainer.find('div:last').text().trim(), '30 30', 'last item rendered correctly before append');
    assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct before append');
    assert.equal(containerHeight(itemContainer), 2000, 'itemContainer height is correct after append');

    const newNumbers = this.get('items').concat(getNumbers(100, 20));
    this.set('items', newNumbers);

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly after append');
    assert.equal(scrollContainer.find('div:last').text().trim(), '30 30', 'last item rendered correctly after append');
    assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct after append');
    assert.equal(containerHeight(itemContainer), 2400, 'itemContainer height is correct after append');
  });
});

testScenarios('Collection prepends via array mutation correctly', { staticScenario, dynamicScenario }, function(assert) {
  assert.expect(8);
  this.set('items', Ember.A(getNumbers(0, 100)));

  this.render(commonTemplate);

  const scrollContainer = this.$('.scrollable');
  const itemContainer = this.$('vertical-collection');

  return wait().then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before prepend');
    assert.equal(scrollContainer.find('div:last').text().trim(), '30 30', 'last item rendered correctly before prepnd');
    assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct before prepend');
    assert.equal(containerHeight(itemContainer), 2000, 'itemContainer height is correct after prepend');

    this.get('items').unshiftObjects(getNumbers(-20, 20));

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '-10 10', 'first item rendered correctly after prepend');
    assert.equal(scrollContainer.find('div:last').text().trim(), '20 40', 'last item rendered correctly after prepend');
    assert.equal(scrollContainer.scrollTop(), 400, 'scrollTop is correct after prepend');
    assert.equal(containerHeight(itemContainer), 2400, 'itemContainer height is correct after prepend');
  });
});

testScenarios('Collection appends via array mutation correctly', { staticScenario, dynamicScenario }, function(assert) {
  assert.expect(8);
  this.set('items', Ember.A(getNumbers(0, 100)));

  this.render(commonTemplate);

  const scrollContainer = this.$('.scrollable');
  const itemContainer = this.$('vertical-collection');

  return wait().then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before append');
    assert.equal(scrollContainer.find('div:last').text().trim(), '30 30', 'last item rendered correctly before append');
    assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct before append');
    assert.equal(containerHeight(itemContainer), 2000, 'itemContainer height is correct after append');

    this.get('items').pushObjects(getNumbers(-20, 20));

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly after append');
    assert.equal(scrollContainer.find('div:last').text().trim(), '30 30', 'last item rendered correctly after append');
    assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct after append');
    assert.equal(containerHeight(itemContainer), 2400, 'itemContainer height is correct after append');
  });
});

testScenarios('Collection prepends correctly if prepend would cause more VCs to be shown', { staticScenario, dynamicScenario }, function(assert) {
  assert.expect(8);
  this.set('items', getNumbers(0, 20));

  this.render(commonTemplate);

  const scrollContainer = this.$('.scrollable');
  const itemContainer = this.$('vertical-collection');

  return wait().then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before prepend');
    assert.equal(scrollContainer.find('div:last').text().trim(), '19 19', 'last item rendered correctly before prepend');
    assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct before prepend');
    assert.equal(containerHeight(itemContainer), 400, 'itemContainer height is correct before prepend');

    const newNumbers = getNumbers(-20, 20).concat(this.get('items'));
    this.set('items', newNumbers);

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '-11 9', 'first item rendered correctly after prepend');
    assert.equal(scrollContainer.find('div:last').text().trim(), '19 39', 'last item rendered correctly after prepend');
    assert.equal(scrollContainer.scrollTop(), 400, 'scrollTop is correct after prepend');
    assert.equal(containerHeight(itemContainer), 800, 'itemContainer height is correct after prepend');
  });
});

testScenarios('Collection appends correctly if append would cause more VCs to be shown', { staticScenario, dynamicScenario }, function(assert) {
  assert.expect(8);
  this.set('items', getNumbers(0, 20));

  this.render(commonTemplate);

  const scrollContainer = this.$('.scrollable');
  const itemContainer = this.$('vertical-collection');

  return wait().then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before append');
    assert.equal(scrollContainer.find('div:last').text().trim(), '19 19', 'last item rendered correctly before append');
    assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct before append');
    assert.equal(containerHeight(itemContainer), 400, 'itemContainer height is correct before append');

    const newNumbers = this.get('items').concat(getNumbers(20, 20));
    this.set('items', newNumbers);

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly after append');
    assert.equal(scrollContainer.find('div:last').text().trim(), '30 30', 'last item rendered correctly after append');
    assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct after append');
    assert.equal(containerHeight(itemContainer), 800, 'itemContainer height is correct after append');
  });
});

testScenarios('Collection can shrink number of items if would cause fewer VCs to be shown', {
  staticScenario: { staticHeight: true, minHeight: 20 },
  dynamicScenario: { staticHeight: false, minHeight: 20 }
}, function(assert) {
  assert.expect(6);
  this.set('items', getNumbers(0, 100));

  this.render(commonTemplate);

  const scrollContainer = this.$('.scrollable');

  return wait().then(() => {
    assert.equal(scrollContainer.find('div').length, 31, 'correct number of VCs rendered before reset');
    assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before reset');
    assert.equal(scrollContainer.find('div:last').text().trim(), '30 30', 'last item rendered correctly before reset');

    this.set('items', getNumbers(0, 10));

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div').length, 10, 'correct number of VCs rendered after reset');
    assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly after reset');
    assert.equal(scrollContainer.find('div:last').text().trim(), '9 9', 'last item rendered correctly after reset');
  });
});

testScenarios('Collection can shrink number of items if would cause fewer VCs to be shown and scroll would change', {
  staticScenario: { staticHeight: true, minHeight: 20 },
  dynamicScenario: { staticHeight: false, minHeight: 20 }
}, function(assert) {
  assert.expect(1);
  this.set('items', getNumbers(0, 100));

  this.render(commonTemplate);

  const scrollContainer = this.$('.scrollable');

  return wait().then(() => {
    scrollContainer.scrollTop(1000);

    return wait();
  }).then(() => {
    this.set('items', getNumbers(0, 10));

    return wait();
  }).then(() => {
    assert.ok(true, 'No errors encountered (Glimmer would have thrown one)');
  });
});

test('Dynamic collection maintains state if the same list is passed in twice', function(assert) {
  assert.expect(4);
  const items = getNumbers(0, 100);
  this.set('items', items);

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20

      as |item i|}}
      <div style="height:40px;">
        {{item.number}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
  `);

  const scrollContainer = this.$('.scrollable');
  const itemContainer = this.$('vertical-collection');

  return wait().then(() => {
    scrollContainer.scrollTop(541);

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '1 1', 'first item rendered correctly after same items set');
    assert.equal(paddingBefore(itemContainer), '40px', 'itemContainer padding correct before same items set');

    this.set('items', items.slice());

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '1 1', 'first item rendered correctly after same items set');
    assert.equal(paddingBefore(itemContainer), '40px', 'itemContainer padding correct after same items set');
  });
});
