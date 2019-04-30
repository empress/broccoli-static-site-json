const shell = require('shelljs');
const { existsSync, mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');

shell.env.NODE_ENV = 'test';
shell.exec('nyc -a report --reporter=text-lcov mocha', (code, stdout) => {
  const coverageDir = join(process.cwd(), 'coverage');
  if (!existsSync(coverageDir)) {
    mkdirSync(coverageDir);
  }

  writeFileSync(join(coverageDir, 'lcov.info'), stdout);

  process.exit(code);
});
