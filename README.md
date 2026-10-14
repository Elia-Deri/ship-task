# PriceHunt

Live shipping-price search across seven simulated suppliers, with persisted price history.

- `server/`: ASP.NET Core (.NET 10) Web API
- `client/`: Angular 22

## How to run

From the repo root:

- Linux / macOS: `npm install && npm start`
- Windows (PowerShell): `npm install; npm start`

## Streaming results to the client

_TBD_

## Database and table structure

_TBD_

## Design decisions and trade-offs

- **.NET 10 and Angular 22.** This is my first .NET and Angular project, so I had no version preferences and used the latest releases.
- **Config in files, not environment variables.** To meet the no-setup requirement, the SQLite connection string and the allowed client origin (CORS) live in `server/appsettings.json`, and the client's API URL is a constant in the code. In a real app I'd move all three to environment variables.
- **Preset locations instead of a places API.** A real app would get cities and ports from a third-party API, but every reliable one needs an API key, which breaks the no-setup rule. Instead, the server serves a list of 50 AI-generated cities and ports (`GET /api/locations`), and the from / to fields autocomplete from it.

## What I would do differently

_TBD_

## Where AI was used

I used **Claude Code** because it's the tool I'm most familiar with and is widely considered the best coding agent at the moment.

These are the main usages:

- A Translation bridge between my Node/React implementations into .NET and Angular idioms.
- A general architecture and coding advisor.
- README Maintainer.
- Unit tests generations.
- Advanced UI and animations, within strict limits and examples I provided.
