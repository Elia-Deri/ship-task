# PriceHunt

Live shipping-price search across seven simulated suppliers, with persisted price history.

- `server/`: ASP.NET Core (.NET 10) Web API
- `client/`: Angular 22

## How to run

Requires the .NET 10 SDK and Node.js 22.22+, 24.15+ or 26+.

From the repo root:

- Linux / macOS: `npm install && npm start`
- Windows (PowerShell): `npm install; npm start`

This starts the API on http://localhost:5298 and the app on http://localhost:4200. The SQLite database is created on first run.

## Streaming results to the client

I stream with **Server-Sent Events over a `POST` request**. The client posts the search, and the server keeps the response open as `text/event-stream`, writing one event per supplier as soon as it answers: `started`, then `quote` or `failed` per supplier, then `ended` with `completed` or `timedOut`.

- **Why SSE:** data only flows from server to client, which is what SSE is for. It's built into .NET 10 (`TypedResults.ServerSentEvents`), needs no extra package on either side, and each search is its own HTTP request, so the request's lifetime is the search's lifetime.
- **Why POST:** the search parameters belong in a request body. The browser's `EventSource` only supports GET, so the client reads the stream through Angular's `HttpClient` progress events and a small SSE parser.
- **Why not SignalR:** it's two-way and needs a client package and connection management that a one-way stream doesn't need.

On the server, each supplier call is its own task that catches its own errors, so one failure can't affect the others, and `Task.WhenEach` hands me results in the order they finish. Every call gets a token that is cancelled by either the 6-second limit or the client disconnecting. Starting a new search unsubscribes the old stream, which aborts its request, and the cancellation reaches every supplier call. Suppliers still running at 6 seconds are recorded as timed out, and `ended: timedOut` tells the client nothing else is coming.

## Database and table structure

SQLite through EF Core. EF migrations are applied at startup, so the schema is created on first run.

| Table               | Columns                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Suppliers`         | `Id`, `Name`, `Behavior` (Normal / Flaky / Unresponsive)                                                                                                     |
| `Searches`          | `Id`, `Source`, `Destination`, `StartDate`, `EndDate`, `CreatedAtUtc`, `Status` (Completed / TimedOut / Cancelled)                                           |
| `SupplierResponses` | `Id`, `SearchId` → `Searches`, `SupplierId` → `Suppliers`, `Status` (Succeeded / Failed / TimedOut / Cancelled), `Price`, `ResponseTimeMs`, `RespondedAtUtc` |

- When a search starts, I insert the search row plus one empty response row per selected supplier, so the selected suppliers are saved right away. When it ends, including when the client disconnects, I fill in each outcome and the final status. A null status means the search is still running or was interrupted.
- A unique index on `(SearchId, SupplierId)` keeps one response per supplier per search. Deleting a search deletes its responses; a supplier that has history can't be deleted.
- Prices are integers in cents: SQLite has no decimal type, and EF can't sort decimals there.
- `Suppliers` is the source of truth. On startup I check it still has seven suppliers with exactly one flaky and one unresponsive, and reseed it if not. That clears history, because supplier ids change.

## Design decisions and trade-offs

- **.NET 10 and Angular 22.** This is my first .NET and Angular project, so I had no version preferences and used the latest releases.
- **Config in files, not environment variables.** To meet the no-setup requirement, the SQLite connection string and the allowed client origin (CORS) live in `server/appsettings.json`, and the client's API URL is a constant in the code. In a real app I'd move all three to environment variables.
- **History filtering on the server, sorting and paging in the browser.** The history filters (date range, suppliers, routes) are sent to the backend as query parameters, to mimic a production app where the full history is too large to send to the browser. The filtered rows are then sorted and paged client-side by AG Grid, which was much faster to build. At real scale I'd move sorting and paging to the server as well.
- **Preset locations instead of a places API.** A real app would get cities and ports from a third-party API, but every reliable one needs an API key, which breaks the no-setup rule. Instead, the server serves a list of 50 AI-generated cities and ports (`GET /api/locations`), and the from / to fields autocomplete from it.
- **Fixed supplier behaviors.** The same supplier is always the flaky one and the same one never responds, rather than picking them randomly per search, so per-supplier history stays meaningful. Each search gets a base price from a hash of its route and dates, and each supplier quotes within ±5% of it, so prices look realistic and stay consistent between runs.
- **History dates.** The date filter matches searches whose shipping dates overlap the selected range. The table's Date column shows when the supplier answered. Responses cut off because the client left, or never completed because the server stopped, are left out, since no supplier actually answered.
- **A third project for tests.** `server.Tests` holds the server's xUnit tests; the client's tests live inside `client/`.

## What I would do differently

- Save each supplier response as it arrives instead of all at the end of the search. Today a server crash mid-search loses up to six seconds of results (the search and its selected suppliers are already saved).
- Add end-to-end API tests (`WebApplicationFactory`) covering the HTTP stream and the history endpoint, on top of the unit tests.
- With real suppliers: per-supplier timeouts, retries and a circuit breaker instead of relying only on the global 6-second limit.
- Show which suppliers timed out in the search results, not only that the search timed out.

## Where AI was used

I used **Claude Code** because it's the tool I'm most familiar with and is widely considered the best coding agent at the moment.

These are the main usages:

- A Translation bridge between my Node/React implementations into .NET and Angular idioms.
- A general architecture and coding advisor.
- README Maintainer.
- Unit tests generations.
- Advanced UI and animations, within strict limits and examples I provided.
