'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = async function() {
  return {
    useYarn: true,
    scenarios: [
      {
        name: 'ember-lts-2.18',
        npm: {
          devDependencies: {
            '@ember/jquery': '^1.1.0',
            '@ember/test-helpers': '^1.7.0',
            'ember-angle-bracket-invocation-polyfill': '^3.0.1',
            'ember-qunit': '^4.0.0',
            'ember-source': '~2.18.0',
            'qunit': null
          },
        },
      },
      {
        name: 'ember-lts-3.4',
        npm: {
          devDependencies: {
            'ember-angle-bracket-invocation-polyfill': '^3.0.1',
            'ember-source': '~3.4.0'
          }
        }
      },
      {
        name: 'ember-lts-3.8',
        npm: {
          devDependencies: {
            'ember-angle-bracket-invocation-polyfill': '^3.0.1',
            'ember-source': '~3.8.0'
          }
        }
      },
      {
        name: 'ember-lts-3.12',
        npm: {
          devDependencies: {
            'ember-source': '~3.12.0'
          }
        }
      },
      {
        name: 'ember-lts-3.16',
        npm: {
          devDependencies: {
            'ember-source': '~3.16.0'
          }
        }
      },
      {
        name: 'ember-lts-3.20',
        npm: {
          devDependencies: {
            'ember-data': '~3.20.0',
            'ember-source': '~3.20.0'
          }
        }
      },
      {
        name: 'ember-lts-3.24',
        npm: {
          devDependencies: {
            'ember-data': '~3.24.0',
            'ember-source': '~3.24.0'
          }
        }
      },
      {
        name: 'ember-lts-3.28',
        npm: {
          devDependencies: {
            'ember-data': '~3.28.0',
            'ember-source': '~3.28.0'
          }
        }
      },
      {
        name: 'ember-4.4',
        npm: {
          devDependencies: {
            'ember-cli-fastboot': '3.2.0-beta.5',
            'ember-data': '~3.28.0',
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
            'ember-data': '~3.28.0',
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
            'ember-data': '~3.28.0',
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
            'ember-data': '~3.28.0',
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
