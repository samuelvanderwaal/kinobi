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

export enum NonceVersion {
  Legacy,
  Current,
}

export type NonceVersionArgs = NonceVersion;

export function getNonceVersionEncoder(): Encoder<NonceVersionArgs> {
  return getEnumEncoder(NonceVersion, { size: getU32Encoder() });
}

export function getNonceVersionDecoder(): Decoder<NonceVersion> {
  return getEnumDecoder(NonceVersion, { size: getU32Decoder() });
}

export function getNonceVersionCodec(): Codec<NonceVersionArgs, NonceVersion> {
  return combineCodec(getNonceVersionEncoder(), getNonceVersionDecoder());
}
