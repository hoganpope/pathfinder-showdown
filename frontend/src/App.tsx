import { useState } from "react";
import "./App.css";
import CharacterBuilder from "./views/CharacterBuilder";
import CharacterPilot from "./views/CharacterPilot";
import Arena from "./views/Arena";

type ViewType = "builder" | "pilot" | "arena";

function App() {
  const [currentView, setCurrentView] = useState<ViewType>("builder");
  const [character, setCharacter] = useState<any>(null);

  const renderView = () => {
    switch (currentView) {
      case "builder":
        return <CharacterBuilder onCharacterCreate={setCharacter} />;
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
            className={currentView === "builder" ? "active" : ""} 
            onClick={() => setCurrentView("builder")}
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
