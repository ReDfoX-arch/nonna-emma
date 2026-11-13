import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import worker from "./worker.mjs";

const env = {
    CMS_ORIGIN: "https://redfox-arch.github.io",
    CMS_ADMIN_PATH: "/nonna-emma/admin/",
    GITHUB_REPOSITORY: "ReDfoX-arch/nonna-emma",
    GITHUB_OAUTH_CLIENT_ID: "client-id-di-prova",
    GITHUB_OAUTH_CLIENT_SECRET: "segreto-di-prova",
    CMS_ADMIN_GITHUB_LOGINS: "emmaowner",
};

const fetchOriginale = globalThis.fetch;
afterEach(() => {
    globalThis.fetch = fetchOriginale;
});

const richiesta = (
    percorso,
    referer = "https://redfox-arch.github.io/nonna-emma/admin/"
) =>
    new Request(`https://nonna-emma-auth.example.workers.dev${percorso}`, {
        headers: referer ? { Referer: referer } : {},
    });

const iniziaAccesso = async () => {
    const risposta = await worker.fetch(
        richiesta("/auth?provider=github&site_id=redfox-arch.github.io"),
        env
    );
    const destinazione = new URL(risposta.headers.get("Location"));
    return { risposta, stato: destinazione.searchParams.get("state") };
};

test("rifiuta provider e siti diversi da quelli configurati", async () => {
    const provider = await worker.fetch(
        richiesta("/auth?provider=gitlab&site_id=redfox-arch.github.io"),
        env
    );
    const sito = await worker.fetch(
        richiesta("/auth?provider=github&site_id=altro.example"),
        env
    );

    assert.equal(provider.status, 400);
    assert.equal(sito.status, 403);
});

test("rifiuta l'accesso OAuth da pagine diverse dal pannello", async () => {
    const risposta = await worker.fetch(
        richiesta(
            "/auth?provider=github&site_id=redfox-arch.github.io",
            "https://redfox-arch.github.io/nonna-emma/"
        ),
        env
    );
    const senzaReferer = await worker.fetch(
        richiesta(
            "/auth?provider=github&site_id=redfox-arch.github.io",
            null
        ),
        env
    );

    assert.equal(risposta.status, 403);
    assert.equal(senzaReferer.status, 403);
});

test("avvia OAuth GitHub solo per l'origine configurata", async () => {
    const { risposta } = await iniziaAccesso();
    const autorizzazione = new URL(risposta.headers.get("Location"));

    assert.equal(risposta.status, 302);
    assert.equal(autorizzazione.origin, "https://github.com");
    assert.equal(
        autorizzazione.searchParams.get("scope"),
        "public_repo read:user"
    );
    assert.equal(
        autorizzazione.searchParams.get("redirect_uri"),
        "https://nonna-emma-auth.example.workers.dev/callback"
    );
});

test("consegna il token soltanto all'account autorizzato con accesso in scrittura", async () => {
    globalThis.fetch = async (url) => {
        if (String(url) === "https://github.com/login/oauth/access_token") {
            return Response.json({ access_token: "token-di-prova" });
        }
        if (String(url) === "https://api.github.com/user") {
            return Response.json({ login: "EmmaOwner" });
        }
        if (String(url).endsWith("/repos/ReDfoX-arch/nonna-emma")) {
            return Response.json({ permissions: { push: true } });
        }
        throw new Error(`Richiesta inattesa: ${url}`);
    };

    const { stato } = await iniziaAccesso();
    const risposta = await worker.fetch(
        richiesta(`/callback?code=codice-di-prova&state=${encodeURIComponent(stato)}`),
        env
    );
    const html = await risposta.text();

    assert.equal(risposta.status, 200);
    assert.match(html, /authorization:github:/);
    assert.match(html, /const destinazione = "https:\/\/redfox-arch\.github\.io"/);
    assert.match(html, /"stato":"success"/);
    assert.match(html, /token-di-prova/);
    assert.doesNotMatch(html, /postMessage\([^)]*,\s*["']\*["']\)/);
});

test("non consegna il token a un account non autorizzato", async () => {
    globalThis.fetch = async (url) => {
        if (String(url) === "https://github.com/login/oauth/access_token") {
            return Response.json({ access_token: "token-da-non-consegnare" });
        }
        if (String(url) === "https://api.github.com/user") {
            return Response.json({ login: "visitatore" });
        }
        throw new Error(`Richiesta inattesa: ${url}`);
    };

    const { stato } = await iniziaAccesso();
    const risposta = await worker.fetch(
        richiesta(`/callback?code=codice-di-prova&state=${encodeURIComponent(stato)}`),
        env
    );
    const html = await risposta.text();

    assert.equal(risposta.status, 200);
    assert.match(html, /"stato":"error"/);
    assert.match(html, /non è autorizzato/);
    assert.doesNotMatch(html, /token-da-non-consegnare/);
});

test("rifiuta un account autorizzato senza permesso di scrittura", async () => {
    globalThis.fetch = async (url) => {
        if (String(url) === "https://github.com/login/oauth/access_token") {
            return Response.json({ access_token: "token-senza-scrittura" });
        }
        if (String(url) === "https://api.github.com/user") {
            return Response.json({ login: "EmmaOwner" });
        }
        if (String(url).endsWith("/repos/ReDfoX-arch/nonna-emma")) {
            return Response.json({ permissions: { push: false } });
        }
        throw new Error(`Richiesta inattesa: ${url}`);
    };

    const { stato } = await iniziaAccesso();
    const risposta = await worker.fetch(
        richiesta(`/callback?code=codice-di-prova&state=${encodeURIComponent(stato)}`),
        env
    );
    const html = await risposta.text();

    assert.equal(risposta.status, 200);
    assert.match(html, /"stato":"error"/);
    assert.match(html, /permesso di scrittura/);
    assert.doesNotMatch(html, /token-senza-scrittura/);
});

test("rifiuta callback con stato mancante, manomesso o scaduto", async () => {
    const risposta = await worker.fetch(
        richiesta("/callback?code=codice-di-prova&state=manomesso"),
        env
    );

    assert.equal(risposta.status, 400);
});
