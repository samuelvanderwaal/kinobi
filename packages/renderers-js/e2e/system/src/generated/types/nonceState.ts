/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/kinobi-so/kinobi
 */

import {
  Codec,
  Decoder,
  Encoder,
  combineCodec,
  getEnumDecoder,
  getEnumEncoder,
  getU32Decoder,
  getU32Encoder,
} from '@solana/web3.js';

export enum NonceState {
  Uninitialized,
  Initialized,
}

export type NonceStateArgs = NonceState;

export function getNonceStateEncoder(): Encoder<NonceStateArgs> {
  return getEnumEncoder(NonceState, { size: getU32Encoder() });
}

export function getNonceStateDecoder(): Decoder<NonceState> {
  return getEnumDecoder(NonceState, { size: getU32Decoder() });
}

export function getNonceStateCodec(): Codec<NonceStateArgs, NonceState> {
  return combineCodec(getNonceStateEncoder(), getNonceStateDecoder());
}
