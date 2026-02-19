export interface Attack {
    id: string;
    name: string;
    action: "standard" | "move" | "swift" | "free";
    damage: {
        dice: string; // e.g., "1d6", "2d8"
        bonus: number;
    };
    targetType: "enemy" | "area" | "self";
    attackBonus?: number;
}
