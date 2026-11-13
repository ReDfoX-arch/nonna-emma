const encoder = new TextEncoder();
const decoder = new TextDecoder();
const massimoEtaStatoMs = 10 * 60 * 1000;

const intestazioniSicure = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
};

const rispostaTesto = (testo, stato = 200) =>
    new Response(testo, {
        status: stato,
        headers: {
            ...intestazioniSicure,
            "Content-Type": "text/plain; charset=utf-8",
        },
    });

const codificaBase64Url = (bytes) =>
    btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");

const decodificaBase64Url = (valore) => {
    const base64 = valore.replace(/-/g, "+").replace(/_/g, "/");
    const riempimento = "=".repeat((4 - base64.length % 4) % 4);
    return Uint8Array.from(
        atob(base64 + riempimento),
        (carattere) => carattere.charCodeAt(0)
    );
};

const codificaJsonPerScript = (valore) =>
    JSON.stringify(valore)
        .replace(/</g, "\\u003c")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");

const leggiConfigurazione = (env) => {
    const origineSito = env.CMS_ORIGIN;
    const percorsoPannello = env.CMS_ADMIN_PATH;
    const repository = env.GITHUB_REPOSITORY;
    const accessiConsentiti = (env.CMS_ADMIN_GITHUB_LOGINS || "")
        .split(",")
        .map((login) => login.trim().toLowerCase())
        .filter(Boolean);

    if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) {
        throw new Error("Configurazione OAuth incompleta.");
    }

    if (
        !origineSito
        || !percorsoPannello
        || !repository
        || accessiConsentiti.length === 0
    ) {
        throw new Error("Configurazione del sito incompleta.");
    }

    let urlSito;
    try {
        urlSito = new URL(origineSito);
    } catch {
        throw new Error("L'origine CMS non è valida.");
    }

    if (urlSito.protocol !== "https:" || urlSito.origin !== origineSito) {
        throw new Error("L'origine CMS deve essere un URL HTTPS senza percorso.");
    }

    if (
        !percorsoPannello.startsWith("/")
        || percorsoPannello.includes("?")
        || percorsoPannello.includes("#")
        || new URL(percorsoPannello, origineSito).pathname !== percorsoPannello
    ) {
        throw new Error("Il percorso del pannello CMS non è valido.");
    }

    const partiRepository = repository.split("/");
    if (
        partiRepository.length !== 2
        || partiRepository.some((parte) => !/^[A-Za-z0-9_.-]+$/.test(parte))
    ) {
        throw new Error("Il repository GitHub non è valido.");
    }

    return {
        origineSito,
        hostSito: urlSito.host,
        percorsoPannello,
        repository,
        proprietarioRepository: partiRepository[0],
        nomeRepository: partiRepository[1],
        accessiConsentiti,
    };
};

const creaStatoFirmato = async (env, origineSito) => {
    const chiave = await crypto.subtle.importKey(
        "raw",
        encoder.encode(env.GITHUB_OAUTH_CLIENT_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const nonce = codificaBase64Url(crypto.getRandomValues(new Uint8Array(24)));
    const payload = codificaBase64Url(
        encoder.encode(JSON.stringify({
            origineSito,
            creato: Date.now(),
            nonce,
        }))
    );
    const firma = await crypto.subtle.sign(
        "HMAC",
        chiave,
        encoder.encode(payload)
    );

    return `${payload}.${codificaBase64Url(new Uint8Array(firma))}`;
};

const verificaStato = async (stato, env, origineSitoAttesa) => {
    if (typeof stato !== "string" || stato.length > 2048) return null;

    const parti = stato.split(".");
    if (parti.length !== 2) return null;

    try {
        const chiave = await crypto.subtle.importKey(
            "raw",
            encoder.encode(env.GITHUB_OAUTH_CLIENT_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );
        const firmaValida = await crypto.subtle.verify(
            "HMAC",
            chiave,
            decodificaBase64Url(parti[1]),
            encoder.encode(parti[0])
        );
        if (!firmaValida) return null;

        const payload = JSON.parse(decoder.decode(decodificaBase64Url(parti[0])));
        const eta = Date.now() - payload.creato;
        if (
            payload.origineSito !== origineSitoAttesa
            || typeof payload.nonce !== "string"
            || eta < 0
            || eta > massimoEtaStatoMs
        ) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
};

const paginaRisultatoOAuth = (stato, dati, origineSito) => {
    const nonceScript = codificaBase64Url(
        crypto.getRandomValues(new Uint8Array(18))
    );
    const contenuto = codificaJsonPerScript({ stato, dati });
    const destinazione = codificaJsonPerScript(origineSito);
    const html = `<!doctype html>
<html lang="it">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accesso al catalogo</title>
<p id="stato-accesso">Verifica dell'account GitHub in corso.</p>
<script nonce="${nonceScript}">
(() => {
    const destinazione = ${destinazione};
    const risultato = ${contenuto};
    document.getElementById("stato-accesso").textContent =
        risultato.stato === "success"
            ? "Accesso completato. Questa finestra si chiuderà tra poco."
            : risultato.dati.message;
    const finestraPrincipale = window.opener;
    if (!finestraPrincipale) return;
    finestraPrincipale.postMessage("authorizing:github", destinazione);
    window.addEventListener("message", (evento) => {
        if (
            evento.source !== finestraPrincipale
            || evento.origin !== destinazione
            || evento.data !== "authorizing:github"
        ) return;
        finestraPrincipale.postMessage(
            "authorization:github:" + risultato.stato + ":" + JSON.stringify(risultato.dati),
            destinazione
        );
        window.close();
    }, { once: true });
})();
</script>
</html>`;

    return new Response(html, {
        headers: {
            ...intestazioniSicure,
            "Content-Type": "text/html; charset=utf-8",
            "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonceScript}'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
        },
    });
};

const erroreOAuth = (messaggio, origineSito) =>
    paginaRisultatoOAuth("error", { message: messaggio }, origineSito);

const avviaAutorizzazione = async (richiesta, env, configurazione) => {
    const url = new URL(richiesta.url);
    if (url.searchParams.get("provider") !== "github") {
        return rispostaTesto("Provider non supportato.", 400);
    }

    if (url.searchParams.get("site_id") !== configurazione.hostSito) {
        return rispostaTesto("Sito non autorizzato.", 403);
    }

    const referer = richiesta.headers.get("Referer");
    let paginaChiamante;
    try {
        paginaChiamante = new URL(referer);
    } catch {
        return rispostaTesto("Pagina di accesso non autorizzata.", 403);
    }

    if (
        paginaChiamante.origin !== configurazione.origineSito
        || (
            paginaChiamante.pathname !== configurazione.percorsoPannello
            && paginaChiamante.pathname !== `${configurazione.percorsoPannello}index.html`
        )
    ) {
        return rispostaTesto("Pagina di accesso non autorizzata.", 403);
    }

    const stato = await creaStatoFirmato(env, configurazione.origineSito);
    const ritorno = new URL("/callback", url.origin).href;
    const autorizzazione = new URL("https://github.com/login/oauth/authorize");
    autorizzazione.searchParams.set("client_id", env.GITHUB_OAUTH_CLIENT_ID);
    autorizzazione.searchParams.set("redirect_uri", ritorno);
    autorizzazione.searchParams.set("scope", "public_repo read:user");
    autorizzazione.searchParams.set("state", stato);

    return new Response(null, {
        status: 302,
        headers: {
            ...intestazioniSicure,
            Location: autorizzazione.href,
        },
    });
};

const completaAutorizzazione = async (richiesta, env, configurazione) => {
    const url = new URL(richiesta.url);
    const stato = await verificaStato(
        url.searchParams.get("state"),
        env,
        configurazione.origineSito
    );
    if (!stato) {
        return rispostaTesto("Richiesta di accesso non valida o scaduta.", 400);
    }

    if (url.searchParams.has("error")) {
        return erroreOAuth(
            "Accesso a GitHub annullato.",
            configurazione.origineSito
        );
    }

    const codice = url.searchParams.get("code");
    if (!codice || codice.length > 2048) {
        return erroreOAuth(
            "GitHub non ha restituito un codice valido.",
            configurazione.origineSito
        );
    }

    const origineWorker = url.origin;
    const rispostaToken = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            client_id: env.GITHUB_OAUTH_CLIENT_ID,
            client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
            code: codice,
            redirect_uri: new URL("/callback", origineWorker).href,
        }),
    });
    const risultatoToken = await rispostaToken.json();
    const token = risultatoToken.access_token;
    if (!rispostaToken.ok || typeof token !== "string" || !token) {
        return erroreOAuth(
            "GitHub non ha autorizzato l'accesso. Riprova.",
            configurazione.origineSito
        );
    }

    const intestazioniGitHub = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Nonna-Emma-CMS-OAuth",
    };
    const rispostaUtente = await fetch("https://api.github.com/user", {
        headers: intestazioniGitHub,
    });
    if (!rispostaUtente.ok) {
        return erroreOAuth(
            "Non è stato possibile verificare l'account GitHub.",
            configurazione.origineSito
        );
    }

    const utente = await rispostaUtente.json();
    if (
        typeof utente.login !== "string"
        || !configurazione.accessiConsentiti.includes(utente.login.toLowerCase())
    ) {
        return erroreOAuth(
            "Questo account GitHub non è autorizzato a gestire il sito.",
            configurazione.origineSito
        );
    }

    const rispostaRepository = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(configurazione.proprietarioRepository)}/${encodeURIComponent(configurazione.nomeRepository)}`,
        { headers: intestazioniGitHub }
    );
    if (!rispostaRepository.ok) {
        return erroreOAuth(
            "L'account non può accedere al repository del sito.",
            configurazione.origineSito
        );
    }

    const repository = await rispostaRepository.json();
    if (repository.permissions?.push !== true) {
        return erroreOAuth(
            "L'account GitHub deve avere il permesso di scrittura sul repository.",
            configurazione.origineSito
        );
    }

    return paginaRisultatoOAuth(
        "success",
        { token },
        configurazione.origineSito
    );
};

export default {
    async fetch(richiesta, env) {
        const url = new URL(richiesta.url);
        if (richiesta.method !== "GET") {
            return rispostaTesto("Metodo non consentito.", 405);
        }

        if (url.pathname === "/") {
            return rispostaTesto("Servizio di autenticazione Nonna Emma attivo.");
        }

        if (url.pathname !== "/auth" && url.pathname !== "/callback") {
            return rispostaTesto("Percorso non trovato.", 404);
        }

        let configurazione;
        try {
            configurazione = leggiConfigurazione(env);
        } catch (errore) {
            return rispostaTesto(errore.message, 503);
        }

        try {
            if (url.pathname === "/auth") {
                return await avviaAutorizzazione(
                    richiesta,
                    env,
                    configurazione
                );
            }
            return await completaAutorizzazione(
                richiesta,
                env,
                configurazione
            );
        } catch {
            return rispostaTesto("Errore temporaneo durante l'accesso.", 502);
        }
    },
};
