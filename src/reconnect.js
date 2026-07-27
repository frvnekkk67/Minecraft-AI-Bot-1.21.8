function createReconnect(startBot, delayMs) {
  let reconnectTimer = null;
  let stopped = false;

  function scheduleReconnect(reason = "unknown") {
    if (stopped) return;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      startBot();
    }, delayMs);
    console.log(`[reconnect] reconnect za ${Math.round(delayMs / 1000)}s (${reason})`);
  }

  function stopReconnect() {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
  }

  return {
    scheduleReconnect,
    stopReconnect
  };
}

module.exports = { createReconnect };
