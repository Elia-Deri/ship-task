# Code review — `feat/history-page`

**Author:** elia · **Branch:** `feat/history-page` (uncommitted server changes) · **Intent:** persist every search and supplier response, and expose `GET /api/history` + `GET /api/history/routes` for the client-side history grid.

**Verified:**

- `dotnet build` of the server passes (0 warnings).
- I ran the server against a throwaway SQLite database. A completed search and a timed-out search were both streamed and saved. All history endpoints were then exercised with no filters, a date range, a supplier filter, a route filter, and two invalid queries.
- `dotnet test` was **not** run: the test project no longer compiles (see Important 2).

---

## Blocking

### `[blocking]` Reseed deletes suppliers before their responses, so startup crashes

`server/Suppliers/SupplierService.cs:33`

```csharp
await db.Suppliers.ExecuteDeleteAsync(ct);   // should be db.SupplierResponses
await db.Searches.ExecuteDeleteAsync(ct);
await db.Suppliers.ExecuteDeleteAsync(ct);
```

The first line deletes `Suppliers` instead of `SupplierResponses`. `SupplierResponses.SupplierId` is a `Restrict` foreign key, so as soon as any history exists, deleting suppliers fails.

Reproduced: I set a second supplier to `Flaky` in a database with 7 history rows, then restarted. The app died before listening:

```
Unhandled exception. Microsoft.Data.Sqlite.SqliteException: SQLite Error 19: 'FOREIGN KEY constraint failed'.
```

That breaks the "one command to run" invariant whenever the supplier list needs reseeding.

**Fix:** change line 33 to `await db.SupplierResponses.ExecuteDeleteAsync(ct);`. The order must be responses → searches → suppliers.

*Nest/Prisma analogy:* same as `deleteMany` on a parent whose relation is `onDelete: Restrict`. You have to delete the children first.

### `[blocking]` Formatting: stacked blank lines (CLAUDE.md → FORMATTING)

- `server/Program.cs:7-9`: three blank lines after the usings.
- `server/Searches/SearchService.cs:10-11`: two blank lines after `_searchTimeout`.
- `server/History/HistoryQuery.cs:13-14`: two blank lines before `Validate`.

**Fix:** exactly one blank line in each place.

---

## Important

### `[important]` `SearchService` is registered twice

`server/Program.cs:23` and `:25` both call `AddScoped<SearchService>()`. It's harmless at runtime, because the last registration wins, but it's leftover noise. Delete line 23.

In the same file, the `using` group isn't sorted by line length. `using ShipTask.Api.History;` goes right after `using ShipTask.Api.Data;`.

### `[important]` Test project no longer compiles

`server.Tests/Searches/SearchServiceTests.cs:111` still constructs `SearchService` with `SearchIdGenerator`, which this change deletes. This is expected: the tests are scheduled to move to an in-memory SQLite database with `SearchStore` in the next step. Until then, `dotnet test` fails at build time.

### `[important]` Branch name is missing the issue segment

CLAUDE.md requires `type/ISSUE-<number>/<short-desc>`. The repo has no GitHub issues, so use the placeholder: `feat/ISSUE-000/history-page`. Rename it before opening the PR.

---

## Nits

- **`[nit]` Unused index.** `server/Data/PriceHuntDbContext.cs:39` adds `IX_SupplierResponses_RespondedAtUtc`. It was there for server-side sorting, which you moved to the client, so now it only slows down writes. The migration isn't committed yet, so the fix is:
  1. Delete the line.
  2. Run `dotnet ef migrations remove`. If your local `pricehunt.db` already applied the migration, run `dotnet ef database update AddSuppliers` first, or delete the `.db` file.
  3. Run `dotnet ef migrations add AddSearchHistory -o Data/Migrations` again.
- **`[nit]` Two non-obvious WHY comments were dropped** in `server/History/HistoryService.cs`. Without them, a reader can't tell why:
  - line 11: `_routeSeparator` is `\u001F`. Typed text can't contain it, so `"a|b" + "c"` can't collide with `"a" + "b|c"`.
  - line 16: cancelled and pending rows are excluded. Pending rows belong to running or interrupted searches; cancelled rows mean the client left.

  Same for the reseed in `SupplierService.cs`: supplier ids change on reseed, so old history would point at the wrong suppliers.
- **`[nit]`** `server/Searches/SearchRequest.cs:15-16`: no blank line between `StartDate` and `EndDate`, unlike the other properties.
- **`[nit]`** `server/Searches/SearchService.cs:16` and `:58`: the closing `)` of the parameter list sits on its own line. Idiomatic C# puts it after the last parameter: `[EnumeratorCancellation] CancellationToken ct)`.

---

## Praise

- **`[praise]` Persistence lifecycle works on the real path.** `SearchStore` creates the search plus one empty row per supplier, and the `finally` completes them with `CancellationToken.None`. On the timed-out search, the silent supplier was saved with `responseTimeMs: 5994` and no event was streamed for it, exactly as designed.
- **`[praise]` The migration is exactly right:**
  - `Cascade` on `SearchId` and `Restrict` on `SupplierId`
  - the unique `(SearchId, SupplierId)` index
  - nullable `TEXT` statuses
  - `DateOnly` stored as `TEXT`
- **`[praise]` Dates are correct end to end:**
  - `respondedAt` came back as real UTC: 20:00:37Z, against a server clock of 20:02Z.
  - The overlap filter is inclusive at the edges: `startDate` equal to a search's last day includes it, and a day between two searches returns `[]`.
- **`[praise]` Inputs are clean.** Locations are trimmed on save (`" Haifa "` → `Haifa`), and validation returns proper `400` problem details, including `Routes[0].Destination` when a route is incomplete.
- **`[praise]` Responsibilities are split well:** orchestration in `SearchService`, persistence in `SearchStore`, reads in `HistoryService`, and thin controllers.

---

**Outcome: request changes.** One line fixes the startup crash. The rest is formatting and small cleanup. After that, this is ready for the test step.
