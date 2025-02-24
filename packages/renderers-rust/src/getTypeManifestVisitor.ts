import {
    arrayTypeNode,
    CountNode,
    fixedCountNode,
    isNode,
    isScalarEnum,
    NumberTypeNode,
    numberTypeNode,
    pascalCase,
    prefixedCountNode,
    REGISTERED_TYPE_NODE_KINDS,
    remainderCountNode,
    resolveNestedTypeNode,
    snakeCase,
} from '@kinobi-so/nodes';
import { extendVisitor, mergeVisitor, pipe, visit } from '@kinobi-so/visitors-core';

import { ImportMap } from './ImportMap';
import { rustDocblock } from './utils';

export type TypeManifest = {
    imports: ImportMap;
    nestedStructs: string[];
    type: string;
};

export function getTypeManifestVisitor(options: { nestedStruct?: boolean; parentName?: string | null } = {}) {
    let parentName: string | null = options.parentName ?? null;
    let nestedStruct: boolean = options.nestedStruct ?? false;
    let inlineStruct: boolean = false;
    let parentSize: NumberTypeNode | number | null = null;

    return pipe(
        mergeVisitor(
            (): TypeManifest => ({ imports: new ImportMap(), nestedStructs: [], type: '' }),
            (_, values) => ({
                ...mergeManifests(values),
                type: values.map(v => v.type).join('\n'),
            }),
            [...REGISTERED_TYPE_NODE_KINDS, 'definedTypeLinkNode', 'definedTypeNode', 'accountNode'],
        ),
        v =>
            extendVisitor(v, {
                visitAccount(account, { self }) {
                    parentName = pascalCase(account.name);
                    const manifest = visit(account.data, self);
                    manifest.imports.add(['borsh::BorshSerialize', 'borsh::BorshDeserialize']);
                    parentName = null;
                    return {
                        ...manifest,
                        type:
                            '#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]\n' +
                            '#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]\n' +
                            `${manifest.type}`,
                    };
                },

                visitArrayType(arrayType, { self }) {
                    const childManifest = visit(arrayType.item, self);

                    if (isNode(arrayType.count, 'fixedCountNode')) {
                        return {
                            ...childManifest,
                            type: `[${childManifest.type}; ${arrayType.count.value}]`,
                        };
                    }

                    if (isNode(arrayType.count, 'remainderCountNode')) {
                        childManifest.imports.add('kaigan::types::RemainderVec');
                        return {
                            ...childManifest,
                            type: `RemainderVec<${childManifest.type}>`,
                        };
                    }

                    const prefix = resolveNestedTypeNode(arrayType.count.prefix);
                    if (prefix.endian === 'le') {
                        switch (prefix.format) {
                            case 'u32':
                                return {
                                    ...childManifest,
                                    type: `Vec<${childManifest.type}>`,
                                };
                            case 'u8':
                            case 'u16':
                            case 'u64': {
                                const prefixFormat = prefix.format.toUpperCase();
                                childManifest.imports.add(`kaigan::types::${prefixFormat}PrefixVec`);
                                return {
                                    ...childManifest,
                                    type: `${prefixFormat}PrefixVec<${childManifest.type}>`,
                                };
                            }
                            default:
                                throw new Error(`Array prefix not supported: ${prefix.format}`);
                        }
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error('Array size not supported by Borsh');
                },

                visitBooleanType(booleanType) {
                    const resolvedSize = resolveNestedTypeNode(booleanType.size);
                    if (resolvedSize.format === 'u8' && resolvedSize.endian === 'le') {
                        return {
                            imports: new ImportMap(),
                            nestedStructs: [],
                            type: 'bool',
                        };
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error('Bool size not supported by Borsh');
                },

                visitBytesType(_bytesType, { self }) {
                    let arraySize: CountNode = remainderCountNode();
                    if (typeof parentSize === 'number') {
                        arraySize = fixedCountNode(parentSize);
                    } else if (parentSize && typeof parentSize === 'object') {
                        arraySize = prefixedCountNode(parentSize);
                    }
                    const arrayType = arrayTypeNode(numberTypeNode('u8'), arraySize);
                    return visit(arrayType, self);
                },

                visitDefinedType(definedType, { self }) {
                    parentName = pascalCase(definedType.name);
                    const manifest = visit(definedType.type, self);
                    parentName = null;
                    manifest.imports.add(['borsh::BorshSerialize', 'borsh::BorshDeserialize']);
                    const traits = ['BorshSerialize', 'BorshDeserialize', 'Clone', 'Debug', 'Eq', 'PartialEq'];
                    if (isNode(definedType.type, 'enumTypeNode') && isScalarEnum(definedType.type)) {
                        traits.push('PartialOrd', 'Hash', 'FromPrimitive');
                        manifest.imports.add(['num_derive::FromPrimitive']);
                    }
                    return {
                        ...manifest,
                        nestedStructs: manifest.nestedStructs.map(
                            struct =>
                                `#[derive(${traits.join(', ')})]\n` +
                                '#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]\n' +
                                `${struct}`,
                        ),
                        type:
                            `#[derive(${traits.join(', ')})]\n` +
                            '#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]\n' +
                            `${manifest.type}`,
                    };
                },

                visitDefinedTypeLink(node) {
                    const pascalCaseDefinedType = pascalCase(node.name);
                    const importFrom = node.importFrom ?? 'generatedTypes';
                    return {
                        imports: new ImportMap().add(`${importFrom}::${pascalCaseDefinedType}`),
                        nestedStructs: [],
                        type: pascalCaseDefinedType,
                    };
                },

                visitEnumEmptyVariantType(enumEmptyVariantType) {
                    const name = pascalCase(enumEmptyVariantType.name);
                    return {
                        imports: new ImportMap(),
                        nestedStructs: [],
                        type: `${name},`,
                    };
                },

                visitEnumStructVariantType(enumStructVariantType, { self }) {
                    const name = pascalCase(enumStructVariantType.name);
                    const originalParentName = parentName;

                    if (!originalParentName) {
                        throw new Error('Enum struct variant type must have a parent name.');
                    }

                    inlineStruct = true;
                    parentName = pascalCase(originalParentName) + name;
                    const typeManifest = visit(enumStructVariantType.struct, self);
                    inlineStruct = false;
                    parentName = originalParentName;

                    return {
                        ...typeManifest,
                        type: `${name} ${typeManifest.type},`,
                    };
                },

                visitEnumTupleVariantType(enumTupleVariantType, { self }) {
                    const name = pascalCase(enumTupleVariantType.name);
                    const originalParentName = parentName;

                    if (!originalParentName) {
                        throw new Error('Enum struct variant type must have a parent name.');
                    }

                    parentName = pascalCase(originalParentName) + name;
                    const childManifest = visit(enumTupleVariantType.tuple, self);
                    parentName = originalParentName;

                    let derive = '';
                    if (childManifest.type === '(Pubkey)') {
                        derive =
                            '#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<serde_with::DisplayFromStr>"))]\n';
                    } else if (childManifest.type === '(Vec<Pubkey>)') {
                        derive =
                            '#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<Vec<serde_with::DisplayFromStr>>"))]\n';
                    }

                    return {
                        ...childManifest,
                        type: `${derive}${name}${childManifest.type},`,
                    };
                },

                visitEnumType(enumType, { self }) {
                    const originalParentName = parentName;
                    if (!originalParentName) {
                        // TODO: Add to the Rust validator.
                        throw new Error('Enum type must have a parent name.');
                    }

                    const variants = enumType.variants.map(variant => visit(variant, self));
                    const variantNames = variants.map(variant => variant.type).join('\n');
                    const mergedManifest = mergeManifests(variants);

                    return {
                        ...mergedManifest,
                        type: `pub enum ${pascalCase(originalParentName)} {\n${variantNames}\n}`,
                    };
                },

                visitFixedSizeType(fixedSizeType, { self }) {
                    parentSize = fixedSizeType.size;
                    const manifest = visit(fixedSizeType.type, self);
                    parentSize = null;
                    return manifest;
                },

                visitMapType(mapType, { self }) {
                    const key = visit(mapType.key, self);
                    const value = visit(mapType.value, self);
                    const mergedManifest = mergeManifests([key, value]);
                    mergedManifest.imports.add('std::collections::HashMap');
                    return {
                        ...mergedManifest,
                        type: `HashMap<${key.type}, ${value.type}>`,
                    };
                },

                visitNumberType(numberType) {
                    if (numberType.format === 'shortU16') {
                        throw new Error('shortU16 numbers are not supported by the Rust renderer');
                    }

                    if (numberType.endian === 'le') {
                        return {
                            imports: new ImportMap(),
                            nestedStructs: [],
                            type: numberType.format,
                        };
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error('Number endianness not supported by Borsh');
                },

                visitOptionType(optionType, { self }) {
                    const childManifest = visit(optionType.item, self);

                    const optionPrefix = resolveNestedTypeNode(optionType.prefix);
                    if (optionPrefix.format === 'u8' && optionPrefix.endian === 'le') {
                        return {
                            ...childManifest,
                            type: `Option<${childManifest.type}>`,
                        };
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error('Option size not supported by Borsh');
                },

                visitPublicKeyType() {
                    return {
                        imports: new ImportMap().add('solana_program::pubkey::Pubkey'),
                        nestedStructs: [],
                        type: 'Pubkey',
                    };
                },

                visitSetType(setType, { self }) {
                    const childManifest = visit(setType.item, self);
                    childManifest.imports.add('std::collections::HashSet');
                    return {
                        ...childManifest,
                        type: `HashSet<${childManifest.type}>`,
                    };
                },

                visitSizePrefixType(sizePrefixType, { self }) {
                    parentSize = resolveNestedTypeNode(sizePrefixType.prefix);
                    const manifest = visit(sizePrefixType.type, self);
                    parentSize = null;
                    return manifest;
                },

                visitStringType() {
                    if (!parentSize) {
                        return {
                            imports: new ImportMap().add(`kaigan::types::RemainderStr`),
                            nestedStructs: [],
                            type: `RemainderStr`,
                        };
                    }

                    if (typeof parentSize === 'number') {
                        return {
                            imports: new ImportMap(),
                            nestedStructs: [],
                            type: `[u8; ${parentSize}]`,
                        };
                    }

                    if (isNode(parentSize, 'numberTypeNode') && parentSize.endian === 'le') {
                        switch (parentSize.format) {
                            case 'u32':
                                return {
                                    imports: new ImportMap(),
                                    nestedStructs: [],
                                    type: 'String',
                                };
                            case 'u8':
                            case 'u16':
                            case 'u64': {
                                const prefix = parentSize.format.toUpperCase();
                                return {
                                    imports: new ImportMap().add(`kaigan::types::${prefix}PrefixString`),
                                    nestedStructs: [],
                                    type: `${prefix}PrefixString`,
                                };
                            }
                            default:
                                throw new Error(`'String size not supported: ${parentSize.format}`);
                        }
                    }

                    // TODO: Add to the Rust validator.
                    throw new Error('String size not supported by Borsh');
                },

                visitStructFieldType(structFieldType, { self }) {
                    const originalParentName = parentName;
                    const originalInlineStruct = inlineStruct;
                    const originalNestedStruct = nestedStruct;

                    if (!originalParentName) {
                        throw new Error('Struct field type must have a parent name.');
                    }

                    parentName = pascalCase(originalParentName) + pascalCase(structFieldType.name);
                    nestedStruct = true;
                    inlineStruct = false;

                    const fieldManifest = visit(structFieldType.type, self);

                    parentName = originalParentName;
                    inlineStruct = originalInlineStruct;
                    nestedStruct = originalNestedStruct;

                    const fieldName = snakeCase(structFieldType.name);
                    const docblock = rustDocblock(structFieldType.docs);
                    const resolvedNestedType = resolveNestedTypeNode(structFieldType.type);

                    let derive = '';
                    if (fieldManifest.type === 'Pubkey') {
                        derive =
                            '#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<serde_with::DisplayFromStr>"))]\n';
                    } else if (fieldManifest.type === 'Vec<Pubkey>') {
                        derive =
                            '#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<Vec<serde_with::DisplayFromStr>>"))]\n';
                    } else if (
                        (isNode(resolvedNestedType, 'arrayTypeNode') &&
                            isNode(resolvedNestedType.count, 'fixedCountNode') &&
                            resolvedNestedType.count.value > 32) ||
                        (isNode(resolvedNestedType, ['bytesTypeNode', 'stringTypeNode']) &&
                            isNode(structFieldType.type, 'fixedSizeTypeNode') &&
                            structFieldType.type.size > 32)
                    ) {
                        derive =
                            '#[cfg_attr(feature = "serde", serde(with = "serde_with::As::<serde_with::Bytes>"))]\n';
                    }

                    return {
                        ...fieldManifest,
                        type: inlineStruct
                            ? `${docblock}${derive}${fieldName}: ${fieldManifest.type},`
                            : `${docblock}${derive}pub ${fieldName}: ${fieldManifest.type},`,
                    };
                },

                visitStructType(structType, { self }) {
                    const originalParentName = parentName;

                    if (!originalParentName) {
                        // TODO: Add to the Rust validator.
                        throw new Error('Struct type must have a parent name.');
                    }

                    const fields = structType.fields.map(field => visit(field, self));
                    const fieldTypes = fields.map(field => field.type).join('\n');
                    const mergedManifest = mergeManifests(fields);

                    if (nestedStruct) {
                        return {
                            ...mergedManifest,
                            nestedStructs: [
                                ...mergedManifest.nestedStructs,
                                `pub struct ${pascalCase(originalParentName)} {\n${fieldTypes}\n}`,
                            ],
                            type: pascalCase(originalParentName),
                        };
                    }

                    if (inlineStruct) {
                        return { ...mergedManifest, type: `{\n${fieldTypes}\n}` };
                    }

                    return {
                        ...mergedManifest,
                        type: `pub struct ${pascalCase(originalParentName)} {\n${fieldTypes}\n}`,
                    };
                },

                visitTupleType(tupleType, { self }) {
                    const items = tupleType.items.map(item => visit(item, self));
                    const mergedManifest = mergeManifests(items);

                    return {
                        ...mergedManifest,
                        type: `(${items.map(item => item.type).join(', ')})`,
                    };
                },
            }),
    );
}

function mergeManifests(manifests: TypeManifest[]): Pick<TypeManifest, 'imports' | 'nestedStructs'> {
    return {
        imports: new ImportMap().mergeWith(...manifests.map(td => td.imports)),
        nestedStructs: manifests.flatMap(m => m.nestedStructs),
    };
}
