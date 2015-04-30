# JSS - new version

A simple JavaScript library for retrieving and setting CSS stylesheet rules.

* Tiny - only 4KB minified
* No dependencies
* MIT Licensed
* Supports FF, Chrome, Safari, Opera, and IE9+

Why generate CSS with JavaScript?

* To set styles that need to be calculated or retrieved
* To set behavioural styles for your widget or plugin so that consumers aren't forced to include a stylesheet for core functionality
* To dynamically apply styles without cluttering your HTML (as is the case with inline styles)
* To set styles on all current and future elements

**IMPORTANT: This version is not compatible with the previous version of jss by [Box9/jss](https://github.com/Box9/jss) (the current version on bower). There are significant changes to the API and usage (see the Changelog section for details).**

## Usage

Download and include `jss.js` (or the minified file, `jss.min.js`) in your HTML:

    <script type="text/javascript" src="jss.js"></script>


## Functions

All functions must be called using **jss([doc])** where **doc** is the document the functions should be applied to. It can be left empty in which case the document of the current context is used.

### Individual properties

**jss([doc]).setProperty(selector, propertyName, propertyValue)** to add a new property to a CSS rule:

```js
jss().setProperty('.demo', 'font-size', '15px');
```

**js([doc]).getProperty(selector, propertyName)** to get a single property from the CSS rules:

```js
jss().setProperty('.demo', 'font-size');
// returns the following: '15px'
```

**js([doc]).removeProperty(selector, propertyName)** to remove a single property from the CSS rules:

```js
jss().setProperty('.demo', 'font-size');
```

### Multiple properties

**jss([doc]).set(selector, properties)** to add a new rule or extend an existing rule:

```js
jss().set('.demo', {
    'font-size': '15px',
    'color': 'red'
});
```

**jss([doc]).get([selector])** to retrieve rules added via JSS:

```js
jss().get('.demo');
// returns the following:
{
    'font-size': '15px',
    'color': 'red'
}

jss().get();
// returns the following:
{
    '.demo': {
        'font-size': '15px',
        'color': 'red'
    }
}
```


**jss([doc]).getAll(selector)** to retrieve all rules that are specified using the selector (not necessarily added via JSS):

```js
jss().getAll('.demo');
// returns the following:
{
    'font-size': '15px',
    'color': 'red',
    'font-weight': 'bold'
}
```

**jss([doc]).remove([selector])** to remove rules added via JSS:

```js
jss().remove('.demo'); // removes all JSS styles matching the selector
jss().remove();        // removes all JSS styles
```

## Tests

There are a couple of tests that can be run.

## Changelog

This library is based on [Box9/jss](https://github.com/Box9/jss) and thus supports all of the features described there:
* setting properties based on a selector
* getting individual rules that were added via JSS
* retrieving all rules that were set via JSS
* removing individual rules or all rules that were set via JSS

Additionally, this library now supports the following:

* applying all functions to a different document (e.g. `iframe`)
* setting, getting and removing individual properties by name
* removing rules that were not added by JSS (upcoming)
* media queries (upcoming)
* function to export all of the rules, add by JSS and others so that they can be saved in a `*.css` file (upcoming)


## License

Copyright (c) 2015 Sybil Ehrensberger  
Copyright (c) 2011 David Tang

See the LICENSE file for license rights and limitations (MIT).
