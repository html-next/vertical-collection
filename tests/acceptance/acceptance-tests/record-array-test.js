import { test } from 'qunit';
import moduleForAcceptance from '../../../tests/helpers/module-for-acceptance';
import wait from 'dummy/tests/helpers/wait';

moduleForAcceptance('Acceptance | Record Array');

test('RecordArrays render correctly', function(assert) {
  visit('/acceptance-tests/record-array');
  server.createList('number-item', 100);

  andThen(function() {
    return wait().then(() => {
      assert.equal(find('number-slide').length, 21, 'correct number of items rendered');
      assert.equal(find('number-slide:first').text().replace(/\s/g, ''), '0(0)', 'correct first item rendered');
      assert.equal(find('number-slide:last').text().replace(/\s/g, ''), '20(20)', 'correct last item rendered');
    });
  });
});
