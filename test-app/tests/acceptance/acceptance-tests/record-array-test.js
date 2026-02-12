import { module, test } from 'qunit';
import { setupApplicationTest } from '../../helpers';
import { scheduler } from '@html-next/vertical-collection/-private/index';

import { click, find, findAll, visit as newVisit } from '@ember/test-helpers';
import scrollTo from '../../helpers/scroll-to';

module('Acceptance | Record Array', function (hooks) {
  setupApplicationTest(hooks);

  test('RecordArrays render correctly', async function (assert) {
    await newVisit('/acceptance-tests/record-array');

    assert.strictEqual(
      findAll('number-slide').length,
      15,
      'correct number of items rendered'
    );
    assert.strictEqual(
      find('number-slide:first-of-type').textContent.replace(/\s/g, ''),
      '0(0)',
      'correct first item rendered'
    );
    assert.strictEqual(
      find('number-slide:last-of-type').textContent.replace(/\s/g, ''),
      '14(14)',
      'correct last item rendered'
    );
  });

  test('RecordArrays update correctly after scrolling and updating items', async function (assert) {
    await newVisit('/acceptance-tests/record-array');

    assert.strictEqual(
      findAll('number-slide').length,
      15,
      'correct number of items rendered'
    );

    await scrollTo('.table-wrapper', 0, 600);

    await click('#update-items-button');

    assert.strictEqual(
      findAll('number-slide').length,
      5,
      'correct number of items rendered'
    );
  });

  test('RecordArrays update correctly after partial update', async function (assert) {
    await newVisit('/acceptance-tests/record-array');

    assert.strictEqual(
      findAll('number-slide').length,
      15,
      'correct number of items rendered'
    );

    await click('#partial-update-button');

    assert.strictEqual(
      findAll('number-slide').length,
      5,
      'correct number of items rendered'
    );
  });

  test('RecordArrays update correctly after being hidden and shown', async function (assert) {
    await newVisit('/acceptance-tests/record-array');

    assert.strictEqual(
      findAll('number-slide').length,
      15,
      'correct number of items rendered'
    );

    await click('#hide-vc-button');

    assert.strictEqual(
      findAll('number-slide').length,
      0,
      'correct number of items rendered'
    );

    await click('#show-vc-button');

    assert.strictEqual(
      findAll('number-slide').length,
      15,
      'correct number of items rendered'
    );
  });

  test('RecordArrays updates correctly after deleting items', async function (assert) {
    await newVisit('/acceptance-tests/record-array');

    assert.strictEqual(
      findAll('number-slide').length,
      15,
      'correct number of items rendered'
    );
    await click('#update-items-button');
    assert.strictEqual(
      findAll('number-slide').length,
      5,
      'correct number of items rendered'
    );
    assert.deepEqual(
      findAll('number-slide').map((s) => s.textContent.trim()[0]),
      ['0', '1', '2', '3', '4'],
      'correct items order'
    );
    await click('#show-prefixed-button');
    assert.strictEqual(
      findAll('number-slide').length,
      5,
      'correct number of items rendered and nothing crashes'
    );
    assert.deepEqual(
      findAll('number-slide').map((s) => s.textContent.trim()[0]),
      ['0', '1', '2', '3', '4'],
      'correct items order'
    );
  });

  test('RecordArrays fires firstVisibleChanged correctly after scrolling and fast-switching items', async function (assert) {
    function waitForMeasure() {
      return new Promise((resolve) => {
        scheduler.schedule('sync', () => {
          scheduler.schedule('measure', resolve);
        });
      });
    }

    await newVisit('/acceptance-tests/record-array');

    assert.strictEqual(
      find('#first-visible-id').value,
      '0',
      'the first item is the first visible id'
    );

    await click('#last-25-button');
    assert.strictEqual(
      find('#first-visible-id').value,
      '75',
      'the first visible id is updated correctly after updating items'
    );

    await scrollTo('.table-wrapper', 0, 1000);
    assert.strictEqual(
      find('#first-visible-id').value,
      '86',
      'the first visible id is updated correctly after scrolling'
    );

    click('#show-all');
    await waitForMeasure();
    await click('#last-25-button');
    await scrollTo('.table-wrapper', 0, 0);
    await scrollTo('.table-wrapper', 0, 1000); // restore sort position

    assert.strictEqual(
      find('#first-visible-id').value,
      '86',
      'the first visible id is the same after fast-switching items'
    );

    await scrollTo('.table-wrapper', 0, 0);
    assert.strictEqual(
      find('#first-visible-id').value,
      '75',
      'the first visible id is updated correctly after scrolling'
    );
  });
});
