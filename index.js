const core = require('@actions/core');
const fs = require('fs');
const { execSync } = require('child_process');

try {
  // Get inputs
  const source = core.getInput('source') || './package.json';
  const versionPattern = new RegExp(core.getInput('version_pattern') || 'v\\d+\\.\\d+\\.\\d+');

  let currentVersion;

  // Determine current version
  if (source === 'package.json') {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    currentVersion = packageJson.version;
  } else {
    currentVersion = fs.readFileSync(source, 'utf8').trim();
  }

  // Fetch Git tags and find the latest version
  execSync('git fetch --tags');
  const tags = execSync(`git tag -l | grep -E "${versionPattern.source}" || true`)
    .toString()
    .split('\n')
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .pop();

  const latestTag = tags ? tags.replace(/^v/, '') : null;

  // Compare versions and set output
  if (currentVersion === latestTag) {
    core.setOutput('updated_version', 'no changes');
  } else {
    core.setOutput('updated_version', currentVersion);
  }
} catch (error) {
  core.setFailed(`Action failed with error: ${error.message}`);
}
