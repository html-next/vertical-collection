import { module, test } from 'qunit';
import { ScrollHandler } from '@html-next/vertical-collection/-private/index';

import { scheduler } from 'ember-raf-scheduler';

const dom = document;

function afterNextScrollUpdate(method) {
  scheduler.schedule('measure', method);
}

function createScrollable() {
  let div = dom.createElement('div');
  let innerDiv = dom.createElement('div');
  div.style.overflowY = 'scroll';
  div.style.height = '100px';
  div.style.position = 'relative';
  innerDiv.style.height = '200px';
  innerDiv.style.position = 'relative';

  div.appendChild(innerDiv);
  dom.body.appendChild(div);

  return div;
}

function destroyScrollable(scrollable) {
  scrollable.parentNode.removeChild(scrollable);
}

module('Unit | Radar Utils | Scroll Handler');

test('We can add, trigger, and remove a scroll handler', (assert) => {
  let scrollHandlers = new ScrollHandler();
  let done = assert.async(2);
  let scrollable = createScrollable();
  let handler = () => {
    assert.ok('handler was triggered');
    done();
  };

  assert.strictEqual(
    scrollHandlers.length,
    0,
    `We initially have no elements to watch.`
  );

  // test adding a single handler
  scrollHandlers.addScrollHandler(scrollable, handler);

  assert.strictEqual(scrollHandlers.length, 1, `We have one element to watch.`);

  let scrollableIndex = scrollHandlers.elements.indexOf(scrollable);
  assert.notStrictEqual(
    scrollableIndex,
    -1,
    `The scrollable was added to the watched elements list.`
  );
  let cache = scrollHandlers.handlers[scrollableIndex];
  assert.strictEqual(cache.handlers.length, 1);

  // test triggering that handler
  assert.strictEqual(
    scrollable.scrollTop,
    0,
    `The scrollable is initially unscrolled`
  );

  afterNextScrollUpdate(() => {
    scrollable.scrollTop = 10;
    assert.strictEqual(
      scrollable.scrollTop,
      10,
      `We updated the scrollable's scroll position`
    );

    afterNextScrollUpdate(() => {
      // test removing that handler
      scrollHandlers.removeScrollHandler(scrollable, handler);
      let newScrollableIndex = scrollHandlers.elements.indexOf(scrollable);

      assert.strictEqual(
        cache.handlers.length,
        0,
        `The handler was removed from the listener cache.`
      );
      assert.strictEqual(
        newScrollableIndex,
        -1,
        `Removing the last handler removed the element from the watched elements list.`
      );
      assert.strictEqual(
        scrollHandlers.handlers.indexOf(cache),
        -1,
        `Removing the last handler removed the cache.`
      );

      assert.strictEqual(
        scrollHandlers.length,
        0,
        `We have no more elements to watch.`
      );
      assert.false(
        scrollHandlers.isPolling,
        `We are no longer polling the elements.`
      );

      destroyScrollable(scrollable);
      done();
    });
  });
});

test('Adding/removing multiple handlers to an element works as expected', (assert) => {
  let scrollHandlers = new ScrollHandler();
  let done = assert.async(3);
  let scrollable = createScrollable();
  let handler1 = () => {
    assert.ok('handler1 was triggered');
    done();
  };
  let handler2 = () => {
    assert.ok('handler2 was triggered');
    done();
  };

  // test adding the handlers
  assert.strictEqual(
    scrollHandlers.length,
    0,
    `We initially have no elements to watch.`
  );
  scrollHandlers.addScrollHandler(scrollable, handler1);
  scrollHandlers.addScrollHandler(scrollable, handler2);

  assert.strictEqual(scrollHandlers.length, 1, `We have one element to watch.`);

  let scrollableIndex = scrollHandlers.elements.indexOf(scrollable);
  assert.notStrictEqual(
    scrollableIndex,
    -1,
    `The scrollable was added to the watched elements list.`
  );
  let cache = scrollHandlers.handlers[scrollableIndex];
  assert.strictEqual(cache.handlers.length, 2);

  // test triggering that handler
  assert.strictEqual(
    scrollable.scrollTop,
    0,
    `The scrollable is initially unscrolled`
  );

  afterNextScrollUpdate(() => {
    scrollable.scrollTop = 10;
    assert.strictEqual(
      scrollable.scrollTop,
      10,
      `We updated the scrollable's scroll position`
    );

    afterNextScrollUpdate(() => {
      // test removing that handler
      scrollHandlers.removeScrollHandler(scrollable, handler1);
      let newScrollableIndex = scrollHandlers.elements.indexOf(scrollable);

      assert.strictEqual(
        cache.handlers.length,
        1,
        `The handler was removed from the listener cache.`
      );
      assert.notStrictEqual(
        newScrollableIndex,
        -1,
        `When an element has other handlers, it is not removed from the watched elements list.`
      );
      assert.notStrictEqual(
        scrollHandlers.handlers.indexOf(cache),
        -1,
        `When an element has other handlers, ths cache is not removed.`
      );
      assert.strictEqual(
        scrollHandlers.length,
        1,
        `We have one element to watch.`
      );

      scrollHandlers.removeScrollHandler(scrollable, handler2);
      newScrollableIndex = scrollHandlers.elements.indexOf(scrollable);
      assert.strictEqual(
        cache.handlers.length,
        0,
        `The handler was removed from the listener cache.`
      );
      assert.strictEqual(
        newScrollableIndex,
        -1,
        `Removing the last handler removed the element from the watched elements list.`
      );
      assert.strictEqual(
        scrollHandlers.handlers.indexOf(cache),
        -1,
        `Removing the last handler removed the cache.`
      );

      assert.strictEqual(
        scrollHandlers.length,
        0,
        `We have no more elements to watch.`
      );
      assert.false(
        scrollHandlers.isPolling,
        `We are no longer polling the elements.`
      );

      destroyScrollable(scrollable);
      done();
    });
  });
});

test('Multiple elements with handlers works as expected', (assert) => {
  let scrollHandlers = new ScrollHandler();
  let done = assert.async(3);
  let scrollable1 = createScrollable();
  let scrollable2 = createScrollable();
  let handler1 = () => {
    assert.ok('handler1 was triggered');
    done();
  };
  let handler2 = () => {
    assert.ok('handler2 was triggered');
    done();
  };

  // test adding the handlers
  assert.strictEqual(
    scrollHandlers.length,
    0,
    `We initially have no elements to watch.`
  );
  scrollHandlers.addScrollHandler(scrollable1, handler1);
  scrollHandlers.addScrollHandler(scrollable2, handler2);

  assert.strictEqual(
    scrollHandlers.length,
    2,
    `We have two elements to watch.`
  );

  let scrollable1Index = scrollHandlers.elements.indexOf(scrollable1);
  let scrollable2Index = scrollHandlers.elements.indexOf(scrollable1);

  assert.notStrictEqual(
    scrollable1Index,
    -1,
    `The scrollable was added to the watched elements list.`
  );
  assert.notStrictEqual(
    scrollable2Index,
    -1,
    `The scrollable was added to the watched elements list.`
  );
  let cache1 = scrollHandlers.handlers[scrollable1Index];
  let cache2 = scrollHandlers.handlers[scrollable2Index];

  assert.strictEqual(cache1.handlers.length, 1, `We added the handler`);
  assert.strictEqual(cache2.handlers.length, 1, `We added the handler`);

  // test triggering that handler
  assert.strictEqual(
    scrollable1.scrollTop,
    0,
    `The scrollable is initially unscrolled`
  );
  assert.strictEqual(
    scrollable2.scrollTop,
    0,
    `The scrollable is initially unscrolled`
  );

  afterNextScrollUpdate(() => {
    scrollable1.scrollTop = 10;
    scrollable2.scrollTop = 20;
    assert.strictEqual(
      scrollable1.scrollTop,
      10,
      `We updated the scrollable's scroll position`
    );
    assert.strictEqual(
      scrollable2.scrollTop,
      20,
      `We updated the scrollable's scroll position`
    );

    afterNextScrollUpdate(() => {
      // test removing that handler
      scrollHandlers.removeScrollHandler(scrollable1, handler1);
      let newScrollableIndex = scrollHandlers.elements.indexOf(scrollable1);

      assert.strictEqual(
        cache1.handlers.length,
        0,
        `The handler was removed from the listener cache.`
      );
      assert.strictEqual(
        newScrollableIndex,
        -1,
        `The element was removed from the watched elements list.`
      );
      assert.strictEqual(
        scrollHandlers.handlers.indexOf(cache1),
        -1,
        `The cache was also removed.`
      );
      assert.strictEqual(scrollHandlers.length, 1, `We were removed entirely`);

      scrollHandlers.removeScrollHandler(scrollable2, handler2);
      newScrollableIndex = scrollHandlers.elements.indexOf(scrollable2);
      assert.strictEqual(
        cache2.handlers.length,
        0,
        `The handler was removed from the listener cache.`
      );
      assert.strictEqual(
        newScrollableIndex,
        -1,
        `Removing the last handler removed the element from the watched elements list.`
      );
      assert.strictEqual(
        scrollHandlers.handlers.indexOf(cache2),
        -1,
        `Removing the last handler removed the cache.`
      );

      assert.strictEqual(
        scrollHandlers.length,
        0,
        `We have no more elements to watch.`
      );
      assert.false(
        scrollHandlers.isPolling,
        `We are no longer polling the elements.`
      );

      destroyScrollable(scrollable1);
      destroyScrollable(scrollable2);
      done();
    });
  });
});
