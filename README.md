vertical-collection
=================

[![Greenkeeper badge](https://badges.greenkeeper.io/html-next/vertical-collection.svg)](https://greenkeeper.io/)

[![Build Status](https://travis-ci.org/html-next/vertical-collection.svg)](https://travis-ci.org/html-next/vertical-collection)

Infinite Scroll and Occlusion at > 60FPS

`vertical-collection` is an `ember-addon` that is part of the `smoke-and-mirrors` framework. It
focuses on improving initial and re-render performance in high-stress situations by providing a
component for performant lists and `svelte renders` to match a core belief:
**Don't render the universe, render the scene.**

#### TL;DR svelte render: the fewer things you need to render, the faster your renders will be.

Your web page is a universe, your viewport is the scene. Much like you wouldn't expect a video game to render
out-of-scene content, your application should smartly cull the content it doesn't need to care about.  Trimming
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
{{#vertical-collection
    items
    tagName='ul'
    estimateHeight=50
    staticHeight=false
    bufferSize=1
    renderAll=false
    renderFromLast=false
    idForFirstItem=idForFirstItem
    firstReached=firstReached
    lastReached=lastReached
    firstVisibleChanged=firstVisibleChanged
    lastVisibleChanged=lastVisibleChanged
     as |item i|}}
    <li>
      {{item.number}} {{i}}
    </li>
{{/vertical-collection}}
```

### Actions

`firstReached` - Triggered when scroll reaches the first element in the collection

`lastReached`- Triggered when scroll reaches the last element in the collection

`firstVisibleChanged` - Triggered when the first element in the viewport changes
 
`lastVisibleChanged` - Triggered when the last element in the viewport changes

## Support, Questions, Collaboration

Join the [smoke-and-mirrors](https://embercommunity.slack.com/messages/smoke-and-mirrors/) channel on Slack.

[![Slack Status](https://ember-community-slackin.herokuapp.com/badge.svg)](https://ember-community-slackin.herokuapp.com/)


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

If it can be trimmer, smoke-and-mirrors likes to trim it.

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
 - Branch off of `develop` (default branch)
 - Use descriptive branch names (e.g. `<type>/<short-description>`)
 - Use [Angular Style Commits](https://github.com/angular/angular.js/blob/v1.4.8/CONTRIBUTING.md#commit)
 - PR against `develop` (default branch).

### Commits

Angular Style commit messages have the full form:

 ```
 <type>(<scope>): <title>

 <body>

 <footer>
 ```

 But the abbreviated form (below) is acceptable and often preferred.

 ```
 <type>(<scope>): <title>
 ```

 Examples:

 - chore(deps): bump deps in package.json and bower.json
 - docs(component): document the `fast-action` component



## Funding

OSS is often a labor of love. Smoke And Mirrors is largely built with that love.

<a href='https://pledgie.com/campaigns/30822'><img alt='Click here to lend your support to: Smoke-and-mirrors: Ambitious infinite-scroll and svelte rendering for Ember applications and make a donation at pledgie.com !' src='https://pledgie.com/campaigns/30822.png?skin_name=chrome' border='0' ></a>
