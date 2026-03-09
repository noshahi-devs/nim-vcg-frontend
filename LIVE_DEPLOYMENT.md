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

## Important

- Do not point nginx back to `SchoolAppClient.NG`
- The old `SchoolAppClient.NG/dist` build was removed on purpose
- `ngx-mask` is pinned to `^19.0.6` so `npm ci` works with Angular 19
- If the browser still shows the old UI, force refresh with `Ctrl+F5`
