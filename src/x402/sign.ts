/**
 * x402 "exact" EVM signer for the MCP `pay_order` tool (DEC-051).
 *
 * Builds and signs the EIP-3009 `transferWithAuthorization` typed-data message
 * that x402 requires, using viem's local signer. This is the ONLY place the
 * buyer's private key is used — it is read from the caller, never logged, and
 * never leaves the process. The signed authorization is base64-encoded into the
 * `X-PAYMENT` header the gateway forwards to the facilitator for on-chain
 * settlement.
 *
 * Env-gated at the tool layer: with `X402_BUYER_PRIVATE_KEY` unset, `pay_order`
 * returns the 402 terms and never calls this module.
 */
import { privateKeyToAccount } from 'viem/accounts'
import type { X402PaymentRequirements } from '@merk.a2a/sdk'

/** x402 network → EVM chainId (must match the gateway's NETWORK_DEFAULTS). */
const NETWORK_CHAIN_IDS: Record<string, number> = {
  base: 8453,
  'base-sepolia': 84532,
}

/** Thrown when an authorization cannot be signed (bad key, unsupported net). */
export class X402SignError extends Error {
  readonly code = 'X402_SIGN_ERROR'
  constructor(message: string) {
    super(message)
    this.name = 'X402SignError'
  }
}

export interface SignedX402Payment {
  /** base64 JSON PaymentPayload for the `X-PAYMENT` header. */
  xPaymentB64: string
  /** The payer address derived from the signing key. */
  from: string
}

/** A cryptographically-random 32-byte nonce as a 0x-prefixed hex string. */
function randomNonce(): `0x${string}` {
  const bytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `0x${hex}`
}

/**
 * Sign an x402 "exact" EVM authorization for the given payment requirements.
 * Pays exactly `maxAmountRequired` to `payTo`; the authorization is valid from
 * now until `now + maxTimeoutSeconds`.
 */
export async function signExactAuthorization(
  reqs: X402PaymentRequirements,
  privateKey: string,
): Promise<SignedX402Payment> {
  if (reqs.scheme !== 'exact') {
    throw new X402SignError(`unsupported x402 scheme "${reqs.scheme}" (only "exact")`)
  }
  const chainId = NETWORK_CHAIN_IDS[reqs.network]
  if (!chainId) {
    throw new X402SignError(`unsupported x402 network "${reqs.network}"`)
  }

  const normalized = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`
  let account
  try {
    account = privateKeyToAccount(normalized)
  } catch {
    // Never echo the key material in the error.
    throw new X402SignError('invalid X402_BUYER_PRIVATE_KEY (expected a 32-byte hex private key)')
  }

  const now = Math.floor(Date.now() / 1000)
  const validAfter = '0'
  const validBefore = String(now + (reqs.maxTimeoutSeconds || 60))
  const nonce = randomNonce()

  // The wire-format authorization (all string fields, per x402 v1).
  const authorization = {
    from: account.address,
    to: reqs.payTo,
    value: reqs.maxAmountRequired,
    validAfter,
    validBefore,
    nonce,
  }

  const signature = await account.signTypedData({
    domain: {
      name: reqs.extra.name,
      version: reqs.extra.version,
      chainId,
      verifyingContract: reqs.asset as `0x${string}`,
    },
    types: {
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization',
    message: {
      from: account.address,
      to: reqs.payTo as `0x${string}`,
      value: BigInt(reqs.maxAmountRequired),
      validAfter: BigInt(validAfter),
      validBefore: BigInt(validBefore),
      nonce,
    },
  })

  const payload = {
    x402Version: 1,
    scheme: 'exact',
    network: reqs.network,
    payload: { signature, authorization },
  }
  const xPaymentB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
  return { xPaymentB64, from: account.address }
}
