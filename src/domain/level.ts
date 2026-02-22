import { Modifier } from "./modifier";
import { Attack } from "./attack";
import { Ability } from "./ability";
import { FeatSlot } from "./featSlot";
import { ClassFeature } from "./classFeature";

export interface ClassDefinition {
    id: string;
    name: string;
    hitDie: number; // e.g., 10 for d10
    baseAttackBonusProgression: "fast" | "medium" | "slow";
    savingThrowProgressions: {
        fortitude: "fast" | "slow";
        reflex: "fast" | "slow";
        will: "fast" | "slow";
    };
    modifiersPerLevel?: Modifier[];
    attacksPerLevel?: Attack[];
    abilitiesPerLevel?: Ability[];
    featSlotsPerLevel?: number;
    // NEW: Class features defined per level (e.g., Bravery, Armor Training)
    classFeatures?: {
        [level: number]: ClassFeature[];
    };
}

export interface CharacterLevel {
    levelNumber: number;
    class: ClassDefinition;
    modifiers: Modifier[];
    attacks: Attack[];
    abilities: Ability[];
    featSlots: FeatSlot[];
}
