# Fighter Class (Levels 1-6) Integration Plan

## Pathfinder Fighter Core Features (Levels 1-6)

### Level 1
- **Weapon and Armor Proficiency**: All simple & martial weapons, all armor & shields
- **Bonus Combat Feat**: Get a combat feat (in addition to normal feat progression)
- **Bravery**: +1 morale bonus to save vs. fear

### Level 2
- **Bravery**: +2 morale bonus to save vs. fear
- **Bonus Feat**: Another combat feat

### Level 3
- **Armor Training I**: +1 to AC when wearing armor (doesn't stack with AC-improving enchants, takes best)
- **Bravery**: +3 morale bonus

### Level 4
- **Bravery**: +4 morale bonus
- **Bonus Feat**: Combat feat

### Level 5
- **Weapon Training I**: Select 1 weapon group. +1 to attack rolls & damage with weapons in that group
- **Bravery**: +5 morale bonus

### Level 6
- **Armor Training II**: +2 to AC when wearing armor
- **Bravery**: +6 morale bonus
- **Bonus Feat**: Combat feat

---

## Current System Analysis

### What Currently Exists ✅
1. **CharacterLevel** struct with:
   - `modifiers[]` - Can store morale bonuses
   - `abilities[]` - Can store combat abilities
   - `featSlots[]` - Already tracks feat slots
   - `class` - References ClassDefinition

2. **Modifier system** - Supports bonus types (enhancement, morale, competence, etc.)

3. **RuleEngine** - Correctly handles bonus stacking rules (take best for morale/competence/luck)

4. **ClassDefinition** - Has `modifiersPerLevel`, `abilitiesPerLevel`, `featSlotsPerLevel`

### What's Missing ❌

1. **Class-specific Features**: No mechanism to assign class-specific abilities/features at specific levels
   - Current system doesn't differentiate between "passive class features" (Bravery) and "combat abilities"
   - No way to express "Weapon Training grants +X to specific weapon groups"

2. **Weapon/Armor Categorization**:
   - No equipment/weapon grouping system (e.g., "Swords", "Polearms", "Light Armor", "Heavy Armor")
   - Equipment.ts is bare - only has `name` and `slot`

3. **Progression Scaling**: Features like "Armor Training" scale (+1 at L3, +2 at L6)
   - Current `progressionTable` only has basic stats (attackBonus, saves)
   - No way to track evolving class features

4. **Conditional Modifiers**: 
   - Weapon Training applies to specific weapon groups
   - Armor Training applies only when wearing armor
   - System currently treats all modifiers as always-active

---

## Recommended Redesign Approach

### **Option A: Minimal Changes** (Quick Implementation)
Add class features as passive modifiers in the progression table:

```json
"progressionTable": [
  {
    "level": 1,
    "abilities": ["proficiency", "bravery_1", "bonus_feat"]
  },
  {
    "level": 3,
    "abilities": ["armor_training_1"],
    "modifiers": [{"name": "Armor Training I", "type": "armor_ac", "value": 1}]
  }
]
```

**Pros**: Minimal code changes, reuses existing system
**Cons**: Doesn't handle conditional/contextual bonuses well (weapon-specific training)

---

### **Option B: Class Feature System** (Better Design) ⭐ RECOMMENDED
Create a dedicated "ClassFeature" type that's separate from regular Feats:

```typescript
interface ClassFeature {
  id: string;
  name: string;
  level: number;
  type: "passive" | "active" | "conditional";
  
  // For passive features (Bravery, Armor Training)
  modifiers?: Modifier[];
  
  // For weapon/armor training (conditional)
  applicableType?: "weapon" | "armor" | "weaponGroup" | "armorType";
  applicableGroups?: string[];
  
  description: string;
}
```

**Pros**: Extensible, handles all feature types, clearly separates class features from feats
**Cons**: More code reorganization needed

---

### **Option C: Hybrid Approach** (Balanced) ⭐⭐ BEST FIT
Keep existing system mostly as-is, but:

1. **Extend Ability interface** to support conditional application:
```typescript
interface Ability {
  id: string;
  name: string;
  action: "standard" | "move" | "swift" | "free" | "passive";
  description?: string;
  
  // NEW: Conditional application
  applicableWhen?: {
    weaponGroups?: string[];
    armorTypes?: string[];
    situations?: string[];
  };
  
  modifierFunction?: (character: Character) => Modifier[];
}
```

2. **Enhance Equipment.ts** to include grouping:
```typescript
interface Equipment {
  id: string;
  name: string;
  type: "weapon" | "armor" | "shield";
  group?: string; // "swords", "polearms", "light armor", etc.
  // ... existing properties
}
```

3. **Add to ClassDefinition**:
```typescript
classFeatures?: {
  [level: number]: ClassFeature[];
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (2-3 hours)
- [ ] Extend Equipment with weapon/armor group categories
- [ ] Add sample data: weapon groups, armor types
- [ ] Create `classFeatures` system in ClassDefinition

### Phase 2: Basic Features (3-4 hours)
- [ ] Implement Bravery (passive morale bonus, fear immunity immunity)
- [ ] Implement Armor Training (AC bonus when wearing armor)
- [ ] Add bonus combat feat slots at correct levels

### Phase 3: Advanced Features (2-3 hours)
- [ ] Implement Weapon Training (group-based bonus)
- [ ] Create conditional modifier system
- [ ] Test interactions with equipment/armor

### Phase 4: Rules Engine Updates (1-2 hours)
- [ ] Update RuleEngine to handle conditional modifiers
- [ ] Handle AC calculations with armor training context

---

## Key Questions to Answer

1. **How deep should equipment categorization go?**
   - Option A: 5-6 weapon groups + 4 armor weight categories (simple)
   - Option B: Full weapon/armor type hierarchy (complex but flexible)

2. **Should Weapon Training be selectable?**
   - Currently assuming fighters choose at level 5
   - Need UI for this selection

3. **How to handle bonus feat selection?**
   - Should be restricted to combat feats
   - Current featSlots system allows whitelist - use this feature

4. **What about other fighter features at higher levels?**
   - Should the system prepared for Improved Armor Training, Weapon Mastery, etc. (L7+)?

---

## New Files Needed

1. `src/domain/classFeature.ts` - ClassFeature interface
2. `src/data/weaponGroups.json` - Weapon categorization
3. `src/data/armorTypes.json` - Armor categorization
4. (Optional) `src/domain/conditionalModifier.ts` - For complex bonus logic

---

## Verdict: Do We Need Major Redesign?

**Short answer: No, not major - but YES, we need extensions.**

Current system is foundational and sound. We need:
- Light structural additions (ClassFeature, conditional modifiers)
- Data layer enhancements (weapon/armor grouping)
- RuleEngine updates (context-aware modifier resolution)

**No breaking changes needed** - all existing features continue to work.

**Estimated effort**: 8-12 hours for full Phase 2-3 implementation with testing

