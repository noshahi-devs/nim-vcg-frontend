# Live Deployment

This is the current working deployment for `visioncollegegojra.com`.

## Live Paths

- Frontend source: `/var/www/apps/nim-vcg-frontend`
- Backend source: `/var/www/apps/nim-vcg-backend`
- Live frontend: `/var/www/visioncollegegojra/frontend`
- Live backend: `/var/www/visioncollegegojra/backend`
- Nginx config: `/etc/nginx/sites-available/visioncollegegojra`
- Backend service: `nim-backend`
- Backend URL behind nginx: `http://127.0.0.1:5000`

## Easiest Option For A Junior Dev

One-time install on the VPS:

```bash
cd /var/www/apps/nim-vcg-backend
chmod +x scripts/install-deploy-command.sh scripts/deploy-live.sh
sudo ./scripts/install-deploy-command.sh
```

Then deploy with one command:

```bash
nim-vcg-deploy all
```

Or only one side:

```bash
nim-vcg-deploy frontend
nim-vcg-deploy backend
```

## Frontend Deploy

```bash
cd /var/www/apps/nim-vcg-frontend
git fetch origin main
git reset --hard origin/main
rm -rf node_modules dist
npm ci
npm run build
sudo rsync -a --delete dist/wowdash/browser/ /var/www/visioncollegegojra/frontend/
sudo chown -R www-data:www-data /var/www/visioncollegegojra/frontend
```

## Backend Deploy

```bash
cd /var/www/apps/nim-vcg-backend
git fetch origin main
git reset --hard origin/main
rm -rf /home/administrator/nim-vcg-backend-publish
mkdir -p /home/administrator/nim-vcg-backend-publish
dotnet restore
dotnet publish SchoolApiService/SchoolApiService.csproj -c Release -o /home/administrator/nim-vcg-backend-publish
sudo rsync -a --delete /home/administrator/nim-vcg-backend-publish/ /var/www/visioncollegegojra/backend/
sudo chown -R administrator:administrator /var/www/visioncollegegojra/backend
sudo systemctl restart nim-backend
```

## Nginx

Nginx must serve `/var/www/visioncollegegojra/frontend` and proxy `/api/` to `http://127.0.0.1:5000`.

## Verification

```bash
sudo systemctl status nim-backend --no-pager
sudo systemctl status nginx --no-pager
ss -ltnp | grep 5000
curl -I https://visioncollegegojra.com
curl -I -X POST https://visioncollegegojra.com/api/users/login
```

Expected:

- site returns `200`
- empty login POST returns `415`
- backend is `active (running)`

## CI/CD

Both repos already have GitHub Actions deploy workflows.

Push to `main` and the workflow can deploy automatically if these secrets are set:

- `VPS_HOST`
- `VPS_PORT`
- `VPS_USER`
- `VPS_SSH_PRIVATE_KEY` or `VPS_PASSWORD`
- `VPS_SUDO_PASSWORD` if the SSH user needs a sudo password
- Frontend repo:
  `FRONTEND_APP_PATH=/var/www/apps/nim-vcg-frontend`
  `FRONTEND_WEB_ROOT=/var/www/visioncollegegojra/frontend`
  `DEPLOY_BRANCH=main`
- Backend repo:
  `BACKEND_APP_PATH=/var/www/apps/nim-vcg-backend`
  `BACKEND_PUBLISH_PATH=/var/www/visioncollegegojra/backend`
  `BACKEND_SERVICE_NAME=nim-backend`
  `DEPLOY_BRANCH=main`

## Important

- Do not point nginx back to `SchoolAppClient.NG`
- The old `SchoolAppClient.NG/dist` build was removed on purpose
- `ngx-mask` is pinned to `^19.0.6` so `npm ci` works with Angular 19
- If the browser still shows the old UI, force refresh with `Ctrl+F5`
