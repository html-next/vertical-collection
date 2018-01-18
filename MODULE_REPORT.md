## Module Report
### Unknown Global

**Global**: `Ember.HTMLBars`

**Location**: `app/initializers/vertical-collection-legacy-compat.js` at line 4

```js
import VerticalCollection from 'vertical-collection/components/vertical-collection/component';

Ember.HTMLBars._registerHelper('vertical-collection', (params, hash, options, env) => {
  hash.items = params.pop();

```

### Unknown Global

**Global**: `Ember.VERSION`

**Location**: `tests/acceptance/acceptance-tests/record-array-test.js` at line 8

```js
moduleForAcceptance('Acceptance | Record Array');

const { VERSION } = Ember;

// Don't test Ember Data pre-1.13, there were no stable releases
```

### Unknown Global

**Global**: `Ember.Handlebars`

**Location**: `tests/dummy/app/helpers/either-or.js` at line 10

```js
  });
} else {
  helper = Ember.Handlebars.makeBoundHelper(function(...params) {
    return params[0] || params[1];
  });
```

### Unknown Global

**Global**: `Ember.Handlebars`

**Location**: `tests/dummy/app/helpers/html-safe.js` at line 10

```js
  });
} else {
  helper = Ember.Handlebars.makeBoundHelper(function(...params) {
    return Ember.String.htmlSafe(params[0]);
  });
```

### Unknown Global

**Global**: `Ember.Handlebars`

**Location**: `tests/dummy/app/helpers/join-strings.js` at line 10

```js
  });
} else {
  helper = Ember.Handlebars.makeBoundHelper(function(...params) {
    return params.join('');
  });
```

### Unknown Global

**Global**: `Ember.VERSION`

**Location**: `tests/dummy/app/routes/index/controller.js` at line 10

```js
export default Controller.extend({
  version: config.VERSION,
  emberVersion: Ember.VERSION
});

```
