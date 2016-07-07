
/**
 * Serve files that are currently in the chain
 *
 * Set up a server that serves all files in its chain
 *
 * _Note: not for production use_
 *
 * **API**: `('server'[, options])`
 *
 * - `options`:
 *     - `port`: port used for the server
 */

'use strict';

var http = require('http');
var path = require('path');
var each = require('lodash/each');

var connect = require('connect');

var __root = process.cwd();

var DEFAULT_PORT = 3000;

function Server(port) {
	this._files = {};

	var app = connect();

	app.use(this._serveFile.bind(this));

	http.createServer(app).listen(port);
}

Server.prototype._serveFile = function(request, response) {
	var files = this._getListOfFiles();
	var found = false;

	files.forEach(function(file) {
		if (request.url === file.url) {
			found = true;

			response.writeHead(200, {
				'Content-Length': file.file.buffer().length,
			});

			response.end(file.file.buffer());
		}
	});

	if (!found) {
		this._serveListOfFiles(response);
	}
};

Server.prototype._serveListOfFiles = function(response) {
	var files = this._getListOfFiles();
	var content = {
		error: 'Could not find file',
		files: files.map(function(file) { return file.url; }),
	};

	var buffer = new Buffer(JSON.stringify(content, 4));

	response.writeHead(404, {
		'Content-Type': 'text/javascript; charset=UTF-8',
		'Content-Length': buffer.length,
	});

	response.end(buffer);
};

Server.prototype._getListOfFiles = function() {
	var files = [];

	each(this._files, function(fileList) {
		files = files.concat(fileList.map(function(file) {
			return {
				url: '/' + path.relative(__root, file.filename()),
				file: file,
			};
		}));
	});

	return files;
};

Server.prototype.setFiles = function setFiles(chainId, files) {
	this._files[chainId] = files;
};

var serverInstances = {};

module.exports = function(rawOptions) {
	var options = rawOptions || {};
	var port = parseInt(options.port || DEFAULT_PORT, 10);

	return function server(files, cb) {
		var chainId = this.getChainId();

		if (!serverInstances[port]) {
			serverInstances[port] = new Server(port);
		}

		serverInstances[port].setFiles(chainId, files);

		cb(null, files);
	};
};
