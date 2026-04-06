import { module, test } from 'qunit';
import { SkipList } from '@html-next/vertical-collection/-private/index';

module('Unit | SkipList', function () {
  test('basic find works with a normal list', function (assert) {
    let list = new SkipList(5, 10);

    let result = list.find(0);
    assert.strictEqual(result.index, 0, 'finds the first item at target 0');
    assert.strictEqual(result.totalBefore, 0, 'nothing before the first item');

    result = list.find(25);
    assert.strictEqual(result.index, 2, 'finds the correct item for target 25');
    assert.strictEqual(result.totalBefore, 20, 'totalBefore is correct');
  });

  test('find returns safely when total is zero', function (assert) {
    let list = new SkipList(3, 0);

    let result = list.find(0);
    assert.strictEqual(result.index, 0, 'index is 0');
    assert.strictEqual(result.totalBefore, 0, 'totalBefore is 0');
    assert.strictEqual(result.totalAfter, 0, 'totalAfter is 0');
  });

  test('find returns safely when list is empty', function (assert) {
    let list = new SkipList(0, 10);

    let result = list.find(0);
    assert.strictEqual(result.index, 0, 'index is 0');
    assert.strictEqual(result.totalBefore, 0, 'totalBefore is 0');
    assert.strictEqual(result.totalAfter, 0, 'totalAfter is 0');
  });

  test('find clamps negative targetValue to zero', function (assert) {
    let list = new SkipList(5, 10);

    let result = list.find(-10);
    assert.strictEqual(result.index, 0, 'clamps to first item');
    assert.strictEqual(result.totalBefore, 0, 'totalBefore is 0');
  });

  test('find clamps targetValue exceeding total', function (assert) {
    let list = new SkipList(5, 10);
    // total is 50, so targeting 100 should clamp to the last item
    let result = list.find(100);
    assert.strictEqual(result.index, 4, 'clamps to last item');
  });

  test('set clamps negative values to zero', function (assert) {
    let list = new SkipList(3, 10);
    let originalTotal = list.total;

    list.set(1, -5);

    // The value should have been clamped to 0, so delta = 0 - 10 = -10
    assert.strictEqual(
      list.total,
      originalTotal - 10,
      'total is reduced by the original value (clamped to 0)',
    );

    // Verify the stored value is 0, not negative
    let result = list.find(0);
    assert.strictEqual(result.index, 0, 'list still functions after clamped set');
  });

  test('set works normally with valid values', function (assert) {
    let list = new SkipList(3, 10);

    list.set(1, 20);

    assert.strictEqual(list.total, 40, 'total updated correctly (10 + 20 + 10)');
  });
});
