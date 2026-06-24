# Feature Workflow

Goal: Define the smallest user-visible slice, touch only the needed files, then verify the expected behavior.

Default: For TypeScript/Next.js work, prefer local state, local route logic, and existing component/API patterns before adding persistence, providers, or new dependencies.

## Steps

1. Name the intended change and files likely touched.
2. Inspect the direct caller, route, component, test, or fixture before editing.
3. Make the smallest useful change in the repo's existing style.
4. Run the narrowest useful verification without adding generated build output to the review surface.
5. Check `git status --short` and remove generated output from the review surface unless explicitly requested.
6. Report changed files, verification, and what remains unverified.

## Stop Conditions

- Scope expands beyond the requested slice.
- Secrets, auth, privacy, provider I/O, migrations, deploys, or external side effects appear.
- Verification fails twice without a new hypothesis.
