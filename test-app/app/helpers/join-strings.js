import { helper } from '@ember/component/helper';

export default helper(function (params) {
  return params.join('');
});
