function createBrain({ bot, config, memory, saveMemory }) {
  function rememberPlayer(username, extra = {}) {
    memory.knownPlayers = memory.knownPlayers || {};
    memory.knownPlayers[username] = {
      ...(memory.knownPlayers[username] || {}),
      ...extra,
      lastSeen: new Date().toISOString()
    };
    saveMemory(memory);
  }

  function rememberLocation(name, pos) {
    if (!name || !pos) return;
    memory.knownLocations = memory.knownLocations || {};
    memory.knownLocations[name] = {
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      z: Math.round(pos.z),
      dim: bot && bot.game ? bot.game.dimension : "unknown",
      at: new Date().toISOString()
    };
    saveMemory(memory);
  }

  function note(text) {
    memory.notes = memory.notes || [];
    memory.notes.push({
      text,
      at: new Date().toISOString()
    });
    saveMemory(memory);
  }

  return {
    rememberPlayer,
    rememberLocation,
    note
  };
}

module.exports = { createBrain };
