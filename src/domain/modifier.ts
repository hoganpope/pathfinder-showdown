import { BonusType } from "./bonusTypes";

export interface Modifier {
    id: string;
    source: string;
    target: string;
    bonusType: BonusType;
    value: number;
    active: boolean;
    condition?: string;
}