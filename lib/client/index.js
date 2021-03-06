/*
Copyright © Microsoft Open Technologies, Inc.
All Rights Reserved       
Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
 
THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
 
See the Apache 2 License for the specific language governing permissions and limitations under the License.
*/

/*
The MIT License
 
Copyright (C) 2013 Gábor Molnár <gabor@molnar.es>
 
Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:
 
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
 
THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/


var glob = require('glob').sync,
	expect = require('chai').expect,
	bunyan = require('bunyan'),
	path = require('path'),
	tls = require('tls'),
	fs = require('fs'),
	http2 = require('http2');

var Browser = require('./browser');

var implementedVersion = 'HTTP-draft-07/2.0';

describe('HTTP/2 client', function() {

	var tests = glob(__dirname + '/tests/**/*-test.js'),
		port = 1024,
		testServer, log, browser;

	function createLogger(name) {
		return bunyan.createLogger({
			name: name,
			stream: process.stdout,
			serializers: http2.serializers,
			level: 'info'
		});
	}
	beforeEach(function() {
		testServer = tls.createServer({
			key: fs.readFileSync(path.join(__dirname + '/../res/keys/localhost.key')),
			cert: fs.readFileSync(path.join(__dirname + '/../res/keys/localhost.crt')),
			NPNProtocols: [implementedVersion]
		});
		testServer.listen(port);
		browser = new Browser(process.env.HTTP2_BROWSER)
	});

	tests.forEach(function(file) {
		it(file, function(done) {
			testServer.on('secureConnection', function(socket) {
				testServer.close();
				if (socket.npnProtocol !== implementedVersion) {
					log.error('Couldn not negotiate HTTP/2 with TLS NPN, aborting');
					socket.end();
					return;
				}

				var startTest = require(file);
				startTest(socket, createLogger('test'), function(error) {
					done(error);
					socket.destroy();
				});
			});

			browser.start('https://localhost:' + port);
		});
	});

	afterEach(function() {
		browser.stop();
		port++;
	})

});