# Configurazione dell'area di gestione

Il pannello usa Decap CMS per modificare i file del repository GitHub. GitHub Pages continua a pubblicare il sito; un Cloudflare Worker gratuito gestisce soltanto l'accesso OAuth. Il segreto OAuth rimane nelle impostazioni del Worker e non viene inserito nei file del sito.

## 1. Preparare l'account che gestirà il sito

1. Usa un account GitHub personale dedicato alla gestione del sito, se possibile.
2. Dagli il permesso **Write** sul repository `ReDfoX-arch/nonna-emma`.
3. Attiva l'autenticazione a due fattori su GitHub.
4. Annota il nome utente GitHub esatto: verrà inserito nella lista degli account autorizzati del Worker.

L'OAuth di GitHub per repository pubblici usa l'ambito `public_repo`: il token può scrivere nei repository pubblici a cui quell'account ha accesso, non soltanto in questo sito. Un account dedicato con accesso solo a questo repository riduce il rischio.

## 2. Pubblicare il Worker OAuth gratuito

Serve un account Cloudflare con il piano Workers Free. Non occorre comprare un dominio: il Worker usa l'indirizzo gratuito `workers.dev`.

1. Installa Node.js LTS, se non è già presente.
2. Apri il terminale di VS Code nella cartella `cloudflare/decap-oauth`.
3. Esegui `npx wrangler login` e autorizza Wrangler dal browser.
4. Esegui `npx wrangler deploy`.
5. Copia l'indirizzo `https://...workers.dev` mostrato da Wrangler; è l'indirizzo del Worker.

Prima di configurare i segreti, l'indirizzo del Worker può rispondere con un errore di configurazione: è normale.

## 3. Creare l'app OAuth gratuita su GitHub

1. Accedi con l'account GitHub che possiede il repository e apri **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Imposta **Application name** su `Nonna Emma CMS`.
3. In **Homepage URL** inserisci l'indirizzo `https://...workers.dev` del Worker.
4. In **Authorization callback URL** inserisci lo stesso indirizzo seguito da `/callback`, per esempio `https://nome.account.workers.dev/callback`.
5. Salva l'app e annota il **Client ID**.
6. Seleziona **Generate a new client secret** e conservalo temporaneamente: non inserirlo nei file del sito, in chat o in un commit.

## 4. Salvare i segreti nel Worker

Dal terminale di VS Code, sempre nella cartella `cloudflare/decap-oauth`, esegui questi comandi uno alla volta:

```powershell
npx wrangler secret put GITHUB_OAUTH_CLIENT_ID
npx wrangler secret put GITHUB_OAUTH_CLIENT_SECRET
npx wrangler secret put CMS_ADMIN_GITHUB_LOGINS
```

Quando Wrangler chiede un valore:

- `GITHUB_OAUTH_CLIENT_ID`: incolla il Client ID dell'app.
- `GITHUB_OAUTH_CLIENT_SECRET`: incolla il Client Secret; non verrà mostrato mentre lo digiti.
- `CMS_ADMIN_GITHUB_LOGINS`: inserisci solo il nome utente GitHub autorizzato. Per più utenti, separali con una virgola.

Il nome utente autorizzato deve anche avere il permesso **Write** sul repository. Il Worker verifica entrambi i requisiti prima di consegnare il token a Decap CMS.

## 5. Collegare il pannello al Worker

1. Apri `admin/config.yml`.
2. Sostituisci `https://SOSTITUISCI-CON-URL-DEL-WORKER.workers.dev` con l'indirizzo esatto del Worker, senza aggiungere `/auth`.
3. Il sito è configurato per l'indirizzo GitHub Pages standard `https://redfox-arch.github.io/nonna-emma/`. Se GitHub Pages usa un dominio personalizzato, aggiorna `site_url` e `display_url` in questo file, `CMS_ORIGIN` in `cloudflare/decap-oauth/wrangler.toml` con la sola origine del dominio e `CMS_ADMIN_PATH` con il percorso completo del pannello (per esempio `/admin/`); poi ridistribuisci il Worker con `npx wrangler deploy`.
4. Verifica che il repository pubblichi il ramo `main` dalla cartella principale. Se GitHub Pages usa un altro ramo o una cartella di pubblicazione, aggiorna `branch` in `admin/config.yml`.

## 6. Pubblicare e provare

1. Nel repository GitHub apri **Settings → Pages** e verifica che la pubblicazione usi il ramo `main` e la cartella principale (`/`). Se Pages non è ancora attivo, seleziona questa origine e salva.
2. Salva e pubblica le modifiche sul ramo `main`; ogni salvataggio del CMS creerà un commit e GitHub Pages pubblicherà automaticamente la nuova versione.
3. Attendi il completamento della pubblicazione del sito.
4. Apri `https://redfox-arch.github.io/nonna-emma/admin/` (oppure il corrispondente indirizzo del dominio personalizzato).
5. Scegli **Accedi con GitHub** e accedi con l'account autorizzato.
6. Prova a caricare una foto e a modificare un testo; verifica poi il progetto nel sito pubblico.

Il pannello è una pagina statica: GitHub Pages non può nascondere la risposta HTML di `/admin/`. Chiunque può raggiungere la schermata di accesso, ma il Worker accetta l'OAuth solo se avviato dal percorso esatto del pannello e consegna il token esclusivamente agli account autorizzati con permesso di scrittura; gli altri non possono aprire la dashboard né salvare. I contenuti del catalogo sono pubblici, come il resto del sito.

## Aggiungere e modificare progetti

- Apri **Catalogo del sito → Categorie e progetti**.
- Per un nuovo progetto usa **Aggiungi progetto**, inserisci un identificativo nuovo in minuscolo e senza spazi, poi nome, descrizione, testo alternativo e almeno una foto.
- Aggiungi le foto una per volta nel campo **Foto del progetto**. L'ordine nell'elenco è l'ordine della galleria.
- Per una categoria nuova usa **Aggiungi categoria** e poi aggiungi i progetti al suo interno.
- Non cambiare gli identificativi dopo la pubblicazione: sono usati negli indirizzi delle pagine.
- Lascia vuoto **Pagina speciale**, tranne per le calzine che usano `prodotto.html`.

## Costi e limiti

GitHub Pages e il repository pubblico restano sul piano gratuito GitHub. La documentazione GitHub indica un limite di 1 GB per il sito pubblicato e limiti morbidi di 100 GB al mese di banda e 10 build all'ora. Il Worker usa il piano gratuito Cloudflare, che al momento include 100.000 richieste al giorno e fino a 10 ms di CPU per richiesta; il pannello non usa un database o servizi a pagamento. I limiti e i piani dei fornitori possono cambiare nel tempo: nessun fornitore può garantire per contratto che un piano gratuito resti gratuito per sempre.

GitHub Pages non è pensato per ospitare un negozio online o un sito principalmente diretto a facilitare transazioni commerciali. Il sito deve restare un portfolio/vetrina con richieste via email, senza checkout o pagamenti; se diventa principalmente un'attività commerciale, va scelta una piattaforma conforme alle condizioni di hosting, anche se non fosse gratuita. Comprimi le foto e tieni repository e sito entro i limiti pubblicati da GitHub.
