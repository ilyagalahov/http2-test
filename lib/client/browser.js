var spawn = require('child_process').spawn;

function Browser(exe) {
	this.exe = exe || __dirname + '/../res/sampleBrowser.js';
	this.process = null;
}

Browser.prototype.start = function(url) {
	if (this.process !== null) {
		this.process.kill();
	}
	this.process = spawn(this.exe, [url], {
		stdio: [process.stdin, process.stdout, process.stderr]
	});
}

Browser.prototype.stop = function() {
	if (this.process !== null) {
		this.process.kill();
	}
}

module.exports = Browser;