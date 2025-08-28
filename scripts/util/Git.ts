import { execSync } from 'child_process';
import fs from 'fs';

class Git {
  public getLastCommit(): string {
    const lastCommit = execSync('git log -1 --pretty=%B').toString().trim();
    return lastCommit || '';
  }

  public addNewRelease(release: string, message: string) {
    execSync('git add .');
    execSync(`git commit -m "update version on package.json"`);
    execSync('git pull origin main');
    execSync('git push origin main');
    execSync(`git tag -a v${release} -m "${message}"`);
    execSync(`git push origin v${release}`);
  }

  public getReleaseMessage() {
    const messages = execSync(`git tag -l --format="%(subject)"`, {
      encoding: 'utf8',
    });

    return messages.split('\n').filter(Boolean).pop();
  }

  private getLatestTag() {
    execSync('git fetch --tags', { stdio: 'inherit' });
    const tags = execSync('git tag --list', { encoding: 'utf8' });
    return tags.split('\n').filter(Boolean).pop();
  }

  public async postSetup() {
    const paths = ['logs', 'input/temp', 'output/temp'];

    for (const path of paths) {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
    }
  }
}

export default new Git();
