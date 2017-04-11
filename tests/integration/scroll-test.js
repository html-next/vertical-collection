import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import getNumbers from 'dummy/lib/get-numbers';
import wait from 'dummy/tests/helpers/wait';
import testScenarios from 'dummy/tests/helpers/test-scenarios';

moduleForComponent('vertical-collection', 'Integration | Scroll Tests', {
  integration: true
});

const commonTemplate = hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=minHeight
      staticHeight=staticHeight

      renderFromLast=renderFromLast
      idForFirstItem=idForFirstItem

      firstVisibleChanged=firstVisibleChanged
      lastVisibleChanged=lastVisibleChanged
      firstReached=firstReached
      lastReached=lastReached

      key=key

      as |item i|}}
      <div style="height:20px;">
        {{item.number}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
`;

testScenarios('Setting renderFromLast starts at the bottom of the collection', {
  staticScenario: { staticHeight: true, minHeight: 20, renderFromLast: true },
  dynamicScenario: { staticHeight: false, minHeight: 10, renderFromLast: true }
}, function(assert) {
  assert.expect(1);

  this.set('items', getNumbers(0, 50));

  this.render(commonTemplate);

  const scrollable = this.$('.scrollable');

  return wait()
    .then(() => {
      assert.equal(scrollable.find('div:last').text().trim(), '49 49', 'the last item in the list should be rendered');
    });
});

testScenarios('Setting idForFirstItem starts it with the first item at the top', {
  staticScenario: { staticHeight: true, minHeight: 20, idForFirstItem: 25, key: '@index' },
  dynamicScenario: { staticHeight: false, minHeight: 20, idForFirstItem: 25, key: '@index' }
}, function(assert) {
  assert.expect(1);

  this.set('items', getNumbers(0, 50));

  this.render(commonTemplate);

  const scrollable = this.$('.scrollable');

  return wait()
    .then(() => {
      assert.equal(scrollable.scrollTop(), 500, 'the scroll container offset is correct');
    });
});

testScenarios('Setting renderFromLast and idForFirstItem starts it with the first item at the bottom', {
  staticScenario: { staticHeight: true, minHeight: 20, renderFromLast: true, idForFirstItem: 25, key: '@index' },
  dynamicScenario: { staticHeight: false, minHeight: 20, renderFromLast: true, idForFirstItem: 25, key: '@index' }
}, function(assert) {
  assert.expect(1);

  this.set('items', getNumbers(0, 50));

  this.render(commonTemplate);

  const scrollable = this.$('.scrollable');

  return wait()
    .then(() => {
      assert.equal(scrollable.scrollTop(), 320, 'the scroll container offset is correct');
    });
});

testScenarios('Sends the firstVisibleChanged action', {
  staticScenario: { staticHeight: true, minHeight: 20, firstVisibleChanged: 'firstVisibleChanged' },
  dynamicScenario: { staticHeight: false, minHeight: 20, firstVisibleChanged: 'firstVisibleChanged' }
}, function(assert) {
  const called = assert.async(2);
  let count = 0;

  this.set('items', getNumbers(0, 50));
  this.on('firstVisibleChanged', (item, index) => {
    if (count === 0) {
      assert.equal(index, 0, 'the first last visible changed should be item 0');
    } else {
      assert.equal(index, 10, 'after scroll the last visible change should be item 10');
    }
    count++;
    called();
  });

  this.render(commonTemplate);

  wait().then(() => this.$('.scrollable').scrollTop(200));
});

testScenarios('Sends the lastVisibleChanged action', {
  staticScenario: { staticHeight: true, minHeight: 20, lastVisibleChanged: 'lastVisibleChanged' },
  dynamicScenario: { staticHeight: false, minHeight: 20, lastVisibleChanged: 'lastVisibleChanged' }
}, function(assert) {
  const called = assert.async(2);
  let count = 0;

  this.set('items', getNumbers(0, 50));
  this.on('lastVisibleChanged', (item, index) => {
    if (count === 0) {
      assert.equal(index, 10, 'the first last visible changed should be item 10');
    } else {
      assert.equal(index, 20, 'after scroll the last visible change should be item 20');
    }
    count++;
    called();
  });

  this.render(commonTemplate);

  wait().then(() => this.$('.scrollable').scrollTop(200));
});

testScenarios('Sends the firstReached action', {
  staticScenario: { staticHeight: true, minHeight: 20, firstReached: 'firstReached' },
  dynamicScenario: { staticHeight: false, minHeight: 20, firstReached: 'firstReached' }
}, function(assert) {
  const called = assert.async(1);

  this.set('items', getNumbers(0, 50));
  this.on('firstReached', (item, index) => {
    assert.equal(index, 0, 'the first last visible changed should be item 0');
    called();
  });

  this.render(commonTemplate);
});

testScenarios('Sends the lastReached action', {
  staticScenario: { staticHeight: true, minHeight: 20, lastReached: 'lastReached' },
  dynamicScenario: { staticHeight: false, minHeight: 20, lastReached: 'lastReached' }
}, function(assert) {
  const called = assert.async(1);

  this.set('items', getNumbers(0, 50));
  this.on('lastReached', (item, index) => {
    assert.equal(index, 49, 'the first last visible changed should be item 10');
    called();
  });

  this.render(commonTemplate);

  wait().then(() => this.$('.scrollable').scrollTop(800));
});

testScenarios('Sends the firstReached after prepend', {
  staticScenario: { staticHeight: true, minHeight: 20, firstReached: 'firstReached' },
  dynamicScenario: { staticHeight: false, minHeight: 20, firstReached: 'firstReached' }
}, function(assert) {
  assert.expect(0);
  const called = assert.async(3);

  this.set('items', Ember.A(getNumbers(0, 10)));
  this.on('firstReached', ({ number }) => {
    this.get('items').unshiftObjects(getNumbers(number - 10, 10));
    called();
  });

  this.render(commonTemplate);
});

testScenarios('Sends the lastReached after append', {
  staticScenario: { staticHeight: true, minHeight: 20, lastReached: 'lastReached' },
  dynamicScenario: { staticHeight: false, minHeight: 20, lastReached: 'lastReached' }
}, function(assert) {
  assert.expect(0);
  const called = assert.async(3);

  this.set('items', Ember.A(getNumbers(0, 10)));
  this.on('lastReached', ({ number }) => {
    this.get('items').pushObjects(getNumbers(number, 10));
    called();
  });

  this.render(commonTemplate);
});

testScenarios('Collection scrolls and measures correctly when parent is a table', {
  staticScenario: { staticHeight: true },
  dynamicScenario: { staticHeight: false }
}, function(assert) {
  assert.expect(2);
  this.set('items', Ember.A(getNumbers(0, 100)));

  this.render(hbs`
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
  `);

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
});

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
