
/**
 * Reloads your browser when files change
 *
 * Notify the browser of any changes in your chain, compatible with at least the [Chrome plugin] and [Firefox plugin].
 *
 * **API**: `('livereload'[, options])`
 *
 * - `options`:
 *     - `port`: port used by the livereload server (default: `35729`)
 *
 * [Chrome plugin]: https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei
 * [Firefox plugin]: https://addons.mozilla.org/en-us/firefox/addon/livereload/
 */

'use strict';

var tinylr = require('tiny-lr');

var defaultPort = 35729;
var servers = {};
var mtimeCache = {};

function notify(livereloadServer, files, cb) {
	var filesToNotify;

	if (files.length) {
		filesToNotify = [];

		files.forEach(function(file) {
			var filename = file.filename();

			if (!mtimeCache[filename] || mtimeCache[filename] < file.stat().mtime) {
				filesToNotify.push(filename);
			}

			mtimeCache[filename] = file.stat().mtime;
		});
	} else {
		filesToNotify = ['*'];
	}

	if (filesToNotify.length) {
		livereloadServer.changed({
			body: {
				files: filesToNotify,
			},
		});
	}

	cb(null, files);
}

module.exports = function(rawOptions) {
	var options = rawOptions || {};
	var port = parseInt(options.port || defaultPort, 10);

	if (!servers[port]) {
		servers[port] = {
			livereloadServer: new tinylr.Server(options),
			listening: false,
			startup: false,
			callbacks: [],
		};
	}

	return function livereload(files, cb) {
		if (servers[port].listening) {
			notify(servers[port].livereloadServer, files, cb);
		} else {
			servers[port].callbacks.push(function() {
				notify(servers[port].livereloadServer, files, cb);
			});

			// we are already starting up this server
			if (!servers[port].startup) {
				servers[port].startup = true;

				servers[port].livereloadServer.listen(port, function() {
					servers[port].listening = true;

					// execute all calls created while we were starting up
					(function loop(callbacks) {
						var callback = callbacks.shift();

						if (callback) {
							callback();
							loop(callbacks);
						}
					}(servers[port].callbacks));
				});
			}
		}
	};
};
