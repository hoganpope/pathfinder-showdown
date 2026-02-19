import { Modifier } from "./modifier";
import { Attack } from "./attack";
import { Ability } from "./ability";

export interface Feat {
    id: string;
    name: string;
    description: string;
    prerequisites?: {
        level?: number;
        baseAttackBonus?: number;
        feats?: string[];
        stats?: Record<string, number>;
    };
    modifiers?: Modifier[];
    attacks?: Attack[];
    abilities?: Ability[];
}
