function createCommands({ bot, config, memory, saveMemory, helpers }) {
  const prefix = config.chatPrefix || "!";
  let lastHelpMessageAt = 0;

  function isOwner(username) {
    return username && username.toLowerCase() === String(config.ownerUsername || "FranciQ").toLowerCase();
  }

  function say(text) {
    if (!bot || !text) return;
    bot.chat(String(text));
  }

  function msgOwner(text) {
    const owner = config.ownerUsername || "FranciQ";
    bot.chat(`/msg ${owner} ${text}`);
  }

  function handleCommand(username, message) {
    const text = String(message || "").trim();
    if (!text) return false;

    const lower = text.toLowerCase();
    const mentionName = String(config.username || "bot").toLowerCase();

    const isDirectMention =
      lower.includes(mentionName) ||
      lower.startsWith(`${prefix}`) ||
      lower.startsWith(`/msg ${String(config.username || "").toLowerCase()}`);

    if (!isDirectMention) return false;

    if (lower.startsWith(prefix)) {
      const args = text.slice(prefix.length).trim().split(/\s+/);
      const cmd = (args.shift() || "").toLowerCase();

      if (cmd === "help") {
        say("Dostępne komendy: !status, !say <tekst>, !note <tekst>, !task <tekst>, !stop");
        return true;
      }

      if (cmd === "status") {
        const taskCount = Array.isArray(memory.activeTasks) ? memory.activeTasks.length : 0;
        say(`OK. Pamięć: ${taskCount} zadań. Właściciel: ${config.ownerUsername || "FranciQ"}.`);
        return true;
      }

      if (cmd === "say") {
        const reply = args.join(" ");
        if (reply) say(reply);
        return true;
      }

      if (cmd === "note") {
        const note = args.join(" ");
        if (note) {
          memory.notes = memory.notes || [];
          memory.notes.push({
            text: note,
            by: username,
            at: new Date().toISOString()
          });
          saveMemory(memory);
          say("Zapisałem.");
        }
        return true;
      }

      if (cmd === "task") {
        const task = args.join(" ");
        if (task) {
          memory.activeTasks = memory.activeTasks || [];
          memory.activeTasks.push({
            text: task,
            by: username,
            at: new Date().toISOString()
          });
          saveMemory(memory);
          say("Przyjąłem zadanie.");
        }
        return true;
      }

      if (cmd === "stop" && isOwner(username)) {
        say("Zamykam się.");
        setTimeout(() => process.exit(0), 1000);
        return true;
      }
    }

    if (isOwner(username) && lower.includes("pomoc")) {
      const now = Date.now();
      if (now - lastHelpMessageAt > (config.helpMessageCooldownMs || 60000)) {
        lastHelpMessageAt = now;
        msgOwner("Potrzebuję pomocy.");
        return true;
      }
    }

    if (isOwner(username) && lower.includes("status")) {
      say("Jestem online.");
      return true;
    }

    if (helpers && typeof helpers.onMention === "function") {
      const reacted = helpers.onMention({ username, message: text, isOwner: isOwner(username) });
      if (reacted) return true;
    }

    return false;
  }

  return { handleCommand, isOwner };
}

module.exports = { createCommands };
