import { chunksToLinesAsync, chomp } from '@rauschma/stringio';
import { spawn, exec } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

import getIdpData from '../constants/idp';
import { Readable } from 'stream';

const scriptPath = 'node_modules/@inrupt/generate-oidc-token/dist/index';

function getTestCase(): string {
  return process.argv.length > 2 ? process.argv[2] : '0';
}

const testCase = parseInt(getTestCase());

if (testCase === 4) {
  console.log(
    'Token generation for TEST CASE 4 -> idp has to be made manually.\nRun the following command and follow the instructions with username \u001b[32msinktest10\u001b[0m and password \u001b[32msink10Sink!\u001b[0m\n\nnode node_modules/@inrupt/generate-oidc-token/dist/index --idp https://broker.pod.inrupt.com/ --registrationType dynamic --port 3002 --applicationName sink-client\n\nClick Allow and paste the resulting token into a file called \u001b[32msink-credentials-4.json\u001b[0m. Remove the last comma to make it valid JSON and save the file.',
  );
  process.exit(0);
}

const idp = getIdpData(testCase).idp;
const idpPath = idp + getIdpData(testCase).idpPath;
const ident = getIdpData(testCase).ident;
const user = getIdpData(testCase).user;
const password = getIdpData(testCase).password;

function execShellCommand(cmd: string): Promise<any> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.warn(err);
        reject(err);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

async function extractToken(readable: Readable | AsyncIterable<string>): Promise<string | any> {
  let extract = false;
  let token = '';
  for await (const line of chunksToLinesAsync(readable)) {
    const chomped = chomp(line);
    //console.log('LINE: ' + chomped);
    if (extract) {
      token += chomped;
    }
    if (chomped.startsWith('Please visit')) {
      const link = chomped.substring(13, chomped.indexOf(' in a web browser'));
      //console.log('LINK: ' + link);
      await execShellCommand(`curl -c cookies.txt -b cookies.txt -iL '${link}'`);
      //console.log('s1: ' + s1);
      // const s2 = await execShellCommand("curl -c cookies.txt -b cookies.txt -iL '" + idpPath + "' -H \"Content-Type: application/x-www-form-urlencoded\" -d \"" + ident + "=" + user + "&password=" + password + "&remember=yes\"");
      await execShellCommand(`curl -c cookies.txt -b cookies.txt -iL '${idpPath}' -H \"Content-Type: application/x-www-form-urlencoded" -d "${ident}=${user}&password=${password}&remember=yes"`);
      //console.log('s2: ' + s2);
    }
    if (chomped.startsWith('These are your login')) {
      extract = true;
    }
    if (chomped === '}') {
      // remove illegal comma from end of json
      token = token.substring(0, token.length - 2) + '}';
      return Promise.resolve(token);
    }
  }
}

export default async function generateToken() {
  console.log('TEST CASE: ' + testCase + ' -> ' + idp);

  const child = spawn(
    'node',
    [
      scriptPath,
      '--idp',
      idp,
      '--registrationType',
      'dynamic',
      '--port',
      '3002',
      '--applicationName',
      'sink-client',
    ],
    { stdio: ['ignore', 'pipe', process.stderr] },
  );

  const token: string = await extractToken(child.stdout);

  //console.log('TOKEN = ' + token);
  const tokenFile = 'sink-credentials.json';
  writeFileSync(tokenFile, token);
  console.log('Token added to ' + tokenFile);

  //console.log('### DONE');

  unlinkSync('cookies.txt');
  child.kill();
}

