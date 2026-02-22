import { useEffect, useState } from "react";

interface StoredCharacter {
  id: string;
  name: string;
  class: string;
  level: number;
}

interface CharacterSelectProps {
  onCharacterSelected: (characterId: string | null) => void;
}

function CharacterSelect({ onCharacterSelected }: CharacterSelectProps) {
  const [characters, setCharacters] = useState<StoredCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:3000/api/characters");
      if (!res.ok) throw new Error("Failed to load characters");
      const data = await res.json();
      setCharacters(data);
    } catch (err) {
      console.error("Error loading characters:", err);
      setError("Failed to load characters");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = (characterId: string) => {
    onCharacterSelected(characterId);
  };

  const handleCreateNew = () => {
    onCharacterSelected(null);
  };

  const handleDeleteCharacter = async (characterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this character?")) {
      try {
        const res = await fetch(`http://localhost:3000/api/characters/${characterId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete character");
        await loadCharacters();
      } catch (err) {
        console.error("Error deleting character:", err);
        setError("Failed to delete character");
      }
    }
  };

  return (
    <div className="character-select">
      <h2>Select or Create Character</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="character-selection-container">
        <section className="character-list-section">
          <h3>Your Characters</h3>
          {loading ? (
            <p>Loading characters...</p>
          ) : characters.length === 0 ? (
            <p>No characters yet. Create your first one!</p>
          ) : (
            <ul className="character-list">
              {characters.map((char) => (
                <li
                  key={char.id}
                  className="character-item"
                  onClick={() => handleSelectCharacter(char.id)}
                >
                  <div className="character-info">
                    <h4>{char.name}</h4>
                    <p>
                      {char.class} - Level {char.level}
                    </p>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={(e) => handleDeleteCharacter(char.id, e)}
                    title="Delete character"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="character-actions-section">
          <button className="btn-primary btn-large" onClick={handleCreateNew}>
            Create New Character
          </button>
        </section>
      </div>
    </div>
  );
}

export default CharacterSelect;
