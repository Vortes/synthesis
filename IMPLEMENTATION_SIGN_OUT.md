# Desktop Sign Out Implementation Plan

This document outlines the phases to implement and test the "Sign Out" functionality in the Curate desktop and web applications, addressing critical gaps in state management, IPC communication, UX, and offline reliability.

## Phase 1: Update the UI Package (`packages/ui`)

**Objective**: Add a "Sign Out" button to the Sidebar, expose a callback prop, and add loading state support to prevent spam-clicking.

1. **Update `Sidebar` Props (`sidebar.tsx`)**:
   - Add an optional `onSignOut?: () => void | Promise<void>` to `SidebarProps`.
   - Add an optional `isSigningOut?: boolean` to `SidebarProps`.
2. **Add `LogOut` Icon (`sidebar.tsx`)**:
   - Add a "Sign Out" button in the Footer section of the Sidebar, next to the "Settings" button.
   - Attach the `onSignOut` callback to the button's `onClick` handler.
   - If `isSigningOut` is true, disable the button and show a loading state (e.g., a spinner or altered opacity) to prevent spam-clicking.
3. **Update `AppShell` Props (`app-shell.tsx`)**:
   - Add `onSignOut` and `isSigningOut` props to `AppShellProps`.
   - Pass these props down to the `Sidebar` component.

## Phase 2: Update Desktop Main Process (`apps/desktop/src/main.ts` & `preload.ts`)

**Objective**: Ensure the main process properly revokes tokens via a robust IPC channel that the renderer can await, and guarantees local tokens are wiped even if the network fails.

1. **Update IPC Handler (`main.ts`)**:
   - Change `ipcMain.on("auth:sign-out")` to `ipcMain.handle("auth:sign-out")` so it returns a Promise. This allows the renderer to wait for the operation to finish.
   - Ensure the token revocation logic (`revokeTokens`) is wrapped in a `try/catch` block.
   - Critically ensure that `clearPersistedTokens()` and clearing the refresh timer always execute (e.g., in a `.finally()` block), even if the revocation network request fails (e.g., offline or Clerk is down).
2. **Update Context Bridge (`preload.ts` & `env.d.ts`)**:
   - Change `signOut` in the `electronAPI` to return a `Promise<void>` instead of `void`.

## Phase 3: Update Desktop Renderer (`apps/desktop/src/renderer`)

**Objective**: Connect the UI, handle the loading state, and purge sensitive application state from the React Query cache.

1. **Update `AuthProvider` (`AuthProvider.tsx`)**:
   - Add an `isSigningOut` boolean state.
   - Expose `isSigningOut` in the `AuthContextValue`.
   - Update the `signOut` function to be async: set `isSigningOut(true)`, await `window.electronAPI.signOut()`, and then clear the local token state and set `isSigningOut(false)`.
2. **Purge React Query Cache (`App.tsx` or `AuthProvider.tsx`)**:
   - When `signOut` is called, ensure the tRPC query cache is entirely purged using `trpc.useUtils().client.clear()` (or equivalent like `queryClient.clear()`) so no sensitive data from the previous user remains in memory. This prevents data leaks between users on the same machine.
3. **Connect to `AppShell` (`App.tsx`)**:
   - Pass `signOut` and `isSigningOut` to the `AppShell` component.

## Phase 4: Integrate into the Web App (`apps/web`)

**Objective**: Add sign-out functionality to the web application using Clerk's built-in hooks/components.

1. **Update Web App Layout/Page**:
   - Locate where `AppShell` is used in `apps/web`.
   - Use Clerk's `useClerk` hook to get the `signOut` function.
   - Pass the `signOut` function as the `onSignOut` prop to `AppShell`.
   - Provide a redirect URL to the sign-in page (`/sign-in`) after signing out.

## Phase 5: Manual Verification & Edge Case Testing

**Objective**: Verify that clicking "Sign Out" successfully clears local tokens, purges memory, and returns the user to the login screen, even in edge cases.

1. **Standard Sign Out**:
   - Click "Sign Out".
   - Verify the loading state appears.
   - Verify immediate redirection to the `SignInScreen`.
   - Verify that data from the previous session is no longer visible if another user logs in (React Query cache successfully cleared).
   - Close the app and reopen it. Verify you are still on the `SignInScreen` (tokens were actually deleted from `safeStorage`).

2. **The "Ghost Session" Scenario**:
   - Sign in to the desktop app.
   - Manually delete the user from the Clerk Dashboard.
   - Click "Sign Out" in the desktop app.
   - Verify that despite the upstream Clerk deletion, the app cleanly catches any network errors, wipes the local `safeStorage` tokens, purges the cache, and logs you out gracefully.

3. **Offline Fallback**:
   - Sign in to the desktop app.
   - Disconnect from the internet.
   - Click "Sign Out".
   - Verify the application still successfully clears local state and drops you to the sign-in screen, without getting stuck in an infinite loading state.
