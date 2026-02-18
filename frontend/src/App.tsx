import { useEffect, useState } from "react";
import "./App.css";

interface StatResult {
  total: number;
  breakdown: {
    source: string;
    bonusType: string;
    value: number;
  }[];
}

interface Modifier {
  id: string;
  source: string;
  target: string;
  bonusType: string;
  value: number;
  active: boolean;
}

const API = "http://localhost:3000";

const abilityList = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

function abilityMod(score: number) {
  return Math.floor((score - 10) / 2);
}

function App() {
  const [stats, setStats] = useState<Record<string, StatResult>>({});
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classLevel, setClassLevel] = useState<number>(0);
  const [pendingClassChoice, setPendingClassChoice] = useState<string>("");
  const [classesState, setClassesState] = useState<Record<string, Array<Record<string, number>>>>({});
  interface Feat {
    id: string;
    name: string;
    description?: string;
    prerequisites?: {
      level?: number;
      class?: string[];
      strength?: number;
      [k: string]: any;
    };
    effects: Array<{
      type: string;
      target?: string;
      value?: number;
      [k: string]: any;
    }>;
  }

  const [featsState, setFeatsState] = useState<Record<string, Feat>>({});
  const [ownedFeats, setOwnedFeats] = useState<string[]>([]);

  // load editable classes definition from public/classes.json
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/classes.json');
        if (res.ok) {
          const json = await res.json();
          setClassesState(json);
        }
      } catch (e) {
        // ignore — keep classesState empty
      }
    })();
  }, []);

  // load feats from public/feats.json
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/feats.json');
        if (res.ok) {
          const json = await res.json();
          setFeatsState(json);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  async function fetchStat(stat: string) {
    const res = await fetch(`${API}/stat/${stat}`);
    return res.json();
  }

  async function loadAll() {
    const newStats: Record<string, StatResult> = {};

    for (const stat of [
      ...abilityList,
      "armorClass",
      "attackBonus",
      "initiative",
      "fortitude",
      "reflex",
      "will"
    ]) {
      try {
        newStats[stat] = await fetchStat(stat);
      } catch {
        newStats[stat] = { total: 0, breakdown: [] };
      }
    }

    const mods = await fetch(`${API}/modifiers`).then(r => r.json());

    setStats(newStats);
    setModifiers(mods);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function addModifier(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as any;

    await fetch(`${API}/modifier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: form.source.value,
        target: form.target.value,
        bonusType: form.bonusType.value,
        value: parseInt(form.value.value)
      })
    });

    form.reset();
    loadAll();
  }

  // Apply gains for a given class and level by creating modifiers on the server
  async function applyClassGains(cls: string, level: number) {
    const levelDef = classesState[cls]?.[level - 1];
    if (!levelDef) return;

    for (const [stat, value] of Object.entries(levelDef)) {
      if (!value) continue;

      await fetch(`${API}/modifier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: `Class:${cls} L${level}`,
          target: stat,
          bonusType: "untyped",
          value
        })
      });
    }

    loadAll();
  }

  // Sync owned feats from modifiers (modifiers created with source `Feat:<id>`)
  useEffect(() => {
    const owned = modifiers
      .filter(m => m.source && m.source.startsWith('Feat:'))
      .map(m => m.source.split(':')[1]);
    setOwnedFeats(Array.from(new Set(owned)));
  }, [modifiers]);

  // Apply a feat by posting its effects as modifiers and recording ownership
  async function applyFeat(featId: string) {
    const feat = featsState[featId];
    if (!feat) return;

    for (const eff of feat.effects || []) {
      if (eff.type === 'modifier' && eff.target && typeof eff.value === 'number') {
        await fetch(`${API}/modifier`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: `Feat:${featId}`,
            target: eff.target,
            bonusType: 'untyped',
            value: eff.value
          })
        });
      }
    }

    // refresh modifiers and stats
    await loadAll();
  }

  // Remove a feat by deleting modifiers created with its source
  async function removeFeat(featId: string) {
    const related = modifiers.filter(m => m.source === `Feat:${featId}`);
    for (const m of related) {
      await fetch(`${API}/modifier/${m.id}`, { method: 'DELETE' });
    }
    await loadAll();
  }

  // Select a class (keeps level at 0 until leveled up)
  function handleSelectClass() {
    if (!pendingClassChoice) return;
    setSelectedClass(pendingClassChoice);
    setClassLevel(0);
  }

  // Level up the selected class
  async function handleLevelUp() {
    if (!selectedClass) return;
    const newLevel = classLevel + 1;
    setClassLevel(newLevel);
    await applyClassGains(selectedClass, newLevel);
  }

  async function toggleModifier(id: string, active: boolean) {
    await fetch(`${API}/modifier/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active })
    });
    loadAll();
  }

  async function deleteModifier(id: string) {
    await fetch(`${API}/modifier/${id}`, {
      method: "DELETE"
    });
    loadAll();
  }

  return (
    <div className="sheet">
      <h1>Character Sheet</h1>

      {/* Ability Scores */}
      <section className="abilities">
        {abilityList.map(stat => {
          const value = stats[stat]?.total ?? 0;
          return (
            <div key={stat} className="ability">
              <div className="ability-name">{stat.toUpperCase()}</div>
              <div className="ability-score">{value}</div>
              <div className="ability-mod">
                {value ? (abilityMod(value) >= 0 ? "+" : "") + abilityMod(value) : "+0"}
              </div>
            </div>
          );
        })}
      </section>

      {/* Combat Block */}
      <section className="combat">
        <div><strong>Armor Class:</strong> {stats.armorClass?.total ?? 10}</div>
        <div><strong>Attack Bonus:</strong> {stats.attackBonus?.total ?? 0}</div>
        <div><strong>Initiative:</strong> {stats.initiative?.total ?? 0}</div>
      </section>

      {/* Saving Throws */}
      <section className="saves">
        <div><strong>Fortitude:</strong> {stats.fortitude?.total ?? 0}</div>
        <div><strong>Reflex:</strong> {stats.reflex?.total ?? 0}</div>
        <div><strong>Will:</strong> {stats.will?.total ?? 0}</div>
      </section>

      {/* Modifiers Panel */}
      <section className="modifiers">
        <h2>Active Modifiers</h2>
        {modifiers.map(m => (
          <div key={m.id} className="modifier">
            {m.source} → {m.target} ({m.bonusType}) {m.value > 0 ? "+" : ""}{m.value}
            <button onClick={() => toggleModifier(m.id, !m.active)}>
              {m.active ? "Disable" : "Enable"}
            </button>
            <button onClick={() => deleteModifier(m.id)}>
              Delete
            </button>
          </div>
        ))}
      </section>

      {/* Add Modifier */}
      <section className="add-modifier">
        <h2>Add Modifier</h2>
        <form onSubmit={addModifier}>
          <input name="source" placeholder="Source" required />
          <input name="target" placeholder="Target (e.g. strength)" required />
          <select name="bonusType">
            <option value="untyped">untyped</option>
            <option value="enhancement">enhancement</option>
            <option value="morale">morale</option>
            <option value="competence">competence</option>
            <option value="luck">luck</option>
            <option value="dodge">dodge</option>
            <option value="circumstance">circumstance</option>
          </select>
          <input name="value" type="number" required />
          <button type="submit">Add</button>
        </form>
      </section>

      {/* Class Levels */}
      <section className="class-levels">
        <h2>Class Levels</h2>
        <div>
          <label>Choose class:</label>
          <select
            value={pendingClassChoice}
            onChange={e => setPendingClassChoice(e.target.value)}
          >
            <option value="">-- pick --</option>
            {Object.keys(classesState).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {!selectedClass ? (
            <button onClick={handleSelectClass} disabled={!pendingClassChoice}>
              Select Class
            </button>
          ) : (
            <>
              <div>
                <strong>Class:</strong> {selectedClass} — <strong>Level:</strong> {classLevel}
              </div>
              <button onClick={handleLevelUp}>Level Up</button>
            </>
          )}
        </div>

        {selectedClass && (
          <div className="class-details">
            <h3>Level Benefits</h3>
            <ol>
              {(classesState[selectedClass] || []).map((lvl, i) => (
                <li key={i}>
                  <strong>Level {i + 1}:</strong>{" "}
                  {Object.entries(lvl).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`).join(', ')}
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

        {/* Feats */}
        <section className="feats">
          <h2>Feats</h2>
          <div className="available-feats">
            <h3>Available</h3>
            <ul>
              {Object.values(featsState)
                .filter(f => !ownedFeats.includes(f.id))
                .filter(f => {
                  const pre = f.prerequisites || {};
                  if (pre.level && classLevel < pre.level) return false;
                  if (pre.class && selectedClass && !pre.class.includes(selectedClass)) return false;
                  return true;
                })
                .map(f => (
                  <li key={f.id}>
                    <strong>{f.name}</strong> — {f.description}
                    <button onClick={() => applyFeat(f.id)}>Take Feat</button>
                  </li>
                ))}
            </ul>
          </div>

          <div className="owned-feats">
            <h3>Owned</h3>
            <ul>
              {ownedFeats.map(id => {
                const f = featsState[id];
                if (!f) return null;
                return (
                  <li key={id}>
                    <strong>{f.name}</strong> — {f.description}
                    <button onClick={() => removeFeat(id)}>Remove</button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
    </div>
  );
}

export default App;
