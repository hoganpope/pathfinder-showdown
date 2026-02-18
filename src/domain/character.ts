import { BaseStats } from "./baseStats";
import { Modifier } from "./modifier";
import { RuleEngine, StatResult } from "./ruleEngine";

export class Character {
    private baseStats: BaseStats;
    private modifiers: Modifier[];

    constructor(baseStats: BaseStats) {
        this.baseStats = { ...baseStats };
        this.modifiers = [];
    }

    addModifier(mod: Modifier): void {
        this.modifiers.push(mod);
    }

    toggleModifier(id: string, active: boolean): void {
        const mod = this.modifiers.find(m => m.id === id);
        if (mod) {
        mod.active = active;
        }
    }

    resolveStat(statName: string): StatResult {
        const baseValue = this.baseStats[statName] ?? 0;

        const relevantMods = this.modifiers.filter(
        m => m.target === statName
        );

        return RuleEngine.resolveStat(baseValue, relevantMods);
    }

    getAllModifiers(): Modifier[] {
        return [...this.modifiers];
    }

    removeModifier(id: string): void {
        this.modifiers = this.modifiers.filter(m => m.id !== id);
    }

    getModifiers(): Modifier[] {
        return [...this.modifiers];
    }

}