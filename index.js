require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const mineflayer = require("mineflayer");

const { loadMemory, saveMemory } = require("./src/memory");
const { createReconnect } = require("./src/reconnect");
const { startAntiAfk } = require("./src/antiAFK");
const { createCommands } = require("./src/commands");
const { createChat } = require("./src/chat");
const { createBrain } = require("./src/ai/brain");

const configPath = path.join(__dirname, "config.json");

function loadConfig() {
  const raw = fs.readFileSync(configPath, "utf8");
  const base = JSON.parse(raw);

  return {
    ...base,
    host: process.env.MC_HOST || base.host,
    port: Number(process.env.MC_PORT || base.port || 25565),
    version: process.env.MC_VERSION || base.version || "1.21.8",
    username: process.env.BOT_USERNAME || base.username || "FranekBot",
    ownerUsername: process.env.OWNER_USERNAME || base.ownerUsername || "FranciQ",
    password: process.env.MC_PASSWORD ?? base.password ?? "",
    autoLogin: String(process.env.AUTO_LOGIN ?? String(base.autoLogin ?? true)).toLowerCase() !== "false",
    autoRegister: String(process.env.AUTO_REGISTER ?? String(base.autoRegister ?? false)).toLowerCase() === "true",
    chatPrefix: process.env.CHAT_PREFIX || base.chatPrefix || "!",
    logLevel: process.env.LOG_LEVEL || "info"
  };
}

const config = loadConfig();
let memory = loadMemory();
memory.botName = config.username;
memory.ownerName = config.ownerUsername;
saveMemory(memory);

const app = express();
app.get("/", (_req, res) => {
  res.send("Minecraft AI Bot działa ✅");
});
const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`[web] health check on ${port}`);
});

let bot = null;
let antiAfkStop = null;
let reconnect = null;
let isShuttingDown = false;
let loginDoneThisSession = false;
let registerDoneThisSession = false;

function safeChat(text) {
  if (!bot || !bot.chat) return;
  try {
    bot.chat(String(text));
  } catch (err) {
    console.log("[chat] nie udało się wysłać wiadomości:", err.message);
  }
}

function boot() {
  const currentConfig = loadConfig();
  console.log(`[bot] łączenie z ${currentConfig.host}:${currentConfig.port} jako ${currentConfig.username}`);

  bot = mineflayer.createBot({
    host: currentConfig.host,
    port: currentConfig.port,
    username: currentConfig.username,
    version: currentConfig.version,
    auth: "offline"
  });

  reconnect = createReconnect(boot, currentConfig.reconnectDelayMs || 15000);

  const brain = createBrain({
    bot,
    config: currentConfig,
    memory,
    saveMemory
  });

  const commands = createCommands({
    bot,
    config: currentConfig,
    memory,
    saveMemory,
    helpers: {
      onMention: ({ username, message, isOwner }) => {
        brain.rememberPlayer(username, { isOwner });

        if (isOwner) {
          if (String(message).toLowerCase().includes("zapisz")) {
            brain.note(`Polecenie od właściciela: ${message}`);
            safeChat("Zapisane.");
            return true;
          }
        }
        return false;
      }
    }
  });

  const chat = createChat({
    bot,
    config: currentConfig,
    memory,
    saveMemory,
    commands,
    helpers: {
      onChat: ({ username, message }) => {
        brain.rememberPlayer(username);
        if (String(message).toLowerCase().includes(currentConfig.ownerUsername.toLowerCase())) {
          return false;
        }
        return false;
      }
    }
  });

  bot.once("spawn", () => {
    console.log("[bot] spawn");

    memory.lastSeen = new Date().toISOString();
    saveMemory(memory);

    if (antiAfkStop) antiAfkStop();
    antiAfkStop = startAntiAfk(bot, currentConfig.antiAfkIntervalMs || 30000);

    loginDoneThisSession = false;
    registerDoneThisSession = false;

    setTimeout(() => {
      if (currentConfig.password && currentConfig.autoLogin && !loginDoneThisSession) {
        safeChat(`/login ${currentConfig.password}`);
        loginDoneThisSession = true;
      }
    }, currentConfig.loginDelayMs || 3500);

    setTimeout(() => {
      if (currentConfig.password && currentConfig.autoRegister && !registerDoneThisSession) {
        safeChat(`/register ${currentConfig.password} ${currentConfig.password}`);
        registerDoneThisSession = true;
      }
    }, (currentConfig.loginDelayMs || 3500) + 2000);

    safeChat(`Cześć! Jestem ${currentConfig.username}.`);
  });

  bot.on("messagestr", (message) => {
    const text = String(message || "");
    const lower = text.toLowerCase();

    if (lower.includes("register") && currentConfig.password && currentConfig.autoRegister && !registerDoneThisSession) {
      setTimeout(() => {
        safeChat(`/register ${currentConfig.password} ${currentConfig.password}`);
        registerDoneThisSession = true;
      }, 1000);
    }

    if (lower.includes("login") && currentConfig.password && currentConfig.autoLogin && !loginDoneThisSession) {
      setTimeout(() => {
        safeChat(`/login ${currentConfig.password}`);
        loginDoneThisSession = true;
      }, 1000);
    }

    // Prosta próba wyciągnięcia nicku z wiadomości czatu.
    // Mineflayer zwykle podaje messagestr bez pewnej struktury, więc to jest heurystyka.
    const mentionOwner = lower.includes(String(currentConfig.ownerUsername || "franciq").toLowerCase());
    if (mentionOwner) {
      brain.note(`Wiadomość z wzmianką o właścicielu: ${text}`);
    }

    // Jeśli wiadomość wygląda jak zwykły czat, można odrzucić systemowe komunikaty
    if (lower.startsWith("[") || lower.includes("server")) {
      return;
    }
  });

  bot.on("chat", (username, message) => {
    if (username === bot.username) return;
    chat.onMessage(username, message);
  });

  bot.on("whisper", (username, message) => {
    if (username === bot.username) return;
    chat.onMessage(username, message);
  });

  bot.on("message", (jsonMsg) => {
    try {
      const txt = jsonMsg.toString();
      if (txt) {
        memory.lastSeen = new Date().toISOString();
        saveMemory(memory);
      }
    } catch {}
  });

  bot.on("death", () => {
    brain.note("Bot umarł.");
    safeChat(`/msg ${currentConfig.ownerUsername} Zginąłem.`);
  });

  bot.on("kicked", (reason) => {
    const text = typeof reason === "string" ? reason : (reason && reason.toString ? reason.toString() : "kicked");
    console.log("[bot] kicked:", text);
    brain.note(`Kick: ${text}`);
  });

  bot.on("error", (err) => {
    console.log("[bot] error:", err.message);
    brain.note(`Error: ${err.message}`);
  });

  bot.on("end", () => {
    console.log("[bot] end");
    if (antiAfkStop) {
      antiAfkStop();
      antiAfkStop = null;
    }

    if (!isShuttingDown && reconnect) {
      reconnect.scheduleReconnect("end");
    }
  });

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

function shutdown() {
  isShuttingDown = true;
  try {
    if (antiAfkStop) antiAfkStop();
  } catch {}
  try {
    if (reconnect) reconnect.stopReconnect();
  } catch {}
  try {
    if (bot) bot.quit("shutdown");
  } catch {}
  setTimeout(() => process.exit(0), 300);
}

boot();
