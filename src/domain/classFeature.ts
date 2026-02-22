import { Modifier } from "./modifier";
import { Ability } from "./ability";

/**
 * Represents a class feature granted at a specific level.
 * Class features are distinct from general feats and can be passive,
 * active, or conditional (applying only in specific situations).
 */
export interface ClassFeature {
    id: string;
    name: string;
    description: string;
    level: number;
    type: "passive" | "active" | "conditional";
    
    // For passive/active class features
    modifiers?: Modifier[];
    abilities?: Ability[];
    
    // For conditional features (e.g., "Weapon Training requires you to have trained weapon groups")
    applicableType?: "weapon" | "armor" | "weaponGroup" | "armorType";
    applicableGroups?: string[];  // Which groups this applies to
    
    // Some features need selection (e.g., which weapon group for Weapon Training)
    requiresSelection?: boolean;
    selectionLabel?: string;  // e.g., "Select a weapon group"
    selectableOptions?: string[];  // Populated at runtime
}
