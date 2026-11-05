import { module, test } from 'qunit';
import { setupRenderingTest } from '../helpers';
import { hbs } from 'ember-cli-htmlbars';
import { find, findAll, render, settled } from '@ember/test-helpers';
import { modifier } from 'ember-modifier';
import scrollTo from '../helpers/scroll-to';
import { append, prepend, replaceArray } from '../helpers/array';

import getNumbers from 'test-app/lib/get-numbers';

import {
  testScenarios,
  simpleScenariosFor,
  standardScenariosFor,
} from 'test-app/tests/helpers/test-scenarios';

// Only the DOM order counts: a wrong row is a row that is out of order, missing, or not in view.
function assertRowsInOrder(assert, label, firstInView) {
  const scroller = find('.scrollable');
  const rows = findAll('vertical-item');
  const numbers = rows.map((row) => Number(row.dataset.number));
  const expected = numbers.map((_, i) => numbers[0] + i);

  assert.deepEqual(
    numbers,
    expected,
    `${label}: rows are in order, with no gap`
  );

  const top = scroller.getBoundingClientRect().top;
  const inView = rows.find(
    (row) => row.getBoundingClientRect().bottom > top + 1
  );
  assert.equal(
    Number(inView?.dataset.number),
    firstInView,
    `${label}: first row in view`
  );
}

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

module('vertical-collection', 'Integration | Recycle Tests', function (hooks) {
  setupRenderingTest(hooks);

  // https://github.com/html-next/vertical-collection/issues/354
  // Rows taller than the estimate make the collection render fewer rows after it measures them.
  async function updatesOutsideTheDocument(context, template) {
    const outside = [];
    const rows = getNumbers(0, 26);
    context.set('rows', rows);
    context.set(
      'track',
      // Reads every argument, because ember-modifier only reruns for the arguments that it reads.
      modifier((element, [item, rows]) => {
        if (!element.isConnected && rows) outside.push(item.number);
      })
    );
    await render(template);
    await scrollTo('.scrollable', 0, find('.scrollable').scrollHeight);
    // The first change leaves rows in the pool, and the second updates them.
    rows[25] = { number: 125 };
    context.set('rows', [...rows]);
    await settled();
    rows[24] = { number: 124 };
    context.set('rows', [...rows]);
    await settled();
    return outside;
  }

  test('Rows outside the document do not update | shouldRecycle=true', async function (assert) {
    const outside = await updatesOutsideTheDocument(
      this,
      hbs`
        <div style="height: 100px" class="scrollable">
          <VerticalCollection @items={{this.rows}} @containerSelector=".scrollable" @estimateHeight={{16}} @shouldRecycle={{true}} as |item|>
            <vertical-item style="height: 40px" {{this.track item this.rows}}></vertical-item>
          </VerticalCollection>
        </div>
      `
    );
    assert.deepEqual(outside, []);
  });

  test('Rows outside the document do not update | shouldRecycle=false', async function (assert) {
    const outside = await updatesOutsideTheDocument(
      this,
      hbs`
        <div style="height: 100px" class="scrollable">
          <VerticalCollection @items={{this.rows}} @containerSelector=".scrollable" @estimateHeight={{16}} @shouldRecycle={{false}} as |item|>
            <vertical-item style="height: 40px" {{this.track item this.rows}}></vertical-item>
          </VerticalCollection>
        </div>
      `
    );
    assert.deepEqual(outside, []);
  });

  test('Rows outside the document do not update | default', async function (assert) {
    const outside = await updatesOutsideTheDocument(
      this,
      hbs`
        <div style="height: 100px" class="scrollable">
          <VerticalCollection @items={{this.rows}} @containerSelector=".scrollable" @estimateHeight={{16}} as |item|>
            <vertical-item style="height: 40px" {{this.track item this.rows}}></vertical-item>
          </VerticalCollection>
        </div>
      `
    );
    assert.deepEqual(outside, []);
  });

  for (const shouldRecycle of [false, true]) {
    const template = shouldRecycle
      ? hbs`
        <div style="height: 200px" class="scrollable">
          <div>
            <VerticalCollection @items={{this.items}}
              @containerSelector=".scrollable"
              @key="number"
              @estimateHeight={{20}}
              @staticHeight={{this.staticHeight}}
              @shouldRecycle={{true}}
              @bufferSize={{2}}
              as |item|>
              <vertical-item style="height: 20px" data-number={{item.number}}></vertical-item>
            </VerticalCollection>
          </div>
        </div>
      `
      : hbs`
        <div style="height: 200px" class="scrollable">
          <div>
            <VerticalCollection @items={{this.items}}
              @containerSelector=".scrollable"
              @key="number"
              @estimateHeight={{20}}
              @staticHeight={{this.staticHeight}}
              @shouldRecycle={{false}}
              @bufferSize={{2}}
              as |item|>
              <vertical-item style="height: 20px" data-number={{item.number}}></vertical-item>
            </VerticalCollection>
          </div>
        </div>
      `;

    testScenarios(
      `The rows stay in order when scrolling step by step | shouldRecycle=${shouldRecycle}`,
      standardScenariosFor(getNumbers(0, 500)),
      template,
      async function (assert) {
        for (const y of [100, 700, 720, 3000, 9000, 8980, 4000, 100, 0]) {
          await scrollTo('.scrollable', 0, y);
          assertRowsInOrder(assert, `scrollTop ${y}`, y / 20);
        }
      }
    );

    testScenarios(
      `The rows stay in order when scrolling fast | shouldRecycle=${shouldRecycle}`,
      standardScenariosFor(getNumbers(0, 500)),
      template,
      async function (assert) {
        const scroller = find('.scrollable');

        for (const step of [130, -130]) {
          for (let i = 0; i < 40; i++) {
            scroller.scrollTop += step;
            await nextFrame();
          }
          await settled();
          assertRowsInOrder(assert, `step ${step}`, scroller.scrollTop / 20);
        }
      }
    );

    testScenarios(
      `The rows stay in order when the items change during a scroll | shouldRecycle=${shouldRecycle}`,
      standardScenariosFor(getNumbers(100, 200)),
      template,
      async function (assert) {
        const scroller = find('.scrollable');

        await scrollTo('.scrollable', 0, 2000);
        scroller.scrollTop += 200;
        await append(this, getNumbers(300, 50));
        assertRowsInOrder(assert, 'append', 100 + scroller.scrollTop / 20);

        scroller.scrollTop += 200;
        await prepend(this, getNumbers(50, 50));
        assertRowsInOrder(assert, 'prepend', 50 + scroller.scrollTop / 20);

        scroller.scrollTop -= 200;
        await replaceArray(this, getNumbers(1000, 300));
        assertRowsInOrder(assert, 'replace', 1000 + scroller.scrollTop / 20);
      }
    );
  }

  testScenarios(
    'The collection does not recycle when shouldRecycle is set to false',
    simpleScenariosFor(getNumbers(0, 20)),

    hbs`
      <div style="height: 200px" class="scrollable with-max-height">
        <div>
          <VerticalCollection @items={{this.items}}
            @containerSelector=".scrollable"
            @estimateHeight={{20}}
            @staticHeight={{this.staticHeight}}
            @shouldRecycle={{false}}
            @bufferSize={{0}}

            as |item i|>
            <vertical-item style="height: 20px">
              {{unbound item.number}} {{unbound i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      </div>
    `,

    async function (assert) {
      assert.expect(2);

      assert.equal(findAll('vertical-item').length, 10);

      await scrollTo('.scrollable', 0, 20);

      assert.equal(
        find('vertical-item:last-of-type').textContent.trim(),
        '10 10',
        'component was not recycled'
      );
    }
  );

  testScenarios(
    'The collection does recycle when shouldRecycle is set to true',
    simpleScenariosFor(getNumbers(0, 20)),

    hbs`
      <div style="height: 200px" class="scrollable">
        <div>
          <VerticalCollection @items={{this.items}}
            @containerSelector=".scrollable"
            @estimateHeight={{20}}
            @staticHeight={{this.staticHeight}}
            @shouldRecycle={{true}}
            @bufferSize={{0}}

            as |item i|>
            <vertical-item style="height: 20px">
              {{unbound item.number}} {{unbound i}}
            </vertical-item>
          </VerticalCollection>
        </div>
      </div>
    `,

    async function (assert) {
      assert.expect(2);

      assert.equal(findAll('vertical-item').length, 10);

      await scrollTo('.scrollable', 0, 20);

      assert.equal(
        find('vertical-item:last-of-type').textContent.trim(),
        '0 0',
        'component was recycled'
      );
    }
  );
});
