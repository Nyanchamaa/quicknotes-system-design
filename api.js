const API_URL = 'https://jsonplaceholder.typicode.com/posts';
const loadButton = document.querySelector('#load-btn');
const noteForm = document.querySelector('#note-form');
const titleInput = document.querySelector('#title-input');
const bodyInput = document.querySelector('#body-input');
const submitButton = document.querySelector('#submit-btn');
const statusElement = document.querySelector('#status');
const notesList = document.querySelector('#notes-list');
let notes = [];

function setStatus(message, type = '') {
  statusElement.textContent = message;
  statusElement.className = `status ${type}`.trim();
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204 || options.method === 'DELETE') {
    return { data: null, status: response.status };
  }
  return { data: await response.json(), status: response.status };
}

function renderNotes(list) {
  notesList.replaceChildren();
  if (list.length === 0) {
    const item = document.createElement('li');
    item.className = 'empty-state';
    item.textContent = 'No notes to show yet. Load notes or create one.';
    notesList.appendChild(item);
    return;
  }
  list.forEach(note => {
    const item = document.createElement('li');
    item.className = 'note-card';
    const title = document.createElement('h3');
    title.textContent = note.title || '(Untitled note)';
    const body = document.createElement('p');
    body.textContent = note.body || 'No body provided.';
    const actions = document.createElement('div');
    actions.className = 'note-actions';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'delete-btn';
    button.textContent = 'Delete';
    button.addEventListener('click', () => deleteNote(note.id, button));
    actions.appendChild(button);
    item.append(title, body, actions);
    notesList.appendChild(item);
  });
}

async function loadNotes() {
  loadButton.disabled = true;
  setStatus('Loading notes...', 'loading');
  try {
    const result = await request(`${API_URL}?_limit=10`);
    notes = Array.isArray(result.data) ? result.data : [];
    renderNotes(notes);
    setStatus(notes.length ? `Loaded ${notes.length} notes from the server.` : 'The server returned no notes.', 'success');
  } catch (error) {
    setStatus('Sorry, notes could not be loaded. Check your connection and try again.', 'error');
    console.error('GET /posts failed:', error);
  } finally {
    loadButton.disabled = false;
  }
}

async function createNote(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();
  if (!title) { setStatus('Please enter a title before creating a note.', 'error'); titleInput.focus(); return; }
  if (title.length > 100) { setStatus('The title must be 100 characters or fewer.', 'error'); titleInput.focus(); return; }
  submitButton.disabled = true;
  setStatus('Creating note...', 'loading');
  try {
    const result = await request(API_URL, { method:'POST', headers:{'Content-Type':'application/json; charset=UTF-8'}, body:JSON.stringify({title, body, userId:1}) });
    const created = result.data;
    // JSONPlaceholder simulates POST and usually returns ID 101; it does not persist the post.
    // Keep it in memory so the page reflects the action until reload.
    notes = [{...created, title, body, userId:1}, ...notes];
    renderNotes(notes);
    noteForm.reset();
    setStatus(`Note created (status ${result.status}, id ${created.id}). This demo keeps it only until you reload.`, 'success');
  } catch (error) {
    setStatus('Sorry, the note could not be created. Please try again.', 'error');
    console.error('POST /posts failed:', error);
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteNote(id, button) {
  button.disabled = true;
  setStatus('Deleting note...', 'loading');
  try {
    const result = await request(`${API_URL}/${encodeURIComponent(id)}`, {method:'DELETE'});
    // JSONPlaceholder simulates DELETE; remove the note locally for this page session.
    notes = notes.filter(note => String(note.id) !== String(id));
    renderNotes(notes);
    setStatus(`Note ${id} deleted (status ${result.status}). The practice API does not persist this change.`, 'success');
  } catch (error) {
    setStatus('Sorry, the note could not be deleted. Please try again.', 'error');
    console.error(`DELETE /posts/${id} failed:`, error);
    if (button.isConnected) button.disabled = false;
  } finally {
    if (button.isConnected) button.disabled = false;
  }
}


loadButton.addEventListener('click', loadNotes);
noteForm.addEventListener('submit', createNote);
renderNotes(notes);
