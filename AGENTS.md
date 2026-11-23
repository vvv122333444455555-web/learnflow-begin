# Security architecture
- App-internal AI uses authenticated TanStack server functions; legacy AI endpoints must be retired to prevent bypassing child gates.
- Child AI and checkout remain disabled until verified parental consent and guided content safeguards are operational.
- Browser updates cannot change protected profile fields; security-invoker triggers distinguish direct client writes from narrowly validated security-definer RPCs.
- Registration for the kids product creates a parent account; legacy child accounts retain their records and cannot self-convert to bypass safeguards.
- Parent relationships are provisioned by administrators using verified account IDs, never claimed by a child or teacher.
- Subscription activation RPCs stay disabled until a future integration verifies payment, prices and duration on the server.