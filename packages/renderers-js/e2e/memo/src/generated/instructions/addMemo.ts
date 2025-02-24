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
  IInstruction,
  IInstructionWithAccounts,
  IInstructionWithData,
  TransactionSigner,
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  getUtf8Decoder,
  getUtf8Encoder,
} from '@solana/web3.js';
import { MEMO_PROGRAM_ADDRESS } from '../programs';

export type AddMemoInstruction<
  TProgram extends string = typeof MEMO_PROGRAM_ADDRESS,
  TRemainingAccounts extends readonly IAccountMeta<string>[] = [],
> = IInstruction<TProgram> &
  IInstructionWithData<Uint8Array> &
  IInstructionWithAccounts<TRemainingAccounts>;

export type AddMemoInstructionData = { memo: string };

export type AddMemoInstructionDataArgs = AddMemoInstructionData;

export function getAddMemoInstructionDataEncoder(): Encoder<AddMemoInstructionDataArgs> {
  return getStructEncoder([['memo', getUtf8Encoder()]]);
}

export function getAddMemoInstructionDataDecoder(): Decoder<AddMemoInstructionData> {
  return getStructDecoder([['memo', getUtf8Decoder()]]);
}

export function getAddMemoInstructionDataCodec(): Codec<
  AddMemoInstructionDataArgs,
  AddMemoInstructionData
> {
  return combineCodec(
    getAddMemoInstructionDataEncoder(),
    getAddMemoInstructionDataDecoder()
  );
}

export type AddMemoInput = {
  memo: AddMemoInstructionDataArgs['memo'];
  signers?: Array<TransactionSigner>;
};

export function getAddMemoInstruction(
  input: AddMemoInput
): AddMemoInstruction<typeof MEMO_PROGRAM_ADDRESS> {
  // Program address.
  const programAddress = MEMO_PROGRAM_ADDRESS;

  // Original args.
  const args = { ...input };

  // Remaining accounts.
  const remainingAccounts: IAccountMeta[] = (args.signers ?? []).map(
    (signer) => ({
      address: signer.address,
      role: AccountRole.READONLY_SIGNER,
      signer,
    })
  );

  const instruction = {
    accounts: remainingAccounts,
    programAddress,
    data: getAddMemoInstructionDataEncoder().encode(
      args as AddMemoInstructionDataArgs
    ),
  } as AddMemoInstruction<typeof MEMO_PROGRAM_ADDRESS>;

  return instruction;
}

export type ParsedAddMemoInstruction<
  TProgram extends string = typeof MEMO_PROGRAM_ADDRESS,
> = {
  programAddress: Address<TProgram>;
  data: AddMemoInstructionData;
};

export function parseAddMemoInstruction<TProgram extends string>(
  instruction: IInstruction<TProgram> & IInstructionWithData<Uint8Array>
): ParsedAddMemoInstruction<TProgram> {
  return {
    programAddress: instruction.programAddress,
    data: getAddMemoInstructionDataDecoder().decode(instruction.data),
  };
}
