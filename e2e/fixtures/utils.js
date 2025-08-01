import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { DEFAULT_GANACHE_PORT } from '../../app/util/test/ganache';
import { DEFAULT_ANVIL_PORT } from '../../e2e/seeder/anvil-manager';
import { DEFAULT_FIXTURE_SERVER_PORT } from './fixture-server';
import { DEFAULT_DAPP_SERVER_PORT } from './fixture-helper';
export const DEFAULT_MOCKSERVER_PORT = 8000;

function transformToValidPort(defaultPort, pid) {
  // Improve uniqueness by using a simple transformation
  const transformedPort = (parseInt(pid, 10) % 100000) + defaultPort;

  // Ensure the transformed port falls within the valid port range (0-65535)
  return transformedPort % 65536;
}

function getServerPort(defaultPort) {
  if (process.env.CI) {
    return transformToValidPort(defaultPort, process.pid);
  }
  return defaultPort;
}

/**
 * Gets the URL for the second test dapp.
 * This function is used instead of a constant to ensure device.getPlatform() is called
 * after Detox is properly initialized, preventing initialization errors in the apiSpecs tests.
 *
 * @returns {string} The URL for the second test dapp
 */
export function getSecondTestDappLocalUrl() {
  const host = device.getPlatform() === 'android' ? '10.0.2.2' : '127.0.0.1';
  return `http://${host}:${getSecondTestDappPort()}`;
}

export function getGanachePort() {
  return getServerPort(DEFAULT_GANACHE_PORT);
}
export function AnvilPort() {
  return getServerPort(DEFAULT_ANVIL_PORT);
}
export function getFixturesServerPort() {
  return getServerPort(DEFAULT_FIXTURE_SERVER_PORT);
}

export function getLocalTestDappPort() {
  return getServerPort(DEFAULT_DAPP_SERVER_PORT);
}

export function getLocalTestDappUrl() {
  return `http://localhost:${getLocalTestDappPort()}`;
}

export function getMockServerPort() {
  return getServerPort(DEFAULT_MOCKSERVER_PORT);
}

export function getSecondTestDappPort() {
  // Use a different base port for the second dapp
  return getServerPort(DEFAULT_DAPP_SERVER_PORT + 1);
}

export function buildPermissions(chainIds) {
  // default mainnet
  const optionalScopes = { 'eip155:1': { accounts: [] } };

  for (const chainId of chainIds) {
    optionalScopes[`eip155:${parseInt(chainId)}`] = {
      accounts: [],
    };
  }
  return {
    [Caip25EndowmentPermissionName]: {
      caveats: [
        {
          type: Caip25CaveatType,
          value: {
            optionalScopes,
            requiredScopes: {},
            sessionProperties: {},
            isMultichainOrigin: false,
          },
        },
      ],
    },
  };
}
