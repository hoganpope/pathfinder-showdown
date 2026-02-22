import path from "path";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { Character } from "./domain/character"
import { Modifier } from "./domain/modifier";
import { BonusType } from "./domain/bonusTypes";
import cors from "cors";



const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use(cors());


const port = 3000;

// In-memory storage for characters
const storedCharacters: Record<string, any> = {};

const character = new Character({
  strength: 16,
  dexterity: 12,
  constitution: 18,
  intelligence: 10,
  wisdom: 8,
  charisma: 10,
  baseAttackBonus: 6
}, 200); // 200 gp starting gold

/*
---------------------------------------------------
GET stat
---------------------------------------------------
*/
app.get("/stat/:name", (req, res) => {
  const statName = req.params.name;
  const result = character.resolveStat(statName);
  res.json(result);
});

/*
---------------------------------------------------
POST modifier
---------------------------------------------------
*/
app.post("/modifier", (req, res) => {

  const { source, target, bonusType, value, active } = req.body;

  // Basic validation
  if (!source || !target || typeof value !== "number") {
    return res.status(400).json({
      error: "source, target, and numeric value are required"
    });
  }

  const validBonusTypes: BonusType[] = [
    "untyped",
    "enhancement",
    "morale",
    "competence",
    "luck",
    "dodge",
    "circumstance",
    "armor-training"
  ];

  if (!validBonusTypes.includes(bonusType)) {
    return res.status(400).json({
      error: "Invalid bonusType"
    });
  }

  const modifier: Modifier = {
    id: uuidv4(),
    name: `${source} (${target})`,
    source,
    target,
    type: bonusType,
    value,
    active: active ?? true
  };

  character.addModifier(modifier);

  res.json({
    message: "Modifier added",
    modifier
  });
});

/*
---------------------------------------
GET all modifiers
---------------------------------------
*/
app.get("/modifiers", (req, res) => {
  res.json(character.getModifiers());
});

/*
---------------------------------------
PATCH toggle modifier
---------------------------------------
*/
app.patch("/modifier/:id", (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  character.toggleModifier(id, active);
  res.json({ message: "Updated" });
});

/*
---------------------------------------
DELETE modifier
---------------------------------------
*/
app.delete("/modifier/:id", (req, res) => {
  const { id } = req.params;
  character.removeModifier(id);
  res.json({ message: "Deleted" });
});

/*
---------------------------------------
CHARACTER ENDPOINTS
---------------------------------------
*/

// GET all characters
app.get("/api/characters", (req, res) => {
  const characters = Object.values(storedCharacters).map(char => ({
    id: char.id,
    name: char.name,
    class: char.class,
    level: char.level,
  }));
  res.json(characters);
});

// POST save a new character
app.post("/api/characters", (req, res) => {
  const characterData = req.body;
  const id = uuidv4();
  
  storedCharacters[id] = {
    id,
    ...characterData,
    createdAt: new Date().toISOString(),
  };
  
  res.json({ id, ...storedCharacters[id] });
});

// GET a specific character
app.get("/api/characters/:id", (req, res) => {
  const { id } = req.params;
  const character = storedCharacters[id];
  
  if (!character) {
    return res.status(404).json({ error: "Character not found" });
  }
  
  res.json(character);
});

// PUT update a character
app.put("/api/characters/:id", (req, res) => {
  const { id } = req.params;
  const characterData = req.body;
  
  if (!storedCharacters[id]) {
    return res.status(404).json({ error: "Character not found" });
  }
  
  storedCharacters[id] = {
    ...storedCharacters[id],
    ...characterData,
    id,
  };
  
  res.json(storedCharacters[id]);
});

// DELETE a character
app.delete("/api/characters/:id", (req, res) => {
  const { id } = req.params;
  
  if (!storedCharacters[id]) {
    return res.status(404).json({ error: "Character not found" });
  }
  
  delete storedCharacters[id];
  res.json({ message: "Character deleted" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
