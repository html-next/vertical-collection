'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = async function() {
  return {
    useYarn: true,
    scenarios: [
      {
        name: 'ember-lts-3.28',
        npm: {
          devDependencies: {
            'ember-source': '~3.28.0'
          }
        }
      },
      {
        name: 'ember-lts-4.4',
        npm: {
          devDependencies: {
            'ember-cli-fastboot': '3.2.0-beta.5',
            'ember-source': '~4.4.0'
          },
          ember: {
            edition: 'octane'
          }
        },
        env: {
          EMBER_OPTIONAL_FEATURES: JSON.stringify({
            'application-template-wrapper': false,
            'template-only-glimmer-components': true,
          })
        }
      },
      {
        name: 'ember-release',
        npm: {
          devDependencies: {
            'ember-cli-fastboot': '3.2.0-beta.5',
            'ember-data': '^5.0.0',
            'ember-source': await getChannelURL('release')
          },
          ember: {
            edition: 'octane'
          }
        },
        env: {
          EMBER_OPTIONAL_FEATURES: JSON.stringify({
            'application-template-wrapper': false,
            'template-only-glimmer-components': true,
          })
        }
      },
      {
        name: 'ember-beta',
        npm: {
          devDependencies: {
            'ember-cli-fastboot': '3.2.0-beta.5',
            'ember-data': '^5.0.0',
            'ember-source': await getChannelURL('beta')
          },
          ember: {
            edition: 'octane'
          }
        },
        env: {
          EMBER_OPTIONAL_FEATURES: JSON.stringify({
            'application-template-wrapper': false,
            'template-only-glimmer-components': true,
          })
        }
      },
      {
        name: 'ember-canary',
        npm: {
          devDependencies: {
            'ember-cli-fastboot': '3.2.0-beta.5',
            'ember-data': '^5.0.0',
            'ember-source': await getChannelURL('canary')
          },
          ember: {
            edition: 'octane'
          }
        },
        env: {
          EMBER_OPTIONAL_FEATURES: JSON.stringify({
            'application-template-wrapper': false,
            'template-only-glimmer-components': true,
          })
        }
      },
      // The default `.travis.yml` runs this scenario via `yarn test`,
      // not via `ember try`. It's still included here so that running
      // `ember try:each` manually or from a customized CI config will run it
      // along with all the other scenarios.
      {
        name: 'ember-default',
        npm: {
          devDependencies: {}
        }
      },
      {
        name: 'ember-default-with-jquery',
        env: {
          EMBER_OPTIONAL_FEATURES: JSON.stringify({
            'jquery-integration': true
          })
        },
        npm: {
          devDependencies: {
            '@ember/jquery': '^0.5.1'
          }
        }
      }
    ]
  };
};
