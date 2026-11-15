# Customer web deployment

- `staging` deploys to `/home/pepsa/var/www/customer-frontend-staging` and uses `https://customersandboxapi.pepsa.co/v1`.
- `main` deploys to `/home/pepsa/var/www/customer-frontend-production` and uses `https://customerapi.pepsa.co/v1`.
- Secrets and environment values live only in each checkout's `shared/.env`.
- Builds replace `dist` atomically and retain one rollback build in `.dist-previous`.

Configure GitHub `staging` and `production` environments with `DEPLOY_HOST`, `DEPLOY_USER`, and `DEPLOY_SSH_KEY`. Clone the private repository into both deployment roots and install its read-only deploy key before enabling the workflow.

To roll back a web build, run `PEPSA_STATIC_ROOT=<deployment-root> bash deploy/scripts/rollback.sh` and verify the site before removing the failed build.
