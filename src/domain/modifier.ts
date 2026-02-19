import { BonusType } from "./bonusTypes";

export interface Modifier {
    id: string;
    name: string;
    source: string;
    target: string;
    type: BonusType;
    value: number;
    active: boolean;
    condition?: string;
}

// For backwards compatibility
export type ModifierType = BonusType;