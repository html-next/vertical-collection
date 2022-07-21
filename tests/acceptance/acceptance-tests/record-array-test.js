import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

import { click, find, findAll, visit as newVisit } from '@ember/test-helpers';

module('Acceptance | Record Array', function(hooks) {
  setupApplicationTest(hooks);

  test('RecordArrays render correctly', async function(assert) {
    await newVisit('/acceptance-tests/record-array');

    assert.equal(findAll('number-slide').length, 15, 'correct number of items rendered');
    assert.equal(find('number-slide:first-of-type').textContent.replace(/\s/g, ''), '0(0)', 'correct first item rendered');
    assert.equal(find('number-slide:last-of-type').textContent.replace(/\s/g, ''), '14(14)', 'correct last item rendered');
  });

  test('RecordArrays updates correctly after deleting items', async function(assert) {
    await newVisit('/acceptance-tests/record-array');

    assert.equal(findAll('number-slide').length, 15, 'correct number of items rendered');
    await click('#update-items-button');
    assert.equal(findAll('number-slide').length, 5, 'correct number of items rendered');
    assert.deepEqual(findAll('number-slide').map(s => s.textContent.trim()[0]), ['0', '1', '2', '3', '4'], 'correct items order');
    await click('#show-prefixed-button');
    assert.equal(findAll('number-slide').length, 5, 'correct number of items rendered and nothing crashes');
    assert.deepEqual(findAll('number-slide').map(s => s.textContent.trim()[0]), ['0', '1', '2', '3', '4'], 'correct items order');
  });
});
