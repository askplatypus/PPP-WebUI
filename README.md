PPP Web UI
==========

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

Create a `config.js` file in the root folder of the repository with as content:
```
window.config = {
	pppCoreUrl: 'FULL URL OF YOUR INSTALL OF THE CORE PPP MODULE'
}
```
