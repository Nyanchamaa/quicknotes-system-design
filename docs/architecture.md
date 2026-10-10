# QuickNotes System Architecture

## Functional requirements
- Users authenticate and access only their own notes.
- Users create, list, retrieve, update, and delete notes.
- A note requires a title of at most 100 characters; body is optional.
- Users organize notes with tags and search/filter their notes.
- The API returns useful validation and error responses.

## Non-functional requirements
- Availability: tolerate an app instance failure and recover from database failures.
- Performance: low-latency reads and responsive writes.
- Scalability: add app instances horizontally.
- Security: HTTPS, password hashing, authorization, input validation, and secret management.
- Durability: backups and tested restore procedures.
- Observability: metrics, logs, traces, and request IDs without unnecessarily logging note contents.

## Load estimate for 1 million registered users

Assumptions: 10% daily active users = 100,000 DAU; each active user makes 50 reads and creates 1 note per day; each note and basic metadata average 2 KB; 365 days/year; average traffic is distributed across 86,400 seconds/day; peak is 5 times average. Estimates exclude indexes, replicas, backups, attachments, and protocol overhead.

- **Reads:** 100,000 × 50 = 5,000,000 reads/day. 5,000,000 / 86,400 ≈ **58 average reads/second**, or **290 peak reads/second** at 5×.
- **Writes:** 100,000 × 1 = 100,000 writes/day. 100,000 / 86,400 ≈ **1.16 average writes/second**, or **5.8 peak writes/second**.
- **Storage:** 100,000 notes/day × 365 = 36.5 million notes/year. At 2 KB each, this is about **73 GB/year** before indexes, replicas, backups, and growth overhead.

This is a read-heavy workload, so caching and a read replica can reduce pressure on the primary database.

## Architecture diagram

```text
                    +-------------------+
                    | Client (web/mobile)|
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    | DNS / domain      |
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    | CDN (static files)|
                    +---------+---------+
                              |
                              v
                    +-------------------+
                    | Load balancer     |
                    +------+-------+----+
                           |       |
                    +------v--+ +--v-------+
                    | App 1   | | App 2    |
                    +----+----+ +----+-----+
                         |           |
                         +-----+-----+
                               |
                       +-------+--------+
                       |                |
                 +-----v------+  +------v-------+
                 | Cache      |  | Primary DB   |
                 +------------+  +------+-------+
                                        |
                                        v
                                 +--------------+
                                 | Read replica |
                                 +--------------+

                    App servers --> Queue --> Worker
                                      background jobs
```

## Component responsibilities

- **Client:** provides the interface and calls the API without direct database access.
- **DNS:** resolves the service domain and supports managed routing/failover.
- **CDN:** serves static assets close to users, reducing latency and origin traffic.
- **Load balancer:** distributes requests across healthy app instances.
- **App servers:** implement authentication, validation, authorization, and API logic; multiple instances enable horizontal scaling.
- **Cache:** keeps popular note lists in memory to reduce repeated database reads, with invalidation to manage freshness.
- **Primary database:** stores authoritative users, notes, tags, and relationships with transactional integrity.
- **Read replica:** serves eligible reads and reduces primary load, while replication lag may mean slightly stale data.
- **Queue:** buffers background tasks so they do not delay the user's request and can be retried.
- **Worker:** processes queued tasks such as notifications, exports, or cleanup independently of API servers.

## GET /notes flow

1. Client sends `GET /v1/notes` over HTTPS with an access token.
2. DNS resolves the API domain; the request reaches the load balancer.
3. The load balancer routes it to a healthy app server.
4. The app server authenticates the user and checks authorization.
5. The app server checks cache for the user's note list and cursor.
6. On a cache hit, return cached data; on a miss, query the read replica when appropriate or the primary when fresh data is required.
7. Return JSON and pagination metadata; cache the result briefly if appropriate.

## POST /notes flow

1. Client sends `POST /v1/notes` with an access token and JSON `title` and optional `body`.
2. DNS and load balancing route the request to a healthy app server; dynamic API responses are not publicly cached.
3. The app server authenticates and validates the title, including its 100-character limit.
4. The app server inserts the note into the primary database in a transaction and receives the new ID.
5. It invalidates or updates the user's cached note list.
6. It may enqueue background work and returns `201 Created` with the saved note.
7. A worker processes queued work asynchronously; failures in the database write must return an error rather than claiming success.

## Trade-offs

- **Cache speed vs freshness:** cache reduces latency and database load, but a note list can briefly be stale; short TTLs and invalidation help at the cost of complexity.
- **Read replicas vs consistency:** replicas scale reads but can lag; read-after-write requests may need the primary.
- **Async queue vs immediate completion:** queued work keeps requests fast and supports retries, but tasks complete later and require monitoring and idempotency.
- **Redundancy vs cost:** multiple instances and managed failover improve resilience but add infrastructure cost and operational complexity.

## Avoiding single points of failure

Run at least two app servers across separate availability zones behind a health-checking load balancer. Use managed redundant DNS/CDN services and a highly available database configuration with automated failover and tested backups. Place replicas and workers in separate failure domains where possible. Use a durable managed queue and make jobs retryable and idempotent so one worker failure does not lose work. The primary database remains critical, so recovery and failover must be tested.
