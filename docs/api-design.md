# QuickNotes REST API Design

## Base URL
`https://api.quicknotes.example/v1`. Requests and responses use JSON. Protected endpoints require `Authorization: Bearer <access-token>`. This is the proposed production API, not JSONPlaceholder.

## Endpoints

| Method | Path | Description | Success |
|---|---|---|---|
| GET | `/notes` | List the current user's notes; supports limit/cursor pagination | 200 OK |
| GET | `/notes/{noteId}` | Get one note owned by the user | 200 OK |
| POST | `/notes` | Create a note | 201 Created |
| PATCH | `/notes/{noteId}` | Update note fields | 200 OK |
| DELETE | `/notes/{noteId}` | Delete a note | 204 No Content |
| GET | `/tags` | List the user's tags | 200 OK |
| POST | `/notes/{noteId}/tags` | Attach an existing tag | 200 OK |
| DELETE | `/notes/{noteId}/tags/{tagId}` | Remove a tag from a note | 204 No Content |

## Create note


Request: `POST /v1/notes`, with a valid bearer token and `Content-Type: application/json`.

```json
{
  "title": "Project ideas",
  "body": "Review the project plan on Friday.",
  "tagIds": [2, 4]
}
```

Response: `201 Created`

```json
{
  "id": 501,
  "userId": 42,
  "title": "Project ideas",
  "body": "Review the project plan on Friday.",
  "createdAt": "2026-10-10T09:30:00Z",
  "updatedAt": "2026-10-10T09:30:00Z",
  "tags": [{"id": 2, "name": "work"}, {"id": 4, "name": "planning"}]
}
```

## List notes

Request: `GET /v1/notes?limit=20` with a valid bearer token.

Response: `200 OK`

```json
{
  "items": [
    {"id": 501, "userId": 42, "title": "Project ideas", "body": "Review the project plan on Friday.", "createdAt": "2026-10-10T09:30:00Z", "updatedAt": "2026-10-10T09:30:00Z"},
    {"id": 500, "userId": 42, "title": "Shopping", "body": "Buy rice and fruit.", "createdAt": "2026-10-09T15:00:00Z", "updatedAt": "2026-10-09T15:00:00Z"}
  ],
  "nextCursor": null
}
```

## Error status codes

| Status | Meaning | Example |
|---|---|---|
| 400 Bad Request | Invalid input or malformed JSON | Missing title or title over 100 characters |
| 401 Unauthorized | Missing/invalid credentials | Expired token |
| 403 Forbidden | User lacks permission | Accessing another user's note |
| 404 Not Found | Resource unavailable | Unknown note ID |
| 500 Internal Server Error | Unexpected server failure | Unhandled service/database error |

Example error body:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required and must be 100 characters or fewer.",
    "details": [{"field": "title", "issue": "required"}],
    "requestId": "req_7f32a1"
  }
}
```

Never return stack traces or sensitive internal details to clients. A request ID helps support staff investigate failures.
