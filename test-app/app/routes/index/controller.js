import Controller from '@ember/controller';
import config from 'test-app/config/environment';
import { VERSION } from '@ember/version';

export default Controller.extend({
  version: config.VERSION,
  emberVersion: VERSION,
});
