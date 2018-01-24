import { module, test } from 'qunit';
import { setupApplicationTest } from 'ember-qunit';

import { find, findAll } from 'ember-native-dom-helpers';
import { visit as newVisit } from '@ember/test-helpers';
import hasEmberVersion from 'ember-test-helpers/has-ember-version';

import moduleForAcceptance from '../../../tests/helpers/module-for-acceptance';

if (hasEmberVersion(2, 4)) {
  // Use the new testing API if greater than 3, old moduleForAcceptance doesn't work

  module('Acceptance | Record Array', function(hooks) {
    setupApplicationTest(hooks);

    test('RecordArrays render correctly', async function(assert) {
      await newVisit('/acceptance-tests/record-array');

      assert.equal(findAll('number-slide').length, 15, 'correct number of items rendered');
      assert.equal(find('number-slide:first-of-type').textContent.replace(/\s/g, ''), '0(0)', 'correct first item rendered');
      assert.equal(find('number-slide:last-of-type').textContent.replace(/\s/g, ''), '14(14)', 'correct last item rendered');
    });
  });
} else if (hasEmberVersion(1, 13)) {
  // Don't test Ember Data pre-1.13, there were no stable releases
  moduleForAcceptance('Acceptance | Record Array');

  test('RecordArrays render correctly', async function(assert) {
    await visit('/acceptance-tests/record-array');

    assert.equal(findAll('number-slide').length, 15, 'correct number of items rendered');
    assert.equal(find('number-slide:first-of-type').textContent.replace(/\s/g, ''), '0(0)', 'correct first item rendered');
    assert.equal(find('number-slide:last-of-type').textContent.replace(/\s/g, ''), '14(14)', 'correct last item rendered');
  });
}
