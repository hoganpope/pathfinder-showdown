import { Modifier } from "./modifier";
import { Attack } from "./attack";
import { Ability } from "./ability";

export type EquipmentSlot = 
    | "head" 
    | "neck" 
    | "shoulders" 
    | "chest" 
    | "hands" 
    | "ring1" 
    | "ring2" 
    | "waist" 
    | "legs" 
    | "feet" 
    | "weapon" 
    | "offhand" 
    | "shoulders_cloak";

export interface Equipment {
    id: string;
    name: string;
    slot: EquipmentSlot;
    cost: number; // in gold pieces
    modifiers: Modifier[];
    attacks?: Attack[];
    ability?: Ability;
    type?: "weapon" | "armor" | "shield"; // NEW: Equipment category
    group?: string; // NEW: Grouping (e.g., "swords", "light-armor", "shields")
}

export interface Weapon extends Equipment {
    damage: {
        dice: string; // e.g., "1d8"
        bonus: number;
    };
    critRange: number; // e.g., 20 (only 20), 19 (19-20), etc.
}

export interface Armor extends Equipment {
    armorBonus: number;
    dexterityPenalty: number;
    arcaneSpellFailure: number;
}
