# Flux Deployment Notes

## App Specs

- `api-app.spec.json`: API-facing deployment.
- `reporter-app.spec.json`: quorum reporter deployment template.

Replace placeholders before registration:

- `owner` with your ZelID.
- `repotag` with your published image tag.
- reporter instance environment values (`FPHO_REPORTER_ID` and any secrets).

## Scaling Guidance

- Keep reporter count tied to quorum requirements (for example, `N=3` with threshold `t=2`).
- Do not scale reporters for user traffic.
- Scale API instances independently to serve read-heavy workloads.
- Keep indexer/anchor workers internal; clients should query API only.
