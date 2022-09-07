import DebugMixin from './edge-visualization/debug-mixin';
import VerticalCollection from '../components/vertical-collection/component';
import HorizontalCollection from '../components/horizontal-collection/component';

VerticalCollection.reopen(DebugMixin);
HorizontalCollection.reopen(DebugMixin);
