import { useState } from "react";
import "./App.css";
import CharacterBuilder from "./views/CharacterBuilder";
import CharacterPilot from "./views/CharacterPilot";
import Arena from "./views/Arena";
import CharacterSelect from "./views/CharacterSelect";

type ViewType = "select" | "builder" | "pilot" | "arena";

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("select");
  const [character, setCharacter] = useState<any>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  const handleCharacterSelected = (characterId: string | null) => {
    setSelectedCharacterId(characterId);
    setCurrentView("builder");
  };

  const handleCharacterCreate = (character: any) => {
    setCharacter(character);
    setCurrentView("pilot");
  };

  const handleBackToSelect = () => {
    setCurrentView("select");
    setSelectedCharacterId(null);
    setCharacter(null);
  };

  const renderView = () => {
    switch (currentView) {
      case "select":
        return <CharacterSelect onCharacterSelected={handleCharacterSelected} />;
      case "builder":
        return (
          <CharacterBuilder 
            onCharacterCreate={handleCharacterCreate} 
            characterId={selectedCharacterId}
            onBackToSelect={handleBackToSelect}
          />
        );
      case "pilot":
        return <CharacterPilot character={character} />;
      case "arena":
        return <Arena character={character} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Pathfinder Showdown</h1>
        <nav className="app-nav">
          <button 
            className={currentView === "select" ? "active" : ""} 
            onClick={() => setCurrentView("select")}
          >
            Select Character
          </button>
          <button 
            className={currentView === "builder" ? "active" : ""} 
            onClick={() => setCurrentView("builder")}
            disabled={currentView === "select"}
          >
            Character Builder
          </button>
          <button 
            className={currentView === "pilot" ? "active" : ""} 
            onClick={() => setCurrentView("pilot")}
            disabled={!character}
          >
            Character Pilot
          </button>
          <button 
            className={currentView === "arena" ? "active" : ""} 
            onClick={() => setCurrentView("arena")}
            disabled={!character}
          >
            Arena
          </button>
        </nav>
      </header>

      <main className="app-main">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
