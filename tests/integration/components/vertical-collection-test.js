import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import getNumbers from 'dummy/lib/get-numbers';
import wait from '../../helpers/wait';

moduleForComponent('vertical-collection', 'Integration | Component | vertical collection', {
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

test('Scroll to last item when actual item sizes are significantly larger than default item size.', function(assert) {
  assert.expect(1);

  this.set('items', new Array(50).fill({ text: 'b' }));

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=10
      alwaysRemeasure=true

      as |item i|}}
      <div style="height: 100px;">{{item.text}} {{i}}</div>
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
      assert.equal(scrollable.find('div:last').html(), 'b 49', 'the last item in the list should be rendered');
    });
});

test('Sends the last visible changed action', function(assert) {
  const called = assert.async(2);
  let count = 0;

  this.set('items', Array(50).fill({ text: 'b' }));
  this.on('lastVisibleChanged', (item, index) => {
    if (count === 0) {
      assert.equal(index, 10, 'the first last visible changed should be item 10');
    } else {
      assert.equal(index, 20, 'after scroll the last visible change should be item 20');
    }
    count++;
    called();
  });

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20
      lastVisibleChanged="lastVisibleChanged"

      as |item|}}
      <div style="height:20px;">
        {{item.text}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
  `);

  wait().then(() => this.$('.scrollable').scrollTop(200));
});

test('Sends the first visible changed action', function(assert) {
  const called = assert.async(2);
  let count = 0;

  this.set('items', Array(50).fill({ text: 'b' }));
  this.on('firstVisibleChanged', (item, index) => {
    if (count === 0) {
      assert.equal(index, 0, 'the first last visible changed should be item 0');
    } else {
      assert.equal(index, 10, 'after scroll the last visible change should be item 10');
    }
    count++;
    called();
  });

  this.render(hbs`
  <div style="height: 200px; width: 100px;" class="scrollable">
    {{#vertical-collection ${'items'}
      minHeight=20
      firstVisibleChanged="firstVisibleChanged"

      as |item|}}
      <div style="height:20px;">
        {{item.text}} {{i}}
      </div>
    {{/vertical-collection}}
  </div>
  `);

  wait().then(() => this.$('.scrollable').scrollTop(200));
});

test('Collection prepends via set correctly', function(assert) {
  assert.expect(4);
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

  const scrollable = this.$('.scrollable');

  return wait().then(() => {
    assert.equal(scrollable.find('div:first').text().trim(), '0 0', 'items rendered correctly');
    assert.equal(scrollable.scrollTop(), 0, 'scrollTop is correct before prepend');

    const newNumbers = getNumbers(-20, 20).concat(this.get('items'));
    this.set('items', newNumbers);

    return wait();
  }).then(() => {
    assert.equal(scrollable.find('div:first').text().trim(), '-10 10', 'items prepended and rendered correctly');
    assert.equal(scrollable.scrollTop(), 400, 'scrollTop is correct after prepend');
  });
});

test('Collection prepends via unshiftObjects correctly', function(assert) {
  assert.expect(4);
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

  const scrollable = this.$('.scrollable');

  return wait().then(() => {
    assert.equal(scrollable.find('div:first').text().trim(), '0 0', 'items rendered correctly');
    assert.equal(scrollable.scrollTop(), 0, 'scrollTop is correct before prepend');

    this.get('items').unshiftObjects(getNumbers(-20, 20));

    return wait();
  }).then(() => {
    assert.equal(scrollable.find('div:first').text().trim(), '-10 10', 'items prepended and rendered correctly');
    assert.equal(scrollable.scrollTop(), 400, 'scrollTop is correct after prepend');
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
        alwaysRemeasure=true

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
if (VERSION >= '1.13.0') {
  test('Yields to inverse when no content is provided', function(assert) {
    assert.expect(1);
    this.set('items', []);

    this.render(hbs`
      {{#vertical-collection ${'items'}}}
        {{else}}
          Foobar
      {{/vertical-collection}}
    `);
    return wait().then(() => {
      const el = this.$('vertical-collection');
      assert.equal(el.html().trim(), 'Foobar');
    });
  });
}

// test('Collection prepends correctly if prepend would cause more VCs to be shown', function(assert) {
//   assert.async();
//   this.set('items', getNumbers(0, 20));

//   this.render(hbs`
//   <div style="height: 200px; width: 100px;" class="scrollable">
//     {{#vertical-collection
//       minHeight=10
//       items=items

//       as |item i|}}
//       <div style="height:20px;">
//         {{item.number}} {{i}}
//       </div>
//     {{/vertical-collection}}
//   </div>
//   `);

//   wait().then(() => {
//     const newNumbers = getNumbers(-20, 20).concat(this.get('items'));
//     this.set('items', newNumbers);

//     return wait();
//   }).then(() => {

//     const scrollable = this.$('.scrollable');

//     assert.equal(scrollable.find('div:first').html(), '-10', 'items prepended and rendered correctly');
//     assert.equal(scrollable.scrollTop(), 200, 'scrollTop is correct after prepend');
//   });
// });

/*
test("The Collection Reveals it's children when `renderAllInitially` is true.", function(assert) {
  assert.expect(1);

  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });
  this.set('items', Ember.A([Ember.Object.create({ text: 'b' })]));

  // Template block usage:
  this.render(hbs`
  <div style="height: 500px; width: 500px;">
    {{#vertical-collection items=items renderAllInitially=true as |item|}}
      {{item.text}}
    {{/vertical-collection}}
  </div>
  `);

  assert.equal(this.$().find('vertical-item').first().get(0).innerHTML, 'b');
});
*/
