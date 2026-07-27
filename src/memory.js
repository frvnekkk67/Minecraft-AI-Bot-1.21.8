const fs = require("fs");
const path = require("path");

const memoryPath = path.join(__dirname, "..", "data", "memory.json");

function ensureMemoryFile() {
  const dir = path.dirname(memoryPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(memoryPath)) {
    fs.writeFileSync(memoryPath, JSON.stringify({
      botName: "FranekBot",
      ownerName: "FranciQ",
      lastSeen: null,
      knownPlayers: {},
      knownLocations: {},
      activeTasks: [],
      notes: []
    }, null, 2), "utf8");
  }
}

function loadMemory() {
  ensureMemoryFile();
  try {
    const raw = fs.readFileSync(memoryPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {
      botName: "FranekBot",
      ownerName: "FranciQ",
      lastSeen: null,
      knownPlayers: {},
      knownLocations: {},
      activeTasks: [],
      notes: []
    };
  }
}

function saveMemory(memory) {
  ensureMemoryFile();
  const tmp = `${memoryPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(memory, null, 2), "utf8");
  fs.renameSync(tmp, memoryPath);
}

function updateMemory(mutator) {
  const memory = loadMemory();
  mutator(memory);
  memory.lastSeen = new Date().toISOString();
  saveMemory(memory);
  return memory;
}

module.exports = {
  loadMemory,
  saveMemory,
  updateMemory
};
