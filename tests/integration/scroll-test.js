import { moduleForComponent } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

import { find, scrollTo } from 'ember-native-dom-helpers';

import getNumbers from 'dummy/lib/get-numbers';
import {
  testScenarios,
  dynamicSimpleScenarioFor,
  scenariosFor,
  standardScenariosFor,
  standardTemplate
} from 'dummy/tests/helpers/test-scenarios';

import { prepend, append } from 'dummy/tests/helpers/array';

moduleForComponent('vertical-collection', 'Integration | Scroll Tests', {
  integration: true
});

testScenarios(
  'Setting renderFromLast starts at the bottom of the collection',
  standardScenariosFor(getNumbers(0, 50), { renderFromLast: true }),
  standardTemplate,

  function(assert) {
    assert.expect(1);

    assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '49 49', 'the last item in the list should be rendered');
  }
);

testScenarios(
  'Setting idForFirstItem starts it with the first item at the top',
  standardScenariosFor(getNumbers(0, 50), { idForFirstItem: '25', key: '@index' }),
  standardTemplate,

  function(assert) {
    assert.expect(1);

    assert.equal(find('.scrollable').scrollTop, 500, 'the scroll container offset is correct');
  }
);

testScenarios(
  'Setting renderFromLast and idForFirstItem starts it with the first item at the bottom',
  standardScenariosFor(getNumbers(0, 50), { renderFromLast: true, idForFirstItem: '25', key: '@index' }),
  standardTemplate,

  function(assert) {
    assert.expect(1);

    assert.equal(find('.scrollable').scrollTop, 320, 'the scroll container offset is correct');
  }
);

testScenarios(
  'Sends the firstVisibleChanged action',
  scenariosFor(getNumbers(0, 50), { firstVisibleChanged: 'firstVisibleChanged' }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    const called = assert.async(2);
    let count = 0;

    this.on('firstVisibleChanged', (item, index) => {
      if (count === 0) {
        assert.equal(index, 0, 'the first visible item is correct');
      } else {
        assert.equal(index, 10, 'after scroll the first visible item is correct');
      }
      count++;
      called();
    });

    await wait();
    await scrollTo('.scrollable', 0, 200);
  }
);

testScenarios(
  'Sends the lastVisibleChanged action',
  scenariosFor(getNumbers(0, 50), { lastVisibleChanged: 'lastVisibleChanged' }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    const called = assert.async(2);
    let count = 0;

    this.on('lastVisibleChanged', (item, index) => {
      if (count === 0) {
        assert.equal(index, 9, 'the first last visible changed is correct');
      } else {
        assert.equal(index, 19, 'after scroll the last visible change is correct');
      }
      count++;
      called();
    });

    await wait();
    await scrollTo('.scrollable', 0, 200);
  }
);

testScenarios(
  'Sends the firstReached action',
  scenariosFor(getNumbers(0, 50), { firstReached: 'firstReached' }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    const called = assert.async(1);

    this.on('firstReached', (item, index) => {
      assert.equal(index, 0, 'the firstReached item is correct');
      called();
    });

    await wait();
  }
);

testScenarios(
  'Sends the lastReached action',
  scenariosFor(getNumbers(0, 50), { lastReached: 'lastReached' }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    const called = assert.async(1);

    this.on('lastReached', (item, index) => {
      assert.equal(index, 49, 'the lastReached item is correct');
      called();
    });

    await wait();
    await scrollTo('.scrollable', 0, 800);
  }
);

testScenarios(
  'Sends the firstReached action after prepend',
  standardScenariosFor(getNumbers(0, 20), { firstReached: 'firstReached', bufferSize: 5 }),
  standardTemplate,

  false, // Run test function before render
  function(assert) {
    assert.expect(0);
    const called = assert.async(2);

    this.on('firstReached', ({ number }) => {
      prepend(this, getNumbers(number - 3, 5));
      called();
    });
  }
);

testScenarios(
  'Sends the lastReached action after append',
  standardScenariosFor(getNumbers(0, 10), { lastReached: 'lastReached', bufferSize: 5 }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    assert.expect(0);
    const called = assert.async(2);

    this.on('lastReached', ({ number }) => {
      append(this, getNumbers(number + 1, 6));
      called();
    });

    await wait();
  }
);

testScenarios(
  'Does not send the firstReached action twice for the same item',
  scenariosFor(getNumbers(0, 50), { firstReached: 'firstReached' }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    assert.expect(0);
    const called = assert.async(1);

    this.on('firstReached', () => {
      called();
    });

    await wait();
    await scrollTo('.scrollable', 0, 800);
    await scrollTo('.scrollable', 0, 0);
  }
);

testScenarios(
  'Does not send the lastReached action twice for the same item',
  scenariosFor(getNumbers(0, 50), { lastReached: 'lastReached' }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    assert.expect(0);
    const called = assert.async(1);

    this.on('lastReached', () => {
      called();
    });

    await wait();
    await scrollTo('.scrollable', 0, 800);
    await scrollTo('.scrollable', 0, 0);
    await scrollTo('.scrollable', 0, 800);
  }
);

testScenarios(
  'Sends the firstVisibleChanged action with renderAll set to true',
  scenariosFor(getNumbers(0, 50), { firstVisibleChanged: 'firstVisibleChanged', renderAll: true }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    const called = assert.async(2);
    let count = 0;

    this.on('firstVisibleChanged', (item, index) => {
      if (count === 0) {
        assert.equal(index, 0, 'the first visible item is correct');
      } else {
        assert.equal(index, 10, 'after scroll the first visible item is correct');
      }
      count++;
      called();
    });

    await wait();
    await scrollTo('.scrollable', 0, 200);
  }
);

testScenarios(
  'Sends the lastVisibleChanged action with renderAll set to true',
  scenariosFor(getNumbers(0, 50), { lastVisibleChanged: 'lastVisibleChanged', renderAll: true }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    const called = assert.async(2);
    let count = 0;

    this.on('lastVisibleChanged', (item, index) => {
      if (count === 0) {
        assert.equal(index, 9, 'the first last visible changed is correct');
      } else {
        assert.equal(index, 19, 'after scroll the last visible change is correct');
      }
      count++;
      called();
    });

    await wait();
    await scrollTo('.scrollable', 0, 200);
  }
);

testScenarios(
  'Sends the firstReached action with renderAll set to true',
  scenariosFor(getNumbers(0, 50), { firstReached: 'firstReached', renderAll: true }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    const called = assert.async(1);

    this.on('firstReached', (item, index) => {
      assert.equal(index, 0, 'the firstReached item is correct');
      called();
    });

    await wait();
  }
);

testScenarios(
  'Sends the lastReached action with renderAll set to true',
  scenariosFor(getNumbers(0, 50), { lastReached: 'lastReached', renderAll: true }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    const called = assert.async(1);

    this.on('lastReached', (item, index) => {
      assert.equal(index, 49, 'the lastReached item is correct');
      called();
    });

    await wait();
    await scrollTo('.scrollable', 0, 800);
  }
);

testScenarios(
  'Sends the firstReached action after prepend with renderAll set to true',
  standardScenariosFor(getNumbers(0, 20), { firstReached: 'firstReached', bufferSize: 5, renderAll: true }),
  standardTemplate,

  false, // Run test function before render
  function(assert) {
    assert.expect(0);
    const called = assert.async(2);

    this.on('firstReached', ({ number }) => {
      prepend(this, getNumbers(number - 3, 5));
      called();
    });
  }
);

testScenarios(
  'Sends the lastReached action after append with renderAll set to true',
  standardScenariosFor(getNumbers(0, 10), { lastReached: 'lastReached', bufferSize: 5, renderAll: true }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    assert.expect(0);
    const called = assert.async(2);

    this.on('lastReached', ({ number }) => {
      append(this, getNumbers(number + 1, 6));
      called();
    });

    await wait();
  }
);

testScenarios(
  'Does not send the firstReached action twice for the same item with renderAll set to true',
  scenariosFor(getNumbers(0, 50), { firstReached: 'firstReached', renderAll: true }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    assert.expect(0);
    const called = assert.async(1);

    this.on('firstReached', () => {
      called();
    });

    await wait();
    await scrollTo('.scrollable', 0, 800);
    await scrollTo('.scrollable', 0, 0);
  }
);

testScenarios(
  'Does not send the lastReached action twice for the same item with renderAll set to true',
  scenariosFor(getNumbers(0, 50), { lastReached: 'lastReached', renderAll: true }),
  standardTemplate,

  false, // Run test function before render
  async function(assert) {
    assert.expect(0);
    const called = assert.async(1);

    this.on('lastReached', () => {
      called();
    });

    await wait();
    await scrollTo('.scrollable', 0, 800);
    await scrollTo('.scrollable', 0, 0);
    await scrollTo('.scrollable', 0, 800);
  }
);

testScenarios(
  'Collection scrolls and measures correctly when parent is a table',
  {
    staticScenario: { items: getNumbers(0, 100), staticHeight: true },
    dynamicScenario: { items: getNumbers(0, 100), staticHeight: false }
  },

  hbs`
  <div style="height: 370px; width: 200px;" class="scrollable">
    <table class="table table-striped latest-data">
      {{#vertical-collection items
        containerSelector=".scrollable"
        tagName="tbody"
        estimateHeight=37
        staticHeight=staticHeight
        bufferSize=0

        as |item i|}}
        <tr>
          <td>{{item.number}}</td>
          <td>{{i}}</td>
        </tr>
      {{/vertical-collection}}
    </table>
  </div>
  `,

  async function(assert) {
    assert.expect(2);

    // Occlude one item
    await scrollTo('.scrollable', 0, 38);

    const tableTop = find('table').getBoundingClientRect().top;

    const row = find('tr:first-of-type');
    const rowTop = row.getBoundingClientRect().top;

    assert.equal(row.textContent.replace(/\s/g, ''), '11', 'correct first row is rendered');
    assert.equal(rowTop - tableTop, 37, 'first row offset is correct');
  }
);

testScenarios(
  'Collection measures correctly when it\'s scroll parent has scrolled',
  dynamicSimpleScenarioFor(getNumbers(0, 100)),
  hbs`
    <div style="height: 200px; width: 200px;" class="scroll-parent scrollable">
      <div style="height: 400px; width: 100px;" class="scroll-child scrollable">
        {{#vertical-collection items
          estimateHeight=20
          bufferSize=0

          as |item i|}}
          <div class="vertical-item" style="height:40px;">
            {{item.number}} {{i}}
          </div>
        {{/vertical-collection}}
      </div>
    </div>
  `,

  async function(assert) {
    assert.expect(1);

    await scrollTo('.scroll-parent', 0, 200);
    await scrollTo('.scroll-child', 0, 400);

    assert.equal(find('.vertical-item:first-of-type').textContent.trim(), '5 5', 'correct first item rendered');
  }
);

testScenarios(
  'Can scroll to last item when actual item sizes are significantly larger than default item size.',
  dynamicSimpleScenarioFor(getNumbers(0, 50), { itemHeight: 100 }),
  standardTemplate,

  async function(assert) {
    assert.expect(1);

    await scrollTo('.scrollable', 0, 10000);

    assert.equal(find('.vertical-item:last-of-type').textContent.trim(), '49 49', 'the last item in the list should be rendered');
  }
);
