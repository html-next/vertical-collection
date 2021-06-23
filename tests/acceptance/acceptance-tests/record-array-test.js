import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

import { find, findAll } from 'ember-native-dom-helpers';
import { visit as newVisit } from '@ember/test-helpers';

module('Acceptance | Record Array', function(hooks) {
  setupApplicationTest(hooks);

  test('RecordArrays render correctly', async function(assert) {
    await newVisit('/acceptance-tests/record-array');

    assert.equal(findAll('number-slide').length, 15, 'correct number of items rendered');
    assert.equal(find('number-slide:first-of-type').textContent.replace(/\s/g, ''), '0(0)', 'correct first item rendered');
    assert.equal(find('number-slide:last-of-type').textContent.replace(/\s/g, ''), '14(14)', 'correct last item rendered');
  });
});
