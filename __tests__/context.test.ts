import {beforeEach, describe, expect, jest, test} from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as uuid from 'uuid';
import {Buildx} from '@docker/actions-toolkit/lib/buildx/buildx';
import {Context} from '@docker/actions-toolkit/lib/context';
import {Docker} from '@docker/actions-toolkit/lib/docker/docker';
import {Toolkit} from '@docker/actions-toolkit/lib/toolkit';
import {Node} from '@docker/actions-toolkit/lib/types/buildx/builder';

import * as context from '../src/context';

const fixturesDir = path.join(__dirname, 'fixtures');
// prettier-ignore
const tmpDir = path.join(process.env.TEMP || '/tmp', 'setup-buildx-jest');
const tmpName = path.join(tmpDir, '.tmpname-jest');

jest.spyOn(Context, 'tmpDir').mockImplementation((): string => {
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, {recursive: true});
  }
  return tmpDir;
});

jest.spyOn(Context, 'tmpName').mockImplementation((): string => {
  return tmpName;
});

jest.mock('uuid');
jest.spyOn(uuid, 'v4').mockReturnValue('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d');

jest.spyOn(Docker, 'context').mockImplementation((): Promise<string> => {
  return Promise.resolve('default');
});

describe('getCreateArgs', () => {
  beforeEach(() => {
    process.env = Object.keys(process.env).reduce((object, key) => {
      if (!key.startsWith('INPUT_')) {
        object[key] = process.env[key];
      }
      return object;
    }, {});
  });

  // prettier-ignore
  test.each([
    [
      0,
      'v0.10.3',
      new Map<string, string>([
        ['install', 'false'],
        ['use', 'true'],
        ['cache-binary', 'true'],
        ['cleanup', 'true'],
      ]),
      [
        'create',
        '--name', 'builder-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        '--driver', 'docker-container',
        '--buildkitd-flags', '--allow-insecure-entitlement security.insecure --allow-insecure-entitlement network.host',
        '--use'
      ]
    ],
    [
      1,
      'v0.10.3',
      new Map<string, string>([
        ['driver', 'docker'],
        ['install', 'false'],
        ['use', 'true'],
        ['cache-binary', 'true'],
        ['cleanup', 'true'],
      ]),
      [
        'create',
        '--name', 'default',
        '--driver', 'docker',
        '--buildkitd-flags', '--allow-insecure-entitlement security.insecure --allow-insecure-entitlement network.host',
        '--use'
      ]
    ],
    [
      2,
      'v0.10.3',
      new Map<string, string>([
        ['install', 'false'],
        ['use', 'false'],
        ['driver-opts', 'image=315120000506.dkr.ecr.us-east-1.amazonaws.com/hotmart/third-party/setup-buildx-action:latest\nnetwork=host'],
        ['cache-binary', 'true'],
        ['cleanup', 'true'],
      ]),
      [
        'create',
        '--name', 'builder-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        '--driver', 'docker-container',
        '--driver-opt', 'image=315120000506.dkr.ecr.us-east-1.amazonaws.com/hotmart/third-party/setup-buildx-action:latest',
        '--driver-opt', 'network=host',
        '--buildkitd-flags', '--allow-insecure-entitlement security.insecure --allow-insecure-entitlement network.host'
      ]
    ],
    [
      3,
      'v0.10.3',
      new Map<string, string>([
        ['driver', 'remote'],
        ['endpoint', 'tls://foo:1234'],
        ['install', 'false'],
        ['use', 'true'],
        ['cache-binary', 'true'],
        ['cleanup', 'true'],
      ]),
      [
        'create',
        '--name', 'builder-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        '--driver', 'remote',
        '--use',
        'tls://foo:1234'
      ]
    ],
    [
      4,
      'v0.10.3',
      new Map<string, string>([
        ['driver', 'remote'],
        ['platforms', 'linux/arm64,linux/arm/v7'],
        ['endpoint', 'tls://foo:1234'],
        ['install', 'false'],
        ['use', 'true'],
        ['cache-binary', 'true'],
        ['cleanup', 'true'],
      ]),
      [
        'create',
        '--name', 'builder-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        '--driver', 'remote',
        '--platform', 'linux/arm64,linux/arm/v7',
        '--use',
        'tls://foo:1234'
      ]
    ],
    [
      5,
      'v0.10.3',
      new Map<string, string>([
        ['install', 'false'],
        ['use', 'false'],
        ['driver-opts', `"env.no_proxy=localhost,127.0.0.1,.mydomain"`],
        ['cache-binary', 'true'],
        ['cleanup', 'true'],
      ]),
      [
        'create',
        '--name', 'builder-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        '--driver', 'docker-container',
        '--driver-opt', '"env.no_proxy=localhost,127.0.0.1,.mydomain"',
        '--buildkitd-flags', '--allow-insecure-entitlement security.insecure --allow-insecure-entitlement network.host'
      ]
    ],
    [
      6,
      'v0.10.3',
      new Map<string, string>([
        ['install', 'false'],
        ['use', 'false'],
        ['platforms', 'linux/amd64\n"linux/arm64,linux/arm/v7"'],
        ['cache-binary', 'true'],
        ['cleanup', 'true'],
      ]),
      [
        'create',
        '--name', 'builder-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        '--driver', 'docker-container',
        '--buildkitd-flags', '--allow-insecure-entitlement security.insecure --allow-insecure-entitlement network.host',
        '--platform', 'linux/amd64,linux/arm64,linux/arm/v7'
      ]
    ],
    [
      7,
      'v0.10.3',
      new Map<string, string>([
        ['install', 'false'],
        ['use', 'false'],
        ['driver', 'unknown'],
        ['cache-binary', 'true'],
        ['cleanup', 'true'],
      ]),
      [
        'create',
        '--name', 'builder-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        '--driver', 'unknown',
      ]
    ],
    [
      8,
      'v0.10.3',
      new Map<string, string>([
        ['install', 'false'],
        ['use', 'false'],
        ['buildkitd-config', path.join(fixturesDir, 'buildkitd.toml')],
        ['cache-binary', 'true'],
        ['cleanup', 'true'],
      ]),
      [
        'create',
        '--name', 'builder-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        '--driver', 'docker-container',
        '--buildkitd-flags', '--allow-insecure-entitlement security.insecure --allow-insecure-entitlement network.host',
        '--config', tmpName,
      ]
    ],
    [
      9,
      'v0.10.3',
      new Map<string, string>([
        ['install', 'false'],
        ['use', 'false'],
        ['buildkitd-config-inline', 'debug = true'],
        ['cache-binary', 'true'],
        ['cleanup', 'true'],
      ]),
      [
        'create',
        '--name', 'builder-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        '--driver', 'docker-container',
        '--buildkitd-flags', '--allow-insecure-entitlement security.insecure --allow-insecure-entitlement network.host',
        '--config', tmpName,
      ]
    ]
  ])(
    '[%d] given buildx %s and %p as inputs, returns %p',
    async (num: number, buildxVersion: string, inputs: Map<string, string>, expected: Array<string>) => {
      inputs.forEach((value: string, name: string) => {
        setInput(name, value);
      });
      const toolkit = new Toolkit();
      jest.spyOn(Buildx.prototype, 'version').mockImplementation(async (): Promise<string> => {
        return buildxVersion;
      });
      const inp = await context.getInputs();
      const res = await context.getCreateArgs(inp, toolkit);
      expect(res).toEqual(expected);
    }
  );
});

describe('getAppendArgs', () => {
  beforeEach(() => {
    process.env = Object.keys(process.env).reduce((object, key) => {
      if (!key.startsWith('INPUT_')) {
        object[key] = process.env[key];
      }
      return object;
    }, {});
  });

  // prettier-ignore
  test.each([
    [
      0,
      'v0.10.3',
      new Map<string, string>([
        ['install', 'false'],
        ['use', 'true'],
        ['cache-binary', 'true'],
        ['cleanup', 'true'],
      ]),
      {
        "name": "aws_graviton2",
        "endpoint": "ssh://me@graviton2",
        "driver-opts": [
          "image=315120000506.dkr.ecr.us-east-1.amazonaws.com/hotmart/third-party/setup-buildx-action:latest"
        ],
        "buildkitd-flags": "--allow-insecure-entitlement security.insecure --allow-insecure-entitlement network.host",
        "platforms": "linux/arm64"
      },
      [
        'create',
        '--name', 'builder-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        '--append',
        '--node', 'aws_graviton2',
        '--driver-opt', 'image=315120000506.dkr.ecr.us-east-1.amazonaws.com/hotmart/third-party/setup-buildx-action:latest',
        '--buildkitd-flags', '--allow-insecure-entitlement security.insecure --allow-insecure-entitlement network.host',
        '--platform', 'linux/arm64',
        'ssh://me@graviton2'
      ]
    ]
  ])(
    '[%d] given buildx %s and %p as inputs, returns %p',
    async (num: number, buildxVersion: string, inputs: Map<string, string>, node: Node, expected: Array<string>) => {
      inputs.forEach((value: string, name: string) => {
        setInput(name, value);
      });
      const toolkit = new Toolkit();
      jest.spyOn(Buildx.prototype, 'version').mockImplementation(async (): Promise<string> => {
        return buildxVersion;
      });
      const inp = await context.getInputs();
      const res = await context.getAppendArgs(inp, node, toolkit);
      expect(res).toEqual(expected);
    }
  );
});

// See: https://github.com/actions/toolkit/blob/master/packages/core/src/core.ts#L67
function getInputName(name: string): string {
  return `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
}

function setInput(name: string, value: string): void {
  process.env[getInputName(name)] = value;
}
