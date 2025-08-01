/* eslint-disable no-console, import/no-nodejs-modules */
import FixtureServer, { DEFAULT_FIXTURE_SERVER_PORT } from './fixture-server';
import FixtureBuilder from './fixture-builder';
import { AnvilManager, defaultOptions } from '../seeder/anvil-manager';
import Ganache from '../../app/util/test/ganache';

import GanacheSeeder from '../../app/util/test/ganache-seeder';
import axios from 'axios';
import path from 'path';
import createStaticServer from '../create-static-server';
import {
  DEFAULT_MOCKSERVER_PORT,
  getFixturesServerPort,
  getLocalTestDappPort,
  getMockServerPort,
} from './utils';
import Utilities from '../utils/Utilities';
import TestHelpers from '../helpers';
import { startMockServer, stopMockServer } from '../api-mocking/mock-server';
import { AnvilSeeder } from '../seeder/anvil-seeder';
import { Buffer } from 'buffer';
import crypto from 'crypto';

export const DEFAULT_DAPP_SERVER_PORT = 8085;
export const DEFAULT_TEST_DAPP_PATH = path.join(
  '..',
  '..',
  'node_modules',
  '@metamask',
  'test-dapp',
  'dist',
);
export const DEFAULT_MULTICHAIN_TEST_DAPP_PATH = path.join(
  '..',
  '..',
  'node_modules',
  '@metamask',
  'test-dapp-multichain',
  'build',
);
export const DEFAULT_SOLANA_TEST_DAPP_PATH = path.join(
  '..',
  '..',
  'node_modules',
  '@metamask',
  'test-dapp-solana',
  'dist',
);

// While Appium is still in use it's necessary to check if getFixturesServerPort if defined and provide a fallback in case it's not.
const getFixturesPort =
  typeof getFixturesServerPort === 'function'
    ? getFixturesServerPort
    : () => DEFAULT_FIXTURE_SERVER_PORT;
const FIXTURE_SERVER_URL = `http://localhost:${getFixturesPort()}/state.json`;

// Helper constant for multichain testing
export const DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS = {
  dapp: true,
  multichainDapp: true,
};

// checks if server has already been started
const isFixtureServerStarted = async () => {
  try {
    const response = await axios.get(FIXTURE_SERVER_URL);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

// SRP corresponding to the vault set in the default fixtures - it's an empty test account, not secret
export const defaultGanacheOptions = {
  hardfork: 'london',
  mnemonic:
    'drive manage close raven tape average sausage pledge riot furnace august tip',
};

/**
 *
 * Normalizes the localNodeOptions into a consistent format to handle different data structures.
 * Case 1: A string: localNodeOptions = 'anvil'
 * Case 2: Array of strings: localNodeOptions = ['anvil', 'bitcoin']
 * Case 3: Array of objects: localNodeOptions =
 * [
 *  { type: 'anvil', options: {anvilOpts}},
 *  { type: 'bitcoin',options: {bitcoinOpts}},
 * ]
 * Case 4: Options object without type: localNodeOptions = {options}
 *
 * @param {string | object | Array} localNodeOptions - The input local node options.
 * @returns {Array} The normalized local node options.
 */
function normalizeLocalNodeOptions(localNodeOptions) {
  if (typeof localNodeOptions === 'string') {
    // Case 1: Passing a string
    return [
      {
        type: localNodeOptions,
        options:
          localNodeOptions === 'ganache'
            ? defaultGanacheOptions
            : localNodeOptions === 'anvil'
            ? defaultOptions
            : {},
      },
    ];
  } else if (Array.isArray(localNodeOptions)) {
    return localNodeOptions.map((node) => {
      if (typeof node === 'string') {
        // Case 2: Array of strings
        return {
          type: node,
          options:
            node === 'ganache'
              ? defaultGanacheOptions
              : node === 'anvil'
              ? defaultOptions
              : {},
        };
      }
      if (typeof node === 'object' && node !== null) {
        // Case 3: Array of objects
        return {
          type: node.type,
          options:
            node.type === 'ganache'
              ? { ...defaultGanacheOptions, ...(node.options || {}) }
              : node.type === 'anvil'
              ? { ...defaultOptions, ...(node.options || {}) }
              : node.options || {},
        };
      }
      throw new Error(`Invalid localNodeOptions entry: ${node}`);
    });
  }
  if (typeof localNodeOptions === 'object' && localNodeOptions !== null) {
    // Case 4: Passing an options object without type
    return [
      {
        type: 'anvil',
        options: localNodeOptions,
      },
    ];
  }
  throw new Error(`Invalid localNodeOptions type: ${typeof localNodeOptions}`);
}

/**
 * Loads a fixture into the fixture server.
 *
 * @param {FixtureServer} fixtureServer - An instance of the FixtureServer class responsible for loading fixtures.
 * @param {Object} options - An object containing the fixture to load.
 * @param {Object} [options.fixture] - The fixture data to load. If not provided, a default fixture is created.
 * @returns {Promise<void>} - A promise that resolves once the fixture is successfully loaded.
 * @throws {Error} - Throws an error if the fixture fails to load or if the fixture server is not properly set up.
 */
export const loadFixture = async (fixtureServer, { fixture } = {}) => {
  // If no fixture is provided, the `onboarding` option is set to `true` by default, which means
  // the app will be loaded without any fixtures and will start and go through the onboarding process.
  const state = fixture || new FixtureBuilder({ onboarding: true }).build();
  await fixtureServer.loadJsonState(state);
  // Checks if state is loaded
  const response = await axios.get(FIXTURE_SERVER_URL);

  // Throws if state is not properly loaded
  if (response.status !== 200) {
    throw new Error('Not able to load fixtures');
  }
};

// Start the fixture server
export const startFixtureServer = async (fixtureServer) => {
  if (await isFixtureServerStarted()) {
    console.log('The fixture server has already been started');
    return;
  }

  try {
    await fixtureServer.start();
    console.log('The fixture server is started');
  } catch (err) {
    console.log('Fixture server error:', err);
  }
};

// Stop the fixture server
export const stopFixtureServer = async (fixtureServer) => {
  if (!(await isFixtureServerStarted())) {
    console.log('The fixture server has already been stopped');
    return;
  }
  await fixtureServer.stop();
  console.log('The fixture server is stopped');
};

/**
 * Executes a test suite with fixtures by setting up a fixture server, loading a specified fixture,
 * and running the test suite. After the test suite execution, it stops the fixture server.
 *
 * @param {Object} options - An object containing configuration options.
 * @param {Object} options.fixture - The fixture to load.
 * @param {boolean} [options.dapp] - The dapp to load.
 * @param {boolean} [options.multichainDapp=false]
 * @param {string} [options.dappPath] - The dapp path to use.
 * @param {Object} [options.ganacheOptions] - The test specific mock to load for test.
 * @param {import('detox/detox').LanguageAndLocale} [options.languageAndLocale] - The language and locale to use for the app.
 * @param {Object} [options.launchArgs] - Additional launch arguments for the app.
 * @param {boolean} [options.restartDevice=false] - If true, restarts the app to apply the loaded fixture.
 * @param {Object} [options.smartContract] - The smart contract to load for test.
 * @param {Object} [options.testSpecificMock] - The test specific mock to load for test.
 * @param {Object} [options.permissions] - The permissions to set for the device.
 * @param {Function} testSuite - The test suite function to execute after setting up the fixture.
 * @param {Object} testSuite.params - The parameters passed to the test suite function.
 * @param {Object} [testSuite.params.contractRegistry] - Registry of deployed smart contracts.
 * @param {Object} [testSuite.params.mockServer] - Mock server instance for API mocking.
 * @param {Array} testSuite.params.localNodes - Array of local blockchain nodes (Anvil/Ganache instances).
 * @returns {Promise<void>} - A promise that resolves once the test suite completes.
 * @throws {Error} - Throws an error if an exception occurs during the test suite execution.
 */
export async function withFixtures(options, testSuite) {
  const {
    fixture,
    restartDevice = false,
    ganacheOptions,
    smartContract,
    disableGanache,
    dapp,
    multichainDapp = false,
    localNodeOptions = 'anvil',
    dappOptions,
    dappPath = undefined,
    dappPaths,
    testSpecificMock,
    launchArgs,
    languageAndLocale,
    permissions = {},
  } = options;

  const fixtureServer = new FixtureServer();
  let mockServer;
  let mockServerPort = DEFAULT_MOCKSERVER_PORT;
  const localNodeOptsNormalized = normalizeLocalNodeOptions(localNodeOptions);

  if (testSpecificMock) {
    mockServerPort = getMockServerPort();
    mockServer = await startMockServer(testSpecificMock, mockServerPort);
  }

  let localNode;
  const localNodes = [];

  try {
    // Start servers based on the localNodes array
    if (!disableGanache) {
      for (let i = 0; i < localNodeOptsNormalized.length; i++) {
        const nodeType = localNodeOptsNormalized[i].type;
        const nodeOptions = localNodeOptsNormalized[i].options || {};

        switch (nodeType) {
          case 'anvil':
            localNode = new AnvilManager();
            await localNode.start(nodeOptions);
            localNodes.push(localNode);
            break;

          case 'ganache':
            localNode = new Ganache();
            await localNode.start(nodeOptions);
            localNodes.push(localNode);
            break;

          case 'none':
            break;

          default:
            throw new Error(
              `Unsupported localNode: '${nodeType}'. Cannot start the server.`,
            );
        }
      }
    }
  } catch (error) {
    console.error(error);
    throw error;
  }

  const dappBasePort = getLocalTestDappPort();
  let numberOfDapps = dapp ? 1 : 0;
  const dappServer = [];

  try {
    let contractRegistry;
    let seeder;

    // We default the smart contract seeder to the first node client
    // If there's a future need to deploy multiple smart contracts in multiple clients
    // this assumption is no longer correct and the below code needs to be modified accordingly
    if (smartContract) {
      switch (localNodeOptsNormalized[0].type) {
        case 'anvil':
          seeder = new AnvilSeeder(localNodes[0].getProvider());
          break;

        case 'ganache':
          seeder = new GanacheSeeder(localNodes[0].getProvider());
          break;

        default:
          throw new Error(
            `Unsupported localNode: '${localNodeOptsNormalized[0].type}'. Cannot deploy smart contracts.`,
          );
      }
      const contracts =
        smartContract instanceof Array ? smartContract : [smartContract];

      const hardfork = localNodeOptsNormalized[0].options.hardfork || 'prague';
      for (const contract of contracts) {
        await seeder.deploySmartContract(contract, hardfork);
      }

      contractRegistry = seeder.getContractRegistry();
    }

    if (dapp) {
      if (dappOptions?.numberOfDapps) {
        numberOfDapps = dappOptions.numberOfDapps;
      }
      for (let i = 0; i < numberOfDapps; i++) {
        let dappDirectory;
        if (dappPath || (dappPaths && dappPaths[i])) {
          dappDirectory = path.resolve(__dirname, dappPath || dappPaths[i]);
        } else {
          dappDirectory = multichainDapp
            ? path.resolve(__dirname, DEFAULT_MULTICHAIN_TEST_DAPP_PATH)
            : path.resolve(__dirname, DEFAULT_TEST_DAPP_PATH);
        }
        dappServer.push(createStaticServer(dappDirectory));
        dappServer[i].listen(`${dappBasePort + i}`);
        await new Promise((resolve, reject) => {
          dappServer[i].on('listening', resolve);
          dappServer[i].on('error', reject);
        });
      }
    }

    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture });
    console.log(
      'The fixture server is started, and the initial state is successfully loaded.',
    );
    // Due to the fact that the app was already launched on `init.js`, it is necessary to
    // launch into a fresh installation of the app to apply the new fixture loaded perviously.
    if (restartDevice) {
      await TestHelpers.launchApp({
        delete: true,
        launchArgs: {
          fixtureServerPort: `${getFixturesServerPort()}`,
          detoxURLBlacklistRegex: Utilities.BlacklistURLs,
          mockServerPort: `${mockServerPort}`,
          ...(launchArgs || {}),
        },
        languageAndLocale,
        permissions,
      });
    }

    await testSuite({ contractRegistry, mockServer, localNodes }); // Pass localNodes instead of anvilServer
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    // Clean up all local nodes
    for (const server of localNodes) {
      if (server) {
        await server.quit();
      }
    }

    if (dapp) {
      for (let i = 0; i < numberOfDapps; i++) {
        if (dappServer[i] && dappServer[i].listening) {
          await new Promise((resolve, reject) => {
            dappServer[i].close((error) => {
              if (error) {
                return reject(error);
              }
              return resolve();
            });
          });
        }
      }
    }

    if (testSpecificMock) {
      await stopMockServer(mockServer);
    }

    await stopFixtureServer(fixtureServer);
  }
}

/**
 * Generates a random salt for encryption purposes.
 *
 * @param {*} byteCount
 * @returns
 */

function generateSalt(byteCount = 32) {
  const view = crypto.randomBytes(byteCount);

  return Buffer.from(view).toString('base64');
}

/**
 * Encrypts a vault object using AES-256-CBC encryption with a password.
 *
 * @param {Object} vault - The vault object to encrypt.
 * @param {string} [password='123123123'] - The password used for encryption.
 * @returns {string} - The encrypted vault as a JSON string.
 */
export function encryptVault(vault, password = '123123123') {
  const salt = generateSalt(16);
  const passBuffer = Buffer.from(password, 'utf-8');
  // Parse base 64 string as utf-8 because mobile encryptor is flawed.
  const saltBuffer = Buffer.from(salt, 'utf-8');
  const iv = crypto.randomBytes(16);

  // Derive key using PBKDF2
  const derivedKey = crypto.pbkdf2Sync(
    passBuffer,
    saltBuffer,
    5000,
    32,
    'sha512',
  );

  const json = JSON.stringify(vault);
  const buffer = Buffer.from(json, 'utf-8');

  // Encrypt using AES-256-CBC
  const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
  let encrypted = cipher.update(buffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Prepare the result object
  const result = {
    keyMetadata: { algorithm: 'PBKDF2', params: { iterations: 5000 } },
    lib: 'original',
    cipher: encrypted.toString('base64'),
    iv: iv.toString('hex'),
    salt,
  };

  // Convert the result to a JSON string
  return JSON.stringify(result);
}

/**
 *  Decrypts a vault object that was encrypted using AES-256-CBC encryption with a password.
 *
 * @param {string} vault - The encrypted vault as a JSON string.
 * @param {string} [password='123123123'] - The password used for encryption.
 * @returns {Object} - The decrypted vault JSON object.
 */

export function decryptVault(vault, password = '123123123') {
  // 1. Parse vault inputs
  const vaultJson = JSON.parse(vault);
  const cipherText = Buffer.from(vaultJson.cipher, 'base64');
  const iv = Buffer.from(vaultJson.iv, 'hex');
  const salt = vaultJson.salt;

  // "flawed": interpret base64 string as UTF-8 bytes, not decoded
  const saltBuffer = Buffer.from(salt, 'utf-8');
  const passBuffer = Buffer.from(password, 'utf-8');

  // 2. Recreate PBKDF2 key
  const derivedKey = crypto.pbkdf2Sync(
    passBuffer,
    saltBuffer,
    5000,
    32,
    'sha512',
  );

  // 3. Decrypt
  const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
  let decrypted = decipher.update(cipherText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  // 4. Convert back to string and parse JSON
  const decryptedText = decrypted.toString('utf-8');
  return JSON.parse(decryptedText);
}
