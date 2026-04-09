import { htmlSafe } from '@ember/template';
import { helper } from '@ember/component/helper';

export default helper(function (params) {
  return htmlSafe(params[0]);
});
