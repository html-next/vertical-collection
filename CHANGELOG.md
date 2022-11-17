Changelog
=========




## v4.0.2 (2022-11-17)

#### :bug: Bug Fix
* [#396](https://github.com/html-next/vertical-collection/pull/396) Fix build for ember-source 4.0+ ([@wagenet](https://github.com/wagenet))

#### Committers: 1
- Peter Wagenet ([@wagenet](https://github.com/wagenet))

## v4.0.1 (2022-11-07)

#### :memo: Documentation
* [#381](https://github.com/html-next/vertical-collection/pull/381) Fix README ([@runspired](https://github.com/runspired))

#### Committers: 4
- Alex Navasardyan ([@twokul](https://github.com/twokul))
- Chris Thoburn ([@runspired](https://github.com/runspired))
- Matthew Beale ([@mixonic](https://github.com/mixonic))
- [@Atrue](https://github.com/Atrue)


## v4.0.0 (2022-09-12)

* Drops support for Ember < 3.12-LTS.
* Drops support for Ember CLI 2.x. https://github.com/html-next/vertical-collection/pull/379
* No change in Node support.
* Drop the positional param for `items` on the vertical collection component.
* Drop ember-compatibility-helpers https://github.com/html-next/vertical-collection/pull/375
* Refactor a bunch of debug code to DEBUG https://github.com/html-next/vertical-collection/pull/388
* Adopt angle bracket invocation
* Adopt native getters


## v4.0.0-beta.2 (2022-09-08)


## v4.0.0-beta.1 (2022-09-07)


## v4.0.0-beta.0 (2022-08-28)

* Drop support for Ember versions prior to 3.12
* Drop support for Ember CLI 2.x
* Adopt native getters
* Adopt angle bracket invocation
* Drop positional param argument for `item`


## v3.1.0 (2022-08-04)

#### :rocket: Enhancement
* [#380](https://github.com/html-next/vertical-collection/pull/380) fix: enable parallel builds ([@runspired](https://github.com/runspired))

#### :bug: Bug Fix
* [#380](https://github.com/html-next/vertical-collection/pull/380) fix: enable parallel builds ([@runspired](https://github.com/runspired))
* [#358](https://github.com/html-next/vertical-collection/pull/358) Delete virtual element ([@Atrue](https://github.com/Atrue))

#### Committers: 3
- Chris Thoburn ([@runspired](https://github.com/runspired))
- Matthew Beale ([@mixonic](https://github.com/mixonic))
- [@Atrue](https://github.com/Atrue)

## v3.0.0 (2022-05-03)


## v3.0.0-1 (2022-03-01)


## v3.0.0-0 (2021-12-09)

#### What's new

* Drop support for Ember < 2.18, add support for Ember 4.0+ (#343) (3343ecc)
* 4 retries on CI, 1s sleep (#352) (4a75d99)
* Extend timeout for base tests, tweak retry (#351) (8fff4c7)
* Remove implicit this in tests (#349) (5f58de6)


## v2.1.0 (2021-12-09)

Changelog:

* Upgrade ember-cli and dev deps (#348) (e8924e9)
* Drop Ember global use in favor of native API (#347) (d101d8a)
* Proper runloop imports (#346) (a765241)
* Remove property fallback lookup (no implicit this) (#345) (506d798)
* Modernize `htmlSafe` module imports / More cleanup (#344) (32e9460)
* Update CI for vertical-collection v2 (#342) (5613faa)


## v2.0.1 (2021-12-07)

#### :bug: Bug Fix
* [#322](https://github.com/html-next/vertical-collection/pull/322) Remove comma in selector list in css ([@CubeSquared](https://github.com/CubeSquared))

#### :house: Internal
* [#336](https://github.com/html-next/vertical-collection/pull/336) Add rwjblue release-it setup ([@rwwagner90](https://github.com/rwwagner90))

#### Committers: 2
- Matthew Jacobs ([@CubeSquared](https://github.com/CubeSquared))
- Robert Wagner ([@rwwagner90](https://github.com/rwwagner90))


## 0.5.5

### Pull Requests

- [#128](https://github.com/runspired/smoke-and-mirrors/pull/128) **fix**: only update scroll handler length when elements array changes  *by [adamjmcgrath](https://github.com/adamjmcgrath)*
- [#126](https://github.com/runspired/smoke-and-mirrors/pull/126) **fix**: update height after render when the item is shown  *by [adamjmcgrath](https://github.com/adamjmcgrath)*
- [#136](https://github.com/runspired/smoke-and-mirrors/pull/136)  New Release  *by [Chris Thoburn](https://github.com/runspired)*
- [#137](https://github.com/runspired/smoke-and-mirrors/pull/137)  0.5.5  *by [Chris Thoburn](https://github.com/runspired)*

#### Commits

- [dc04f499](https://github.com/runspired/smoke-and-mirrors/commit/dc04f49924e5b3379df4d97692e5405ad8c393a6) **feat(code-stripping)**: remove classCallChecks for perf, strip unused code from builds *by [Chris Thoburn](https://github.com/runspired)*
- [bf1c02b4](https://github.com/runspired/smoke-and-mirrors/commit/bf1c02b4fa4c5d32c3bad0df9ab3a9e2086184a5) **fix(scroll-handler)**: only update scroll handler length when elements array changes *by [adamjmcgrath](https://github.com/adamjmcgrath)*
- [c6399038](https://github.com/runspired/smoke-and-mirrors/commit/c6399038759d46b234f585f48b8e52a1434a1b46) **fix(vertical-item)**: update height after render when the item is shown *by [adamjmcgrath](https://github.com/adamjmcgrath)*
- [441f7635](https://github.com/runspired/smoke-and-mirrors/commit/441f76359695439ce91bae21cc34309409b6e0bc) **fix(readme)**: cleanup style *by [Chris Thoburn](https://github.com/runspired)*

## 0.5.4

### Pull Requests

- [#106](https://github.com/runspired/smoke-and-mirrors/pull/106)  Patch Release  *by [Chris Thoburn](https://github.com/runspired)*
- [#107](https://github.com/runspired/smoke-and-mirrors/pull/107)  fix addon dependency issue  *by [Chris Thoburn](https://github.com/runspired)*

## 0.5.3

## 0.5.2

### Pull Requests

- [#105](https://github.com/runspired/smoke-and-mirrors/pull/105)  Fixing links to runspired blog  *by [pete_the_pete](https://github.com/pete-the-pete)*
- [#107](https://github.com/runspired/smoke-and-mirrors/pull/107)  fix addon dependency issue  *by [Chris Thoburn](https://github.com/runspired)*

## 0.5.1

### Pull Requests

- [#102](https://github.com/runspired/smoke-and-mirrors/pull/102)  patch log output  *by [Chris Thoburn](https://github.com/runspired)*
- [#104](https://github.com/runspired/smoke-and-mirrors/pull/104)  Include ember-getowner-polyfill in dependencies.  *by [Chris Thoburn](https://github.com/runspired)*

## 0.5.0

### Pull Requests

- [#100](https://github.com/runspired/smoke-and-mirrors/pull/100)  Released 0.4.7  *by [Chris Thoburn](https://github.com/runspired)*

#### Commits

- [fc36460c](https://github.com/runspired/smoke-and-mirrors/commit/fc36460c463da33e53c72c6374373e25b3fde996) **fix(changelog)**: updates changelog from last release *by [Chris Thoburn](https://github.com/runspired)*
- [132216e5](https://github.com/runspired/smoke-and-mirrors/commit/132216e5acc0fdd0754a23323ffe97ee6018f2c9) **fix(container)**: use getOwner to resolve deprecation *by [Chris Thoburn](https://github.com/runspired)*
- [e68fcb43](https://github.com/runspired/smoke-and-mirrors/commit/e68fcb43f19517c976ec0cd31b0e3dfe4ee0babe) **fix(visualizer)**: improves teardown *by [Chris Thoburn](https://github.com/runspired)*
- [90138118](https://github.com/runspired/smoke-and-mirrors/commit/90138118c154144c7c29f5d8abab2a60f0d7571d) **fix(geography)**: ensures that destroy sequence completes before update sequence *by [Chris Thoburn](https://github.com/runspired)*
- [a6afb468](https://github.com/runspired/smoke-and-mirrors/commit/a6afb46808a3caa7424c09687d80ed658015c995) **fix(geography)**: don't cycle if we don't have any components *by [Chris Thoburn](https://github.com/runspired)*

## 0.4.7

- [c4aabc20](https://github.com/runspired/smoke-and-mirrors/commit/c4aabc209f2d42668c12b5c121a363384c7b42c4) **fix(changelog-config)**: generate changelog from the develop branch *by [Chris Thoburn](https://github.com/runspired)*
- [917e2e8c](https://github.com/runspired/smoke-and-mirrors/commit/917e2e8c2886116092f38fefb8bf5da2dd70adca) **fix(vertical-collection)**: removes template logic that crept in from smart-collection *by [Chris Thoburn](https://github.com/runspired)*
- [#97](https://github.com/runspired/smoke-and-mirrors/pull/97)  Chore/dependencies  *by [Chris Thoburn](https://github.com/runspired/chore)*
- [#99](https://github.com/runspired/smoke-and-mirrors/pull/99)  Fix (Firefox)  *by [Chris Thoburn](https://github.com/runspired)*

## 0.4.6

## 0.0.0

- Hold Your Horses,
- Pack Your Parachutes,
- We're Coming,
- But we haven't released anything yet.
