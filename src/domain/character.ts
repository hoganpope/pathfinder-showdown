import { BaseStats } from "./baseStats";
import { Modifier } from "./modifier";
import { RuleEngine, StatResult } from "./ruleEngine";
import { CharacterLevel, ClassDefinition } from "./level";
import { FeatSlot } from "./featSlot";
import { Equipment, EquipmentSlot } from "./equipment";
import { Attack } from "./attack";
import { Ability } from "./ability";
import { ClassFeature } from "./classFeature";

export class Character {
    private baseStats: BaseStats;
    private modifiers: Modifier[];
    private levels: CharacterLevel[];
    private featSlots: FeatSlot[];
    private equipment: Map<EquipmentSlot, Equipment>;
    private attacks: Attack[];
    private abilities: Ability[];
    private gold: number;
    private classFeatures: Map<string, ClassFeature> = new Map(); // Track selected features
    private featureSelections: Map<string, string> = new Map(); // Track selections like weapon group

    constructor(baseStats: BaseStats, startingGold: number = 0) {
        this.baseStats = { ...baseStats };
        this.modifiers = [];
        this.levels = [];
        this.featSlots = [];
        this.equipment = new Map();
        this.attacks = [];
        this.abilities = [];
        this.gold = startingGold;
    }

    // ============ Level Management ============
    addLevel(levelNumber: number, characterClass: ClassDefinition): CharacterLevel {
        const newLevel: CharacterLevel = {
            levelNumber,
            class: characterClass,
            modifiers: [],
            attacks: [],
            abilities: [],
            featSlots: []
        };
        this.levels.push(newLevel);
        
        // Add feat slot for base level up (every 3 levels + 1st level)
        if (levelNumber === 1 || (levelNumber - 1) % 3 === 0) {
            this.addFeatSlot("baseLevel", levelNumber);
        }

        // NEW: Apply class features for this level
        if (characterClass.classFeatures && characterClass.classFeatures[levelNumber]) {
            const featuresForLevel = characterClass.classFeatures[levelNumber];
            for (const feature of featuresForLevel) {
                this.addClassFeature(feature, levelNumber);
            }
        }

        return newLevel;
    }

    getLevel(levelNumber: number): CharacterLevel | undefined {
        return this.levels.find(l => l.levelNumber === levelNumber);
    }

    getAllLevels(): CharacterLevel[] {
        return [...this.levels];
    }

    getCurrentLevel(): number {
        return this.levels.length;
    }

    // ============ Feat Slot Management ============
    addFeatSlot(source: "classLevel" | "baseLevel" | "other", grantedAtLevel: number, whitelist?: string[]): void {
        const featSlot: FeatSlot = {
            id: `feat-slot-${this.featSlots.length}`,
            grantedAtLevel,
            source,
            whitelist
        };
        this.featSlots.push(featSlot);
    }

    getFeatSlots(): FeatSlot[] {
        return [...this.featSlots];
    }

    selectFeat(featSlotId: string, featId: string): void {
        const slot = this.featSlots.find(s => s.id === featSlotId);
        if (slot) {
            // Check whitelist if exists
            if (slot.whitelist && !slot.whitelist.includes(featId)) {
                throw new Error(`Feat ${featId} not allowed in slot ${featSlotId}`);
            }
            slot.featSelected = featId;
        }
    }

    // ============ Class Feature Management (NEW) ============
    addClassFeature(feature: ClassFeature, grantedAtLevel: number): void {
        this.classFeatures.set(feature.id, feature);
        
        // Add modifiers from feature
        if (feature.modifiers) {
            feature.modifiers.forEach(mod => this.addModifier(mod));
        }
        
        // Add abilities from feature
        if (feature.abilities) {
            feature.abilities.forEach(ab => this.addAbility(ab));
        }
        
        // Handle bonus combat feat slots
        if (feature.id.includes("bonus-feat")) {
            this.addFeatSlot("classLevel", grantedAtLevel, ["combat-feat"]);
        }
    }

    selectClassFeatureOption(featureId: string, selectedOption: string): void {
        const feature = this.classFeatures.get(featureId);
        if (!feature) {
            throw new Error(`Feature ${featureId} not found`);
        }
        if (!feature.requiresSelection) {
            throw new Error(`Feature ${featureId} does not require selection`);
        }
        if (feature.selectableOptions && !feature.selectableOptions.includes(selectedOption)) {
            throw new Error(`Invalid selection ${selectedOption} for feature ${featureId}`);
        }
        
        this.featureSelections.set(featureId, selectedOption);
    }

    getFeatureSelection(featureId: string): string | undefined {
        return this.featureSelections.get(featureId);
    }

    getClassFeatures(): ClassFeature[] {
        return Array.from(this.classFeatures.values());
    }

    // ============ Equipment Management ============
    equipItem(equipment: Equipment): void {
        if (this.equipment.has(equipment.slot)) {
            throw new Error(`Slot ${equipment.slot} already occupied`);
        }
        if (this.gold < equipment.cost) {
            throw new Error(`Insufficient gold. Need ${equipment.cost} gp, but only have ${this.gold} gp`);
        }
        
        this.gold -= equipment.cost;
        this.equipment.set(equipment.slot, equipment);
        
        // Add modifiers from equipment
        equipment.modifiers.forEach(mod => this.addModifier(mod));
        
        // Add attacks from equipment
        if (equipment.attacks) {
            this.attacks.push(...equipment.attacks);
        }
        
        // Add ability from equipment
        if (equipment.ability) {
            this.abilities.push(equipment.ability);
        }
    }

    unequipItem(slot: EquipmentSlot): void {
        const equipment = this.equipment.get(slot);
        if (equipment) {
            // Refund the cost of the equipment
            this.gold += equipment.cost;
            
            // Remove modifiers from equipment
            equipment.modifiers.forEach(mod => this.removeModifier(mod.id));
            
            // Remove attacks from equipment
            if (equipment.attacks) {
                this.attacks = this.attacks.filter(a => !equipment.attacks!.includes(a));
            }
            
            // Remove ability from equipment
            if (equipment.ability) {
                this.abilities = this.abilities.filter(ab => ab.id !== equipment.ability!.id);
            }
            
            this.equipment.delete(slot);
        }
    }

    getEquippedItem(slot: EquipmentSlot): Equipment | undefined {
        return this.equipment.get(slot);
    }

    getAllEquipment(): Equipment[] {
        return Array.from(this.equipment.values());
    }

    // ============ Modifier Management ============
    addModifier(mod: Modifier): void {
        this.modifiers.push(mod);
    }

    toggleModifier(id: string, active: boolean): void {
        const mod = this.modifiers.find(m => m.id === id);
        if (mod) {
            mod.active = active;
        }
    }

    removeModifier(id: string): void {
        this.modifiers = this.modifiers.filter(m => m.id !== id);
    }

    getAllModifiers(): Modifier[] {
        return [...this.modifiers];
    }

    getModifiers(): Modifier[] {
        return [...this.modifiers];
    }

    // ============ Stat Resolution ============
    resolveStat(statName: string): StatResult {
        const baseValue = this.baseStats[statName] ?? 0;

        const relevantMods = this.modifiers.filter(
            m => (m.target === statName || !m.target) && m.active && this.modifierAppliesToContext(m)
        );

        return RuleEngine.resolveStat(baseValue, relevantMods);
    }

    /**
     * Check if a modifier applies given the current character context
     * (equipped armor, equipped weapons, etc.)
     */
    private modifierAppliesToContext(modifier: Modifier): boolean {
        if (!modifier.applicableWhen) {
            return true; // No restrictions, always applies
        }

        const { situations, armorTypes } = modifier.applicableWhen;

        // Check armor type requirement
        if (armorTypes) {
            if (armorTypes.includes("none") && this.isWearingArmor()) {
                return false; // Requires no armor but wearing some
            }
            if (!armorTypes.includes("none") && !this.isWearingArmor()) {
                return false; // Requires armor but not wearing any
            }
            
            // TODO: Check specific armor type (light/medium/heavy)
        }

        // Check situation requirement
        if (situations) {
            // For now, we'll assume all situations are met
            // In a real implementation, this would check game state
            // e.g., isUnderFearEffect(), etc.
        }

        return true;
    }

    private isWearingArmor(): boolean {
        // Check if any armor is equipped (excluding shields)
        for (const equipment of this.equipment.values()) {
            if (equipment.type === "armor") {
                return true;
            }
        }
        return false;
    }

    resolveStrengthModifier(): number {
        const str = this.resolveStat("strength").total;
        return Math.floor((str - 10) / 2);
    }

    resolveArmorClass(): number {
        const dex = this.resolveStat("dexterity").total;
        const dexMod = Math.floor((dex - 10) / 2);

        const baseAC = 10;

        const acResult = this.resolveStat("armorClass");

        return baseAC + dexMod + (acResult.total - (this.baseStats["armorClass"] ?? 0));
    }

    // ============ Attack Management ============
    addAttack(attack: Attack): void {
        this.attacks.push(attack);
    }

    removeAttack(attackId: string): void {
        this.attacks = this.attacks.filter(a => a.id !== attackId);
    }

    getAllAttacks(): Attack[] {
        return [...this.attacks];
    }

    // ============ Ability Management ============
    addAbility(ability: Ability): void {
        this.abilities.push(ability);
    }

    removeAbility(abilityId: string): void {
        this.abilities = this.abilities.filter(a => a.id !== abilityId);
    }

    getAllAbilities(): Ability[] {
        return [...this.abilities];
    }

    // ============ Base Stats ============
    getBaseStats(): BaseStats {
        return { ...this.baseStats };
    }

    setBaseStat(statName: string, value: number): void {
        this.baseStats[statName] = value;
    }

    // ============ Gold Management ============
    getGold(): number {
        return this.gold;
    }

    addGold(amount: number): void {
        if (amount < 0) {
            throw new Error("Cannot add negative gold amount");
        }
        this.gold += amount;
    }

    subtractGold(amount: number): void {
        if (amount < 0) {
            throw new Error("Cannot subtract negative gold amount");
        }
        if (this.gold < amount) {
            throw new Error(`Insufficient gold. Need ${amount} gp, but only have ${this.gold} gp`);
        }
        this.gold -= amount;
    }
}