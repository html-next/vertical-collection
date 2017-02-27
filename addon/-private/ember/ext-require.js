import Ember from 'ember';

export default function(moduleName, exportName = 'default') {
  let module = Ember.__loader.require(moduleName); // eslint-disable-line ember-suave/no-direct-property-access

  return module[exportName];
}
