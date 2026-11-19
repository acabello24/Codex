export const people = [
  { id: 'coordinador', name: 'Coordinador', role: 'coordinator' },
  ...['Camila Torres', 'Mateo Ruiz', 'Valentina Díaz', 'Santiago León'].map((name, index) => ({
    id: 'agente' + (index + 1), name, role: 'agent',
  })),
];
export const agents = people.filter(person => person.role === 'agent');
export const channels = ['Teléfono', 'Correo electrónico', 'Mensajería'];
export const types = ['Consulta de stock', 'Estado de pedido', 'Inconformidad de envío', 'Facturación o cobro', 'Devolución'];
export const transitions = {
  'Nuevo': ['En proceso'],
  'En proceso': ['Pendiente logística', 'Pendiente ventas', 'Resuelto'],
  'Pendiente logística': ['En proceso', 'Resuelto'],
  'Pendiente ventas': ['En proceso', 'Resuelto'],
  'Resuelto': ['Cerrado'],
  'Cerrado': [],
};
export const states = Object.keys(transitions);
export const hours = (date, now = Date.now()) => (now - Date.parse(date)) / 3_600_000;
export const overdue = (ticket, now) => !ticket.resolvedAt && hours(ticket.receivedAt, now) > 48;
export const pending = status => ['Pendiente logística', 'Pendiente ventas'].includes(status);
const slaHours = 48;

export function slaNotice(ticket, now = Date.now()) {
  if (ticket.resolvedAt) return '';
  const age = hours(ticket.receivedAt, now);
  if (age > slaHours) return 'Vencida';
  if (age >= 36) return 'Plazo crítico';
  if (age >= 24) return 'Aviso de plazo';
  return '';
}

export function weeklySummary(tickets, now = Date.now()) {
  const inWeek = stamp => typeof stamp === 'string' && hours(stamp, now) >= 0 && hours(stamp, now) <= 168;
  const received = tickets.filter(ticket => inWeek(ticket.receivedAt));
  const resolved = tickets.filter(ticket => inWeek(ticket.resolvedAt));
  const complaints = received.filter(ticket => ['Inconformidad de envío', 'Facturación o cobro', 'Devolución'].includes(ticket.type));
  return {
    received: received.length, resolved: resolved.length,
    onTime: resolved.filter(ticket => ticket.withinSla).length,
    openByAgent: agents.map(agent => ({ name: agent.name, count: tickets.filter(ticket => !ticket.resolvedAt && ticket.agent === agent.id).length })),
    complaints: [...new Set(complaints.map(ticket => ticket.type))].map(type => ({
      type, count: complaints.filter(ticket => ticket.type === type).length,
    })).sort((a, b) => b.count - a.count || a.type.localeCompare(b.type, 'es')),
  };
}
const monthFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit' });
const monthOf = now => monthFormat.formatToParts(now).filter(part => part.type !== 'literal').map(part => part.value).join('');
const nameOf = id => people.find(person => person.id === id)?.name ?? id;
const clean = value => typeof value === 'string' ? value.trim() : '';
const isDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const validNit = value => /^\d{5,15}(?:-\d)?$/.test(value);

export class DomainError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function event(ticket, actor, at, action, before, after) {
  ticket.history.push({ actor: actor.id, at, action, before, after });
}

export function initialState(now = Date.now()) {
  const state = {
    schema: 1, cursor: 0, counters: {}, unavailable: [], tickets: [],
    clients: [
      { nit: '900123456', name: 'Colegio Los Cedros' },
      { nit: '800987654', name: 'Grupo Horizonte' },
      { nit: '901456789', name: 'Instituto Arboleda' },
      { nit: '900654321', name: 'Estudio Norte' },
    ],
  };
  const examples = [
    [types[1], 'Confirmar la fecha de entrega del pedido de material escolar.', 3],
    [types[2], 'El despacho llegó con dos cajas de papel pendientes.', 53],
    [types[3], 'El cliente requiere una copia de la factura electrónica.', 27],
    [types[0], 'Consultar disponibilidad de marcadores y carpetas tamaño carta.', 16],
    [types[4], 'Solicita devolver una referencia duplicada del pedido.', 36],
    [types[1], 'Solicita confirmar la recepción del pedido en portería.', 39],
  ];
  examples.forEach(([type, description, age], index) => {
    const at = now - age * 3_600_000;
    const ticket = createTicket(state, people[0], {
      nit: state.clients[index % 4].nit, type, description, channel: channels[index % 3],
    }, at);
    if (index === 0 || index === 4 || index === 5) {
      updateTicket(state, people[0], ticket.id, { version: 1, status: 'En proceso' }, at + 360_000);
    }
    if (index === 4) updateTicket(state, people[0], ticket.id, { version: 2, status: 'Resuelto', response: 'Se coordinó la devolución.' }, at + 7_200_000);
    if (index === 5) updateTicket(state, people[0], ticket.id, { version: 2, status: 'Pendiente logística' }, at + 720_000);
  });
  return state;
}

export function createTicket(state, actor, input, now = Date.now()) {
  const { channel, type } = input;
  const client = state.clients.find(entry => entry.nit === clean(input.nit));
  const description = clean(input.description);
  const order = clean(input.order);
  const errors = [];
  if (!client) errors.push('Selecciona un NIT del directorio');
  if (!channels.includes(channel)) errors.push('Selecciona el canal de origen');
  if (!types.includes(type)) errors.push('Selecciona un tipo de solicitud');
  if (description.length < 10 || description.length > 4000) errors.push('Escribe una descripción de 10 a 4.000 caracteres');
  if (order.length > 80) errors.push('La referencia de pedido admite hasta 80 caracteres');
  if (errors.length) throw new DomainError(errors.join('. ') + '.');
  const index = Array.from({ length: agents.length }, (_, offset) => (state.cursor + offset) % agents.length)
    .find(candidate => !state.unavailable.includes(agents[candidate].id));
  if (index === undefined) throw new DomainError('No hay agentes disponibles para asignar la solicitud.', 409);
  const month = monthOf(now);
  const sequence = (state.counters[month] ?? 0) + 1;
  if (sequence > 9999) throw new DomainError('Se alcanzó el límite de consecutivos de este mes.', 409);
  const ticket = {
    id: 'AUR-' + month + '-' + String(sequence).padStart(4, '0'),
    nit: client.nit, clientName: client.name, description, channel, type, order,
    agent: agents[index].id, status: 'Nuevo', receivedAt: new Date(now).toISOString(),
    resolvedAt: null, response: '', withinSla: null, version: 1, history: [],
  };
  event(ticket, actor, ticket.receivedAt, 'Radicación', null, { status: ticket.status, agent: ticket.agent });
  state.cursor = (index + 1) % agents.length;
  state.counters[month] = sequence;
  state.tickets.unshift(ticket);
  return ticket;
}

function readNextAction(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new DomainError('La próxima acción no es válida.');
  const action = { description: clean(value.description), responsible: clean(value.responsible), reviewDate: clean(value.reviewDate) };
  if (!Object.values(action).some(Boolean)) return null;
  const day = Date.parse(action.reviewDate + 'T00:00:00Z');
  if (!action.description || action.description.length > 400 || !action.responsible || action.responsible.length > 120 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(action.reviewDate) || !Number.isFinite(day) ||
      new Date(day).toISOString().slice(0, 10) !== action.reviewDate) {
    throw new DomainError('Completa qué falta, quién debe responder y una fecha de revisión válida.');
  }
  return action;
}

export function updateTicket(state, actor, id, input, now = Date.now()) {
  const ticket = state.tickets.find(entry => entry.id === id);
  if (!ticket) throw new DomainError('La solicitud no existe.', 404);
  if (actor.role !== 'coordinator' && (ticket.agent !== actor.id || input.agent !== undefined)) {
    throw new DomainError('Tu cuenta no tiene permiso para esta operación.', 403);
  }
  if (ticket.version !== input.version) throw new DomainError('Otra persona actualizó esta solicitud. Recarga el caso antes de guardar.', 409);
  const newStatus = input.status ?? ticket.status;
  const newAgent = input.agent ?? ticket.agent;
  const statusChanged = newStatus !== ticket.status;
  const agentChanged = newAgent !== ticket.agent;
  if (statusChanged && !transitions[ticket.status].includes(newStatus)) throw new DomainError('El cambio de estado no está permitido.');
  if (agentChanged && !agents.some(agent => agent.id === newAgent && !state.unavailable.includes(agent.id))) {
    throw new DomainError('Selecciona un agente disponible.');
  }
  const response = clean(input.response);
  if (newStatus === 'Resuelto' && statusChanged && (!response || response.length > 4000)) {
    throw new DomainError('Escribe la respuesta de resolución (máximo 4.000 caracteres).');
  }
  const previousAction = ticket.nextAction ?? null;
  const nextAction = pending(newStatus)
    ? (input.nextAction === undefined ? previousAction : readNextAction(input.nextAction))
    : null;
  const actionChanged = JSON.stringify(previousAction) !== JSON.stringify(nextAction);
  if (!statusChanged && !agentChanged && !actionChanged) return ticket;
  const at = new Date(now).toISOString();
  if (statusChanged) {
    event(ticket, actor, at, 'Cambio de estado', { status: ticket.status }, { status: newStatus });
    ticket.status = newStatus;
  }
  if (agentChanged) {
    event(ticket, actor, at, 'Reasignación', { agent: ticket.agent }, { agent: newAgent });
    ticket.agent = newAgent;
  }
  if (newStatus === 'Resuelto' && statusChanged) {
    ticket.resolvedAt = at;
    ticket.response = response;
    ticket.withinSla = hours(ticket.receivedAt, now) <= 48;
  }
  if (actionChanged) {
    event(ticket, actor, at, 'Próxima acción', previousAction, nextAction ?? {});
    ticket.nextAction = nextAction;
  }
  ticket.version++;
  return ticket;
}

export function setAvailability(state, actor, id, available) {
  if (actor.role !== 'coordinator') throw new DomainError('Solo el coordinador puede gestionar la disponibilidad.', 403);
  if (!agents.some(agent => agent.id === id) || typeof available !== 'boolean') throw new DomainError('Disponibilidad inválida.');
  state.unavailable = state.unavailable.filter(agent => agent !== id);
  if (!available) state.unavailable.push(id);
}

export function snapshot(state, actor) {
  return {
    actor, people, unavailable: state.unavailable, clients: state.clients,
    tickets: actor.role === 'coordinator' ? state.tickets : state.tickets.filter(ticket => ticket.agent === actor.id),
  };
}

function parseCsv(source) {
  const firstLine = source.split(/\r?\n/, 1)[0];
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';
  const rows = [];
  let row = [], field = '', mode = 'plain';
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (mode === 'quoted') {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') mode = 'closed';
      else field += char;
    } else if (char === delimiter || char === '\r' || char === '\n') {
      row.push(field);
      field = '';
      mode = 'plain';
      if (char !== delimiter) {
        rows.push(row);
        row = [];
        if (char === '\r' && source[index + 1] === '\n') index++;
      }
    } else if (char === '"' && mode === 'plain' && !field) mode = 'quoted';
    else if (char === '"' || mode === 'closed') throw new DomainError('El CSV contiene comillas inválidas.');
    else field += char;
  }
  if (mode === 'quoted') throw new DomainError('El CSV contiene una celda sin cerrar.');
  if (field || row.length || mode === 'closed') rows.push([...row, field]);
  return rows;
}

export function readClients(filename, raw) {
  const source = raw.replace(/^\uFEFF/, '');
  if (/\.json$/i.test(filename)) {
    let value;
    try { value = JSON.parse(source); } catch { throw new DomainError('No se pudo leer el JSON.'); }
    if (!Array.isArray(value)) throw new DomainError('El JSON debe contener un arreglo de clientes.');
    return value;
  }
  if (!/\.csv$/i.test(filename)) throw new DomainError('Selecciona un archivo CSV o JSON.');
  const [header = [], ...rows] = parseCsv(source);
  const columns = header.map(value => value.trim().toLowerCase().replaceAll(' ', '_'));
  const nit = columns.indexOf('nit');
  const name = columns.findIndex(value => ['name', 'razon_social', 'razón_social'].includes(value));
  if (nit < 0 || name < 0) throw new DomainError('El CSV debe incluir las columnas nit y razon_social.');
  return rows.map(row => row.length === header.length ? { nit: row[nit], name: row[name] } : null);
}

export function importClients(state, actor, records) {
  if (actor.role !== 'coordinator') throw new DomainError('Solo el coordinador puede importar clientes.', 403);
  if (!Array.isArray(records) || records.length > 5000) throw new DomainError('La carga admite hasta 5.000 filas.');
  const known = new Set(state.clients.map(client => client.nit));
  const report = { added: 0, invalid: [], duplicates: [] };
  records.forEach((record, index) => {
    const nit = clean(record?.nit);
    const name = clean(record?.name ?? record?.razon_social);
    if (!validNit(nit) || !name || name.length > 160) report.invalid.push(index + 1);
    else if (known.has(nit)) report.duplicates.push({ row: index + 1, nit });
    else {
      known.add(nit);
      state.clients.push({ nit, name });
      report.added++;
    }
  });
  return report;
}

export function restoreBackup(raw) {
  let data;
  try { data = JSON.parse(raw); } catch { throw new DomainError('El respaldo no contiene un JSON válido.'); }
  const bad = () => { throw new DomainError('El respaldo contiene datos inválidos o incompletos.'); };
  const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (!plain(data) || data.schema !== 1 || !Array.isArray(data.clients) || !Array.isArray(data.tickets) ||
      !Array.isArray(data.unavailable) || !plain(data.counters) || !Number.isInteger(data.cursor) ||
      data.cursor < 0 || data.cursor >= agents.length) bad();
  const ids = new Set(agents.map(agent => agent.id));
  if (data.unavailable.some(id => !ids.has(id)) || new Set(data.unavailable).size !== data.unavailable.length) bad();
  const clients = new Set();
  for (const client of data.clients) {
    if (!plain(client) || !validNit(clean(client.nit)) || client.nit !== clean(client.nit) ||
        !clean(client.name) || client.name.length > 160 || clients.has(client.nit)) bad();
    clients.add(client.nit);
  }
  for (const [month, count] of Object.entries(data.counters)) {
    if (!/^\d{4}(0[1-9]|1[0-2])$/.test(month) || !Number.isInteger(count) || count < 0 || count > 9999) bad();
  }
  const tickets = new Set();
  const actors = new Set(people.map(person => person.id));
  for (const ticket of data.tickets) {
    if (!plain(ticket)) bad();
    const match = /^AUR-(\d{4}(?:0[1-9]|1[0-2]))-(\d{4})$/.exec(ticket.id);
    if (!match || tickets.has(ticket.id) || !Number(match[2]) || !(data.counters[match[1]] >= Number(match[2])) ||
        !clients.has(ticket.nit) || !clean(ticket.clientName) || !ids.has(ticket.agent) || !states.includes(ticket.status) ||
        !types.includes(ticket.type) || !channels.includes(ticket.channel) || !isDate(ticket.receivedAt) ||
        monthOf(Date.parse(ticket.receivedAt)) !== match[1] || clean(ticket.description).length < 10 ||
        typeof ticket.order !== 'string' || typeof ticket.response !== 'string' ||
        !Number.isInteger(ticket.version) || ticket.version < 1 || !Array.isArray(ticket.history) || !ticket.history.length) bad();
    const resolved = ['Resuelto', 'Cerrado'].includes(ticket.status);
    if (resolved ? !isDate(ticket.resolvedAt) || !clean(ticket.response) ||
        hours(ticket.receivedAt, Date.parse(ticket.resolvedAt)) < 0 ||
        ticket.withinSla !== (hours(ticket.receivedAt, Date.parse(ticket.resolvedAt)) <= 48)
      : ticket.resolvedAt !== null || ticket.withinSla !== null || ticket.response !== '') bad();
    if (ticket.nextAction != null && (!pending(ticket.status) || !readNextAction(ticket.nextAction))) bad();
    for (const entry of ticket.history) {
      if (!plain(entry) || !actors.has(entry.actor) || !isDate(entry.at) ||
          !['Radicación', 'Cambio de estado', 'Reasignación', 'Próxima acción'].includes(entry.action) ||
          (entry.before !== null && !plain(entry.before)) || !plain(entry.after)) bad();
      for (const value of [entry.before, entry.after]) {
        if (value && ((value.agent !== undefined && !ids.has(value.agent)) ||
          (value.status !== undefined && !states.includes(value.status)))) bad();
      }
    }
    tickets.add(ticket.id);
  }
  return data;
}

export function eventValue(value) {
  return [value?.status, value?.agent && nameOf(value.agent), value?.description, value?.responsible, value?.reviewDate].filter(Boolean).join(' · ');
}
