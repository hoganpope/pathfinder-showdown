import { Modifier } from "./modifier";
import { BonusType } from "./bonusTypes";

export interface StatBreakdownEntry {
    source: string;
    type: BonusType;
    value: number;
}

export interface StatResult {
  total: number;
  breakdown: StatBreakdownEntry[];
}

export class RuleEngine {
    static resolveStat(
        baseValue: number,
        modifiers: Modifier[]
    ): StatResult {
        const breakdown: StatBreakdownEntry[] = [];

        //Group by bonus type
        const buckets: Record<string, Modifier[]> = {};

        for(const mod of modifiers){
            if(!mod.active){
                continue;
            }

            if(!buckets[mod.type]){
                buckets[mod.type] = [];
            }

            buckets[mod.type].push(mod);
        }

        let totalBonus = 0;

        for(const bonusType in buckets){
            const mods = buckets[bonusType];

            switch (bonusType){
                //Non-static cases
                case "enhancement":
                case "morale":
                case "competence":
                case "luck": {
                    const best = mods.reduce((a, b) =>
                        a.value >= b.value ? a : b
                    );
                    totalBonus += best.value;
                    breakdown.push({
                        source: best.source,
                        type: best.type,
                        value: best.value
                    });
                    break;
                }

                // Stacking
                case "dodge":
                case "circumstance":
                case "untyped":
                case "racial":
                default:
                    for (const mod of mods) {
                    totalBonus += mod.value;
                    breakdown.push({
                    source: mod.source,
                    type: mod.type,
                    value: mod.value
                    });
                }
                break;
            }
        }

        return {total: baseValue + totalBonus, breakdown};
    }

    static abilityModifier(score: number): number {
        return Math.floor((score - 10) / 2);
    }

}