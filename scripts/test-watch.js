const shell = require('shelljs');

shell.env.NODE_ENV = 'test';
shell.exec('mocha --recursive -w --reporter min');
