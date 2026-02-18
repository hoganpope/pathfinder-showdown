const statsToDisplay = ["strength", "attackBonus"];

async function fetchStat(stat) {
  const res = await fetch(`/stat/${stat}`);
  return res.json();
}

async function renderStats() {
  const container = document.getElementById("stats");
  container.innerHTML = "";

  for (const stat of statsToDisplay) {
    const data = await fetchStat(stat);

    const statDiv = document.createElement("div");
    statDiv.className = "stat";

    statDiv.innerHTML = `<strong>${stat}:</strong> ${data.total}`;

    const breakdownDiv = document.createElement("div");
    breakdownDiv.className = "breakdown";

    data.breakdown.forEach(entry => {
      const line = document.createElement("div");
      line.textContent = `${entry.source} (${entry.bonusType}): ${entry.value >= 0 ? "+" : ""}${entry.value}`;
      breakdownDiv.appendChild(line);
    });

    statDiv.appendChild(breakdownDiv);
    container.appendChild(statDiv);
  }
}

document.getElementById("modifierForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const source = document.getElementById("source").value;
  const target = document.getElementById("target").value;
  const bonusType = document.getElementById("bonusType").value;
  const value = parseInt(document.getElementById("value").value);

  await fetch("/modifier", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source,
      target,
      bonusType,
      value
    })
  });

  e.target.reset();
  renderStats();
});

renderStats();
