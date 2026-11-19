import { agents, channels, createTicket, eventValue, hours, importClients, initialState, overdue, pending, people, readClients, restoreBackup, setAvailability, slaNotice, snapshot, states, transitions, types, updateTicket, weeklySummary } from './domain.mjs';

const local = document.documentElement.dataset.mode === 'demo';
const hosted = document.documentElement.dataset.mode === 'hosted';
const $ = selector => document.querySelector(selector);
const date = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' });
const nameOf = id => people.find(person => person.id === id)?.name ?? id;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const option = (value, label = value) => '<option value="' + escape(value) + '">' + escape(label) + '</option>';
const inputs = form => Object.fromEntries(new FormData(form));
const initialAccount = people[0];
let state = local ? initialState() : null;
let actor = local ? initialAccount : null;
let data;
let currentPage = 'tickets';
let editing;
let selectedNit;

async function api(path, method = 'GET', body) {
  const response = await fetch('/api/' + path, {
    method, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error);
    error.status = response.status;
    throw error;
  }
  return result;
}

function message(selector, text, isError = false) {
  const node = $(selector);
  node.textContent = text;
  node.hidden = !text;
  node.classList.toggle('error', isError);
}

async function run(button, action, onError = error => message('#notice', error.message, true)) {
  if (button.disabled) return;
  button.disabled = true;
  try { await action(); }
  catch (error) { onError(error); }
  finally { button.disabled = false; }
}

async function refresh() {
  try {
    data = local ? snapshot(state, actor) : await api('state');
    actor = data.actor;
  } catch (error) {
    if (error.status !== 401) throw error;
    actor = null;
    data = null;
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
  }
  if (currentPage === 'interactions' && $('#detail-dialog').open &&
      !data?.tickets.some(ticket => ticket.id === editing?.id)) {
    $('#detail-dialog').close();
    editing = undefined;
  }
  render();
}

function render() {
  const signedIn = Boolean(actor);
  const coordinator = actor?.role === 'coordinator';
  if (!coordinator && ['team', 'summary'].includes(currentPage)) currentPage = 'tickets';
  $('#login').hidden = signedIn;
  $('#navigation').hidden = !signedIn;
  $('#logout').hidden = local || hosted || !signedIn;
  $('#account').textContent = actor?.name ?? '';
  $('[data-page="team"]').hidden = !coordinator;
  $('[data-page="summary"]').hidden = !coordinator;
  for (const key of ['tickets', 'clients', 'team', 'summary']) {
    $('#' + key).hidden = !signedIn || key !== currentPage;
    $('[data-page="' + key + '"]').setAttribute('aria-current', key === currentPage ? 'page' : 'false');
  }
  $('#interactions').hidden = !signedIn || currentPage !== 'interactions';
  if (currentPage === 'interactions') $('[data-page="clients"]').setAttribute('aria-current', 'page');
  if (!signedIn) return;
  $('#import-box').hidden = !coordinator;
  renderTickets();
  renderClients();
  if (currentPage === 'interactions') renderInteractions();
  renderTeam();
  if (coordinator && currentPage === 'summary') renderSummary();
  if ($('#create-dialog').open) renderRelatedTickets();
}

const normalize = value => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
function matches(query, ...values) {
  const term = normalize(query.trim());
  return values.some(value => normalize(value).includes(term));
}

function renderTickets() {
  const now = Date.now();
  const { query, status, agent, age, sort } = inputs($('#filters'));
  const tickets = data.tickets;
  const open = tickets.filter(ticket => !ticket.resolvedAt);
  const cards = [
    ['Solicitudes', tickets.length],
    ['Abiertas', open.length],
    ['Vencidas', open.filter(ticket => overdue(ticket, now)).length, 'danger'],
    ['Resueltas a tiempo', tickets.filter(ticket => ticket.withinSla).length],
  ];
  $('#stats').innerHTML = cards.map(([label, count, style]) =>
    '<div class="stat ' + (style ?? '') + '"><span>' + label + '</span><strong>' + count + '</strong></div>').join('');
  const shown = tickets.filter(ticket => matches(query, ticket.id, ticket.nit, ticket.clientName) &&
    (!status || ticket.status === status) && (!agent || ticket.agent === agent) &&
    (!age || (hours(ticket.receivedAt, now) > 48) === (age === 'older')));
  if (sort === 'sla') shown.sort((a, b) =>
    Number(Boolean(a.resolvedAt)) - Number(Boolean(b.resolvedAt)) ||
    (a.resolvedAt && b.resolvedAt ? Date.parse(b.receivedAt) - Date.parse(a.receivedAt) : Date.parse(a.receivedAt) - Date.parse(b.receivedAt)));
  if (!shown.length) {
    $('#ticket-table').innerHTML = '<p class="empty">No hay solicitudes que coincidan con la búsqueda.</p>';
    return;
  }
  $('#ticket-table').innerHTML = '<table><thead><tr><th>Ticket</th><th>Cliente</th><th>Estado</th><th>Responsable</th><th>Recepción</th></tr></thead><tbody>' +
    shown.map(ticket => {
      const alert = slaNotice(ticket, now);
      const style = alert === 'Vencida' || alert === 'Plazo crítico' ? 'late' : ticket.resolvedAt ? 'done' :
        alert || pending(ticket.status) ? 'wait' : '';
      return '<tr><td><button class="ticket-link" type="button" data-ticket="' + escape(ticket.id) + '">' + escape(ticket.id) + '</button></td>' +
        '<td class="client-cell">' + escape(ticket.clientName) + '<small>' + escape(ticket.nit) + '</small></td>' +
        '<td><span class="badge ' + style + '">' + escape(ticket.status) + (alert ? ' · ' + alert : '') + '</span></td>' +
        '<td>' + escape(nameOf(ticket.agent)) + '</td><td>' + escape(date.format(new Date(ticket.receivedAt))) + '</td></tr>';
    }).join('') + '</tbody></table>';
}

function renderClients() {
  const query = $('#client-query').value;
  const clients = data.clients.filter(client => matches(query, client.nit, client.name));
  $('#client-table').innerHTML = clients.length
    ? '<table><thead><tr><th>NIT</th><th>Razón social</th><th>Acción</th></tr></thead><tbody>' +
      clients.map(client => '<tr><td>' + escape(client.nit) + '</td><td>' + escape(client.name) + '</td><td><button type="button" class="ticket-link" data-client="' +
        escape(client.nit) + '">Ver interacciones</button></td></tr>').join('') + '</tbody></table>'
    : '<p class="empty">No hay clientes que coincidan con la búsqueda.</p>';
  $('#client-options').innerHTML = data.clients.map(client => option(client.nit, client.name)).join('');
}

function renderInteractions() {
  const client = data.clients.find(entry => entry.nit === selectedNit);
  $('#interaction-client').textContent = client?.name ?? 'Interacciones';
  $('#interaction-nit').textContent = client ? 'NIT ' + client.nit : '';
  const tickets = client ? data.tickets.filter(ticket => ticket.nit === client.nit)
    .sort((first, second) => Date.parse(second.receivedAt) - Date.parse(first.receivedAt) ||
      second.id.localeCompare(first.id)) : [];
  $('#interaction-table').innerHTML = tickets.length
    ? '<table><thead><tr><th>Recepción</th><th>Canal</th><th>Ticket</th><th>Tipo</th><th>Estado</th><th>Responsable</th></tr></thead><tbody>' +
      tickets.map(ticket => '<tr><td>' + escape(date.format(new Date(ticket.receivedAt))) +
        '</td><td>' + escape(ticket.channel) + '</td><td><button type="button" class="ticket-link" data-ticket="' +
        escape(ticket.id) + '">' + escape(ticket.id) + '</button></td><td>' + escape(ticket.type) +
        '</td><td>' + escape(ticket.status) + '</td><td>' + escape(nameOf(ticket.agent)) + '</td></tr>').join('') + '</tbody></table>'
    : '<p class="empty">No hay interacciones disponibles para este cliente.</p>';
}

function renderTeam() {
  $('#team-list').innerHTML = agents.map(agent => '<div class="team-row"><strong>' + escape(agent.name) +
    '</strong><label><input type="checkbox" data-agent="' + agent.id + '"' + (data.unavailable.includes(agent.id) ? '' : ' checked') +
    '> Disponible</label></div>').join('');
}

function renderSummary() {
  const { received, resolved, onTime, openByAgent, complaints } = weeklySummary(data.tickets);
  const percent = resolved ? (onTime / resolved).toLocaleString('es-CO', { style: 'percent', maximumFractionDigits: 1 }) : '—';
  const list = rows => '<ul>' + rows.map(([label, value]) => '<li>' + escape(label) + ' · ' + value + '</li>').join('') + '</ul>';
  $('#summary-content').innerHTML = '<div class="stats">' +
    [['Recibidas', received], ['Resueltas', resolved], ['Resueltas en 48 h', percent]].map(([label, value]) =>
      '<div class="stat"><span>' + label + '</span><strong>' + value + '</strong></div>').join('') + '</div>' +
    '<section class="panel summary-panel"><h2>Abiertas por responsable</h2>' + list(openByAgent.map(row => [row.name, row.count])) +
    '</section><section class="panel summary-panel"><h2>Motivos de reclamo</h2>' +
    (complaints.length ? list(complaints.map(row => [row.type, row.count])) : '<p>No hay reclamos registrados en este periodo.</p>') + '</section>';
}

function renderRelatedTickets() {
  const fields = $('#create-form').elements;
  const nit = fields.nit.value.trim();
  const client = data.clients.find(entry => entry.nit === nit);
  $('#client-match').textContent = client?.name ?? (nit ? 'No hay coincidencias.' : '');
  const order = normalize(fields.order.value.trim());
  const related = client ? data.tickets.filter(ticket => ticket.nit === nit && !ticket.resolvedAt) : [];
  const sameOrder = ticket => order && normalize(ticket.order?.trim() ?? '') === order;
  related.sort((first, second) => Number(Boolean(sameOrder(second))) - Number(Boolean(sameOrder(first))));
  $('#related-tickets').hidden = !related.length;
  $('#related-tickets').innerHTML = related.length ? '<strong>Solicitudes abiertas del cliente</strong><ul>' +
    related.map(ticket => '<li><button type="button" class="ticket-link" data-ticket="' + escape(ticket.id) + '">' +
      escape(ticket.id) + '</button> · ' + escape(ticket.type) + (sameOrder(ticket) ? ' · Mismo pedido' : '') + '</li>').join('') + '</ul>' : '';
}

function syncDetailFields(status) {
  $('#response-field').hidden = status !== 'Resuelto' || editing.status === 'Resuelto';
  $('#next-action').hidden = $('#next-action').disabled = !pending(status);
}

function showTicket(id) {
  const ticket = data?.tickets.find(entry => entry.id === id);
  if (!ticket) {
    $('#detail-dialog').close();
    message('#notice', 'La solicitud ya no está disponible para tu cuenta.', true);
    return;
  }
  editing = ticket;
  $('#detail-title').textContent = ticket.id;
  const facts = [
    ['Cliente', ticket.clientName + ' · ' + ticket.nit],
    ['Tipo', ticket.type], ['Canal', ticket.channel],
    ['Recepción', date.format(new Date(ticket.receivedAt))], ['Responsable', nameOf(ticket.agent)],
    ['Descripción', ticket.description],
    ...(ticket.nextAction ? [['Próxima acción', ticket.nextAction.description],
      ['Debe responder', ticket.nextAction.responsible], ['Revisión', ticket.nextAction.reviewDate]] : []),
  ];
  if (ticket.order) facts.push(['Pedido', ticket.order]);
  if (ticket.resolvedAt) {
    facts.push(['Resolución', date.format(new Date(ticket.resolvedAt))], ['Respuesta', ticket.response],
      ['Plazo', ticket.withinSla ? 'Dentro de 48 horas' : 'Fuera de 48 horas']);
  } else if (overdue(ticket)) facts.push(['Plazo', 'Vencido']);
  $('#detail-content').innerHTML = '<dl>' + facts.map(([key, value]) =>
    '<dt>' + key + '</dt><dd>' + escape(value) + '</dd>').join('') + '</dl>';
  const coordinator = actor.role === 'coordinator';
  $('#detail-fields').innerHTML = '<label>Estado<select name="status">' +
    [ticket.status, ...transitions[ticket.status]].map(value => option(value)).join('') + '</select></label>' +
    (coordinator ? '<label>Responsable<select name="agent">' +
      agents.filter(agent => agent.id === ticket.agent || !data.unavailable.includes(agent.id))
        .map(agent => option(agent.id, agent.name)).join('') + '</select></label>' : '');
  if (coordinator) $('#detail-form').elements.agent.value = ticket.agent;
  $('#detail-form').elements.response.value = '';
  const fields = $('#detail-form').elements;
  fields.actionDescription.value = ticket.nextAction?.description ?? '';
  fields.actionResponsible.value = ticket.nextAction?.responsible ?? '';
  fields.actionReviewDate.value = ticket.nextAction?.reviewDate ?? '';
  syncDetailFields(ticket.status);
  $('#save-detail').hidden = !coordinator && transitions[ticket.status].length === 0;
  $('#reload-detail').hidden = true;
  message('#detail-error', '');
  $('#history').innerHTML = [...ticket.history].reverse().map(entry => {
    const before = eventValue(entry.before), after = eventValue(entry.after);
    return '<li><strong>' + escape(entry.action) + '</strong> · ' + escape(before ? before + ' → ' + after : after) +
      '<small>' + escape(nameOf(entry.actor)) + ' · ' + escape(date.format(new Date(entry.at))) + '</small></li>';
  }).join('');
  if (!$('#detail-dialog').open) $('#detail-dialog').showModal();
}

if (hosted) {
  $('#login-form').hidden = true;
  $('#login').append(Object.assign(document.createElement('p'), {
    textContent: 'Entra con una cuenta autorizada para consultar las solicitudes del piloto.',
  }), Object.assign(document.createElement('a'), {
    href: '/signin-with-chatgpt?return_to=%2F',
    target: '_top',
    textContent: 'Iniciar sesión con ChatGPT',
  }));
}
$('#mode').textContent = local ? 'Demo local' : 'Piloto compartido';
$('#local-tools').hidden = !local;
$('#demo-link').hidden = local;
const accounts = people.map(person => option(person.id, person.name)).join('');
$('#profile').innerHTML = accounts;
$('#login-form').elements.user.innerHTML = accounts;
$('#create-form').elements.channel.innerHTML = option('', 'Selecciona el canal') + channels.map(value => option(value)).join('');
$('#create-form').elements.type.innerHTML = option('', 'Selecciona el tipo') + types.map(value => option(value)).join('');
$('#filters').elements.status.innerHTML = option('', 'Todos') + states.map(value => option(value)).join('');
$('#filters').elements.agent.innerHTML = option('', 'Todos') + agents.map(agent => option(agent.id, agent.name)).join('');

$('#navigation').addEventListener('click', event => {
  const button = event.target.closest('[data-page]');
  if (!button) return;
  currentPage = button.dataset.page;
  message('#notice', '');
  render();
});
const interactionError = () => message('#notice', 'No se pudo actualizar el historial de interacciones.', true);
$('#client-table').addEventListener('click', event => {
  const button = event.target.closest('[data-client]');
  if (!button) return;
  run(button, async () => {
    await refresh();
    if (!actor || currentPage !== 'clients') return;
    selectedNit = button.dataset.client;
    currentPage = 'interactions';
    message('#notice', '');
    render();
    $('#back-to-clients').focus();
  }, interactionError);
});
$('#back-to-clients').addEventListener('click', () => {
  currentPage = 'clients';
  message('#notice', '');
  render();
  [...$('#client-table').querySelectorAll('[data-client]')].find(button => button.dataset.client === selectedNit)?.focus();
});
$('#refresh-interactions').addEventListener('click', event => run(event.currentTarget, async () => {
  await refresh();
  message('#notice', '');
}, interactionError));
$('#interaction-table').addEventListener('click', event => {
  const button = event.target.closest('[data-ticket]');
  if (!button) return;
  run(button, async () => {
    const nit = selectedNit;
    await refresh();
    if (!actor || currentPage !== 'interactions' || nit !== selectedNit) return;
    [...$('#interaction-table').querySelectorAll('[data-ticket]')].find(entry => entry.dataset.ticket === button.dataset.ticket)?.focus();
    showTicket(button.dataset.ticket);
  }, interactionError);
});
$('#profile').addEventListener('change', async event => {
  actor = people.find(person => person.id === event.target.value);
  $('dialog[open]')?.close();
  message('#notice', '');
  await refresh();
});
$('#login-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  run(form.querySelector('button'), async () => {
    await api('login', 'POST', inputs(form));
    form.reset();
    currentPage = 'tickets';
    message('#notice', '');
    await refresh();
  });
});
$('#logout').addEventListener('click', event => run(event.currentTarget, async () => {
  await api('logout', 'POST');
  message('#notice', '');
  await refresh();
}));
$('#refresh').addEventListener('click', event => run(event.currentTarget, refresh));
$('#filters').addEventListener('input', renderTickets);
$('#filters').addEventListener('submit', event => event.preventDefault());
$('#client-query').addEventListener('input', renderClients);
$('#refresh-summary').addEventListener('click', event => run(event.currentTarget, refresh));
$('#new').addEventListener('click', event => run(event.currentTarget, async () => {
  message('#notice', '');
  await refresh();
  if (!actor) return;
  renderRelatedTickets();
  $('#create-dialog').showModal();
}));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $('#' + button.dataset.close).close()));
for (const name of ['nit', 'order']) $('#create-form').elements[name].addEventListener('input', renderRelatedTickets);
$('#related-tickets').addEventListener('click', event => {
  const button = event.target.closest('[data-ticket]');
  if (!button) return;
  run(button, async () => {
    await refresh();
    if (!actor || !$('#create-dialog').open) return;
    if (!data.tickets.some(ticket => ticket.id === button.dataset.ticket)) {
      message('#create-error', 'La solicitud ya no está disponible para tu cuenta.', true);
      return;
    }
    $('#create-dialog').close();
    showTicket(button.dataset.ticket);
  }, error => message('#create-error', error.message, true));
});
$('#create-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  run(form.querySelector('button'), async () => {
    const input = inputs(form);
    const ticket = local ? createTicket(state, actor, input) : await api('tickets', 'POST', input);
    $('#create-dialog').close();
    form.reset();
    $('#client-match').textContent = '';
    message('#create-error', '');
    message('#notice', 'Solicitud ' + ticket.id + ' asignada a ' + nameOf(ticket.agent) + '.');
    await refresh();
  }, error => message('#create-error', error.message, true));
});
$('#ticket-table').addEventListener('click', event => {
  const ticket = event.target.closest('[data-ticket]');
  if (ticket) showTicket(ticket.dataset.ticket);
});
$('#detail-form').addEventListener('change', event => {
  if (event.target.name === 'status') syncDetailFields(event.target.value);
});
$('#detail-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const id = editing.id;
  run($('#save-detail'), async () => {
    const { actionDescription, actionResponsible, actionReviewDate, ...fields } = inputs(form);
    const input = { ...fields, version: editing.version };
    if (pending(input.status)) input.nextAction = { description: actionDescription, responsible: actionResponsible, reviewDate: actionReviewDate };
    if (local) updateTicket(state, actor, id, input);
    else await api('tickets/' + id, 'PATCH', input);
    await refresh();
    if ($('#detail-dialog').open) showTicket(id);
    message('#notice', 'Cambios guardados.');
  }, error => {
    message('#detail-error', error.message, true);
    $('#reload-detail').hidden = error.status !== 409;
  });
});
$('#reload-detail').addEventListener('click', event => run(event.currentTarget, async () => {
  const id = editing.id;
  await refresh();
  if ($('#detail-dialog').open) showTicket(id);
}, error => message('#detail-error', error.message, true)));
$('#team-list').addEventListener('change', async event => {
  const box = event.target;
  if (!box.matches('[data-agent]')) return;
  await run(box, async () => {
    if (local) setAvailability(state, actor, box.dataset.agent, box.checked);
    else await api('availability', 'POST', { id: box.dataset.agent, available: box.checked });
    await refresh();
  }, error => {
    box.checked = !box.checked;
    message('#notice', error.message, true);
  });
});
$('#import').addEventListener('click', event => run(event.currentTarget, async () => {
  const file = $('#import-file').files[0];
  if (!file || file.size > 1_000_000) throw new Error('Selecciona un CSV o JSON de hasta 1 MB.');
  const raw = await file.text();
  const report = local
    ? importClients(state, actor, readClients(file.name, raw))
    : await api('clients/import', 'POST', { filename: file.name, raw });
  $('#import-file').value = '';
  await refresh();
  const result = [report.added + ' incorporados'];
  if (report.invalid.length) result.push('registros inválidos: ' + report.invalid.join(', '));
  if (report.duplicates.length) result.push('NIT duplicados: ' + report.duplicates.map(entry => entry.nit + ' (registro ' + entry.row + ')').join(', '));
  message('#import-report', result.join(' · '));
}, error => message('#import-report', error.message, true)));
$('#export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'aurora-respaldo.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('#restore').addEventListener('click', () => $('#backup-file').click());
$('#backup-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 20_000_000) throw new Error('El respaldo supera 20 MB.');
    state = restoreBackup(await file.text());
    await refresh();
    message('#notice', 'Respaldo restaurado.');
  } catch (error) { message('#notice', error.message, true); }
});
refresh().catch(error => {
  render();
  message('#notice', error.message, true);
});
