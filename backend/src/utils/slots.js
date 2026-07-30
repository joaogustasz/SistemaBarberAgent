function toMinutes(hhmm) {
  const [h, m] = String(hhmm).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * @param {string} date        'YYYY-MM-DD'
 * @param {number} durationMin duração do serviço escolhido
 * @param {Array}  workingHours linhas da tabela working_hours daquele barbeiro (todas)
 * @param {Array}  blockedSlots linhas de blocked_slots daquele barbeiro na data
 * @param {Array}  busyAppointments agendamentos já confirmados daquele barbeiro na data ({ time, duration_min })
 * @param {number} stepMin     granularidade dos horários oferecidos (padrão 30min)
 */
function computeAvailableSlots({ date, durationMin, workingHours, blockedSlots, busyAppointments, stepMin = 30 }) {
  const weekday = new Date(date + "T12:00:00").getDay();
  const dayRanges = workingHours.filter((w) => w.weekday === weekday);
  if (dayRanges.length === 0) return []; // barbeiro não atende neste dia da semana

  const wholeDayBlocked = blockedSlots.some((b) => b.start_time === null);
  if (wholeDayBlocked) return [];

  const blockedRanges = blockedSlots
    .filter((b) => b.start_time !== null)
    .map((b) => [toMinutes(b.start_time), toMinutes(b.end_time)]);

  const busyRanges = busyAppointments.map((a) => {
    const s = toMinutes(a.time);
    return [s, s + a.duration_min];
  });

  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots = [];
  for (const range of dayRanges) {
    const start = toMinutes(range.start_time);
    const end = toMinutes(range.end_time);
    for (let t = start; t + durationMin <= end; t += stepMin) {
      if (isToday && t <= nowMinutes) continue;
      const hitsBlocked = blockedRanges.some(([bs, be]) => t < be && t + durationMin > bs);
      const hitsBusy = busyRanges.some(([bs, be]) => t < be && t + durationMin > bs);
      if (!hitsBlocked && !hitsBusy) slots.push(toHHMM(t));
    }
  }
  return slots;
}

module.exports = { computeAvailableSlots, toMinutes, toHHMM };
