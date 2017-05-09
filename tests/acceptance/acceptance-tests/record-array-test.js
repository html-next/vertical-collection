import Ember from 'ember';
import { test } from 'qunit';
import moduleForAcceptance from '../../../tests/helpers/module-for-acceptance';
import wait from 'dummy/tests/helpers/wait';

moduleForAcceptance('Acceptance | Record Array');

const { VERSION } = Ember;

// Don't test Ember Data pre-1.13, there were no stable releases
if (VERSION.match(/1\.11\.\d+/) === null) {
  test('RecordArrays render correctly', function(assert) {
    visit('/acceptance-tests/record-array');

    andThen(function() {
      return wait().then(() => {
        assert.equal(find('number-slide').length, 21, 'correct number of items rendered');
        assert.equal(find('number-slide:first').text().replace(/\s/g, ''), '0(0)', 'correct first item rendered');
        assert.equal(find('number-slide:last').text().replace(/\s/g, ''), '20(20)', 'correct last item rendered');
      });
    });
  });
}
