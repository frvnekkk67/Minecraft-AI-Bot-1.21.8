function createChat({ bot, config, memory, saveMemory, commands, helpers }) {
  const botName = String(config.username || "bot").toLowerCase();

  function maybeReplyToMention(username, message) {
    const text = String(message || "");
    const lower = text.toLowerCase();
    const owner = String(config.ownerUsername || "FranciQ").toLowerCase();

    if (!config.autoReplyWhenMentioned) return false;
    if (!lower.includes(botName)) return false;

    const now = Date.now();
    memory.notes = memory.notes || [];
    memory.notes.push({
      text: `Wzmianka od ${username}: ${text}`,
      at: new Date().toISOString()
    });
    saveMemory(memory);

    if (lower.includes("diax") || lower.includes("diament")) {
      bot.chat(`Jasne, ${username}. Sprawdzam.`);
      bot.chat(`/msg ${owner} ${username} poprosił mnie o diamenty.`);
      return true;
    }

    if (lower.includes("pomoc")) {
      bot.chat(`Jasne, ${username}.`);
      bot.chat(`/msg ${owner} ${username} potrzebuje pomocy.`);
      return true;
    }

    if (lower.includes("chodź") || lower.includes("chodz")) {
      bot.chat(`Idę.`);
      return true;
    }

    if (lower.includes("zrób") || lower.includes("zrob")) {
      bot.chat(`Postaram się.`);
      return true;
    }

    bot.chat(`Tak, ${username}?`);
    return true;
  }

  function onMessage(username, message) {
    if (!username || !message) return false;

    const handledByCommands = commands.handleCommand(username, message);
    if (handledByCommands) return true;

    const handledMention = maybeReplyToMention(username, message);
    if (handledMention) return true;

    if (helpers && typeof helpers.onChat === "function") {
      const handled = helpers.onChat({ username, message });
      if (handled) return true;
    }

    return false;
  }

  return { onMessage };
}

module.exports = { createChat };
