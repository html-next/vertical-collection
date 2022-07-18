/* eslint-disable no-undef */
self.deprecationWorkflow = self.deprecationWorkflow || {};
self.deprecationWorkflow.config = {
  throwOnUnhandled: true,
  workflow: [
    // Resolving this requires updating all the tests
    { handler: 'silence', matchId: 'ember-test-helpers.setup-rendering-context.render' }
  ]
};
