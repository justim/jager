
'use strict';

var path = require('path');
var extend = require('util')._extend;

var async = require('async');
var less = require('less');

var __root = process.cwd();

function compileLess(options, file, cb) {
	var basePath = options.basePath || __root;

	var lessOptions = {
		paths: [basePath],
		filename: path.relative(__root, file.filename()),
	};

	extend(lessOptions, options);

	if (options.sourceMap === 'inline') {
		lessOptions.sourceMap = {
			sourceMapFileInline: true,
			outputSourceFiles: true,
		};
	}

	less.render(file.contents(), lessOptions)
		.then(function(output) {
			file.contents(output.css);
			cb(null, file);
		},
		function(err) {
			cb(err);
		});
}

module.exports = function(options) {
	options = options || {};

	return function less(files, cb) {
		async.map(files, compileLess.bind(null, options), cb);
	};
};
