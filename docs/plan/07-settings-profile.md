# 07 — Settings & Profile

**Route:** `/tabs/settings`
**Feature folder:** `frontend/src/app/features/settings/` (already scaffolded)

---

## Sections

### Profile
- Avatar (initials fallback from first + last name)
- Display name (`type-heading-3`)
- Email (`type-body`, `--color-on-surface-variant`)
- "Edit profile" link → Keycloak account console (`/auth/realms/pwa/account`)

### Appearance
Already implemented. Keep as-is:
- Scheme picker: Light / Dark / System (`IonSegment`)
- Accent swatches: Clay / Moss / Dune / Slate / Default (5 circular swatches)

### Notifications
New section. Three toggles (`ToggleFieldComponent`):

| Toggle | Description | Default |
|---|---|---|
| Morning reminder | Daily push + email at 8:00 AM | On |
| Evening reminder | Daily push + email at 7:00 PM | On |
| In-app alerts | Show in-app notification badge | On |

On toggle change → `PUT /api/v1/notifications/settings` → persisted to DB per user.
Notification time is fixed for MVP (no custom time picker).

### Sign out
`IonButton` ghost style. Calls `KeycloakService.logout()`. Clears NgRx store.

---

## NgRx additions

Extend existing settings store (or create `notifications` slice):

```
features/settings/store/
  notifications.actions.ts  — loadNotificationSettings, updateNotificationSettings
  notifications.effects.ts
  notifications.reducer.ts
  notifications.state.ts    — { morningReminder: boolean, eveningReminder: boolean, inAppAlerts: boolean }
```

---

## API calls

| Action | Endpoint |
|---|---|
| Load notification settings | `GET /api/v1/notifications/settings` |
| Update notification settings | `PUT /api/v1/notifications/settings` |
