import { useEffect, useState } from "react";

interface ArenaProps {
  character: any;
}

interface Combatant {
  name: string;
  hp: number;
  maxHP: number;
  class: string;
  level: number;
  initiative: number;
  stats: Record<string, number>;
}

function Arena({ character }: ArenaProps) {
  const [player, setPlayer] = useState<Combatant | null>(null);
  const [opponent, setOpponent] = useState<Combatant | null>(null);
  const [currentTurn, setCurrentTurn] = useState<"player" | "opponent">("player");
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleActive, setBattleActive] = useState<boolean>(false);

  useEffect(() => {
    if (character) {
      const conMod = Math.floor((character.baseStats?.constitution - 10) / 2);
      const baseHP = (8 + conMod) * (character.level || 1);

      const playerChar: Combatant = {
        name: character.name || "Player",
        hp: baseHP,
        maxHP: baseHP,
        class: character.class || "Fighter",
        level: character.level || 1,
        initiative: Math.floor(Math.random() * 20) + 1 + Math.floor((character.baseStats?.dexterity - 10) / 2),
        stats: character.baseStats,
      };

      const opponentChar: Combatant = {
        name: "Enemy Fighter",
        hp: baseHP,
        maxHP: baseHP,
        class: "Fighter",
        level: character.level || 1,
        initiative: Math.floor(Math.random() * 20) + 1,
        stats: {
          strength: 14,
          dexterity: 12,
          constitution: 14,
          intelligence: 10,
          wisdom: 11,
          charisma: 10,
        },
      };

      setPlayer(playerChar);
      setOpponent(opponentChar);
      setBattleLog([
        `Battle Start!`,
        `${playerChar.name} Initiative: ${playerChar.initiative}`,
        `${opponentChar.name} Initiative: ${opponentChar.initiative}`,
      ]);

      if (playerChar.initiative >= opponentChar.initiative) {
        setCurrentTurn("player");
        addLog(`${playerChar.name} goes first!`);
      } else {
        setCurrentTurn("opponent");
        addLog(`${opponentChar.name} goes first!`);
      }
    }
  }, [character]);

  const addLog = (message: string) => {
    setBattleLog((prev) => [...prev, message]);
  };

  const performAttack = (attacker: Combatant, defender: Combatant) => {
    const strMod = Math.floor((attacker.stats.strength - 10) / 2);
    const attackRoll = Math.floor(Math.random() * 20) + 1;
    const attackTotal = attackRoll + strMod;

    const defenderDexMod = Math.floor((defender.stats.dexterity - 10) / 2);
    const defenderAC = 10 + defenderDexMod;

    addLog(`${attacker.name} attacks: rolled ${attackRoll} + ${strMod} = ${attackTotal} vs AC ${defenderAC}`);

    if (attackTotal >= defenderAC) {
      const damage = Math.floor(Math.random() * 8) + 1 + strMod;
      addLog(`🎯 HIT! Dealing ${damage} damage!`);
      return damage;
    } else {
      addLog(`❌ MISS!`);
      return 0;
    }
  };

  const handlePlayerAttack = () => {
    if (!player || !opponent) return;

    const damage = performAttack(player, opponent);
    const newOpponentHP = Math.max(0, opponent.hp - damage);
    setOpponent({ ...opponent, hp: newOpponentHP });

    if (newOpponentHP <= 0) {
      addLog(`🎊 ${player.name} defeats ${opponent.name}! Victory!`);
      setBattleActive(false);
    } else {
      setCurrentTurn("opponent");
    }
  };

  const handleOpponentAttack = () => {
    if (!player || !opponent) return;

    const damage = performAttack(opponent, player);
    const newPlayerHP = Math.max(0, player.hp - damage);
    setPlayer({ ...player, hp: newPlayerHP });

    if (newPlayerHP <= 0) {
      addLog(`💀 ${opponent.name} defeats ${player.name}! Defeat!`);
      setBattleActive(false);
    } else {
      setCurrentTurn("player");
    }
  };

  const handleStartBattle = () => {
    setBattleActive(true);
    setBattleLog([...battleLog, "Battle has begun!"]);
  };

  const handleResetBattle = () => {
    if (player && opponent) {
      setPlayer({ ...player, hp: player.maxHP });
      setOpponent({ ...opponent, hp: opponent.maxHP });
      setBattleActive(false);
      setBattleLog([
        `Battle Start!`,
        `${player.name} Initiative: ${player.initiative}`,
        `${opponent.name} Initiative: ${opponent.initiative}`,
      ]);
    }
  };

  if (!player || !opponent) {
    return <div className="arena">Loading arena...</div>;
  }

  const playerHealthPercentage = (player.hp / player.maxHP) * 100;
  const opponentHealthPercentage = (opponent.hp / opponent.maxHP) * 100;

  return (
    <div className="arena">
      <h2>Arena Battle</h2>

      {/* Combat Display */}
      <section className="arena-combat">
        <div className="combatant player-side">
          <h3>{player.name}</h3>
          <p className="class-level">
            Level {player.level} {player.class}
          </p>
          <div className="health-bar">
            <div
              className="health-fill"
              style={{ width: `${playerHealthPercentage}%` }}
            />
          </div>
          <p className="health-text">
            {Math.max(0, player.hp)} / {player.maxHP}
          </p>
        </div>

        <div className="versus">VS</div>

        <div className="combatant opponent-side">
          <h3>{opponent.name}</h3>
          <p className="class-level">
            Level {opponent.level} {opponent.class}
          </p>
          <div className="health-bar">
            <div
              className="health-fill"
              style={{ width: `${opponentHealthPercentage}%` }}
            />
          </div>
          <p className="health-text">
            {Math.max(0, opponent.hp)} / {opponent.maxHP}
          </p>
        </div>
      </section>

      {/* Battle Controls */}
      <section className="arena-controls">
        {!battleActive && player.hp > 0 && opponent.hp > 0 && (
          <button onClick={handleStartBattle} className="btn-start-battle">
            Start Battle
          </button>
        )}

        {battleActive && (
          <div className="turn-display">
            <p className="current-turn">
              {currentTurn === "player" ? `${player.name}'s Turn` : `${opponent.name}'s Turn`}
            </p>

            {currentTurn === "player" ? (
              <button onClick={handlePlayerAttack} className="btn-attack">
                Attack
              </button>
            ) : (
              <button onClick={handleOpponentAttack} disabled className="btn-attack">
                Opponent Attacking...
              </button>
            )}
          </div>
        )}

        {(player.hp <= 0 || opponent.hp <= 0) && (
          <button onClick={handleResetBattle} className="btn-reset-battle">
            Reset Battle
          </button>
        )}
      </section>

      {/* Battle Log */}
      <section className="arena-log">
        <h3>Battle Log</h3>
        <div className="log-container">
          {battleLog.map((entry, idx) => (
            <p key={idx} className="log-entry">
              {entry}
            </p>
          ))}
        </div>
      </section>

      {/* Battle Result */}
      {!battleActive && (player.hp <= 0 || opponent.hp <= 0) && (
        <section className="arena-result">
          <h3 className={player.hp > 0 ? "victory" : "defeat"}>
            {player.hp > 0 ? "🎊 Victory!" : "💀 Defeat!"}
          </h3>
          <p>
            {player.hp > 0
              ? `${player.name} is victorious with ${player.hp} HP remaining!`
              : `${opponent.name} wins the battle!`}
          </p>
        </section>
      )}
    </div>
  );
}

export default Arena;
