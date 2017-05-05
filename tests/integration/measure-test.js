import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import wait from 'dummy/tests/helpers/wait';
import { paddingBefore, paddingAfter } from 'dummy/tests/helpers/measurement';
import getNumbers from 'dummy/lib/get-numbers';

moduleForComponent('vertical-collection', 'Integration | Measure Tests', {
  integration: true
});

test('The collection correctly remeasures items when scrolling down', function(assert) {
  assert.expect(2);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('items', Ember.A(getNumbers(0, 100)));

  // Template block usage:
  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20

      as |item|}}
      <div class="item" style="height: 20px;">
        {{item.number}}
      </div>
    {{/vertical-collection}}
  </div>
  `);

  const scrollContainer = this.$('.scrollable');
  const itemContainer = this.$('vertical-collection');

  return wait().then(() => {
    assert.equal(paddingBefore(itemContainer), 0, 'itemContainer padding is correct on initial render');
    this.$('.item:first').height(50);

    scrollContainer.scrollTop(51);

    return wait();
  }).then(() => {
    assert.equal(paddingBefore(itemContainer), 50, 'itemContainer padding is the height of the modified first element');
  });
});

test('The collection correctly remeasures items when scrolling up', function(assert) {
  assert.expect(3);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('items', Ember.A(getNumbers(0, 100)));

  // Template block usage:
  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20

      as |item|}}
      <div class="item" style="height: 20px;">
        {{item.number}}
      </div>
    {{/vertical-collection}}
  </div>
  `);

  const scrollContainer = this.$('.scrollable');
  const itemContainer = this.$('vertical-collection');

  return wait().then(() => {
    assert.equal(paddingAfter(itemContainer), 1780, 'itemContainer padding is correct on initial render');
    scrollContainer.scrollTop(21);

    return wait();
  }).then(() => {
    assert.equal(paddingAfter(itemContainer), 1760, 'itemContainer padding is correct after scrolling down');
    this.$('.item:last').height(50);
    scrollContainer.scrollTop(0);

    return wait();
  }).then(() => {
    assert.equal(paddingAfter(itemContainer), 1810, 'itemContainer padding has the height of the modified last element');
  });
});

test('Can scroll correctly in dynamic list of items that has non-integer heights', function(assert) {
  assert.expect(2);

  this.set('items', getNumbers(0, 21));

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20

      as |item i|}}
      <div style="height: 33.333px;">{{item.number}} {{i}}</div>
    {{/vertical-collection}}
  </div>
  `);

  const scrollable = this.$('.scrollable');
  const itemContainer = this.$('vertical-collection');

  return wait()
    .then(() => scrollable.scrollTop(scrollable.get(0).scrollHeight))
    .then(wait)
    .then(() => {
      // Floats aren't perfect, neither is browser rendering/measuring, but any subpixel errors
      // should be amplified to the point where they are very noticeable at this point, so rounding
      // should provide some safety.
      assert.equal(Math.round(paddingBefore(itemContainer)), 333, 'Occluded content has the correct height before');
      assert.equal(paddingAfter(itemContainer), 0, 'Occluded content has the correct height after');
    });
});
