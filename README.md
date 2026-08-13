## Gruppera.se

Next.js-app för gruppera.se. Sajten byggs som en **statisk export** (`output: "export"`)
och hostas på Cloudflare Pages, som bygger automatiskt från GitHub. Det finns ingen
server och inga API-routes i produktion.

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

`npm run build` skriver den färdiga sajten till `out/`. Förhandsgranska exporten med
en valfri statisk server, t.ex. `npx serve out`. Observera att `npm start`
(`next start`) **inte** fungerar tillsammans med statisk export.

## Environment Variables

Skapa `.env.local` i projektroten:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
```

Eftersom sajten är helt statisk finns bara build-time-variabler, och de måste vara
`NEXT_PUBLIC_`-prefixade för att bakas in i klientkoden.

| Variabel | Krävs | Beskrivning |
| --- | --- | --- |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Ja | Publik Mapbox-token för kartan på `/hitta-till-oss`. Måste finnas vid `next build`. |
| `NEXT_PUBLIC_BUILD_ID` | Nej | Visas som `Build: <värde>` i footern. Utelämnas den syns ingen build-rad. |

## Static Export

`next.config.ts` sätter `output: "export"`. Det innebär:

- Alla sidor prerenderas vid build till statisk HTML i `out/`.
- Inga route handlers, ingen `cookies()`, inga server-only API:er.
- Ingen filskrivning i runtime — innehåll ändras genom att bygga om.

## Content

`app/mockdata.json` är källan till sanning för konsulterna och `app/blogg/mockdata.json`
för bloggen. Båda läses in vid build. Ändra innehåll genom att redigera JSON-filen,
öppna en PR och merga — Cloudflare bygger om och publicerar automatiskt.

## Production Deploy (Cloudflare Pages)

Cloudflare Pages kopplas mot GitHub-repot och bygger vid varje push till `main`.

Projektinställningar:

| Inställning | Värde |
| --- | --- |
| Framework preset | None (eller Next.js Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `out` |
| Node version | 20 eller senare |

Lägg in `NEXT_PUBLIC_MAPBOX_TOKEN` som environment variable i Pages-projektet, för både
Production och Preview.

För att visa git-shan i footern, sätt build command till:

```bash
NEXT_PUBLIC_BUILD_ID=$CF_PAGES_COMMIT_SHA npm run build
```

Cloudflare hanterar TLS och CDN. Ingen VPS, ingen SSH-nyckel, inget container-registry
och inga deploy-secrets i GitHub behövs.

### Custom domain

Peka `gruppera.se`, `www.gruppera.se` och `new2.gruppera.se` mot Pages-projektet under
**Custom domains**. DNS ligger redan i Cloudflare.

## Legacy Docker deploy

`Dockerfile`, `docker-compose.yaml` och `.github/workflows/deploy-production.yml` hör till
den tidigare VPS-baserade deployen och används inte längre. De är kvar orörda men fungerar
inte mot en statisk export — `next start` startar ingen server när `output: "export"` är satt.
Ta bort dem i en separat PR när Cloudflare-deployen är verifierad.
