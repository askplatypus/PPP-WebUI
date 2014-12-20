PPP Web UI
==========

[![Build Status](https://travis-ci.org/ProjetPP/PPP-WebUI.svg?branch=master)](https://travis-ci.org/ProjetPP/PPP-WebUI)
[![Dependency Status](https://www.versioneye.com/user/projects/5482b6273f594ec26d000006/badge.svg?style=flat)](https://www.versioneye.com/user/projects/5482b6273f594ec26d000006)

##Installation
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
	pppCoreUrl: 'FULL URL OF YOUR INSTALL OF THE CORE PPP MODULE'
}
```

Add a `flavicon.ico` and an `img/icon-152.png` file of the icon.

Just browse with your favorite browser to the `index.html` file.
