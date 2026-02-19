// Character class loading from JSON
export interface CharacterClassData {
    id: string;
    name: string;
    hitDie: number;
    baseAttackBonusProgression: "fast" | "medium" | "slow";
    savingThrowProgressions: {
        fortitude: "fast" | "slow";
        reflex: "fast" | "slow";
        will: "fast" | "slow";
    };
    progressionTable: CharacterClassProgression[];
}

export interface CharacterClassProgression {
    level: number;
    attackBonus: number;
    fortitude: number;
    reflex: number;
    will: number;
    abilities?: string[];
}
