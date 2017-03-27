import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import getNumbers from 'dummy/lib/get-numbers';
import wait from 'dummy/tests/helpers/wait';
import { paddingBefore, containerHeight } from 'dummy/tests/helpers/measurement';

moduleForComponent('vertical-collection', 'Integration | Mutation Tests', {
  integration: true
});

test('Collection prepends via array replacement correctly', function(assert) {
  assert.expect(8);
  this.set('items', getNumbers(0, 100));

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20

      as |item i|}}
      <div style="height:20px;">
        {{item.number}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
  `);

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

test('Collection appends via array replacement correctly', function(assert) {
  assert.expect(8);
  this.set('items', getNumbers(0, 100));

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20

      as |item i|}}
      <div style="height:20px;">
        {{item.number}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
  `);

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

test('Collection prepends via array mutation correctly', function(assert) {
  assert.expect(8);
  this.set('items', Ember.A(getNumbers(0, 100)));

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20

      as |item i|}}
      <div style="height:20px;">
        {{item.number}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
  `);

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

test('Collection appends via array mutation correctly', function(assert) {
  assert.expect(8);
  this.set('items', Ember.A(getNumbers(0, 100)));

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20

      as |item i|}}
      <div style="height:20px;">
        {{item.number}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
  `);

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

test('Collection prepends correctly if prepend would cause more VCs to be shown', function(assert) {
  assert.expect(8);
  this.set('items', getNumbers(0, 20));

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20

      as |item i|}}
      <div style="height:20px;">
        {{item.number}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
  `);

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

test('Collection appends correctly if prepend would cause more VCs to be shown', function(assert) {
  assert.expect(8);
  this.set('items', getNumbers(0, 20));

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20

      as |item i|}}
      <div style="height:20px;">
        {{item.number}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
  `);

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

test('Collection maintains state if the same list is passed in twice', function(assert) {
  assert.expect(4);
  const items = getNumbers(0, 100);
  this.set('items', items);

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20
      alwaysRemeasure=true

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
    assert.equal(paddingBefore(itemContainer), '40px', 'itemContainer height is correct before append');

    this.set('items', items.slice());

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '1 1', 'first item rendered correctly after same items set');
    assert.equal(paddingBefore(itemContainer), '40px', 'itemContainer padding correct after same items set');
  });
});
