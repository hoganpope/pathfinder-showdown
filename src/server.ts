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

const character = new Character({
  strength: 16,
  dexterity: 12,
  constitution: 18,
  intelligence: 10,
  wisdom: 8,
  charisma: 10,
  baseAttackBonus: 6
});

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
    "circumstance"
  ];

  if (!validBonusTypes.includes(bonusType)) {
    return res.status(400).json({
      error: "Invalid bonusType"
    });
  }

  const modifier: Modifier = {
    id: uuidv4(),
    source,
    target,
    bonusType,
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


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
