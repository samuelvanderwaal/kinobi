/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/kinobi-so/kinobi
 */

import {
  AccountRole,
  Address,
  Codec,
  Decoder,
  Encoder,
  IAccountMeta,
  IAccountSignerMeta,
  IInstruction,
  IInstructionWithAccounts,
  IInstructionWithData,
  ReadonlyAccount,
  ReadonlySignerAccount,
  TransactionSigner,
  WritableAccount,
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  getU64Decoder,
  getU64Encoder,
  getU8Decoder,
  getU8Encoder,
  transformEncoder,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ADDRESS } from '../programs';
import { ResolvedAccount, getAccountMetaFactory } from '../shared';

export type TransferInstruction<
  TProgram extends string = typeof TOKEN_PROGRAM_ADDRESS,
  TAccountSource extends string | IAccountMeta<string> = string,
  TAccountDestination extends string | IAccountMeta<string> = string,
  TAccountAuthority extends string | IAccountMeta<string> = string,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<
    [
      TAccountSource extends string
        ? WritableAccount<TAccountSource>
        : TAccountSource,
      TAccountDestination extends string
        ? WritableAccount<TAccountDestination>
        : TAccountDestination,
      TAccountAuthority extends string
        ? ReadonlyAccount<TAccountAuthority>
        : TAccountAuthority,
      ...TRemainingAccounts,
    ]
  >;

export type TransferInstructionData = {
  discriminator: number;
  /** The amount of tokens to transfer. */
  amount: bigint;
};

export type TransferInstructionDataArgs = {
  /** The amount of tokens to transfer. */
  amount: number | bigint;
};

export function getTransferInstructionDataEncoder(): Encoder<TransferInstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', getU8Encoder()],
      ['amount', getU64Encoder()],
    ]),
    (value) => ({ ...value, discriminator: 3 })
  );
}

export function getTransferInstructionDataDecoder(): Decoder<TransferInstructionData> {
  return getStructDecoder([
    ['discriminator', getU8Decoder()],
    ['amount', getU64Decoder()],
  ]);
}

export function getTransferInstructionDataCodec(): Codec<
  TransferInstructionDataArgs,
  TransferInstructionData
> {
  return combineCodec(
    getTransferInstructionDataEncoder(),
    getTransferInstructionDataDecoder()
  );
}

export type TransferInput<
  TAccountSource extends string = string,
  TAccountDestination extends string = string,
  TAccountAuthority extends string = string,
> = {
  /** The source account. */
  source: Address<TAccountSource>;
  /** The destination account. */
  destination: Address<TAccountDestination>;
  /** The source account's owner/delegate or its multisignature account. */
  authority: Address<TAccountAuthority> | TransactionSigner<TAccountAuthority>;
  amount: TransferInstructionDataArgs['amount'];
  multiSigners?: Array<TransactionSigner>;
};

export function getTransferInstruction<
  TAccountSource extends string,
  TAccountDestination extends string,
  TAccountAuthority extends string,
>(
  input: TransferInput<TAccountSource, TAccountDestination, TAccountAuthority>
): TransferInstruction<
  typeof TOKEN_PROGRAM_ADDRESS,
  TAccountSource,
  TAccountDestination,
  (typeof input)['authority'] extends TransactionSigner<TAccountAuthority>
    ? ReadonlySignerAccount<TAccountAuthority> &
        IAccountSignerMeta<TAccountAuthority>
    : TAccountAuthority
> {
  // Program address.
  const programAddress = TOKEN_PROGRAM_ADDRESS;

  // Original accounts.
  const originalAccounts = {
    source: { value: input.source ?? null, isWritable: true },
    destination: { value: input.destination ?? null, isWritable: true },
    authority: { value: input.authority ?? null, isWritable: false },
  };
  const accounts = originalAccounts as Record<
    keyof typeof originalAccounts,
    ResolvedAccount
  >;

  // Original args.
  const args = { ...input };

  // Remaining accounts.
  const remainingAccounts: IAccountMeta[] = (args.multiSigners ?? []).map(
    (signer) => ({
      address: signer.address,
      role: AccountRole.READONLY_SIGNER,
      signer,
    })
  );

  const getAccountMeta = getAccountMetaFactory(programAddress, 'programId');
  const instruction = {
    accounts: [
      getAccountMeta(accounts.source),
      getAccountMeta(accounts.destination),
      getAccountMeta(accounts.authority),
      ...remainingAccounts,
    ],
    programAddress,
    data: getTransferInstructionDataEncoder().encode(
      args as TransferInstructionDataArgs
    ),
  } as TransferInstruction<
    typeof TOKEN_PROGRAM_ADDRESS,
    TAccountSource,
    TAccountDestination,
    (typeof input)['authority'] extends TransactionSigner<TAccountAuthority>
      ? ReadonlySignerAccount<TAccountAuthority> &
          IAccountSignerMeta<TAccountAuthority>
      : TAccountAuthority
  >;

  return instruction;
}

export type ParsedTransferInstruction<
  TProgram extends string = typeof TOKEN_PROGRAM_ADDRESS,
  TAccountMetas extends readonly IAccountMeta[] = readonly IAccountMeta[],
> = {
  programAddress: Address<TProgram>;
  accounts: {
    /** The source account. */
    source: TAccountMetas[0];
    /** The destination account. */
    destination: TAccountMetas[1];
    /** The source account's owner/delegate or its multisignature account. */
    authority: TAccountMetas[2];
  };
  data: TransferInstructionData;
};

export function parseTransferInstruction<
  TProgram extends string,
  TAccountMetas extends readonly IAccountMeta[],
>(
  instruction: IInstruction<TProgram> &
    IInstructionWithAccounts<TAccountMetas> &
    IInstructionWithData<Uint8Array>
): ParsedTransferInstruction<TProgram, TAccountMetas> {
  if (instruction.accounts.length < 3) {
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
      source: getNextAccount(),
      destination: getNextAccount(),
      authority: getNextAccount(),
    },
    data: getTransferInstructionDataDecoder().decode(instruction.data),
  };
}
