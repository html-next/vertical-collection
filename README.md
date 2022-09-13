# vertical-collection

[![Greenkeeper badge](https://badges.greenkeeper.io/html-next/vertical-collection.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/html-next/vertical-collection.svg)](https://travis-ci.org/html-next/vertical-collection)

Infinite Scroll and Occlusion at > 60FPS

`vertical-collection` is an `ember-addon` that is part of the `smoke-and-mirrors` framework. It
focuses on improving initial and re-render performance in high-stress situations by providing a
component for performant lists and `svelte renders` to match a core belief:
**Don't render the universe, render the scene.**

#### TL;DR svelte render: the fewer things you need to render, the faster your renders will be.

Your web page is a universe, your viewport is the scene. Much like you wouldn't expect a video game to render
out-of-scene content, your application should smartly cull the content it doesn't need to care about. Trimming
excess content lets the browser perform both initial renders and re-renders at far higher frame-rates, as the only
content it needs to focus on for layout is the content the user can see.

`vertical-collection` augments your existing app, it doesn't ask you to rewrite layouts or logic in order to use it.
It will try its best to allow you to keep the conventions, structures, and layouts you want.

## Install

```bash
ember install @html-next/vertical-collection
```

## Usage

```htmlbars
<VerticalCollection
    @items={{items}}
    @tagName="ul"
    @estimateHeight={{50}}
    @staticHeight={{false}}
    @bufferSize={{1}}
    @renderAll={{false}}
    @renderFromLast={{false}}
    @idForFirstItem={{idForFirstItem}}
    @firstReached={{firstReachedCallback}}
    @lastReached={{lastReachedCallback}}
    @firstVisibleChanged={{firstVisibleChangedCallback}}
    @lastVisibleChanged={{lastVisibleChangedCallback}}
     as |item i|>
    <li>
      {{item.number}} {{i}}
    </li>
</VerticalCollection>
```

### Actions

`firstReached` - Triggered when scroll reaches the first element in the collection

`lastReached`- Triggered when scroll reaches the last element in the collection

`firstVisibleChanged` - Triggered when the first element in the viewport changes

`lastVisibleChanged` - Triggered when the last element in the viewport changes

## Support Matrix

| `vertical-collection` version | Supported Ember versions | Supported Node versions |
| ----------------------------- | ------------------------ | ----------------------- |
| `^v1.x.x`                     | `v1.12.0 - v3.8.x`       | `?`                     |
| `^v2.x.x`                     | `v2.8.0 - v3.26.x`       | `v12 - ?`               |
| `^v3.x.x`                     | `v2.18.0+`               | `v14+`                  |
| `^v4.x.x`                     | `v3.12.0+`               | `v14+`                  |

## Support, Questions, Collaboration

Join the [Ember community on Discord](https://discord.gg/zT3asNS)

## Features

### Infinite Scroll (bi-directional)

Infinite scroll that remains performant even for very long lists is easily achievable
with the [`vertical-collection`](http://html-next.github.io/vertical-collection/#/settings).
It works via a scrollable div or scrollable body.

- [bi-directional scrollable div](http://html-next.github.io/vertical-collection/#/examples/infinite-scroll)
- [scrollable body](http://html-next.github.io/vertical-collection/#/examples/scrollable-body)
- [dynamic content sizes](http://html-next.github.io/vertical-collection/#/examples/flexible-layout)
- [as a table](http://html-next.github.io/vertical-collection/#/examples/dbmon)

### Svelte Everything

If it can be trimmer, vertical-collection likes to trim it.

## Status

[Changelog](./CHANGELOG.md)

[![Build Status](https://travis-ci.org/html-next/vertical-collection.svg)](https://travis-ci.org/html-next/vertical-collection)
[![dependencies](https://david-dm.org/html-next/vertical-collection.svg)](https://david-dm.org/html-next/vertical-collection)
[![devDependency Status](https://david-dm.org/html-next/vertical-collection/dev-status.svg)](https://david-dm.org/html-next/vertical-collection#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/html-next/vertical-collection/badge.svg?branch=master&service=github)](https://coveralls.io/github/html-next/vertical-collection?branch=master)

## Documentation

For updated documentation and demos see [http://html-next.github.io/vertical-collection/](http://html-next.github.io/vertical-collection/)

## Contributing

- Open an Issue for discussion first if you're unsure a feature/fix is wanted.
- Branch off of `master` (default branch)
- Use descriptive branch names (e.g. `<type>/<short-description>`)
- PR against `master` (default branch).

### Testing

Make sure you register the test waiter from [ember-raf-scheduler](https://github.com/html-next/ember-raf-scheduler). So `ember-test-helpers`'s `wait` is aware of the scheduled updates.

An example can be found [here](https://github.com/html-next/vertical-collection/blob/master/tests/test-helper.js#L2)

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
