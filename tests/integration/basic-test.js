import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import getNumbers from 'dummy/lib/get-numbers';
import wait from 'dummy/tests/helpers/wait';
import {
  default as testScenarios,
  scenariosFor,
  standardTemplate
} from 'dummy/tests/helpers/test-scenarios';

moduleForComponent('vertical-collection', 'Integration | Basic Tests', {
  integration: true
});

testScenarios(
  'The collection Renders',
  standardTemplate,
  scenariosFor(getNumbers(0, 1)),

  function(assert) {
    assert.expect(1);

    return wait().then(() => {
      assert.equal(this.$('.scrollable').find('div').length, 1);
    });
  }
);

testScenarios(
  'The collection Renders when content is empty',
  standardTemplate,
  scenariosFor([]),

  function(assert) {
    assert.expect(1);

    return wait().then(() => {
      assert.equal(this.$('.scrollable').find('div').length, 0);
    });
  }
);

testScenarios(
  'The collection renders with a key path set',
  standardTemplate,
  scenariosFor([{ id: 1 }, { id: 2 }, { id: 3 }], { key: 'id' }),

  function(assert) {
    assert.expect(1);

    return wait().then(() => {
      assert.equal(this.$('.scrollable').find('div').length, 3);
    });
  }
);

testScenarios(
  'The collection renders correct number of components with bufferSize set',
  standardTemplate,
  scenariosFor(getNumbers(0, 10), { minHeight: 200, bufferSize: 1 }),

  function(assert) {
    assert.expect(1);

    return wait().then(() => {
      // Should render 2 components to be able to cover the whole scroll space, and 1
      // extra buffer component on either side
      assert.equal(this.$('.scrollable').find('div').length, 4);
    });
  }
);

test('The collection renders with containerSelector set', function(assert) {
  assert.expect(1);

  this.set('items', getNumbers(0, 100));

  this.render(hbs`
  <div style="height: 100px;" class="scrollable">
    <div>
      {{#vertical-collection ${'items'}
        containerSelector=".scrollable"
        minHeight=20
        staticHeight=true
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

test('The collection renders in the correct initial position', function(assert) {
  assert.expect(3);

  this.set('items', getNumbers(0, 100));

  this.render(hbs`
  <div style="height: 100px; padding-top: 50px;" class="scrollable">
    <div>
      {{#vertical-collection ${'items'}
        containerSelector=".scrollable"
        minHeight=20
        staticHeight=true
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
    let occludedBoundaries = this.$().find('occluded-content');
    assert.equal(occludedBoundaries.get(0).getAttribute('style'), 'height: 0px;', 'Occluded height above is 0');
    assert.equal(occludedBoundaries.get(1).getAttribute('style'), 'height: 1880px;', 'Occluded height below is 20 * 94 items');
    assert.equal(this.$().find('vertical-item').length, 6, 'We rendered 100/20 + 1 items');
  });
});

test('The collection renders in the correct initial position with dynamic heights', function(assert) {
  assert.expect(3);

  this.set('items', getNumbers(0, 100));

  this.render(hbs`
  <div style="position: relative; background: red; box-sizing: content-box; height: 100px; overflow-y: scroll;" class="scrollable">
    <div style="padding: 200px;">
      {{#vertical-collection ${'items'}
        containerSelector=".scrollable"
        minHeight=20

        as |item i|}}
        <vertical-item style="height: 28px">
          {{item.number}} {{i}}
        </vertical-item>
      {{/vertical-collection}}
    </div>
  </div>
  `);

  return wait().then(() => {
    let occludedBoundaries = this.$().find('occluded-content');
    assert.equal(occludedBoundaries.get(0).getAttribute('style'), 'height: 0px;', 'Occluded height above is 0');
    assert.equal(occludedBoundaries.get(1).getAttribute('style'), 'height: 1880px;', 'Occluded height below is 20 * 94 items');
    assert.equal(this.$().find('vertical-item').length, 6, 'We rendered 100/20 + 1 items');
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

test('The collection renders the initialRenderCount correctly', function(assert) {
  assert.expect(5);
  this.set('items', getNumbers(0, 100));

  this.render(hbs`
    <div style="height: 500px; width: 500px;" class="scrollable">
      {{#vertical-collection ${'items'}
        minHeight=50
        initialRenderCount=1
        as |item i|
      }}
        <vertical-item style="height: 50px">
          {{item.number}} {{i}}
        </vertical-item>
      {{/vertical-collection}}
    </div>
  `);

  requestAnimationFrame(() => {
    assert.equal(this.$('vertical-item').length, 1, 'correct number of items rendered on initial pass');
    assert.equal(this.$('vertical-item').text().trim(), '0 0', 'correct item rendered');
  });

  return wait().then(() => {
    assert.equal(this.$('vertical-item').length, 11, 'correctly updates the number of items rendered on second pass');
    assert.equal(this.$('vertical-item:eq(0)').text().trim(), '0 0', 'correct first item rendered');
    assert.equal(this.$('vertical-item:eq(10)').text().trim(), '10 10', 'correct last item rendered');
  });
});

test('The collection renders the initialRenderCount correctly if idForFirstItem is set', function(assert) {
  assert.expect(5);
  this.set('items', getNumbers(0, 100));

  this.render(hbs`
    <div style="height: 500px; width: 500px;" class="scrollable">
      {{#vertical-collection ${'items'}
        minHeight=50
        initialRenderCount=1
        idForFirstItem="20"
        key="number"
        as |item i|
      }}
        <vertical-item style="height: 50px">
          {{item.number}} {{i}}
        </vertical-item>
      {{/vertical-collection}}
    </div>
  `);

  requestAnimationFrame(() => {
    assert.equal(this.$('vertical-item').length, 1, 'correct number of items rendered on initial pass');
    assert.equal(this.$('vertical-item').text().trim(), '20 20', 'correct item rendered');
  });

  return wait().then(() => {
    assert.equal(this.$('vertical-item').length, 11, 'correctly updates the number of items rendered on second pass');
    assert.equal(this.$('vertical-item:eq(0)').text().trim(), '20 20', 'correct first item rendered');
    assert.equal(this.$('vertical-item:eq(10)').text().trim(), '30 30', 'correct last item rendered');
  });
});

test('The collection renders the initialRenderCount correctly if the count is more than the number of items', function(assert) {
  assert.expect(4);
  this.set('items', getNumbers(0, 1));

  this.render(hbs`
    <div style="height: 500px; width: 500px;" class="scrollable">
      {{#vertical-collection ${'items'}
        minHeight=50
        initialRenderCount=5
        as |item i|
      }}
        <vertical-item style="height: 50px">
          {{item.number}} {{i}}
        </vertical-item>
      {{/vertical-collection}}
    </div>
  `);

  requestAnimationFrame(() => {
    assert.equal(this.$('vertical-item').length, 1, 'correct number of items rendered on initial pass');
    assert.equal(this.$('vertical-item').text().trim(), '0 0', 'correct item rendered');
  });

  return wait().then(() => {
    assert.equal(this.$('vertical-item').length, 1, 'correctly updates the number of items rendered on second pass');
    assert.equal(this.$('vertical-item').text().trim(), '0 0', 'correct first item rendered');
  });
});

/*
test("The Collection Reveals it's children when `renderAllInitially` is true.", function(assert) {
  assert.expect(1);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('items', A([Ember.Object.create({ text: 'b' })]));

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
