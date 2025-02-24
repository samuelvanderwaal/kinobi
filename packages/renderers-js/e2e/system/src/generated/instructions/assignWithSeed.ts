/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/kinobi-so/kinobi
 */

import {
  Address,
  Codec,
  Decoder,
  Encoder,
  IAccountMeta,
  IAccountSignerMeta,
  IInstruction,
  IInstructionWithAccounts,
  IInstructionWithData,
  ReadonlySignerAccount,
  TransactionSigner,
  WritableAccount,
  addDecoderSizePrefix,
  addEncoderSizePrefix,
  combineCodec,
  getAddressDecoder,
  getAddressEncoder,
  getStructDecoder,
  getStructEncoder,
  getU32Decoder,
  getU32Encoder,
  getUtf8Decoder,
  getUtf8Encoder,
  transformEncoder,
} from '@solana/web3.js';
import { SYSTEM_PROGRAM_ADDRESS } from '../programs';
import { ResolvedAccount, getAccountMetaFactory } from '../shared';

export type AssignWithSeedInstruction<
  TProgram extends string = typeof SYSTEM_PROGRAM_ADDRESS,
  TAccountAccount extends string | IAccountMeta<string> = string,
  TAccountBaseAccount extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountAccount extends string
        ? WritableAccount<TAccountAccount>
        : TAccountAccount,
      TAccountBaseAccount extends string
        ? ReadonlySignerAccount<TAccountBaseAccount> &
            IAccountSignerMeta<TAccountBaseAccount>
        : TAccountBaseAccount,
      ...TRemainingAccounts,
    ]
  >;

export type AssignWithSeedInstructionData = {
  discriminator: number;
  base: Address;
  seed: string;
  programAddress: Address;
};

export type AssignWithSeedInstructionDataArgs = {
  base: Address;
  seed: string;
  programAddress: Address;
};

export function getAssignWithSeedInstructionDataEncoder(): Encoder<AssignWithSeedInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU32Encoder()],
      ['base', getAddressEncoder()],
      ['seed', addEncoderSizePrefix(getUtf8Encoder(), getU32Encoder())],
      ['programAddress', getAddressEncoder()],
    ]),
    (value) => ({ ...value, discriminator: 10 })
  );
}

export function getAssignWithSeedInstructionDataDecoder(): Decoder<AssignWithSeedInstructionData> {
  return getStructDecoder([
    ['discriminator', getU32Decoder()],
    ['base', getAddressDecoder()],
    ['seed', addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())],
    ['programAddress', getAddressDecoder()],
  ]);
}

export function getAssignWithSeedInstructionDataCodec(): Codec<
  AssignWithSeedInstructionDataArgs,
  AssignWithSeedInstructionData
> {
  return combineCodec(
    getAssignWithSeedInstructionDataEncoder(),
    getAssignWithSeedInstructionDataDecoder()
  );
}

export type AssignWithSeedInput<
  TAccountAccount extends string = string,
  TAccountBaseAccount extends string = string,
> = {
  account: Address<TAccountAccount>;
  baseAccount: TransactionSigner<TAccountBaseAccount>;
  base: AssignWithSeedInstructionDataArgs['base'];
  seed: AssignWithSeedInstructionDataArgs['seed'];
  programAddress: AssignWithSeedInstructionDataArgs['programAddress'];
};

export function getAssignWithSeedInstruction<
  TAccountAccount extends string,
  TAccountBaseAccount extends string,
>(
  input: AssignWithSeedInput<TAccountAccount, TAccountBaseAccount>
): AssignWithSeedInstruction<
  typeof SYSTEM_PROGRAM_ADDRESS,
  TAccountAccount,
  TAccountBaseAccount
> {
  // Program address.
  const programAddress = SYSTEM_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    account: { value: input.account ?? null, isWritable: true },
    baseAccount: { value: input.baseAccount ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.account),
      getAccountMeta(accounts.baseAccount),
    ],
    programAddress,
    data: getAssignWithSeedInstructionDataEncoder().encode(
      args as AssignWithSeedInstructionDataArgs
    ),
  } as AssignWithSeedInstruction<
    typeof SYSTEM_PROGRAM_ADDRESS,
    TAccountAccount,
    TAccountBaseAccount
  >;

  return instruction;
}

export type ParsedAssignWithSeedInstruction<
  TProgram extends string = typeof SYSTEM_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    account: TAccountMetas[0];
    baseAccount: TAccountMetas[1];
  };
  data: AssignWithSeedInstructionData;
};

export function parseAssignWithSeedInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedAssignWithSeedInstruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 2) {
    // TODO: Coded error.
    throw new Error('Not enough accounts');
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts![accountIndex]!;
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      account: getNextAccount(),
      baseAccount: getNextAccount(),
    },
    data: getAssignWithSeedInstructionDataDecoder().decode(instruction.data),
  };
}
