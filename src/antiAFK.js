function startAntiAfk(bot, intervalMs = 30000) {
  let tick = null;
  if (!bot) return () => {};

  const pulse = () => {
    if (!bot.entity) return;
    try {
      bot.setControlState("jump", true);
      setTimeout(() => bot.setControlState("jump", false), 250);
      setTimeout(() => bot.look(bot.entity.yaw + 0.3, bot.entity.pitch, true), 500);
      setTimeout(() => bot.look(bot.entity.yaw - 0.3, bot.entity.pitch, true), 1000);
    } catch (err) {
      console.log("[antiAfk] błąd:", err.message);
    }
  };

  tick = setInterval(pulse, intervalMs);
  pulse();

  return () => {
    if (tick) clearInterval(tick);
    tick = null;
  };
}

module.exports = { startAntiAfk };
