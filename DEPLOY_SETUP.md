# Frontend Auto Deploy Setup

This repository now has a GitHub Actions workflow at `.github/workflows/deploy.yml`.

## 1) One-time VPS setup (Ubuntu)

Run on your VPS:

```bash
sudo apt update
sudo apt install -y git rsync nginx curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Clone the repo on VPS (choose your own path):

```bash
mkdir -p /var/www/apps
cd /var/www/apps
git clone https://github.com/noshahi-devs/nim-vcg-frontend.git
```

Web root example:

```bash
sudo mkdir -p /var/www/visioncollegegojra
sudo chown -R $USER:$USER /var/www/visioncollegegojra
```

## 2) GitHub repository secrets (frontend repo)

Go to: `Settings -> Secrets and variables -> Actions -> New repository secret`

Add:

- `VPS_HOST` = VPS IP (example `93.127.141.27`)
- `VPS_PORT` = `22`
- `VPS_USER` = VPS SSH username (recommended: non-root deploy user)
- `VPS_SSH_PRIVATE_KEY` = private key content of deploy user
- `FRONTEND_APP_PATH` = VPS path where this repo is cloned (example `/var/www/apps/nim-vcg-frontend`)
- `FRONTEND_WEB_ROOT` = live web path served by nginx (example `/var/www/visioncollegegojra`)
- `DEPLOY_BRANCH` = `main`

## 3) Nginx should serve the web root

Nginx `root` should point to your `FRONTEND_WEB_ROOT`.

## 4) Deploy flow

You make changes locally -> push via GitHub Desktop -> workflow runs -> VPS pulls latest code -> builds Angular -> syncs to web root -> live site updates.
