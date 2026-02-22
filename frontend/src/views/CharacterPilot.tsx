import { useEffect, useState } from "react";

interface ClassFeature {
  id: string;
  name: string;
  description: string;
}

interface CharacterPilotProps {
  character: any;
}

function CharacterPilot({ character }: CharacterPilotProps) {
  const [hitPoints, setHitPoints] = useState<number>(0);
  const [actionPoints, setActionPoints] = useState<number>(3);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [classData, setClassData] = useState<any>(null);
  const [classFeatures, setClassFeatures] = useState<ClassFeature[]>([]);
  const [braveryBonus, setBraveryBonus] = useState<number>(0);
  const [armorTrainingBonus, setArmorTrainingBonus] = useState<number>(0);
  const [weaponTraining, setWeaponTraining] = useState<string | null>(null);

  useEffect(() => {
    if (character) {
      // Calculate hit points: constitution modifier + hit die
      const conMod = Math.floor((character.baseStats?.constitution - 10) / 2);
      const baseHP = 8 + conMod; // Assuming 8 as average for example
      setHitPoints(baseHP * character.level || baseHP);
      setActionPoints(3);
      setBattleLog([]);

      // Load class data and calculate features
      loadClassFeatures();
    }
  }, [character]);

  const loadClassFeatures = async () => {
    try {
      const res = await fetch("/classes.json");
      const classesData = await res.json();
      const fighterData = classesData[character.class];
      
      if (!fighterData) return;
      
      setClassData(fighterData);
      
      // Calculate features for current level
      const features: ClassFeature[] = [];
      let bravery = 0;
      let armorTraining = 0;
      let weaponGroup: string | null = null;
      
      for (let lvl = 1; lvl <= character.level; lvl++) {
        const lvlFeatures = fighterData.classFeatures?.[lvl] || [];
        features.push(...lvlFeatures);
        
        // Calculate bonuses
        lvlFeatures.forEach((feat: any) => {
          if (feat.id.startsWith("bravery-")) {
            bravery = parseInt(feat.id.split("-")[1]) || 0;
          }
          if (feat.id === "armor-training-1") {
            armorTraining = 1;
          }
          if (feat.id === "armor-training-2") {
            armorTraining = 2;
          }
          if (feat.id === "weapon-training-1" && character.featureSelections?.["weapon-training-1"]) {
            weaponGroup = character.featureSelections["weapon-training-1"];
          }
        });
      }
      
      setClassFeatures(features);
      setBraveryBonus(bravery);
      setArmorTrainingBonus(armorTraining);
      setWeaponTraining(weaponGroup);
    } catch (e) {
      console.error("Failed to load class features:", e);
    }
  };

  if (!character) {
    return <div className="character-pilot">No character created yet. Go to Character Builder first.</div>;
  }

  const abilityMod = (stat: number) => Math.floor((stat - 10) / 2);

  const handleAttack = () => {
    const strMod = abilityMod(character.baseStats?.strength);
    const roll = Math.floor(Math.random() * 20) + 1;
    const attackBonus = strMod;
    const total = roll + attackBonus;

    const message = `Attack Roll: ${roll} + ${attackBonus} = ${total}`;
    setBattleLog((prev) => [message, ...prev]);
    setActionPoints(actionPoints - 1);
  };

  const handleCast = () => {
    const intMod = abilityMod(character.baseStats?.intelligence);
    const message = `Cast spell with modifier: ${intMod}`;
    setBattleLog((prev) => [message, ...prev]);
    setActionPoints(actionPoints - 1);
  };

  const handleTakeDamage = (damage: number) => {
    const newHP = Math.max(0, hitPoints - damage);
    setHitPoints(newHP);
    const message = `Took ${damage} damage! HP: ${newHP}/${hitPoints}`;
    setBattleLog((prev) => [message, ...prev]);
  };

  const handleRest = () => {
    const conMod = Math.floor((character.baseStats?.constitution - 10) / 2);
    const baseHP = 8 + conMod;
    const maxHP = baseHP * character.level || baseHP;
    setHitPoints(maxHP);
    setActionPoints(3);
    setBattleLog((prev) => ["Rested! HP and actions restored.", ...prev]);
  };

  return (
    <div className="character-pilot">
      <h2>Character Pilot: {character.name}</h2>

      {/* Character Summary */}
      <section className="pilot-section character-summary">
        <div className="summary-grid">
          <div className="stat-block">
            <h3>{character.class}</h3>
            <p>Level {character.level}</p>
          </div>
          <div className="stat-block">
            <h4>Health</h4>
            <div className="hp-bar">
              <div
                className="hp-fill"
                style={{
                  width: `${(hitPoints / (8 * character.level)) * 100}%`,
                }}
              />
            </div>
            <p>{Math.max(0, hitPoints)} / {8 * character.level}</p>
          </div>
          <div className="stat-block">
            <h4>Actions</h4>
            <p>{actionPoints} remaining</p>
          </div>
        </div>
      </section>

      {/* Class Features */}
      {classFeatures.length > 0 && (
        <section className="pilot-section class-features">
          <h3>Class Features</h3>
          <div className="features-display">
            {braveryBonus > 0 && (
              <div className="feature-bonus">
                <strong>Bravery:</strong> +{braveryBonus} vs fear effects
              </div>
            )}
            {armorTrainingBonus > 0 && (
              <div className="feature-bonus">
                <strong>Armor Training:</strong> +{armorTrainingBonus} AC when wearing armor
              </div>
            )}
            {weaponTraining && (
              <div className="feature-bonus">
                <strong>Weapon Training:</strong> {weaponTraining.charAt(0).toUpperCase() + weaponTraining.slice(1).replace("-", " ")}
              </div>
            )}
          </div>
          <div className="features-list" style={{ marginTop: "12px" }}>
            {classFeatures.map((feat) => (
              <div key={feat.id} style={{ fontSize: "0.9rem", marginBottom: "6px", color: "var(--muted)" }}>
                • {feat.name}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ability Scores */}
      <section className="pilot-section abilities">
        <h3>Ability Scores</h3>
        <div className="ability-grid">
          {Object.entries(character.baseStats || {}).map(([stat, value]: [string, any]) => (
            <div key={stat} className="ability-item">
              <h5>{stat.toUpperCase()}</h5>
              <p className="ability-score">{value}</p>
              <p className="ability-mod">
                {abilityMod(value) >= 0 ? "+" : ""}{abilityMod(value)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section className="pilot-section actions">
        <h3>Available Actions</h3>
        <div className="action-buttons">
          <button onClick={handleAttack} disabled={actionPoints < 1} className="btn-attack">
            Attack (1 action)
          </button>
          <button onClick={handleCast} disabled={actionPoints < 1} className="btn-cast">
            Use Ability (1 action)
          </button>
          <button onClick={() => handleTakeDamage(5)} className="btn-damage">
            Take 5 Damage
          </button>
          <button onClick={handleRest} className="btn-rest">
            Rest
          </button>
        </div>
      </section>

      {/* Selected Feats */}
      {character.selectedFeats && character.selectedFeats.length > 0 && (
        <section className="pilot-section feats">
          <h3>Feats</h3>
          <ul>
            {character.selectedFeats.map((feat: string) => (
              <li key={feat}>{feat}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Equipped Items */}
      {character.equippedItems && character.equippedItems.length > 0 && (
        <section className="pilot-section equipment">
          <h3>Equipped Items</h3>
          <ul>
            {character.equippedItems.map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Battle Log */}
      <section className="pilot-section battle-log">
        <h3>Battle Log</h3>
        <div className="log-entries">
          {battleLog.length === 0 ? (
            <p className="empty">No actions yet. Use the buttons above to take actions!</p>
          ) : (
            battleLog.map((entry, idx) => (
              <p key={idx} className="log-entry">
                {entry}
              </p>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default CharacterPilot;
