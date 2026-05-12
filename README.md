## Gruppera.se

Next.js-app för gruppera.se. Produktion deployas manuellt via GitHub Actions till en VPS med container-images i GHCR.

## Development

Installera beroenden och starta utvecklingsservern:

```bash
npm ci
npm run dev
```

Verifiera ändringar lokalt:

```bash
npm run lint
npm run build
```

## Environment Variables

Skapa `.env.local` i projektroten:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
ALLOWED_EMAIL_DOMAINS=gruppera.se
AUTH_COOKIE_SECRET=your_random_secret
AUTH_SESSION_DAYS=7
SMTP_HOST=smtp-relay.gmail.com
SMTP_NAME=gruppera.se
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@gruppera.se
SMTP_FROM_NAME=Gruppera.se Admin
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
```

### Login/OTP notes

- Inloggning sker via e-post + engångskod på `/login` och sätter en signerad, HTTP-only cookie först efter lyckad verifiering.
- Endast e-postadresser vars domän matchar `ALLOWED_EMAIL_DOMAINS` accepteras (kommaseparerad lista).
- Googles SMTP-relay (`smtp-relay.gmail.com`) stöds utan `SMTP_USER`/`SMTP_PASS` när relayen är konfigurerad för serverns IP/domän. Port 587 använder STARTTLS som standard.
- `SMTP_NAME` används som EHLO-namn mot Google SMTP-relay och bör vara en riktig domän, inte `localhost` eller containerns interna hostname.
- `SMTP_FROM` ska vara ren e-postadress. Använd `SMTP_FROM_NAME` för visningsnamn i stället för formatet `Namn <adress>`.
- OTP-koder lagras i minnet. Vid flera instanser behöver en delad store, till exempel Redis.

## Production Deploy

Deploystrategin är avsiktligt manuell och godkänd:

- GitHub Actions triggas endast via `workflow_dispatch`.
- Produktionscontainern byggs från repoets `Dockerfile` och pushas till `ghcr.io/gruppera/gruppera-online-vibe:<git-sha>`.
- VPS:en kör `docker compose` från `/etc/docker/gruppera.se`.
- `docker-compose.yaml` syncas alltid från repot till servern innan deploy.
- Deploy-jobbet ska köras i GitHub Environment `production` med required reviewers aktiverat.

### Docker Compose

`docker-compose.yaml` använder image-referenser med `${IMAGE_TAG}`:

```yaml
image: ghcr.io/gruppera/gruppera-online-vibe:${IMAGE_TAG}
```

På servern ska en separat `.env` ligga i `/etc/docker/gruppera.se/.env` för runtime-hemligheter. Den filen hanteras inte av GitHub Actions.

Observera att `NEXT_PUBLIC_MAPBOX_TOKEN` inte räcker att sätta i serverns runtime-`.env` när appen byggs som Docker-image i CI. Eftersom tokenen används i klientkod måste den finnas vid `next build`, alltså i GitHub Actions-bygget.

### GitHub Secrets

Workflowen förväntar sig följande repository- eller environment-secrets:

- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `PRODUCTION_SSH_HOST`
- `PRODUCTION_SSH_PORT`
- `PRODUCTION_SSH_USER`
- `PRODUCTION_SSH_PRIVATE_KEY`
- `GHCR_USERNAME`
- `GHCR_TOKEN`

`GHCR_USERNAME` och `GHCR_TOKEN` används på VPS:en för `docker login ghcr.io` innan `docker compose pull`.

### VPS Setup

Servern ska ha en dedikerad deploy-user, exempelvis `gha-deploy`, med:

- SSH-nyckel som matchar `PRODUCTION_SSH_PRIVATE_KEY`
- rätt att skriva i `/etc/docker/gruppera.se`
- rätt att köra Docker och Docker Compose

Minimikrav på servern:

```bash
sudo mkdir -p /etc/docker/gruppera.se
sudo chown -R gha-deploy:gha-deploy /etc/docker/gruppera.se
sudo usermod -aG docker gha-deploy
```

Lägg därefter in produktionsmiljön i `/etc/docker/gruppera.se/.env`.

### Deploy Flow

Deploy-jobbet kör följande på VPS:en:

```bash
docker login ghcr.io
IMAGE_TAG=<sha> docker compose pull
IMAGE_TAG=<sha> docker compose up -d --force-recreate
```

Git push bör ske via SSH mot GitHub för att undvika PAT-problem kopplade till workflow-scope.
