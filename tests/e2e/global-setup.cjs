const { execFileSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  execFileSync('php', [path.join(__dirname, '..', 'seed_visual.php')], {
    cwd: path.join(__dirname, '..', '..'),
    stdio: 'inherit',
  });
};

