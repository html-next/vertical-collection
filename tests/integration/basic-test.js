import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import getNumbers from 'dummy/lib/get-numbers';
import wait from 'dummy/tests/helpers/wait';

moduleForComponent('vertical-collection', 'Integration | Basic Tests', {
  integration: true
});

test('The Collection Renders', function(assert) {
  assert.expect(1);

  this.set('items', Ember.A([Ember.Object.create({ text: 'b' })]));

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

  this.set('items', Ember.A([]));

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

test('The Collection Renders with a key path set', function(assert) {
  assert.expect(1);

  this.set('items', [{ id: 1 }, { id: 2 }, { id: 3 }]);

  this.render(hbs`
  <div style="height: 500px; width: 500px;">
    {{#vertical-collection ${'items'}
      key="id"

      as |item|}}
      <vertical-item>
        {{item.id}}
      </vertical-item>
    {{/vertical-collection}}
  </div>
  `);

  return wait().then(() => {
    assert.equal(this.$().find('vertical-item').length, 3);
  });
});

test('The collection renders with containerSelector set', function(assert) {
  assert.expect(1);

  this.set('items', getNumbers(0, 100));

  this.render(hbs`
  <div style="height: 100px;" class="scrollable">
    <div>
      {{#vertical-collection ${'items'}
        containerSelector=".scrollable"
        minHeight=20
        bufferSize=0

        as |item i|}}
        <vertical-item style="height: 20px">
          {{item.number}} {{i}}
        </vertical-item>
      {{/vertical-collection}}
    </div>
  </div>
  `);

  return wait().then(() => {
    assert.equal(this.$().find('vertical-item').length, 6);
  });
});

test('The collection renders when yielded item has conditional', function(assert) {
  assert.expect(1);
  const items = [{
    shouldRender: true
  }];
  this.set('items', items);
  this.render(hbs`
    <div style="height: 500px; width: 500px;">
      {{#vertical-collection ${'items'}
        minHeight=10
        containerSelector="body"
        alwaysRemeasure=true
        as |item|
      }}
        Content
        {{#if item.shouldRender}}
          <section>
            Conditional Content
          </section>
        {{/if}}
      {{/vertical-collection}}
    </div>
  `);
  return wait().then(() => {
    assert.ok(true, 'No errors were thrown in the process');
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
