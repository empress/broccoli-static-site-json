const shell = require('shelljs');

shell.env.NODE_ENV = 'test';
shell.exec('nyc -a mocha --recursive');
