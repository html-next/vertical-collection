import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import wait from 'dummy/tests/helpers/wait';

moduleForComponent('vertical-collection', 'Integration | Basic Tests', {
  integration: true
});

test('The Collection Renders', function(assert) {
  assert.expect(1);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('items', Ember.A([Ember.Object.create({ text: 'b' })]));

  // Template block usage:
  this.render(hbs`
  <div style="height: 500px; width: 500px;">
    {{#vertical-collection ${'items'}

      as |item|}}
      <vertical-item>
        {{item.text}}
      </vertical-item>
    {{/vertical-collection}}
  </div>
  `);

  return wait().then(() => {
    assert.equal(this.$().find('vertical-item').length, 1);
  });
});

test('The Collection Renders when content is empty', function(assert) {
  assert.expect(1);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('items', Ember.A([]));

  // Template block usage:
  this.render(hbs`
  <div style="height: 500px; width: 500px;">
    {{#vertical-collection ${'items'}

      as |item|}}
      <vertical-item>
        {{item.text}}
      </vertical-item>
    {{/vertical-collection}}
  </div>
  `);

  return wait().then(() => {
    assert.equal(this.$().find('vertical-item').length, 0);
  });
});

/*
test("The Collection Reveals it's children when `renderAllInitially` is true.", function(assert) {
  assert.expect(1);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('items', Ember.A([Ember.Object.create({ text: 'b' })]));

  // Template block usage:
  this.render(hbs`
  <div style="height: 500px; width: 500px;">
    {{#vertical-collection ${'items'} renderAllInitially=true as |item|}}
      {{item.text}}
    {{/vertical-collection}}
  </div>
  `);

  assert.equal(this.$().find('vertical-item').first().get(0).innerHTML, 'b');
});
*/
