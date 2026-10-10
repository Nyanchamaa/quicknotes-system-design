# QuickNotes Data Model

## Entities and columns

- **users:** `id INTEGER` primary key; `name TEXT NOT NULL`; `email TEXT NOT NULL UNIQUE`; `password_hash TEXT NOT NULL`; `created_at TEXT NOT NULL`.
- **notes:** `id INTEGER` primary key; `user_id INTEGER NOT NULL` foreign key to users; `title TEXT NOT NULL` (maximum 100 characters); `body TEXT` optional; `created_at TEXT NOT NULL`; `updated_at TEXT NOT NULL`.
- **tags:** `id INTEGER` primary key; `user_id INTEGER NOT NULL` foreign key to users; `name TEXT NOT NULL`.
- **note_tags:** `note_id INTEGER NOT NULL` foreign key to notes and `tag_id INTEGER NOT NULL` foreign key to tags; composite primary key `(note_id, tag_id)`.

## Relationships

One user can own many notes (one-to-many) and create many tags (one-to-many). Notes and tags are many-to-many: each note can have multiple tags, and a tag can be used on multiple notes. `note_tags` is the join table representing this relationship and its composite key prevents duplicate associations.

## SQLite schema

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL CHECK (length(title) <= 100),
  body TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
  note_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_notes_user_created ON notes(user_id, created_at DESC);
```

## Example SQL queries

List a user's notes, newest first:

```sql
SELECT id, title, body, created_at
FROM notes WHERE user_id = 42 ORDER BY created_at DESC;
```

JOIN notes to their tags:

```sql
SELECT n.title, t.name AS tag
FROM notes n
JOIN note_tags nt ON nt.note_id = n.id
JOIN tags t ON t.id = nt.tag_id
WHERE n.user_id = 42;
```

Count notes per user, including users with no notes:

```sql
SELECT u.id, u.name, COUNT(n.id) AS note_count
FROM users u LEFT JOIN notes n ON n.user_id = u.id
GROUP BY u.id, u.name;
```

Find notes with a particular tag:

```sql
SELECT n.id, n.title
FROM notes n
JOIN note_tags nt ON nt.note_id = n.id
JOIN tags t ON t.id = nt.tag_id
WHERE t.user_id = 42 AND t.name = 'work';
```

## Index

`idx_notes_user_created` supports the common query for a user's notes in newest-first order. It helps locate matching rows and can reduce sorting work, at the cost of additional storage and slower writes.

## SQL or NoSQL?

I would choose relational SQL, such as PostgreSQL, because users, notes, tags, and their relationships have clear structure. Foreign keys and transactions preserve data integrity, and joins support tag filtering and reporting. A NoSQL database may suit some access patterns, but relational constraints and these queries are more natural in SQL. Read replicas and caching can be added as traffic grows.
