# ProjectWorld

ProjectWorld is a personal portfolio site built with Angular. Its main feature is an interactive Three.js globe with clickable markers for projects and experience. Selecting a marker opens a popup with text and, where available, an embedded video. A Chatbase chatbot is also embedded on the page.

## How the workspace is organized

- `src/app/app.*` is the application shell: it places the title, animated starfield, globe, and popup.
- `src/app/features/Globe/world/` renders and animates the globe, reads project records, and creates the clickable markers.
- `src/app/features/Globe/popup/` displays the selected project's details.
- `src/app/core/Services/` contains the popup state service and SQLite loading service.
- `src/app/core/Constants/db.ts` configures the browser asset paths for the SQLite WebAssembly module and database.
- `public/assets/` contains static files copied into the build, including the SQLite database, SQLite WASM module, and marker images.
- `scripts/setup-data.ts` is a data-generation utility for the project SQLite database. It is not currently exposed as an npm script.
- `docs/` is the configured production build output and is intended for static deployment.

The project data is stored in `public/assets/sqlite/database.sqlite`. The browser loads `sql.js` from jsDelivr, initializes it using `public/assets/sqlite/sql-wasm.wasm` (served in the app as `assets/sqlite/sql-wasm.wasm`), then fetches the database as `assets/sqlite/database.sqlite`. The globe expects a `projects` table with `lat`, `lon`, `title`, `text`, `img`, and `video` columns. Image paths in the records are relative to the deployed site, for example `assets/images/Unity_Country.png`.

## Requirements

- Node.js compatible with Angular 21 (Node.js `^20.19.0`, `^22.12.0`, or `>=24.0.0`).
- pnpm `11.11.0`.
- A WebGL-capable browser for the interactive globe.
- Internet access at runtime for the Chatbase embed and the `sql.js` script loaded from jsDelivr.

## Development

Install dependencies from the repository root:

```bash
pnpm install
```

Start the Angular development server:

```bash
pnpm start
```

Open <http://localhost:4200/>. The dev server rebuilds as source files change. `pnpm watch` builds with the development configuration and watches for changes; it does not start a web server.

Run the unit tests with:

```bash
pnpm test
```

Angular CLI commands are also available through the npm `ng` script, for example:

```bash
pnpm ng generate component component-name
```

## Production build and deployment

Build the production site with:

```bash
pnpm build
```

This runs Angular's production build and then uses Windows `xcopy`/`rmdir` commands to move the browser output from `docs/browser/` into `docs/`. The result is a static site; deploy the contents of `docs/` to a static web host.

The Angular build sets its base URL to `/ProjectWorld/`, matching a GitHub Pages project site at `https://<account>.github.io/ProjectWorld/`. Deploying under a different path or at the domain root requires changing the `baseHref` in `angular.json` and rebuilding. The host must serve the generated files and preserve the `assets/` paths. The app also needs network access to Chatbase and jsDelivr; the chatbot and database initialization depend on those third-party resources at runtime.

The build script's file-copy and cleanup steps use Windows command-line tools, so `pnpm build` as written requires Windows. On another operating system, use the Angular production build directly (`pnpm exec ng build --configuration production`) and deploy the browser output from `docs/browser/`, or adapt the post-build copy step for that platform.
