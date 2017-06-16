Platypus Web UI
==========

[![Build Status](https://travis-ci.org/askplatypus/platypus-ui.svg?branch=master)](https://travis-ci.org/ProjetPP/PPP-WebUI)

## Installation
Clone this repository in a web reachable folder.

Install dependencies using bower:
```
bower install
```
To install bower just use `npm` with:
```
npm install -g bower
```

Build icons:
```
sh bootstrap_icons.sh
```
This script depends on ImageMagick and librsvg

Create a `config.js` file in the root folder of the repository with as content:
```
window.config = {
	pppCoreUrl: 'FULL URL OF YOUR INSTALL OF THE CORE PPP MODULE',
	pppLoggerUrl: 'FULL URL OF YOUR INSTALL OF THE LOGGER PPP MODULE',
	allowedLanguages: ['en']
}
```

With `allowedLanguages` the list of allowed languages. The first one is the default one.

Just browse with your favorite browser to the `index.html` file.
