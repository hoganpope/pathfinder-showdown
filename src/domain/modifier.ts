import { BonusType } from "./bonusTypes";

export interface Modifier {
    id: string;
    name: string;
    source: string;
    target?: string;
    type: BonusType;
    value: number;
    active: boolean;
    condition?: string;
    // NEW: Structured condition for class features
    applicableWhen?: {
        weaponGroups?: string[];  // e.g., ["swords", "polearms"]
        armorTypes?: string[];     // e.g., ["light", "heavy", "none"]
        situations?: string[];     // e.g., ["fear-effect", "in-armor"]
    };
}

// For backwards compatibility
export type ModifierType = BonusType;