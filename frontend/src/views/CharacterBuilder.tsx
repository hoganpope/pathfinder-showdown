import { useEffect, useState } from "react";

interface ClassData {
  id: string;
  name: string;
  hitDie: number;
  progressionTable: any[];
  classFeatures?: Record<number, any[]>;
}

interface ClassFeature {
  id: string;
  name: string;
  description: string;
  requiresSelection?: boolean;
  selectableOptions?: string[];
}

interface Feat {
  id: string;
  name: string;
  description: string;
  prerequisites?: any;
  modifiers?: any[];
}

interface Equipment {
  id: string;
  name: string;
  slot: string;
  type: string;
}

interface CharacterBuilderProps {
  onCharacterCreate: (character: any) => void;
  characterId?: string | null;
  onBackToSelect?: () => void;
}

function CharacterBuilder({ onCharacterCreate, characterId, onBackToSelect }: CharacterBuilderProps) {
  const [characterName, setCharacterName] = useState<string>("New Character");
  const [classes, setClasses] = useState<Record<string, ClassData>>({});
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [level, setLevel] = useState<number>(0);
  const [baseStats, setBaseStats] = useState<Record<string, number>>({
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  });
  const [feats, setFeats] = useState<Record<string, Feat>>({});
  const [selectedFeats, setSelectedFeats] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<Record<string, Equipment>>({});
  const [equippedItems, setEquippedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!characterId);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [featureSelections, setFeatureSelections] = useState<Record<string, string>>({});

  // Load character if editing
  useEffect(() => {
    if (characterId) {
      (async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/characters/${characterId}`);
          if (!res.ok) throw new Error("Failed to load character");
          const character = await res.json();
          
          setCharacterName(character.name);
          setSelectedClass(character.class);
          setLevel(character.level);
          setBaseStats(character.baseStats);
          setSelectedFeats(character.selectedFeats);
          setEquippedItems(character.equippedItems);
          setFeatureSelections(character.featureSelections || {});
        } catch (e) {
          console.error("Failed to load character:", e);
          setError("Failed to load character");
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setLoading(false);
    }
  }, [characterId]);

  // Load classes
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/classes.json");
        const data = await res.json();
        setClasses(data);
      } catch (e) {
        console.error("Failed to load classes:", e);
      }
    })();
  }, []);

  // Load feats
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/feats.json");
        const data = await res.json();
        setFeats(data);
      } catch (e) {
        console.error("Failed to load feats:", e);
      }
    })();
  }, []);

  // Load equipment
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/equipment.json");
        const data = await res.json();
        setEquipment(data);
      } catch (e) {
        console.error("Failed to load equipment:", e);
      }
    })();
  }, []);

  const handleLevelUp = () => {
    if (selectedClass && level < classes[selectedClass]?.progressionTable.length) {
      setLevel(level + 1);
    }
  };

  const handleStatChange = (stat: string, value: number) => {
    setBaseStats({ ...baseStats, [stat]: value });
  };

  const handleToggleFeat = (featId: string) => {
    setSelectedFeats((prev) =>
      prev.includes(featId) ? prev.filter((f) => f !== featId) : [...prev, featId]
    );
  };

  const handleEquipItem = (itemId: string) => {
    setEquippedItems((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  };

  const handleFeatureSelection = (featureId: string, selectedValue: string) => {
    setFeatureSelections((prev) => ({
      ...prev,
      [featureId]: selectedValue
    }));
  };

  const handleSaveCharacter = async () => {
    const characterData = {
      name: characterName,
      class: selectedClass,
      level,
      baseStats,
      selectedFeats,
      equippedItems,
      featureSelections,
    };

    try {
      setIsSaving(true);
      setError(null);

      let response;
      if (characterId) {
        // Update existing character
        response = await fetch(`http://localhost:3000/api/characters/${characterId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(characterData),
        });
      } else {
        // Create new character
        response = await fetch("http://localhost:3000/api/characters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(characterData),
        });
      }

      if (!response.ok) throw new Error("Failed to save character");

      const savedCharacter = await response.json();
      onCharacterCreate(savedCharacter);
      alert("Character saved successfully!");
    } catch (err) {
      console.error("Error saving character:", err);
      setError("Failed to save character");
    } finally {
      setIsSaving(false);
    }
  };

  const currentClassData = selectedClass ? classes[selectedClass] : null;

  const getFeaturesForLevel = (classData: ClassData | null, lvl: number): ClassFeature[] => {
    if (!classData?.classFeatures || lvl === 0) return [];
    const features = classData.classFeatures[lvl] || [];
    return features;
  };

  if (loading) {
    return <div className="character-builder"><p>Loading character...</p></div>;
  }

  return (
    <div className="character-builder">
      <div className="builder-header">
        <h2>{characterId ? "Edit Character" : "Create New Character"}</h2>
        {onBackToSelect && (
          <button className="btn-secondary" onClick={onBackToSelect}>
            Back to Characters
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Character Name */}
      <section className="builder-section">
        <h3>Character Name</h3>
        <input
          type="text"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          placeholder="Enter character name"
        />
      </section>

      {/* Class Selection */}
      <section className="builder-section">
        <h3>Select Class</h3>
        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setLevel(0);
          }}
        >
          <option value="">-- Select a Class --</option>
          {Object.entries(classes).map(([id, cls]) => (
            <option key={id} value={id}>
              {cls.name} (d{cls.hitDie})
            </option>
          ))}
        </select>

        {currentClassData && (
          <div className="class-info">
            <p>
              <strong>Level:</strong> {level} / {currentClassData.progressionTable.length}
            </p>
            <button onClick={handleLevelUp} disabled={level >= currentClassData.progressionTable.length}>
              Level Up
            </button>

            {level > 0 && (
              <div className="level-progression">
                <h4>Current Level Bonuses:</h4>
                <ul>
                  {Object.entries(currentClassData.progressionTable[level - 1] || {})
                    .filter(([key]) => key !== "level" && key !== "abilities")
                    .map(([key, value]) => (
                      <li key={key}>
                        {key}: +{value}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Display Class Features */}
        {level > 0 && getFeaturesForLevel(currentClassData, level).length > 0 && (
          <div className="class-features-section">
            <h4 style={{ marginTop: "16px", color: "#8bd5ca" }}>New Features at Level {level}</h4>
            <div className="features-list">
              {getFeaturesForLevel(currentClassData, level).map((feature) => (
                <div key={feature.id} className="feature-item">
                  <div className="feature-header">
                    <strong>{feature.name}</strong>
                    <span className="feature-desc">{feature.description}</span>
                  </div>
                  
                  {/* Feature Selection UI */}
                  {feature.requiresSelection && feature.selectableOptions && (
                    <div className="feature-selection">
                      <label htmlFor={`select-${feature.id}`} style={{ marginRight: "8px" }}>
                        Choose option:
                      </label>
                      <select
                        id={`select-${feature.id}`}
                        value={featureSelections[feature.id] || ""}
                        onChange={(e) => handleFeatureSelection(feature.id, e.target.value)}
                        style={{ padding: "6px 12px", marginTop: "8px" }}
                      >
                        <option value="">-- Select --</option>
                        {feature.selectableOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.charAt(0).toUpperCase() + opt.slice(1).replace("-", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Ability Scores */}
      <section className="builder-section">
        <h3>Ability Scores (Point Buy)</h3>
        <div className="ability-scores">
          {Object.entries(baseStats).map(([stat, value]) => (
            <div key={stat} className="stat-input">
              <label>{stat.charAt(0).toUpperCase() + stat.slice(1)}:</label>
              <input
                type="number"
                min="3"
                max="18"
                value={value}
                onChange={(e) => handleStatChange(stat, parseInt(e.target.value))}
              />
              <span className="mod">
                ({value >= 10 ? "+" : ""}{Math.floor((value - 10) / 2)})
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Feats */}
      <section className="builder-section">
        <h3>Available Feats (Select {level} feat{level !== 1 ? "s" : ""})</h3>
        <div className="feats-list">
          {Object.values(feats).map((feat) => {
            const meetsPrereqs =
              !feat.prerequisites ||
              (feat.prerequisites.level === undefined || feat.prerequisites.level <= level);
            return (
              <div key={feat.id} className="feat-item">
                <input
                  type="checkbox"
                  id={feat.id}
                  checked={selectedFeats.includes(feat.id)}
                  onChange={() => handleToggleFeat(feat.id)}
                  disabled={!meetsPrereqs && !selectedFeats.includes(feat.id)}
                />
                <label htmlFor={feat.id}>
                  <strong>{feat.name}</strong>: {feat.description}
                </label>
              </div>
            );
          })}
        </div>
        <p>Selected: {selectedFeats.length}</p>
      </section>

      {/* Equipment */}
      <section className="builder-section">
        <h3>Equipment</h3>
        <div className="equipment-list">
          {Object.values(equipment).map((item) => (
            <div key={item.id} className="equipment-item">
              <input
                type="checkbox"
                id={item.id}
                checked={equippedItems.includes(item.id)}
                onChange={() => handleEquipItem(item.id)}
              />
              <label htmlFor={item.id}>
                <strong>{item.name}</strong> [{item.slot}]
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <section className="builder-actions">
        <button 
          className="btn-primary" 
          onClick={handleSaveCharacter}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : characterId ? "Update Character" : "Save Character"}
        </button>
      </section>
    </div>
  );
}

export default CharacterBuilder;
