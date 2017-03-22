import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import wait from 'dummy/tests/helpers/wait';
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
      alwaysRemeasure=true
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
    assert.equal(itemContainer.css('paddingTop'), '0px', 'itemContainer padding is correct on initial render');
    this.$('.item:first').height(50);

    scrollContainer.scrollTop(251);

    return wait();
  }).then(() => {
    assert.equal(itemContainer.css('paddingTop'), '50px', 'itemContainer padding is the height of the modified first element');
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
      alwaysRemeasure=true
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
    assert.equal(itemContainer.css('paddingBottom'), '1380px', 'itemContainer padding is correct on initial render');
    scrollContainer.scrollTop(221);

    return wait();
  }).then(() => {
    assert.equal(itemContainer.css('paddingBottom'), '1360px', 'itemContainer padding is correct after scrolling down');
    this.$('.item:last').height(50);
    scrollContainer.scrollTop(0);

    return wait();
  }).then(() => {
    assert.equal(itemContainer.css('paddingBottom'), '1410px', 'itemContainer padding has the height of the modified last element');
  });
});
