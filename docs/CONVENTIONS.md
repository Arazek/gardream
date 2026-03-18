# PWA Template — Conventions

Standards and rules for working in this codebase.
Most rules reference established industry specs — links provided where relevant.

---

## Instructions for AI Assistants

If you are an AI assistant (LLM) working in this codebase, read this section first.

**You must follow these conventions at all times.**

If the user asks you to do something that would violate any convention in this document
(naming rules, folder structure, styling approach, store patterns, backend patterns, etc.),
**do not proceed silently**. Instead:

1. State clearly which convention would be violated and why.
2. Ask the user to explicitly confirm they want to override it before making any changes.

Example response when a conflict is detected:

> "This would override the BEM convention (SCSS & BEM section) — custom layout classes
> should follow `.block__element` naming. Do you want to proceed anyway and make an
> exception here, or should I find an approach that stays within conventions?"

Only proceed with the override after the user confirms a **second time**.
A single casual mention ("just do it") is not enough — ask once more to be sure,
especially during mass edits where convention drift compounds quickly.

**Do not silently "improve" or refactor code outside the scope of the requested task.**
If you notice a convention violation in nearby code while working, flag it as a comment
at the end of your response — do not fix it unless asked.

---

## Table of Contents

1. [General](#general)
2. [Git](#git)
3. [Frontend — Angular / Ionic](#frontend--angular--ionic)
4. [Frontend — SCSS & BEM](#frontend--scss--bem)
5. [Frontend — NgRx](#frontend--ngrx)
6. [Backend — Python / FastAPI](#backend--python--fastapi)
7. [Backend — Database & Alembic](#backend--database--alembic)
8. [Environment Variables](#environment-variables)
9. [Docker](#docker)
10. [Storybook](#storybook)

---

## General

- Working language: **English** — all code, comments, commit messages, and docs.
- Encoding: **UTF-8**, Unix line endings (`LF`).
- Trailing whitespace: **not allowed**.
- Each file ends with a **single newline**.

---

## Git

Based on [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

### Commit message format

```
<type>(<scope>): <short summary>

[optional body]
```

**Types:**

| Type       | Use when                                               |
|------------|--------------------------------------------------------|
| `feat`     | New feature                                            |
| `fix`      | Bug fix                                                |
| `chore`    | Tooling, deps, config (no production code change)      |
| `docs`     | Documentation only                                     |
| `style`    | Formatting, whitespace (no logic change)               |
| `refactor` | Code change that is neither a fix nor a feature        |
| `test`     | Adding or correcting tests                             |
| `ci`       | CI/CD pipeline changes                                 |

**Scope** = affected area: `frontend`, `backend`, `infra`, `auth`, `example`, etc.

```
feat(backend): add pagination to example endpoint
fix(frontend): resolve auth guard redirect loop
chore(infra): update keycloak to 26.1
```

### Branch naming

```
<type>/<short-description>
```

```
feat/user-profile-page
fix/keycloak-redirect
chore/upgrade-angular-19
```

- `main` — stable, deployable at all times
- Feature branches are short-lived, merged via PR

---

## Frontend — Angular / Ionic

Based on the [Angular Style Guide](https://angular.dev/style-guide).

### File naming

All files use **kebab-case**. Suffix indicates the Angular artifact type.

| Artifact       | Suffix         | Example                        |
|----------------|----------------|--------------------------------|
| Page component | `.page.ts`     | `example-list.page.ts`         |
| Component      | `.component.ts`| `item-card.component.ts`       |
| Service        | `.service.ts`  | `example-api.service.ts`       |
| Guard          | `.guard.ts`    | `auth.guard.ts`                |
| Interceptor    | `.interceptor.ts` | `auth.interceptor.ts`       |
| Pipe           | `.pipe.ts`     | `truncate.pipe.ts`             |
| Routes file    | `.routes.ts`   | `example.routes.ts`            |
| Store actions  | `.actions.ts`  | `example.actions.ts`           |
| Store reducer  | `.reducer.ts`  | `example.reducer.ts`           |
| Store selectors| `.selectors.ts`| `example.selectors.ts`         |
| Store effects  | `.effects.ts`  | `example.effects.ts`           |
| Store state    | `.state.ts`    | `example.state.ts`             |

### Class naming

**PascalCase** + suffix matching the file type.

```ts
// example-list.page.ts
export class ExampleListPage {}

// auth.service.ts
export class AuthService {}

// auth.guard.ts
export const authGuard: CanActivateFn = ...

// example.actions.ts
export const ExampleActions = createActionGroup(...)
```

### Components

- **All components are standalone** — no NgModules.
- Import only what the template uses.
- Pages live in `features/<feature>/pages/`, reusable UI in `shared/components/`.
- One component per file.

```ts
@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [IonCard, IonCardHeader, IonCardTitle],
  templateUrl: './item-card.component.html',
})
export class ItemCardComponent {}
```

### Selector prefix

All component selectors use the `app-` prefix.

```ts
selector: 'app-example-list'  // correct
selector: 'example-list'      // wrong
```

### Folder structure rules

```
src/app/
├── core/         # Singleton services, interceptors, guards, auth
│                 # Never import from features/
├── features/     # One folder per domain/feature
│   └── <name>/
│       ├── components/   # Feature-local UI components
│       ├── pages/        # Routable pages
│       ├── services/     # Feature-local API services
│       └── store/        # NgRx slice for this feature
├── shared/       # Reused across 2+ features (components, pipes, directives)
│                 # No dependencies on core/ or features/
└── store/        # Root NgRx store registration only
```

**Rules:**
- `core/` → never depends on `features/` or `shared/`
- `shared/` → never depends on `features/` or `core/`
- Features are self-contained — cross-feature communication goes through the store
- Route files (`*.routes.ts`) live at the feature root, not inside `pages/`

### TypeScript

- `strict: true` is enforced (see `tsconfig.json`).
- Always declare return types on public methods.
- Prefer `readonly` for injected services.
- Use `interface` for data shapes, `type` for unions/aliases.
- No `any` — use `unknown` and narrow, or define a proper type.
- Use `signal` / `computed` for new reactive state where applicable (Angular 17+).

```ts
// Correct
constructor(private readonly store: Store) {}
getItems(): Observable<ExampleItem[]> { ... }

// Wrong
constructor(private store) {}
getItems() { ... }
```

### Observables and async

- Suffix observable variables with `$`: `items$`, `loading$`.
- Unsubscribe via `async` pipe in templates (preferred), `takeUntilDestroyed()`, or `DestroyRef`.
- Never subscribe inside a constructor — use `ngOnInit` or effects.

### Import order

Group imports in this order, separated by a blank line:

1. Angular core (`@angular/core`, `@angular/common`, etc.)
2. Third-party libraries (`@ionic/angular`, `@ngrx/store`, `rxjs`, etc.)
3. App-level (`@app/...` path alias)
4. Relative imports (`./`, `../`)

---

## Frontend — SCSS & BEM

Styling uses **SCSS** (component-scoped) with **BEM** class naming for custom UI.
Ionic component internals are themed exclusively via **CSS custom properties**.

### File structure

Each component that needs custom styles has a co-located `.scss` file:

```
item-card.component.ts
item-card.component.scss   ← scoped to this component via Angular's ViewEncapsulation
```

Global and shared styles live in:

```
src/
├── global.scss          ← Ionic base imports, global resets, font declarations
└── theme/
    └── variables.scss   ← ALL Ionic CSS variable overrides (colors, fonts, radii…)
```

### BEM naming

Follow [BEM](https://getbem.com/) — Block, Element, Modifier.

```
.block {}
.block__element {}
.block--modifier {}
.block__element--modifier {}
```

**Block** = the standalone component or section (`item-card`, `login-form`, `user-avatar`).
**Element** = a part of the block (`item-card__title`, `login-form__input`).
**Modifier** = a variation or state (`item-card--featured`, `login-form__input--error`).

```html
<!-- Template -->
<div class="item-card item-card--featured">
  <h2 class="item-card__title">Title</h2>
  <p class="item-card__description">Description</p>
  <span class="item-card__badge item-card__badge--new">New</span>
</div>
```

```scss
// item-card.component.scss
.item-card {
  padding: 1rem;

  &--featured {
    border: 2px solid var(--ion-color-primary);
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
  }

  &__description {
    color: var(--ion-color-medium);
    font-size: 0.875rem;
  }

  &__badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;

    &--new {
      background: var(--ion-color-success);
      color: var(--ion-color-success-contrast);
    }
  }
}
```

### Rules

- **BEM classes only for custom components** — do not invent classes for Ionic components.
- **Never nest BEM blocks** inside each other in SCSS — keep specificity flat.
- **Max nesting depth: 2 levels** (block → element, block → modifier). Deeper = smell.
- **No IDs** in stylesheets — always classes.
- **No inline `style=""`** in templates unless the value is dynamic and cannot be a class.

```scss
// Correct — flat, readable
.login-form__input { ... }
.login-form__input--error { ... }

// Wrong — over-nested, high specificity
.login-form {
  .form-group {
    input {
      &.error { ... }
    }
  }
}
```

### Ionic theming

Override Ionic's design tokens in `src/theme/variables.scss` only. Never use component-scoped SCSS to override Ionic component styles — use `::part()` for that.

### ThemeService

Use `ThemeService` (from `core/theme/theme.service.ts`) as the single source of truth for color scheme and accent color. Never manipulate `body.dark`, `body.light`, or `body[data-accent]` directly — always go through the service.

```ts
// Correct
this.theme.setScheme('dark');
this.theme.setAccent('clay');

// Wrong — bypasses persistence and signal state
document.body.classList.add('dark');
```

`ThemeService` is `providedIn: 'root'` — inject it directly, no provider registration needed.

```scss
// variables.scss — global design tokens
:root {
  --ion-color-primary: #3880ff;
  --ion-border-radius: 8px;
}

// item-card.component.scss — targeting an Ionic component's shadow part
ion-card::part(native) {
  border-radius: var(--ion-border-radius);
}
```

### Ionic utility classes vs custom classes

Prefer Ionic's built-in utilities for common one-liners. Only write a BEM class when the style is specific to a component.

```html
<!-- Correct — use Ionic utility for generic spacing -->
<div class="ion-padding">...</div>

<!-- Correct — use BEM for component-specific layout -->
<div class="dashboard__header">...</div>

<!-- Wrong — inventing a generic utility class that Ionic already provides -->
<div class="my-padding">...</div>
```

---

## Frontend — NgRx

### When to use the store

| Scenario                                      | Use store? |
|-----------------------------------------------|------------|
| Server data shared across multiple components | Yes        |
| Auth state / current user                     | Yes        |
| UI state used in only one component           | No — local |
| Form state                                    | No — reactive forms |
| Single-use loading flags inside a page        | No — local |

### Action naming

Actions follow the Event Sourcing pattern — they describe **what happened**, not what to do.

```ts
// Correct — past-tense events or user intent nouns
'Load Items'          // triggers a load
'Load Items Success'  // server responded ok
'Load Items Failure'  // server responded with error
'Select Item'         // user selected an item

// Wrong
'GET_ITEMS'
'setLoading'
'fetchItems'
```

### One action group per feature

```ts
// example.actions.ts
export const ExampleActions = createActionGroup({
  source: 'Example',
  events: { ... },
});
```

Never dispatch actions from one feature's store file to another feature's reducer directly. Use root-level actions or effects for cross-feature coordination.

### Selectors

- Always use `createSelector` with memoization — never select state directly in components.
- Prefix selector names with `select`.
- Keep selectors composable.

```ts
// Correct
export const selectAllItems = createSelector(selectExampleState, (s) => s.items);

// Wrong — direct state access in component
this.store.select((state) => state.example.items)
```

### Effects

- Effects handle all side effects — HTTP calls, navigation, notifications.
- One effects class per feature.
- Always catch errors and dispatch a failure action — never let an effect complete without error handling.

```ts
loadItems$ = createEffect(() =>
  this.actions$.pipe(
    ofType(ExampleActions.loadItems),
    switchMap(() =>
      this.api.getAll().pipe(
        map((items) => ExampleActions.loadItemsSuccess({ items })),
        catchError((error) => of(ExampleActions.loadItemsFailure({ error: error.message }))),
      ),
    ),
  ),
);
```

---

## Backend — Python / FastAPI

Based on [PEP 8](https://peps.python.org/pep-0008/) and [FastAPI best practices](https://fastapi.tiangolo.com/tutorial/).

### Formatting

- Formatter: **Black** (line length 88)
- Linter: **Ruff**
- All code must pass both before merging

```bash
# From backend/
black .
ruff check .
```

Add to `requirements.txt` (dev) or run in the container:
```
black==24.10.0
ruff==0.8.4
```

### Naming

| Element          | Convention       | Example                     |
|------------------|------------------|-----------------------------|
| Files/modules    | `snake_case`     | `example_service.py`        |
| Classes          | `PascalCase`     | `ExampleItem`, `Settings`   |
| Functions        | `snake_case`     | `get_current_user()`        |
| Variables        | `snake_case`     | `owner_id`, `access_token`  |
| Constants        | `UPPER_SNAKE`    | `DEFAULT_TIMEOUT`           |
| Pydantic schemas | `PascalCase` + suffix | `ExampleItemCreate`    |

### Type hints

**All functions must have type hints** — parameters and return type.

```python
# Correct
async def get_item(item_id: str, db: AsyncSession) -> ExampleItem:
    ...

# Wrong
async def get_item(item_id, db):
    ...
```

### Folder responsibilities

```
app/
├── api/v1/endpoints/   # Route handlers only — thin layer, delegate to services
├── core/               # Config, security, shared dependencies
├── db/                 # Engine, session factory, base model
├── models/             # SQLAlchemy ORM models (database shape)
└── schemas/            # Pydantic models (API request/response shape)
```

**Rules:**
- Endpoint files (`endpoints/*.py`) contain only route handlers — no business logic.
- Business logic that grows beyond a single endpoint goes in `services/` (create as needed).
- `models/` defines the DB shape. `schemas/` defines the API contract. Never mix them.
- Schemas have explicit suffixes: `Base`, `Create`, `Update`, `Response`.

```python
class ExampleItemBase(BaseModel): ...      # shared fields
class ExampleItemCreate(ExampleItemBase): ...  # POST body
class ExampleItemUpdate(BaseModel): ...    # PUT body (all optional)
class ExampleItemResponse(ExampleItemBase): ...  # what the API returns
```

### Async

All database operations and HTTP calls must be `async`. Never use synchronous SQLAlchemy calls.

```python
# Correct
result = await db.execute(select(ExampleItem))

# Wrong
result = db.execute(select(ExampleItem))
```

### Error handling

Use FastAPI's `HTTPException` for client errors. Let unexpected errors propagate (FastAPI returns 500 automatically). Do not swallow exceptions silently.

```python
# Correct
if not item:
    raise HTTPException(status_code=404, detail="Item not found")

# Wrong
if not item:
    return None
```

### API versioning

All routes are prefixed with `/api/v1/`. When introducing breaking changes, add a `v2` router — never modify `v1` contracts in place.

### Dependency injection

Use `Depends()` for database sessions, current user, and role checks. Do not instantiate services or sessions manually inside endpoint functions.

```python
@router.get("")
async def list_items(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    ...
```

---

## Backend — Database & Alembic

### Model naming

- Table names: **plural snake_case** (`example_items`, `user_profiles`)
- Column names: **snake_case** (`created_at`, `owner_id`)
- Primary keys: `id` (string UUID)
- Foreign keys: `<table_singular>_id` (`user_id`, `item_id`)
- Timestamps: always include `created_at` and `updated_at` on every table

### Migrations

- **Never** use `Base.metadata.create_all()` in production — always use Alembic.
- `create_all` is only present in `main.py` lifespan for local dev convenience.
- Every schema change gets its own migration revision with a descriptive message.

```bash
./run.sh db:revision "add user profile table"
./run.sh db:migrate
```

- Migration files are committed to source control.
- Do not edit existing migration files after they have been applied — create a new revision instead.

---

## Environment Variables

- All variables are documented in `.env.example` with a comment.
- Naming: `UPPER_SNAKE_CASE`.
- Group by service with a comment block header.
- Secrets (passwords, tokens, keys) must never be committed — they live only in `.env` (gitignored).
- Internal service URLs (container-to-container) use the Docker service name, not `localhost`.

```env
# Correct
KEYCLOAK_INTERNAL_URL=http://keycloak:8080

# Wrong
KEYCLOAK_INTERNAL_URL=http://localhost:8080
```

---

## Docker

- Each service uses a **multi-stage Dockerfile**: `base` → `development` → `production`.
- Development stage enables hot reload; production stage copies source and runs with workers.
- Images do not run as root — add a non-root user in production stages if the base image requires it.
- Service names in `docker-compose.yml` are **kebab-case** and match the Traefik router name.
- Volumes for persistent data are named (not bind-mounted) in production.
- Bind mounts (source code) are only in `docker-compose.local.yml`.

---

## Keycloak Login Theme

The custom `pwa` theme lives in `infra/keycloak/themes/pwa/login/`.

### FreeMarker rules

Keycloak 26 uses FreeMarker with **HTML auto-escaping enabled**. This means:

- **Never use `?html`** — it is a parse error in Keycloak 26 (`?html` is the legacy escaping built-in, forbidden when auto-escaping is on).
- Use plain `${}` interpolations — they are automatically HTML-escaped.
- Use `?no_esc` only on values that have already been sanitized (e.g. `${kcSanitize(message.summary)?no_esc}`).

```ftl
<!-- Correct -->
<input value="${login.username!''}">

<!-- Wrong — parse error in KC26 -->
<input value="${(login.username!'')?html}">
```

### Theme structure

```
themes/pwa/login/
  template.ftl             Base layout macro (<@layout.page title=...>)
  login.ftl                Username/password form + social providers + register link
  error.ftl                Error page (renders message.summary via kcSanitize + ?no_esc)
  info.ftl                 Info/confirmation page
  login-reset-password.ftl Forgot password form
  login-update-password.ftl Update password form
  login-verify-email.ftl   Email verification prompt
  resources/css/login.css  BEM-styled CSS with dark mode via @media (prefers-color-scheme: dark)
  theme.properties         parent=base, styles=css/login.css
```

### Realm import

- `realm-export.json` sets `"loginTheme": "pwa"` — applied on first import.
- If realm already exists, Keycloak skips re-import silently.
- To update a live realm's theme: `kcadm.sh update realms/pwa -s loginTheme=pwa`

---

## Storybook

Stories are written only for components in `shared/components/`. Feature components and pages do not get stories.

### File placement

Story files are co-located with the component:

```
shared/components/chip/
  chip.component.ts
  chip.component.stories.ts
```

### Story file structure

```ts
import type { Meta, StoryObj } from '@storybook/angular';
import { MyComponent } from './my.component';

const meta: Meta<MyComponent> = {
  title: 'Shared/<Category>/<ComponentName>',
  component: MyComponent,
  tags: ['autodocs'],          // always include — enables auto docs page
  argTypes: { ... },
};
export default meta;
type Story = StoryObj<MyComponent>;

export const Default: Story = { args: { ... } };
export const Variant: Story = { args: { ... } };
```

### Title naming

Follow the pattern `Shared/<Category>/<ComponentName>`:

| Category      | Use for                                      |
|---------------|----------------------------------------------|
| `DataDisplay` | Read-only display: chips, badges, avatars    |
| `Feedback`    | Status/state: empty state, error, success    |
| `Forms`       | Inputs: form-field, select, toggle, textarea |
| `Layout`      | Structure: card, section, divider, list-item |
| `Navigation`  | Nav elements: page-header, tabs              |
| `Media`       | Images, logos                                |

### Rules

- Always include `tags: ['autodocs']` on the `meta` object.
- Export at least a `Default` story.
- Export named variants for each meaningful visual state.
- Use `argTypes` to define controls for interactive props.
- Use `action` for event outputs (`remove`, `click`, etc.).
- Do not import from `core/` or `features/` inside story files.
