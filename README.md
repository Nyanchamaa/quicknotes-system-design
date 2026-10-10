# QuickNotes System Design

QuickNotes is a notes-app API client prototype and system-design capstone. The browser client demonstrates GET, POST, and DELETE against the JSONPlaceholder practice API. The documents describe a production REST API, relational data model, and architecture for a service with one million registered users.

**Important:** JSONPlaceholder is a mock API. POST and DELETE are simulated and do not persist changes on its server. The client updates its in-memory list so the page reflects those actions until reload.


## Files
- `index.html` — HTML5 client and form.
- `api.js` — reusable fetch helper, GET/POST/DELETE, validation, and request states.
- `style.css` — responsive styling and distinct success/error messages.
- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## Run the API client
1. Clone or download the repository.
2. Open it in VS Code.
3. Open `index.html` using Live Server or another local HTTP server.
4. Click **Load notes** to fetch 10 posts from `https://jsonplaceholder.typicode.com/posts?_limit=10`.
5. Create a note with the form or delete one from the list.
6. An internet connection is required for JSONPlaceholder. POST/DELETE changes are not retained by the mock server.

## What I learned
- How `fetch`, `async/await`, and a reusable request helper handle HTTP responses and errors.
- Why interfaces need loading, success, error, and empty states and should disable controls during requests.
- Why user text should be inserted with `textContent` rather than HTML string interpolation.
- How SQL foreign keys and a join table represent ownership and many-to-many tagging.
- How caching, read replicas, queues, and horizontal scaling address different performance and reliability concerns.

## Suggested meaningful commit history
1. `Add API client with GET`
2. `Add create note with POST`
3. `Add delete with DELETE`
4. `Add API design doc`
5. `Add data model doc`
6. `Add architecture doc`
7. `Add README`
