
/* eslint-disable */
self.deprecationWorkflow = self.deprecationWorkflow || {};
self.deprecationWorkflow.config = {  
  workflow: [    
    { handler: "silence", matchId: "ember-qunit.deprecate-legacy-apis" },    
    { handler: "silence", matchId: "ember-data:legacy-test-helper-support" },
  ]
};
