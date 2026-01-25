import { module, test } from 'qunit';
import { setupRenderingTest } from '../helpers';
import { find, findAll, render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import scrollTo from '../helpers/scroll-to';

import getNumbers from 'dummy/lib/get-numbers';

module(
  'vertical-collection',
  'Integration | Table Occlusion Tests',
  function (hooks) {
    setupRenderingTest(hooks);

    test('occluded-content should have line-height: 0 to prevent text from affecting height', async function (assert) {
      // This test verifies that the occluded-content element has line-height: 0
      // set in its CSS to prevent the debug text from affecting the element's height.
      //
      // The issue: When occluded-content is inside a table (display: table-row),
      // the debug text ("And X items before/after") creates a line box. If a
      // consuming application has a non-zero line-height set, this can cause
      // the actual rendered height (getBoundingClientRect().height) to be larger
      // than the inline style height. This causes VerticalCollection to "correct"
      // its estimate upwards, leading to visual jumps when scrolling.
      //
      // The fix: The addon's CSS should set `line-height: 0` on `.occluded-content`
      // to ensure the debug text never affects the element's layout height.

      this.set('items', getNumbers(0, 50));

      await render(hbs`
        <div class="scrollable" style="height: 200px; overflow-y: scroll;">
          <table style="width: 100%;">
            <tbody>
              <VerticalCollection
                @items={{this.items}}
                @containerSelector=".scrollable"
                @key="number"
                @estimateHeight={{40}}
                @staticHeight={{true}}
                @bufferSize={{0}}
                as |item|
              >
                <tr>
                  <td style="height: 40px;">{{item.number}}</td>
                </tr>
              </VerticalCollection>
            </tbody>
          </table>
        </div>
      `);

      // Scroll down to create occluded content before
      await scrollTo('.scrollable', 0, 200);

      const occludedBefore = find('.occluded-content:first-of-type');
      const occludedAfter = find('.occluded-content:last-of-type');

      // The occluded-content elements should exist
      assert.ok(occludedBefore, 'occluded-content before exists');
      assert.ok(occludedAfter, 'occluded-content after exists');

      // Check that line-height is 0 (or "0px" or "normal" which would be equivalent)
      const beforeComputedLineHeight =
        window.getComputedStyle(occludedBefore).lineHeight;
      const afterComputedLineHeight =
        window.getComputedStyle(occludedAfter).lineHeight;

      // The CSS should explicitly set line-height to 0 to prevent inherited
      // line-height from causing the debug text to affect the element's height
      assert.strictEqual(
        beforeComputedLineHeight,
        '0px',
        `occluded-content before should have line-height: 0px, got: ${beforeComputedLineHeight}`,
      );

      assert.strictEqual(
        afterComputedLineHeight,
        '0px',
        `occluded-content after should have line-height: 0px, got: ${afterComputedLineHeight}`,
      );
    });

    test('occluded-content height matches style height in tables', async function (assert) {
      // This test verifies that the actual rendered height of occluded-content
      // matches its inline style height when used inside tables.

      this.set('items', getNumbers(0, 30));

      await render(hbs`
        <div class="scrollable" style="height: 100px; overflow-y: scroll;">
          <table style="width: 100%;">
            <tbody>
              <VerticalCollection
                @items={{this.items}}
                @containerSelector=".scrollable"
                @key="number"
                @estimateHeight={{20}}
                @staticHeight={{true}}
                @bufferSize={{0}}
                as |item|
              >
                <tr>
                  <td style="height: 20px;">{{item.number}}</td>
                </tr>
              </VerticalCollection>
            </tbody>
          </table>
        </div>
      `);

      // Scroll to ensure we have both occluded content before and after
      await scrollTo('.scrollable', 0, 100);

      const occludedElements = findAll('.occluded-content');

      for (const el of occludedElements) {
        const styleHeight = parseFloat(el.style.height);
        const actualHeight = el.getBoundingClientRect().height;
        const hasText = el.textContent.trim().length > 0;

        // Skip elements with 0 height (they have no content to measure)
        if (styleHeight === 0) {
          continue;
        }

        assert.ok(
          Math.abs(actualHeight - styleHeight) < 1,
          `occluded-content (has text: ${hasText}): actual ${actualHeight}px should equal style ${styleHeight}px`,
        );
      }
    });
  },
);
