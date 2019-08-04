'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = function() {
  return Promise.all([
    getChannelURL('release'),
    getChannelURL('beta'),
    getChannelURL('canary')
  ]).then((urls) => {
    return {
      useYarn: true,
      scenarios: [
        {
          name: 'ember-1.12',
          bower: {
            dependencies: {
              ember: '~1.12.0',
              'ember-cli-shims': 'ember-cli/ember-cli-shims#0.0.3',
              'ember-data': '~1.13.0',
            },
            resolutions: {
              ember: '~1.12.0',
              'ember-cli-shims': '0.0.3',
              'ember-data': '~1.13.0',
            },
          },
          npm: {
            devDependencies: {
              'ember-cli-shims': null,
              'ember-cli-fastboot': null,
              'ember-data': '~1.13.0',
              'ember-source': null
            },
          },
        },
        {
          name: 'ember-1.13',
          bower: {
            dependencies: {
              'ember': '~1.13.0',
              'ember-cli-shims': '0.0.6',
              'ember-data': '~1.13.0'
            },
            resolutions: {
              'ember': '~1.13.0',
              'ember-cli-shims': '0.0.6',
              'ember-data': '~1.13.0'
            }
          },
          npm: {
            devDependencies: {
              'ember-cli-shims': null,
              'ember-cli-fastboot': null,
              'ember-data': '~1.13.15',
              'ember-source': null
            }
          }
        },
        {
          name: 'ember-lts-2.4',
          bower: {
            dependencies: {
              'ember-cli-shims': '~0.1.0',
              'ember': 'components/ember#lts-2-4'
            },
            resolutions: {
              'ember-cli-shims': '0.1.0',
              'ember': 'lts-2-4'
            }
          },
          npm: {
            devDependencies: {
              'ember-cli-shims': null,
              'ember-cli-fastboot': null,
              'ember-data': '~2.4.0',
              'ember-source': null
            }
          }
        },
        {
          name: 'ember-lts-2.8',
          bower: {
            dependencies: {
              'ember': 'components/ember#lts-2-8'
            },
            resolutions: {
              'ember': 'lts-2-8'
            }
          },
          npm: {
            devDependencies: {
              'ember-data': '~2.8.0',
              'ember-source': null
            }
          }
        },
        {
          name: 'ember-lts-2.12',
          env: {
            EMBER_OPTIONAL_FEATURES: JSON.stringify({ 'jquery-integration': true })
          },
          npm: {
            devDependencies: {
              '@ember/jquery': '^0.5.1',
              'ember-source': '~2.12.0'
            }
          }
        },
        {
          name: 'ember-lts-2.16',
          env: {
            EMBER_OPTIONAL_FEATURES: JSON.stringify({ 'jquery-integration': true }),
          },
          npm: {
            devDependencies: {
              '@ember/jquery': '^0.5.1',
              'ember-source': '~2.16.0'
            }
          }
        },
        {
          name: 'ember-lts-2.18',
          env: {
            EMBER_OPTIONAL_FEATURES: JSON.stringify({ 'jquery-integration': true })
          },
          npm: {
            devDependencies: {
              '@ember/jquery': '^0.5.1',
              'ember-source': '~2.18.0'
            }
          }
        },
        {
          name: 'ember-lts-3.4',
          npm: {
            devDependencies: {
              'ember-source': '~3.4.0'
            }
          }
        },
        {
          name: 'ember-release',
          npm: {
            devDependencies: {
              'ember-source': urls[0]
            }
          }
        },
        {
          name: 'ember-beta',
          npm: {
            devDependencies: {
              'ember-source': urls[1]
            }
          }
        },
        {
          name: 'ember-canary',
          npm: {
            devDependencies: {
              'ember-source': urls[2]
            }
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
  });
};
