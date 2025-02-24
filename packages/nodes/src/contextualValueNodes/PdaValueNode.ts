import type { PdaLinkNode, PdaSeedValueNode, PdaValueNode } from '@kinobi-so/node-types';

import { pdaLinkNode } from '../linkNodes';

export function pdaValueNode<const TSeeds extends PdaSeedValueNode[] = []>(
    pda: PdaLinkNode | string,
    seeds: TSeeds = [] as PdaSeedValueNode[] as TSeeds,
): PdaValueNode<TSeeds> {
    return Object.freeze({
        kind: 'pdaValueNode',

        // Children.
        pda: typeof pda === 'string' ? pdaLinkNode(pda) : pda,
        seeds,
    });
}
