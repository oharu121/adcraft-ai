import fs from 'fs';
import Git from './util/Git';

const config = {
  releaseType: 'Patch' as 'Major' | 'Minor' | 'Patch',
  msg: 'fix test files',
};

(async () => {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
  const currentVersion = packageJson.version;
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  let newVersion = '';
  switch (config.releaseType) {
    case 'Major':
      newVersion = `${major + 1}.0.0`; // Increment major, reset minor and patch
      break;
    case 'Minor':
      newVersion = `${major}.${minor + 1}.0`; // Increment minor, reset patch
      break;
    case 'Patch':
      newVersion = `${major}.${minor}.${patch + 1}`; // Increment patch
      break;
    default:
      throw new Error('Invalid releaseType specified in config.');
  }

  packageJson.version = newVersion;
  const updatedPackageJson = JSON.stringify(packageJson, null, 2);
  fs.writeFileSync('./package.json', updatedPackageJson, 'utf-8');

  Git.addNewRelease(newVersion, config.msg);

  process.exit(0);
})();
