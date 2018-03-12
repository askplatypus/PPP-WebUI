//- ----------------------------------
//- 💥 DISPLACY
//- ----------------------------------

'use strict';

var _slicedToArray = function () {
	function sliceIterator(arr, i) {
		var _arr = [];
		var _n = true;
		var _d = false;
		var _e = undefined;
		try {
			for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
				_arr.push(_s.value);
				if (i && _arr.length === i) break;
			}
		} catch (err) {
			_d = true;
			_e = err;
		} finally {
			try {
				if (!_n && _i["return"]) _i["return"]();
			} finally {
				if (_d) throw _e;
			}
		}
		return _arr;
	}

	return function (arr, i) {
		if (Array.isArray(arr)) {
			return arr;
		} else if (Symbol.iterator in Object(arr)) {
			return sliceIterator(arr, i);
		} else {
			throw new TypeError("Invalid attempt to destructure non-iterable instance");
		}
	};
}();

var _createClass = function () {
	function defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];
			descriptor.enumerable = descriptor.enumerable || false;
			descriptor.configurable = true;
			if ("value" in descriptor) descriptor.writable = true;
			Object.defineProperty(target, descriptor.key, descriptor);
		}
	}

	return function (Constructor, protoProps, staticProps) {
		if (protoProps) defineProperties(Constructor.prototype, protoProps);
		if (staticProps) defineProperties(Constructor, staticProps);
		return Constructor;
	};
}();

function _toConsumableArray(arr) {
	if (Array.isArray(arr)) {
		for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
			arr2[i] = arr[i];
		}
		return arr2;
	} else {
		return Array.from(arr);
	}
}

function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError("Cannot call a class as a function");
	}
}

var displaCy = function () {
	function displaCy(api, options) {
		_classCallCheck(this, displaCy);

		this.api = api;
		this.container = typeof options.container == 'string' ? document.querySelector(options.container || '#displacy') : options.container;

		this.format = options.format || 'spacy';
		this.defaultText = options.defaultText || 'Hello World.';
		this.defaultModel = options.defaultModel || 'en';
		this.collapsePunct = options.collapsePunct != undefined ? options.collapsePunct : true;
		this.collapsePhrase = options.collapsePhrase != undefined ? options.collapsePhrase : true;

		this.onStart = options.onStart || false;
		this.onSuccess = options.onSuccess || false;
		this.onError = options.onError || false;

		this.distance = options.distance || 200;
		this.offsetX = options.offsetX || 50;
		this.arrowSpacing = options.arrowSpacing || 20;
		this.arrowWidth = options.arrowWidth || 10;
		this.arrowStroke = options.arrowStroke || 2;
		this.wordSpacing = options.wordSpacing || 75;
		this.font = options.font || 'inherit';
		this.color = options.color || '#000000';
		this.bg = options.bg || '#ffffff';
	}

	_createClass(displaCy, [{
		key: 'parse',
		value: function parse() {
			var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.defaultText;

			var _this = this;

			var model = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.defaultModel;
			var settings = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

			if (typeof this.onStart === 'function') this.onStart();

			var xhr = new XMLHttpRequest();
			xhr.open('POST', this.api, true);
			xhr.setRequestHeader('Content-type', 'text/plain');
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4 && xhr.status === 200) {
					if (typeof _this.onSuccess === 'function') _this.onSuccess();
					_this.render(JSON.parse(xhr.responseText), settings, text);
				} else if (xhr.status !== 200) {
					if (typeof _this.onError === 'function') _this.onError(xhr.statusText);
				}
			};

			xhr.onerror = function () {
				xhr.abort();
				if (typeof _this.onError === 'function') _this.onError();
			};

			xhr.send(JSON.stringify({
				text: text, model: model,
				collapse_punctuation: settings.collapsePunct != undefined ? settings.collapsePunct : this.collapsePunct,
				collapse_phrases: settings.collapsePhrase != undefined ? settings.collapsePhrase : this.collapsePhrase
			}));
		}
	}, {
		key: 'render',
		value: function render(parse) {
			var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
			var text = arguments[2];

			parse = this.handleConversion(parse);

			if (text) console.log('%c\uD83D\uDCA5  JSON for "' + text + '"\n%c' + JSON.stringify(parse), 'font: bold 16px/2 arial, sans-serif', 'font: 13px/1.5 Consolas, "Andale Mono", Menlo, Monaco, Courier, monospace');

			this.levels = [].concat(_toConsumableArray(new Set(parse.arcs.map(function (_ref) {
				var end = _ref.end,
					start = _ref.start;
				return end - start;
			}).sort(function (a, b) {
				return a - b;
			}))));
			this.highestLevel = this.levels.indexOf(this.levels.slice(-1)[0]) + 1;
			this.offsetY = this.distance / 2 * this.highestLevel;

			var width = this.offsetX + parse.words.length * this.distance;
			var height = this.offsetY + 3 * this.wordSpacing;

			this.container.innerHTML = '';
			this.container.appendChild(this._el('svg', {
				id: 'displacy-svg',
				classnames: ['displacy'],
				attributes: [['width', width], ['height', height], ['viewBox', '0 0 ' + width + ' ' + height], ['preserveAspectRatio', 'xMinYMax meet'], ['data-format', this.format]],
				style: [['color', settings.color || this.color], ['background', settings.bg || this.bg], ['fontFamily', settings.font || this.font]],
				children: [].concat(_toConsumableArray(this.renderWords(parse.words)), _toConsumableArray(this.renderArrows(parse.arcs)))
			}));
		}
	}, {
		key: 'renderWords',
		value: function renderWords(words) {
			var _this2 = this;

			return words.map(function (_ref2, i) {
				var text = _ref2.text,
					tag = _ref2.tag,
					_ref2$data = _ref2.data,
					data = _ref2$data === undefined ? [] : _ref2$data;
				return _this2._el('text', {
					classnames: ['displacy-token'],
					attributes: [['fill', 'currentColor'], ['data-tag', tag], ['text-anchor', 'middle'], ['y', _this2.offsetY + _this2.wordSpacing]].concat(_toConsumableArray(data.map(function (_ref3) {
						var _ref4 = _slicedToArray(_ref3, 2),
							attr = _ref4[0],
							value = _ref4[1];

						return ['data-' + attr.replace(' ', '-'), value];
					}))),
					children: [_this2._el('tspan', {
						classnames: ['displacy-word'],
						attributes: [['x', _this2.offsetX + i * _this2.distance], ['fill', 'currentColor'], ['data-tag', tag]],
						text: text
					}), _this2._el('tspan', {
						classnames: ['displacy-tag'],
						attributes: [['x', _this2.offsetX + i * _this2.distance], ['dy', '2em'], ['fill', 'currentColor'], ['data-tag', tag]],
						text: tag
					})]
				});
			});
		}
	}, {
		key: 'renderArrows',
		value: function renderArrows(arcs) {
			var _this3 = this;

			return arcs.map(function (_ref5, i) {
				var label = _ref5.label,
					end = _ref5.end,
					start = _ref5.start,
					dir = _ref5.dir,
					_ref5$data = _ref5.data,
					data = _ref5$data === undefined ? [] : _ref5$data;

				var rand = Math.random().toString(36).substr(2, 8);
				var level = _this3.levels.indexOf(end - start) + 1;
				var startX = _this3.offsetX + start * _this3.distance + _this3.arrowSpacing * (_this3.highestLevel - level) / 4;
				var startY = _this3.offsetY;
				var endpoint = _this3.offsetX + (end - start) * _this3.distance + start * _this3.distance - _this3.arrowSpacing * (_this3.highestLevel - level) / 4;

				var curve = _this3.offsetY - level * _this3.distance / 2;
				if (curve == 0 && _this3.levels.length > 5) curve = -_this3.distance;

				return _this3._el('g', {
					classnames: ['displacy-arrow'],
					attributes: [['data-dir', dir], ['data-label', label]].concat(_toConsumableArray(data.map(function (_ref6) {
						var _ref7 = _slicedToArray(_ref6, 2),
							attr = _ref7[0],
							value = _ref7[1];

						return ['data-' + attr.replace(' ', '-'), value];
					}))),
					children: [_this3._el('path', {
						id: 'arrow-' + rand,
						classnames: ['displacy-arc'],
						attributes: [['d', 'M' + startX + ',' + startY + ' C' + startX + ',' + curve + ' ' + endpoint + ',' + curve + ' ' + endpoint + ',' + startY], ['stroke-width', _this3.arrowStroke + 'px'], ['fill', 'none'], ['stroke', 'currentColor'], ['data-dir', dir], ['data-label', label]]
					}), _this3._el('text', {
						attributes: [['dy', '1em']],
						children: [_this3._el('textPath', {
							xlink: '#arrow-' + rand,
							classnames: ['displacy-label'],
							attributes: [['startOffset', '50%'], ['fill', 'currentColor'], ['text-anchor', 'middle'], ['data-label', label], ['data-dir', dir]],
							text: label
						})]
					}), _this3._el('path', {
						classnames: ['displacy-arrowhead'],
						attributes: [['d', 'M' + (dir == 'left' ? startX : endpoint) + ',' + (startY + 2) + ' L' + (dir == 'left' ? startX - _this3.arrowWidth + 2 : endpoint + _this3.arrowWidth - 2) + ',' + (startY - _this3.arrowWidth) + ' ' + (dir == 'left' ? startX + _this3.arrowWidth - 2 : endpoint - _this3.arrowWidth + 2) + ',' + (startY - _this3.arrowWidth)], ['fill', 'currentColor'], ['data-label', label], ['data-dir', dir]]
					})]
				});
			});
		}
	}, {
		key: 'handleConversion',
		value: function handleConversion(parse) {
			switch (this.format) {
				case 'spacy':
					return parse;
					break;
				case 'google':
					return {
						words: parse.map(function (_ref8) {
							var text = _ref8.text.content,
								tag = _ref8.partOfSpeech.tag;
							return {text: text, tag: tag};
						}),
						arcs: parse.map(function (_ref9, i) {
							var _ref9$dependencyEdge = _ref9.dependencyEdge,
								label = _ref9$dependencyEdge.label,
								j = _ref9$dependencyEdge.headTokenIndex;
							return i != j ? {
								label: label,
								start: Math.min(i, j),
								end: Math.max(i, j),
								dir: j > i ? 'left' : 'right'
							} : null;
						}).filter(function (word) {
							return word != null;
						})
					};
					break;
				default:
					return parse;
			}
		}
	}, {
		key: '_el',
		value: function _el(tag, options) {
			var _options$classnames = options.classnames,
				classnames = _options$classnames === undefined ? [] : _options$classnames,
				_options$attributes = options.attributes,
				attributes = _options$attributes === undefined ? [] : _options$attributes,
				_options$style = options.style,
				style = _options$style === undefined ? [] : _options$style,
				_options$children = options.children,
				children = _options$children === undefined ? [] : _options$children,
				text = options.text,
				id = options.id,
				xlink = options.xlink;

			var ns = 'http://www.w3.org/2000/svg';
			var nsx = 'http://www.w3.org/1999/xlink';
			var el = document.createElementNS(ns, tag);

			classnames.forEach(function (name) {
				return el.classList.add(name);
			});
			attributes.forEach(function (_ref10) {
				var _ref11 = _slicedToArray(_ref10, 2),
					attr = _ref11[0],
					value = _ref11[1];

				return el.setAttribute(attr, value);
			});
			style.forEach(function (_ref12) {
				var _ref13 = _slicedToArray(_ref12, 2),
					prop = _ref13[0],
					value = _ref13[1];

				return el.style[prop] = value;
			});
			if (xlink) el.setAttributeNS(nsx, 'xlink:href', xlink);
			if (text) el.appendChild(document.createTextNode(text));
			if (id) el.id = id;
			children.forEach(function (child) {
				return el.appendChild(child);
			});
			return el;
		}
	}]);

	return displaCy;
}();