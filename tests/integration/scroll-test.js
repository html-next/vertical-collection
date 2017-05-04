import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import getNumbers from 'dummy/lib/get-numbers';
import wait from 'dummy/tests/helpers/wait';
import {
  default as testScenarios,
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
  standardTemplate,
  standardScenariosFor(getNumbers(0, 50), { renderFromLast: true }),

  function(assert) {
    assert.expect(1);

    const scrollable = this.$('.scrollable');

    return wait()
      .then(() => {
        assert.equal(scrollable.find('div:last').text().trim(), '49 49', 'the last item in the list should be rendered');
      });
  }
);

testScenarios(
  'Setting idForFirstItem starts it with the first item at the top',
  standardTemplate,
  standardScenariosFor(getNumbers(0, 50), { idForFirstItem: 25, key: '@index' }),

  function(assert) {
    assert.expect(1);

    const scrollable = this.$('.scrollable');

    return wait()
      .then(() => {
        assert.equal(scrollable.scrollTop(), 500, 'the scroll container offset is correct');
      });
  }
);

testScenarios(
  'Setting renderFromLast and idForFirstItem starts it with the first item at the bottom',
  standardTemplate,
  standardScenariosFor(getNumbers(0, 50), { renderFromLast: true, idForFirstItem: 25, key: '@index' }),

  function(assert) {
    assert.expect(1);

    const scrollable = this.$('.scrollable');

    return wait()
      .then(() => {
        assert.equal(scrollable.scrollTop(), 320, 'the scroll container offset is correct');
      });
  }
);

testScenarios(
  'Sends the firstVisibleChanged action',
  standardTemplate,
  scenariosFor(getNumbers(0, 50), { firstVisibleChanged: 'firstVisibleChanged' }),

  function(assert) {
    const called = assert.async(2);
    let count = 0;

    this.on('firstVisibleChanged', (item, index) => {
      if (count === 0) {
        assert.equal(index, 0, 'the first visible item should be item 0');
      } else {
        assert.equal(index, 10, 'after scroll the first visible item should be item 10');
      }
      count++;
      called();
    });

    wait().then(() => this.$('.scrollable').scrollTop(200));
  }
);

testScenarios(
  'Sends the lastVisibleChanged action',
  standardTemplate,
  scenariosFor(getNumbers(0, 50), { lastVisibleChanged: 'lastVisibleChanged' }),

  function(assert) {
    const called = assert.async(2);
    let count = 0;

    this.on('lastVisibleChanged', (item, index) => {
      if (count === 0) {
        assert.equal(index, 10, 'the first last visible changed should be item 10');
      } else {
        assert.equal(index, 20, 'after scroll the last visible change should be item 20');
      }
      count++;
      called();
    });

    return wait().then(() => this.$('.scrollable').scrollTop(200));
  }
);

testScenarios(
  'Sends the firstReached action',
  standardTemplate,
  scenariosFor(getNumbers(0, 50), { firstReached: 'firstReached' }),

  function(assert) {
    const called = assert.async(1);

    this.on('firstReached', (item, index) => {
      if (index === 0) {
        assert.ok(true, 'the firstReached item should be item 0');
        called();
      }
    });
  }
);

testScenarios(
  'Sends the lastReached action',
  standardTemplate,
  scenariosFor(getNumbers(0, 50), { lastReached: 'lastReached' }),

  function(assert) {
    const called = assert.async(1);

    this.on('lastReached', (item, index) => {
      if (index === 49) {
        assert.ok(true, 'the lastReached item should be item 49');
        called();
      }
    });

    return wait().then(() => this.$('.scrollable').scrollTop(800));
  }
);

testScenarios(
  'Sends the firstReached action after prepend',
  standardTemplate,
  standardScenariosFor(getNumbers(0, 20), { firstReached: 'firstReached' }),

  function(assert) {
    assert.expect(0);
    const called = assert.async(2);

    this.on('firstReached', ({ number }) => {
      prepend(this, getNumbers(number - 10, 10));
      called();
    });
  }
);

testScenarios(
  'Sends the lastReached action after append',
  standardTemplate,
  standardScenariosFor(getNumbers(0, 20), { lastReached: 'lastReached' }),

  function(assert) {
    assert.expect(0);
    const called = assert.async(2);

    this.on('lastReached', ({ number }) => {
      append(this, getNumbers(number + 1, 10));
      called();
    });
  }
);

testScenarios(
  'Does not send the firstReached action twice for the same item',
  standardTemplate,
  scenariosFor(getNumbers(0, 50), { firstReached: 'firstReached' }),

  function(assert) {
    assert.expect(0);
    const called = assert.async(1);

    this.on('firstReached', () => {
      called();
    });

    return wait().then(() => {
      this.$('.scrollable').scrollTop(800);

      return wait();
    }).then(() => {
      this.$('.scrollable').scrollTop(0);

      return wait();
    });
  }
);

testScenarios(
  'Does not send the lastReached action twice for the same item',
  standardTemplate,
  scenariosFor(getNumbers(0, 50), { lastReached: 'lastReached' }),

  function(assert) {
    assert.expect(0);
    const called = assert.async(1);

    this.on('lastReached', () => {
      called();
    });

    return wait().then(() => {
      this.$('.scrollable').scrollTop(800);

      return wait();
    }).then(() => {
      this.$('.scrollable').scrollTop(0);

      return wait();
    }).then(() => {
      this.$('.scrollable').scrollTop(800);

      return wait();
    });
  }
);

testScenarios(
  'Collection scrolls and measures correctly when parent is a table',
  hbs`
  <div style="height: 370px; width: 200px;" class="scrollable">
    <table class="table table-striped latest-data">
      {{#vertical-collection ${'items'}
        containerSelector=".scrollable"
        tagName="tbody"
        minHeight=37
        staticHeight=staticHeight

        as |item i|}}
        <tr>
          <td>{{item.number}}</td>
          <td>{{i}}</td>
        </tr>
      {{/vertical-collection}}
    </table>
  </div>
  `,

  {
    staticScenario: { items: getNumbers(0, 100), staticHeight: true },
    dynamicScenario: { items: getNumbers(0, 100), staticHeight: false }
  },

  function(assert) {
    assert.expect(2);

    const scrollContainer = this.$('.scrollable');

    return wait().then(() => {
      scrollContainer.scrollTop(407);

      return wait();
    }).then(() => {
      const tableTop = this.$('table')[0].getBoundingClientRect().top;

      const row = this.$('tr:first');
      const rowTop = row[0].getBoundingClientRect().top;

      assert.equal(row.text().replace(/\s/g, ''), '11', 'correct first row is rendered');
      assert.equal(rowTop - tableTop, 37, 'first row offset is correct');
    });
  }
);

test('Collection measures correctly when it\'s scroll parent has scrolled', function(assert) {
  assert.expect(0);
  this.set('items', Ember.A(getNumbers(0, 100)));

  this.render(hbs`
  <div style="height: 200px; width: 200px;" class="scroll-parent scrollable">
    <div style="height: 400px; width: 100px;" class="scroll-child scrollable">
      {{#vertical-collection ${'items'}
        minHeight=20

        as |item i|}}
        <div style="height:20px;">
          {{item.number}} {{i}}
        </div>
      {{/vertical-collection}}
    </div>
  </div>
  `);

  const scrollChild = this.$('.scroll-child');
  const scrollParent = this.$('.scroll-parent');

  return wait().then(() => {
    scrollParent.scrollTop(200);
    scrollChild.scrollTop(600);
    // An assertion will be thrown if the scroll parent affects the measurement
  });
});

test('Can scroll to last item when actual item sizes are significantly larger than default item size.', function(assert) {
  assert.expect(1);

  this.set('items', getNumbers(0, 50));

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=10

      as |item i|}}
      <div style="height: 100px;">{{item.number}} {{i}}</div>
    {{/vertical-collection}}
  </div>
  `);

  const scrollable = this.$('.scrollable');
  const waitForScroll = new Ember.RSVP.Promise((resolve) => scrollable.scroll(resolve));

  return wait()
    .then(() => {
      // Jump to bottom.
      scrollable.scrollTop(scrollable.get(0).scrollHeight);
    })
    .then(waitForScroll)
    .then(wait)
    .then(() => {
      assert.equal(scrollable.find('div:last').html(), '49 49', 'the last item in the list should be rendered');
    });
});
