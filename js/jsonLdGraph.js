/**
 * @copyright Thomas Pellissier-Tanon
 * @licence MIT
 */
(function(window) {
	'use strict';

	/**
	 * A JSON-LD graph
	 *
	 * @class
	 * @constructor
	 *
	 * @param {array} expendedJsonLd an expended JSON-LD graph
	 */
	window.JsonLdGraph = function(expendedJsonLd) {
		this.resources = expendedJsonLd;
	};

	/**
	 * @return {JsonLdResource}
	 */
	window.JsonLdGraph.prototype.getMainResource = function() {
		if(this.resources.length !== 1) {
			throw new JsonLdError('The graph should only contain one resource!');
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
	window.JsonLdResource = function(expendedJsonLd) {
		this.resource = expendedJsonLd;
	};

	/**
	 * @return {string[]}
	 */
	window.JsonLdResource.prototype.getTypes = function() {
		if(!('@type' in this.resource)) {
			return [this.guessType()];
		}

		var type = this.resource['@type'];
		if(type instanceof Array) {
			return type;
		}
		return [type];
	};

	/**
	 * @private
	 */
	window.JsonLdResource.prototype.guessType = function() {
		if(this.hasValue()) {
			var value = this.resource['@value'];

			if(value.match(/^(https?)?:\/\//)) { //TODO: improve
				return 'http://schema.org/URL';
			} else {
				return 'http://schema.org/Text';
			}
		} else {
			return 'http://schema.org/Thing';
		}
	};

	/**
	 * @param {string} targetType
	 * @return {boolean}
	 */
	window.JsonLdResource.prototype.isInstanceOf = function(targetType) {
		var types = this.getTypes();

		for(var i in types) {
			var currentType = types[i];
			do {
				if(currentType === targetType) {
					return true;
				}
				currentType = window.schemaDotOrgTypeHierachy[currentType];
			} while(currentType !== undefined);
		}

		return false;
	};

	/**
	 * @return {JsonLdResource[]}
	 */
	window.JsonLdResource.prototype.getResourcesForProperty = function(property) {
		if(!(property in this.resource)) {
			return [];
		}

		return this.arrayToResources(this.resource[property]);
	};

	/**
	 * @return {JsonLdResource[]}
	 */
	window.JsonLdResource.prototype.getResourcesForReverseProperty = function(property) {
		if(!('@reverse' in this.resource) || !(property in this.resource['@reverse'])) {
			return [];
		}

		return this.arrayToResources(this.resource['@reverse'][property]);
	};

	/**
	 * @private
	 */
	window.JsonLdResource.prototype.arrayToResources = function(array) {
		var resources = [];

		for(var i in array) {
			resources.push(new window.JsonLdResource(array[i]));
		}

		return resources;
	};

	/**
	 * @return {boolean}
	 */
	window.JsonLdResource.prototype.hasId = function() {
		return '@id' in this.resource;
	};

	/**
	 * @return {string}
	 */
	window.JsonLdResource.prototype.getId = function() {
		if(!this.hasId()) {
			throw new JsonLdError('This resource has no id!');
		}

		return this.resource['@id'];
	};

	/**
	 * @return {boolean}
	 */
	window.JsonLdResource.prototype.hasValue = function() {
		return '@value' in this.resource;
	};

	/**
	 * @return {string}
	 */
	window.JsonLdResource.prototype.getValue = function() {
		if(!this.hasValue()) {
			throw new JsonLdError('This resource has no value!');
		}

		return this.resource['@value'];
	};

	/**
	 * @return {boolean}
	 */
	window.JsonLdResource.prototype.hasLanguage = function() {
		return '@language' in this.resource;
	};

	/**
	 * @return {string}
	 */
	window.JsonLdResource.prototype.getLanguage = function() {
		if(!this.hasLanguage()) {
			throw new JsonLdError('This resource has no language!');
		}

		return this.resource['@language'];
	};

	/**
	 * Returns the best resources for an ordered list of languages. Use null in order to match resources without @language
	 *
	 * @param {JsonLdResource[]} resources
	 * @param {string[]} languages
	 * @return {JsonLdResource[]}
	 */
	window.JsonLdResource.filterBestResourcesForLanguage = function(resources, languages) {
		for(var i in languages) {
			var language = languages[i];

			var matchedResources = [];
			for(var j in resources) {
				var resource = resources[j];

				if(resource.hasLanguage()) {
					if(resource.getLanguage() === language) {
						matchedResources.push(resource);
					}
				} else {
					if(language === null) {
						matchedResources.push(resource);
					}
				}
			}

			if(matchedResources.length > 0) {
				return matchedResources;
			}
		}

		return [];
	};

}(window));
