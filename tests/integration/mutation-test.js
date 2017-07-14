import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

import getNumbers from 'dummy/lib/get-numbers';
import wait from 'dummy/tests/helpers/wait';
import {
  default as testScenarios,
  scenariosFor,
  standardTemplate
} from 'dummy/tests/helpers/test-scenarios';

import { prepend, append, emptyArray } from 'dummy/tests/helpers/array';
import { paddingBefore, containerHeight } from 'dummy/tests/helpers/measurement';

moduleForComponent('vertical-collection', 'Integration | Mutation Tests', {
  integration: true
});

testScenarios(
  'Collection prepends correctly',
  standardTemplate,
  scenariosFor(getNumbers(0, 100)),

  function(assert) {
    assert.expect(8);

    const scrollContainer = this.$('.scrollable');
    const itemContainer = this.$('vertical-collection');

    return wait().then(() => {
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before prepend');
      assert.equal(scrollContainer.find('div:last').text().trim(), '9 9', 'last item rendered correctly before prepnd');
      assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct before prepend');
      assert.equal(containerHeight(itemContainer), 2000, 'itemContainer height is correct before prepend');

      prepend(this, getNumbers(-20, 20));

      return wait();
    }).then(() => {
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 20', 'first item rendered correctly after prepend');
      assert.equal(scrollContainer.find('div:last').text().trim(), '9 29', 'last item rendered correctly after prepend');
      assert.equal(scrollContainer.scrollTop(), 400, 'scrollTop is correct after prepend');
      assert.equal(containerHeight(itemContainer), 2400, 'itemContainer height is correct after prepend');
    });
  }
);

testScenarios(
  'Collection appends correctly',
  standardTemplate,
  scenariosFor(getNumbers(0, 100)),

  function(assert) {
    assert.expect(8);

    const scrollContainer = this.$('.scrollable');
    const itemContainer = this.$('vertical-collection');

    return wait().then(() => {
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before append');
      assert.equal(scrollContainer.find('div:last').text().trim(), '9 9', 'last item rendered correctly before append');
      assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct before append');
      assert.equal(containerHeight(itemContainer), 2000, 'itemContainer height is correct after append');

      append(this, getNumbers(100, 20));

      return wait();
    }).then(() => {
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly after append');
      assert.equal(scrollContainer.find('div:last').text().trim(), '9 9', 'last item rendered correctly after append');
      assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct after append');
      assert.equal(containerHeight(itemContainer), 2400, 'itemContainer height is correct after append');
    });
  }
);

testScenarios(
  'Collection prepends correctly if prepend would cause more VCs to be shown',
  standardTemplate,
  scenariosFor(getNumbers(0, 10), { bufferSize: 5 }),

  function(assert) {
    assert.expect(6);

    const scrollContainer = this.$('.scrollable');

    return wait().then(() => {
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before prepend');
      assert.equal(scrollContainer.find('div:last').text().trim(), '9 9', 'last item rendered correctly before prepend');
      assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct before prepend');

      prepend(this, getNumbers(-5, 5));

      return wait();
    }).then(() => {
      assert.equal(scrollContainer.find('div:first').text().trim(), '-5 0', 'first item rendered correctly after prepend');
      assert.equal(scrollContainer.find('div:last').text().trim(), '9 14', 'last item rendered correctly after prepend');
      assert.equal(scrollContainer.scrollTop(), 100, 'scrollTop is correct after prepend');
    });
  }
);

testScenarios(
  'Collection appends correctly if append would cause more VCs to be shown',
  standardTemplate,
  scenariosFor(getNumbers(0, 5)),

  function(assert) {
    assert.expect(6);

    const scrollContainer = this.$('.scrollable');

    return wait().then(() => {
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before append');
      assert.equal(scrollContainer.find('div:last').text().trim(), '4 4', 'last item rendered correctly before append');
      assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct before append');

      append(this, getNumbers(5, 5));

      return wait();
    }).then(() => {
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly after append');
      assert.equal(scrollContainer.find('div:last').text().trim(), '9 9', 'last item rendered correctly after append');
      assert.equal(scrollContainer.scrollTop(), 0, 'scrollTop is correct after append');
    });
  }
);

testScenarios(
  'Collection can shrink number of items if would cause fewer VCs to be shown',
  standardTemplate,
  scenariosFor(getNumbers(0, 10)),

  function(assert) {
    assert.expect(6);

    const scrollContainer = this.$('.scrollable');

    return wait().then(() => {
      assert.equal(scrollContainer.find('div').length, 10, 'correct number of VCs rendered before reset');
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before reset');
      assert.equal(scrollContainer.find('div:last').text().trim(), '9 9', 'last item rendered correctly before reset');

      this.set('items', getNumbers(0, 5));

      return wait();
    }).then(() => {
      assert.equal(scrollContainer.find('div').length, 5, 'correct number of VCs rendered after reset');
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly after reset');
      assert.equal(scrollContainer.find('div:last').text().trim(), '4 4', 'last item rendered correctly after reset');
    });
  }
);

testScenarios(
  'Collection can shrink number of items if would cause fewer VCs to be shown and scroll would change',
  standardTemplate,
  scenariosFor(getNumbers(0, 20)),

  function(assert) {
    assert.expect(6);

    const scrollContainer = this.$('.scrollable');

    return wait().then(() => {
      scrollContainer.scrollTop(200);

      return wait();
    }).then(() => {
      assert.equal(scrollContainer.find('div').length, 10, 'correct number of VCs rendered before reset');
      assert.equal(scrollContainer.find('div:first').text().trim(), '10 10', 'first item rendered correctly before reset');
      assert.equal(scrollContainer.find('div:last').text().trim(), '19 19', 'last item rendered correctly before reset');

      this.set('items', getNumbers(0, 5));

      return wait();
    }).then(() => {
      assert.equal(scrollContainer.find('div').length, 5, 'correct number of VCs rendered after reset');
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before reset');
      assert.equal(scrollContainer.find('div:last').text().trim(), '4 4', 'last item rendered correctly before reset');
    });
  }
);

testScenarios(
  'Collection can shrink number of items to empty collection',
  standardTemplate,
  scenariosFor(getNumbers(0, 10)),

  function(assert) {
    assert.expect(4);

    const scrollContainer = this.$('.scrollable');

    return wait().then(() => {
      assert.equal(scrollContainer.find('div').length, 10, 'correct number of VCs rendered before reset');
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before reset');
      assert.equal(scrollContainer.find('div:last').text().trim(), '9 9', 'last item rendered correctly before reset');

      emptyArray(this);

      return wait();
    }).then(() => {
      assert.equal(scrollContainer.find('div').length, 0, 'correct number of VCs rendered after reset');
    });
  }
);

testScenarios(
  'Collection can shrink number of items to empty collection (after scroll has changed)',
  standardTemplate,
  scenariosFor(getNumbers(0, 20)),

  function(assert) {
    assert.expect(4);

    const scrollContainer = this.$('.scrollable');

    return wait().then(() => {
      scrollContainer.scrollTop(200);

      return wait();
    }).then(() => {
      assert.equal(scrollContainer.find('div').length, 10, 'correct number of VCs rendered before reset');
      assert.equal(scrollContainer.find('div:first').text().trim(), '10 10', 'first item rendered correctly before reset');
      assert.equal(scrollContainer.find('div:last').text().trim(), '19 19', 'last item rendered correctly before reset');

      emptyArray(this);

      return wait();
    }).then(() => {
      assert.equal(scrollContainer.find('div').length, 0, 'correct number of VCs rendered after reset');
    });
  }
);

testScenarios(
  'Collection will rerender items after reset',
  standardTemplate,
  scenariosFor(getNumbers(0, 10)),

  function(assert) {
    assert.expect(4);

    const scrollContainer = this.$('.scrollable');

    return wait().then(() => {
      assert.equal(scrollContainer.find('div:first').text().trim(), '0 0', 'first item rendered correctly before append');
      assert.equal(scrollContainer.find('div:last').text().trim(), '9 9', 'last item rendered correctly before append');

      this.set('items', getNumbers(10, 10));

      return wait();
    }).then(() => {
      assert.equal(scrollContainer.find('div:first').text().trim(), '10 0', 'first item rendered correctly after reset');
      assert.equal(scrollContainer.find('div:last').text().trim(), '19 9', 'last item rendered correctly after reset');
    });
  }
);

test('Dynamic collection maintains state if the same list is passed in twice', function(assert) {
  assert.expect(4);
  const items = getNumbers(0, 100);
  this.set('items', items);

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      estimateHeight=20
      bufferSize=0

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
    // Occlude a single item
    scrollContainer.scrollTop(40);

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '1 1', 'first item rendered correctly after initial scroll set');
    assert.equal(paddingBefore(itemContainer), 40, 'itemContainer padding correct before same items set');

    this.set('items', items.slice());

    return wait();
  }).then(() => {
    assert.equal(scrollContainer.find('div:first').text().trim(), '1 1', 'first item rendered correctly after same items set');
    assert.equal(paddingBefore(itemContainer), 40, 'itemContainer padding correct after same items set');
  });
});
