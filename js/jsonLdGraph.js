/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function (window) {
	'use strict';

	/**
	 * A JSON-LD graph
	 *
	 * @class
	 * @constructor
	 *
	 * @param {array} expendedJsonLd an expended JSON-LD graph
	 */
	window.JsonLdGraph = function (expendedJsonLd) {
		this.resources = expendedJsonLd;
	};

	/**
	 * @return {JsonLdResource}
	 */
	window.JsonLdGraph.prototype.getMainResource = function () {
		if (this.resources.length !== 1) {
			throw new Error('The graph should only contain one resource!');
		}

		return new window.JsonLdResource(this.resources[0]);
	};


	/**
	 * A JSON-LD graph
	 *
	 * @class
	 * @constructor
	 *
	 * @param {object} expendedJsonLd an expended JSON-LD resource
	 */
	window.JsonLdResource = function (expendedJsonLd) {
		this.resource = expendedJsonLd;
	};

	/**
	 * @return {string[]}
	 */
	window.JsonLdResource.prototype.getTypes = function () {
		if (!('@type' in this.resource)) {
			if (this.hasLanguage()) {
				return ['http://www.w3.org/1999/02/22-rdf-syntax-ns#langString'];
			} else if (this.hasValue()) {
				return ['http://www.w3.org/2001/XMLSchema#string'];
			} else {
				return ['http://schema.org/Thing'];
			}
		}

		var type = this.resource['@type'];
		if (type instanceof Array) {
			return type;
		}
		return [type];
	};

	/**
	 * @param {string} targetType
	 * @return {boolean}
	 */
	window.JsonLdResource.prototype.isInstanceOf = function (targetType) {
		var types = this.getTypes();

		for (var i in types) {
			var currentType = types[i];
			do {
				if (currentType === targetType) {
					return true;
				}
				currentType = window.schemaDotOrgTypeHierachy[currentType];
			} while (currentType !== undefined);
		}

		return false;
	};

	/**
	 * @return {JsonLdResource[]}
	 */
	window.JsonLdResource.prototype.getResourcesForProperty = function (property) {
		if (!(property in this.resource)) {
			return [];
		}

		return this.arrayToResources(this.resource[property]);
	};

	/**
	 * @return {string[]}
	 */
	window.JsonLdResource.prototype.getReverseProperties = function () {
		if (!('@reverse' in this.resource)) {
			return [];
		}
		return Object.keys(this.resource['@reverse']);
	};

	/**
	 * @return {JsonLdResource[]}
	 */
	window.JsonLdResource.prototype.getResourcesForReverseProperty = function (property) {
		if (!('@reverse' in this.resource) || !(property in this.resource['@reverse'])) {
			return [];
		}

		return this.arrayToResources(this.resource['@reverse'][property]);
	};

	/**
	 * @private
	 */
	window.JsonLdResource.prototype.arrayToResources = function (array) {
		var resources = [];

		for (var i in array) {
			resources.push(new window.JsonLdResource(array[i]));
		}

		return resources;
	};

	/**
	 * @return {boolean}
	 */
	window.JsonLdResource.prototype.hasId = function () {
		return '@id' in this.resource;
	};

	/**
	 * @return {string}
	 */
	window.JsonLdResource.prototype.getId = function () {
		if (!this.hasId()) {
			throw new Error('This resource has no id!');
		}

		return this.resource['@id'];
	};

	/**
	 * @return {boolean}
	 */
	window.JsonLdResource.prototype.hasValue = function () {
		return '@value' in this.resource;
	};

	/**
	 * @return {string}
	 */
	window.JsonLdResource.prototype.getValue = function () {
		if (!this.hasValue()) {
			throw new Error('This resource has no value!');
		}

		return this.resource['@value'];
	};

	/**
	 * @return {boolean}
	 */
	window.JsonLdResource.prototype.hasLanguage = function () {
		return '@language' in this.resource;
	};

	/**
	 * @return {string}
	 */
	window.JsonLdResource.prototype.getLanguage = function () {
		if (!this.hasLanguage()) {
			throw new Error('This resource has no language!');
		}

		return this.resource['@language'];
	};

	window.JsonLdResource.prototype.toJsonLd = function () {
		return this.resource;
	};

	/**
	 * Returns the best resources for an ordered list of languages. Use null in order to match resources without @language
	 *
	 * @param {JsonLdResource[]} resources
	 * @param {string[]} languages
	 * @return {JsonLdResource[]}
	 */
	window.JsonLdResource.filterBestResourcesForLanguage = function (resources, languages) {
		for (var i in languages) {
			var language = languages[i];

			var matchedResources = [];
			for (var j in resources) {
				var resource = resources[j];

				if (resource.hasLanguage()) {
					if (resource.getLanguage() === language) {
						matchedResources.push(resource);
					}
				} else {
					if (language === null) {
						matchedResources.push(resource);
					}
				}
			}

			if (matchedResources.length > 0) {
				return matchedResources;
			}
		}

		return [];
	};

}(window));
