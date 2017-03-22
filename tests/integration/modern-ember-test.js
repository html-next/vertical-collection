import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import Ember from 'ember';

import getNumbers from 'dummy/lib/get-numbers';
import wait from 'dummy/tests/helpers/wait';

if (Ember.VERSION >= '1.13.0') {
  moduleForComponent('vertical-collection', 'Integration | Modern Ember Features Tests', {
    integration: true
  });

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

  test('Collection measures correctly after firing heightDidChange', function(assert) {
    assert.expect(2);

    let firstItem;
    const items = getNumbers(0, 20);

    this.set('items', items.map((item) => {
      item.height = 100;
      return item;
    }));

    this.render(hbs`
      <div style="height: 200px; width: 200px;" class="scroll-parent scrollable">
        {{#vertical-collection ${'items'}
          alwaysRemeasure=true
          as |item i heightDidChange|}}
          {{number-slide
            item=item
            index=index
            incrementBy=250
            didResize=heightDidChange
          }}
        {{/vertical-collection}}
      </div>
    `);
    return wait()
      .then(() => {
        firstItem = this.$('number-slide').get(0);
        firstItem.click(); // item height will now be 350
        return wait();
      }).then(() => {
        assert.equal(firstItem.style.height, '350px');
        this.$('.scrollable')[0].scrollTop += 750;
        return wait();
      }).then(() => {
        assert.equal(this.$('vertical-collection')[0].style.paddingTop, '350px');
      });
  });
}
