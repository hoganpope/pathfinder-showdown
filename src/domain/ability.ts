import { Modifier } from "./modifier";

export interface Ability {
    id: string;
    name: string;
    action: "standard" | "move" | "swift" | "free" | "passive";
    onUse?: () => void | Promise<void>;
    description?: string;
    // NEW: Conditional application for class features
    applicableWhen?: {
        weaponGroups?: string[];  // e.g., ["swords", "polearms"]
        armorTypes?: string[];     // e.g., ["light", "heavy", "none"]
        situations?: string[];     // e.g., ["fear-effect", "in-armor"]
    };
    // NEW: For class features, can define modifiers directly
    modifiers?: Modifier[];
}
