"use strict";

const filoScroll = document.querySelector(".filo-scroll");

if (filoScroll) {
    const intestazione = document.querySelector(".navbar");
    const filoPercorso = filoScroll.querySelector(".filo-percorso");
    const bobinaFilato = filoScroll.querySelector(".bobina-filato");
    let aggiornamentoFiloInAttesa = false;

    const aggiornaPosizioneFilo = () => {
        const altezzaNavbar = intestazione.getBoundingClientRect().height;
        const extraOffset = window.innerWidth > 768 ? 26 : 10;
        filoScroll.style.setProperty(
            "--filo-top",
            `${altezzaNavbar + extraOffset}px`
        );
    };

    const aggiornaFilo = () => {
        const altezzaScorribile =
            document.documentElement.scrollHeight - window.innerHeight;
        const avanzamento = Math.min(
            1,
            Math.max(
                0,
                altezzaScorribile > 0
                    ? window.scrollY / altezzaScorribile
                    : 0
            )
        );
        const trattoRimanente = 1000 * (1 - avanzamento);

        filoScroll.style.setProperty(
            "--filo-avanzamento",
            String(trattoRimanente)
        );
        bobinaFilato.style.transform = `rotate(${window.scrollY * 0.18}deg)`;

        aggiornamentoFiloInAttesa = false;
    };

    const pianificaAggiornamentoFilo = () => {
        if (aggiornamentoFiloInAttesa) return;

        aggiornamentoFiloInAttesa = true;
        window.requestAnimationFrame(aggiornaFilo);
    };

    window.addEventListener("scroll", pianificaAggiornamentoFilo, {
        passive: true,
    });
    window.addEventListener("resize", pianificaAggiornamentoFilo, {
        passive: true,
    });
    const osservatoreIntestazione = new ResizeObserver(aggiornaPosizioneFilo);
    osservatoreIntestazione.observe(intestazione);
    aggiornaPosizioneFilo();
    window.addEventListener("pageshow", pianificaAggiornamentoFilo);
    window.addEventListener("load", pianificaAggiornamentoFilo, { once: true });
    aggiornaFilo();
}

document.querySelectorAll(".navbar").forEach((intestazione) => {
    const pulsanteMenu = intestazione.querySelector(".menu-toggle");
    const navigazione = intestazione.querySelector("nav");

    if (!pulsanteMenu || !navigazione) return;

    const impostaMenuAperto = (aperto) => {
        intestazione.classList.toggle("menu-aperto", aperto);
        pulsanteMenu.setAttribute("aria-expanded", String(aperto));
        pulsanteMenu.setAttribute(
            "aria-label",
            aperto ? "Chiudi il menu" : "Apri il menu"
        );
    };

    pulsanteMenu.addEventListener("click", () => {
        impostaMenuAperto(pulsanteMenu.getAttribute("aria-expanded") !== "true");
    });

    navigazione.addEventListener("click", (evento) => {
        if (evento.target.closest("a")) impostaMenuAperto(false);
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && intestazione.classList.contains("menu-aperto")) {
            impostaMenuAperto(false);
            pulsanteMenu.focus();
        }
    });
});

document.querySelectorAll(".nav-dropdown").forEach((menu) => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        menu.addEventListener("pointerenter", () => {
            menu.open = true;
        });
        menu.addEventListener("pointerleave", () => {
            menu.open = false;
        });
    }

    document.addEventListener("click", (evento) => {
        if (!menu.contains(evento.target)) menu.open = false;
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") menu.open = false;
    });
});

const mostraErroreCatalogo = (destinazioni) => {
    destinazioni.filter(Boolean).forEach((destinazione) => {
        const messaggio = document.createElement("p");
        messaggio.className = "portfolio-intro";
        messaggio.setAttribute("role", "status");
        messaggio.textContent =
            "Il catalogo non è disponibile al momento. Riprova tra poco.";
        destinazione.replaceChildren(messaggio);
    });
};

const verificaCatalogo = (catalogo) => {
    if (!catalogo || !Array.isArray(catalogo.categorie) || !catalogo.categorie.length) {
        throw new Error("Il catalogo deve contenere almeno una categoria.");
    }

    const idCategorie = new Set();
    const idProgetti = new Set();
    const slugValido = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const percorsoImmagineValido = (percorso) =>
        typeof percorso === "string"
        && percorso.startsWith("images/")
        && !percorso.includes("\\")
        && !percorso.split("/").includes("..")
        && /\.(?:avif|gif|jpe?g|png|webp)$/i.test(percorso);
    const tagValidi = (tags) =>
        tags === undefined
        || (
            Array.isArray(tags)
            && tags.every((tag) => typeof tag === "string")
        );

    catalogo.categorie.forEach((categoria) => {
        if (
            !categoria
            || !slugValido.test(categoria.id)
            || idCategorie.has(categoria.id)
            || typeof categoria.nome !== "string"
            || !categoria.nome.trim()
            || !tagValidi(categoria.tag_generali)
            || !Array.isArray(categoria.elementi)
            || !categoria.elementi.length
        ) {
            throw new Error("Una categoria non è valida o ha un identificativo duplicato.");
        }
        idCategorie.add(categoria.id);

        categoria.elementi.forEach((elemento) => {
            if (
                !elemento
                || !slugValido.test(elemento.id)
                || idProgetti.has(elemento.id)
                || typeof elemento.nome !== "string"
                || !elemento.nome.trim()
                || !Array.isArray(elemento.immagini)
                || !elemento.immagini.length
                || !elemento.immagini.every((immagine) =>
                    immagine
                    && percorsoImmagineValido(immagine.percorso)
                    && tagValidi(immagine.tag)
                )
                || (elemento.pagina && elemento.pagina !== "prodotto.html")
            ) {
                throw new Error("Un progetto non è valido o ha un identificativo duplicato.");
            }
            idProgetti.add(elemento.id);
        });
    });

    return catalogo.categorie;
};

const normalizzaTag = (tag) => {
    const valore =
        typeof tag === "string"
            ? tag
            : tag && typeof tag === "object"
                ? tag.parola ?? tag.tag ?? ""
                : "";
    if (typeof valore !== "string") return "";

    const testo = valore.trim().replace(/\s+/g, " ");
    return testo
        ? testo.charAt(0).toLocaleUpperCase("it")
            + testo.slice(1).toLocaleLowerCase("it")
        : "";
};

const chiaveTag = (tag) => normalizzaTag(tag).toLocaleLowerCase("it");
let coloriPerTag = new Map();

const raccogliTagUnici = (tags) => {
    const tagUnici = new Map();

    tags.forEach((tag) => {
        const testo = normalizzaTag(tag);
        if (!testo) return;
        const chiave = chiaveTag(testo);
        if (!tagUnici.has(chiave)) tagUnici.set(chiave, testo);
    });

    return [...tagUnici.values()];
};

const creaEtichettaTag = (testo, pulsante = false) => {
    const etichetta = document.createElement(pulsante ? "button" : "span");
    etichetta.className = "creation-tag";
    etichetta.style.setProperty(
        "--tag-hue",
        String(coloriPerTag.get(chiaveTag(testo)) || 0)
    );
    etichetta.textContent = testo;

    if (pulsante) {
        etichetta.type = "button";
        etichetta.setAttribute("aria-pressed", "false");
        etichetta.classList.add("tag-filter-button");
    }

    return etichetta;
};

const creaElencoTag = (tags) => {
    const elenco = document.createElement("div");
    elenco.className = "creation-tags";
    elenco.setAttribute("role", "list");
    elenco.setAttribute("aria-label", "Parole chiave");
    aggiornaElencoTag(elenco, tags);

    return elenco;
};

const aggiornaElencoTag = (elenco, tags) => {
    const etichette = raccogliTagUnici(tags).map((tag) => {
        const etichetta = creaEtichettaTag(tag);
        etichetta.setAttribute("role", "listitem");
        return etichetta;
    });

    elenco.hidden = etichette.length === 0;
    elenco.replaceChildren(...etichette);
};

const tagDellaFoto = (elemento, immagine) =>
    raccogliTagUnici([
        ...(elemento.categoria?.tag_generali || []),
        ...(immagine.tag || []),
    ]);

const tagDellaCreazione = (elemento) =>
    raccogliTagUnici([
        ...(elemento.categoria?.tag_generali || []),
        ...elemento.immagini.flatMap((immagine) => immagine.tag || []),
    ]);

const inizializzaFiltroTag = (creazioni, griglia) => {
    const barraFiltro = document.querySelector("[data-tag-filter]");
    const opzioniFiltro = document.querySelector("[data-tag-filters]");
    const statoFiltro = document.querySelector("[data-tag-filter-status]");
    const pulsanteAzzera = document.querySelector("[data-clear-tag-filters]");

    if (!barraFiltro || !opzioniFiltro || !statoFiltro || !pulsanteAzzera) return;

    const schede = Array.from(griglia.children);
    const tagPerCreazione = creazioni.map(tagDellaCreazione);
    const tagDisponibili = raccogliTagUnici(tagPerCreazione.flat());
    const filtroHome = griglia.matches("[data-home-project-grid]");
    const carosello = filtroHome
        ? document.querySelector("[data-tag-slider]")
        : null;

    if (!tagDisponibili.length) {
        barraFiltro.hidden = true;
        return;
    }

    barraFiltro.hidden = false;
    const selezionati = new Set();
    const pulsanti = new Map();

    const aggiornaRisultati = () => {
        let visibili = 0;

        schede.forEach((scheda, indice) => {
            const tagCreazione = new Set(
                tagPerCreazione[indice].map(chiaveTag)
            );
            const corrisponde =
                filtroHome
                    ? selezionati.size > 0
                        && [...selezionati].some((tag) => tagCreazione.has(tag))
                    : !selezionati.size
                        || [...selezionati].some((tag) => tagCreazione.has(tag));
            scheda.hidden = !corrisponde;
            if (corrisponde) visibili += 1;
        });

        statoFiltro.textContent = !selezionati.size && filtroHome
            ? "Scegli un'etichetta per vedere le creazioni."
            : visibili === 0
                ? "Nessuna creazione corrisponde ai tag selezionati."
                : `${visibili} ${visibili === 1 ? "creazione" : "creazioni"} trovate.`;
        pulsanteAzzera.hidden = !selezionati.size;

        if (filtroHome) {
            const mostraCarosello = selezionati.size > 0 && visibili > 0;
            griglia.hidden = !mostraCarosello;
            carosello.hidden = !mostraCarosello;
            if (mostraCarosello) {
                griglia.scrollTo({ left: 0, behavior: "auto" });
            }
        }
    };

    tagDisponibili.forEach((tag) => {
        const chiave = chiaveTag(tag);
        const pulsante = creaEtichettaTag(tag, true);

        pulsante.addEventListener("click", () => {
            if (selezionati.has(chiave)) {
                selezionati.delete(chiave);
                pulsante.setAttribute("aria-pressed", "false");
            } else {
                selezionati.add(chiave);
                pulsante.setAttribute("aria-pressed", "true");
            }
            aggiornaRisultati();
        });

        pulsanti.set(chiave, pulsante);
    });

    opzioniFiltro.replaceChildren(...pulsanti.values());
    if (filtroHome) {
        griglia.classList.add("is-tag-slider");
        const scorri = (direzione) =>
            griglia.scrollBy({
                left: direzione * griglia.clientWidth * 0.8,
                behavior: "smooth",
            });
        document
            .querySelector("[data-tag-slider-previous]")
            .addEventListener("click", () => scorri(-1));
        document
            .querySelector("[data-tag-slider-next]")
            .addEventListener("click", () => scorri(1));
    }
    pulsanteAzzera.addEventListener("click", () => {
        selezionati.clear();
        pulsanti.forEach((pulsante) =>
            pulsante.setAttribute("aria-pressed", "false")
        );
        aggiornaRisultati();
    });
    aggiornaRisultati();
};

const creaSchedaCategoria = (categoria) => {
    const collegamento = document.createElement("a");
    collegamento.className = "card catalog-card stitch-border";
    collegamento.href =
        `categoria.html?categoria=${encodeURIComponent(categoria.id)}`;
    collegamento.setAttribute("aria-label", `Esplora ${categoria.nome}`);

    const immagine = document.createElement("img");
    immagine.src = categoria.elementi[0].immagini[0].percorso;
    immagine.alt = (categoria.descrizione || categoria.nome || "").trim();

    const contenuto = document.createElement("div");
    contenuto.className = "card-info";

    const titolo = document.createElement("h3");
    titolo.textContent = categoria.nome;

    const descrizione = document.createElement("p");
    descrizione.textContent = `${categoria.elementi.length} progetti da scoprire`;

    const invito = document.createElement("span");
    invito.className = "card-cta";
    invito.textContent = "Esplora la categoria →";

    contenuto.append(titolo, descrizione, invito);
    collegamento.append(immagine, contenuto);
    return collegamento;
};

const creaSchedaProgetto = (elemento) => {
    const collegamento = document.createElement("a");
    collegamento.className = "card catalog-card stitch-border";
    collegamento.href = elemento.pagina
        || `creazione.html?elemento=${encodeURIComponent(elemento.id)}`;
    collegamento.setAttribute("aria-label", `Scopri ${elemento.nome}`);

    const immagine = document.createElement("img");
    immagine.src = elemento.immagini[0].percorso;
    immagine.alt = (elemento.descrizione || elemento.nome || "").trim();

    const contenuto = document.createElement("div");
    contenuto.className = "card-info";
    const titolo = document.createElement("h2");
    titolo.textContent = elemento.nome;
    const descrizione = document.createElement("p");
    descrizione.textContent = elemento.descrizione;

    const blocchiContenuto = [titolo, descrizione];

    if (elemento.prezzo && elemento.prezzo.toString().trim()) {
        const prezzoEl = document.createElement("span");
        prezzoEl.className = "card-price";
        const valPrezzo = elemento.prezzo.toString().trim();
        prezzoEl.textContent = `Fascia di prezzo: ${valPrezzo.includes("€") ? valPrezzo : valPrezzo + "€"}`;
        blocchiContenuto.push(prezzoEl);
    }

    const invito = document.createElement("span");
    invito.className = "card-cta";
    invito.textContent = elemento.immagini.length > 1
        ? `${elemento.immagini.length} foto · Guarda il progetto →`
        : "Guarda il progetto →";

    blocchiContenuto.push(creaElencoTag(tagDellaCreazione(elemento)), invito);
    contenuto.append(...blocchiContenuto);
    collegamento.append(immagine, contenuto);
    return collegamento;
};

const inizializzaCatalogo = async () => {
    const grigliaHome = document.querySelector("[data-home-categories]");
    const grigliaHomeProgetti = document.querySelector("[data-home-project-grid]");
    const paginaCategoria = document.querySelector("[data-category-grid]");
    const paginaElemento = document.querySelector("[data-item-gallery]");
    const tagPaginaProdotto = document.querySelector("[data-product-tags]");

    if (
        !grigliaHome
        && !grigliaHomeProgetti
        && !paginaCategoria
        && !paginaElemento
        && !tagPaginaProdotto
    ) {
        return;
    }

    try {
        const risposta = await fetch("content/catalogo.json", {
            cache: "no-cache",
        });
        if (!risposta.ok) {
            throw new Error(`Caricamento catalogo non riuscito: ${risposta.status}`);
        }

        const catalogo = await risposta.json();

        if (typeof catalogo?.sfondo_hero === "string" && catalogo.sfondo_hero.trim()) {
            document.documentElement.style.setProperty(
                "--sfondo-hero-immagine",
                `url("${catalogo.sfondo_hero.trim()}")`
            );
        }

        const trasparenza = catalogo?.trasparenza_hero || "media";
        let gradienteHero = "linear-gradient(180deg, rgba(255, 253, 249, 0.76), rgba(250, 246, 240, 0.84))";
        if (trasparenza === "leggera") {
            gradienteHero = "linear-gradient(180deg, rgba(255, 253, 249, 0.42), rgba(250, 246, 240, 0.58))";
        } else if (trasparenza === "forte") {
            gradienteHero = "linear-gradient(180deg, rgba(255, 253, 249, 0.88), rgba(250, 246, 240, 0.94))";
        }
        document.documentElement.style.setProperty("--gradiente-hero", gradienteHero);

        const posizione = catalogo?.posizione_hero || "cover";
        if (posizione === "repeat") {
            document.documentElement.style.setProperty("--dimensione-hero-immagine", "auto");
            document.documentElement.style.setProperty("--ripetizione-hero-immagine", "repeat");
        } else if (posizione === "contain") {
            document.documentElement.style.setProperty("--dimensione-hero-immagine", "contain");
            document.documentElement.style.setProperty("--ripetizione-hero-immagine", "no-repeat");
        } else {
            document.documentElement.style.setProperty("--dimensione-hero-immagine", "cover");
            document.documentElement.style.setProperty("--ripetizione-hero-immagine", "no-repeat");
        }

        if (typeof catalogo?.tema_sfondo === "string" && catalogo.tema_sfondo.trim()) {
            const tema = catalogo.tema_sfondo.trim();
            if (tema !== "sfumatura-crema") {
                document.body.classList.add(`tema-${tema}`);
            }
        }

        if (Array.isArray(catalogo?.categorie)) {
            catalogo.categorie.forEach((categoria) => {
                if (Array.isArray(categoria?.tag_generali)) {
                    categoria.tag_generali =
                        categoria.tag_generali.map(normalizzaTag);
                }
                if (!Array.isArray(categoria?.elementi)) return;
                categoria.elementi.forEach((elemento) => {
                    if (!Array.isArray(elemento?.immagini)) return;
                    elemento.immagini.forEach((immagine) => {
                        if (Array.isArray(immagine?.tag)) {
                            immagine.tag = immagine.tag.map(normalizzaTag);
                        }
                    });
                });
            });
        }
        if (Array.isArray(catalogo?.suggerimenti_tag)) {
            catalogo.suggerimenti_tag =
                catalogo.suggerimenti_tag.map(normalizzaTag);
        }
        const categorieCreazioni = verificaCatalogo(catalogo);
        const elementiCreazioni = categorieCreazioni.flatMap((categoria) =>
            categoria.elementi.map((elemento) => ({ ...elemento, categoria }))
        );
        const tagUnici = raccogliTagUnici(
            elementiCreazioni.flatMap(tagDellaCreazione)
        );
        coloriPerTag = new Map(
            tagUnici.map((tag, indice) => [
                chiaveTag(tag),
                Math.round((indice * 360) / tagUnici.length),
            ])
        );

        if (tagPaginaProdotto) {
            const progettoProdotto = elementiCreazioni.find(
                (progetto) => progetto.id === tagPaginaProdotto.dataset.productTags
            );
            if (!progettoProdotto) {
                throw new Error("Il progetto della pagina prodotto non è presente nel catalogo.");
            }
            aggiornaElencoTag(
                tagPaginaProdotto,
                tagDellaFoto(
                    progettoProdotto,
                    progettoProdotto.immagini[0]
                )
            );
        }

        if (grigliaHome) {
            const categoriePrincipali = categorieCreazioni.slice(0, 6);
            grigliaHome.dataset.categoryCount = categoriePrincipali.length;
            grigliaHome.replaceChildren(
                ...categoriePrincipali.map(creaSchedaCategoria)
            );
        }

        if (grigliaHomeProgetti) {
            grigliaHomeProgetti.replaceChildren(
                ...elementiCreazioni.map(creaSchedaProgetto)
            );
            inizializzaFiltroTag(elementiCreazioni, grigliaHomeProgetti);
        }

        if (paginaCategoria) {
            const idCategoria =
                new URLSearchParams(window.location.search).get("categoria");
            const categoria = categorieCreazioni.find(
                (elemento) => elemento.id === idCategoria
            );

            if (categoria) {
                document.title = `${categoria.nome} | Nonna Emma`;
                document.querySelector("[data-category-eyebrow]").textContent =
                    `${categoria.elementi.length} progetti`;
                document.querySelector("[data-category-title]").textContent =
                    categoria.nome;
                document.querySelector("[data-category-description]").textContent =
                    categoria.descrizione;
                const elementiCategoria = categoria.elementi.map((elemento) => ({
                    ...elemento,
                    categoria,
                }));
                paginaCategoria.replaceChildren(
                    ...elementiCategoria.map(creaSchedaProgetto)
                );
                inizializzaFiltroTag(elementiCategoria, paginaCategoria);
            } else {
                document.querySelector("[data-category-eyebrow]").textContent =
                    "Collezioni Nonna Emma";
                document.querySelector("[data-category-title]").textContent =
                    "Categoria non trovata";
                document.querySelector("[data-category-description]").textContent =
                    "Scegli una categoria per esplorare i progetti.";
                paginaCategoria.replaceChildren(
                    ...categorieCreazioni.map(creaSchedaCategoria)
                );
            }
        }

        if (paginaElemento) {
            const idElemento =
                new URLSearchParams(window.location.search).get("elemento");
            const elemento = elementiCreazioni.find(
                (progetto) => progetto.id === idElemento
            );

            if (elemento) {
                document.title = `${elemento.nome} | Nonna Emma`;
                document.querySelector("[data-item-category]").textContent =
                    elemento.categoria.nome;
                document.querySelector("[data-item-title]").textContent =
                    elemento.nome;
                document.querySelector("[data-item-description]").textContent =
                    elemento.descrizione || "";

                const elementoPrezzo = document.querySelector("[data-item-price]");
                if (elementoPrezzo) {
                    if (elemento.prezzo && elemento.prezzo.toString().trim()) {
                        const valPrezzo = elemento.prezzo.toString().trim();
                        elementoPrezzo.textContent = `Fascia di prezzo: ${valPrezzo.includes("€") ? valPrezzo : valPrezzo + "€"}`;
                        elementoPrezzo.hidden = false;
                    } else {
                        elementoPrezzo.hidden = true;
                    }
                }

                document.querySelector("[data-item-category-link]").href =
                    `categoria.html?categoria=${encodeURIComponent(elemento.categoria.id)}`;

                const immaginePrincipale =
                    document.querySelector("[data-item-image]");
                const anteprimaPrec =
                    document.querySelector("[data-item-prev-preview]");
                const anteprimaSucc =
                    document.querySelector("[data-item-next-preview]");
                const frecciaPrec =
                    paginaElemento.querySelector("[data-item-previous]");
                const frecciaSucc =
                    paginaElemento.querySelector("[data-item-next]");
                const statoGalleria =
                    document.querySelector("[data-item-status]");
                const tagImmagine =
                    document.querySelector("[data-item-tags]");
                const miniature =
                    document.querySelector("[data-item-thumbnails]");
                let immagineAttiva = 0;

                const selezionaImmagine = (indice) => {
                    const totale = elemento.immagini.length;
                    immagineAttiva = (indice + totale) % totale;
                    const foto = elemento.immagini[immagineAttiva];
                    immaginePrincipale.src = foto.percorso;
                    immaginePrincipale.alt = (elemento.descrizione || elemento.nome || "").trim();

                    if (anteprimaPrec && anteprimaSucc) {
                        const slotPrec = paginaElemento.querySelector("[data-item-prev-slot]");
                        const slotSucc = paginaElemento.querySelector("[data-item-next-slot]");
                        if (totale > 1) {
                            const fotoPrec = elemento.immagini[(immagineAttiva - 1 + totale) % totale];
                            const fotoSucc = elemento.immagini[(immagineAttiva + 1) % totale];
                            anteprimaPrec.src = fotoPrec.percorso;
                            anteprimaSucc.src = fotoSucc.percorso;
                            if (slotPrec) slotPrec.hidden = false;
                            if (slotSucc) slotSucc.hidden = false;
                            if (frecciaPrec) frecciaPrec.hidden = false;
                            if (frecciaSucc) frecciaSucc.hidden = false;
                        } else {
                            if (slotPrec) slotPrec.hidden = true;
                            if (slotSucc) slotSucc.hidden = true;
                            if (frecciaPrec) frecciaPrec.hidden = true;
                            if (frecciaSucc) frecciaSucc.hidden = true;
                        }
                    }

                    statoGalleria.textContent =
                        `Foto ${immagineAttiva + 1} di ${totale}`;
                    aggiornaElencoTag(
                        tagImmagine,
                        tagDellaFoto(elemento, foto)
                    );
                    miniature.querySelectorAll("button").forEach(
                        (pulsante, indiceMiniatura) => {
                            pulsante.setAttribute(
                                "aria-pressed",
                                String(indiceMiniatura === immagineAttiva)
                            );
                        }
                    );
                };

                elemento.immagini.forEach((foto, indice) => {
                    const pulsante = document.createElement("button");
                    pulsante.className = "item-thumbnail";
                    pulsante.type = "button";
                    pulsante.setAttribute(
                        "aria-label",
                        `Mostra foto ${indice + 1}`
                    );
                    pulsante.setAttribute(
                        "aria-pressed",
                        String(indice === 0)
                    );
                    const immagine = document.createElement("img");
                    immagine.src = foto.percorso;
                    immagine.alt = "";
                    immagine.setAttribute("aria-hidden", "true");
                    pulsante.append(immagine);
                    pulsante.addEventListener("click", () =>
                        selezionaImmagine(indice)
                    );
                    miniature.append(pulsante);
                });

                paginaElemento
                    .querySelector("[data-item-previous]")
                    .addEventListener("click", () =>
                        selezionaImmagine(immagineAttiva - 1)
                    );
                paginaElemento
                    .querySelector("[data-item-next]")
                    .addEventListener("click", () =>
                        selezionaImmagine(immagineAttiva + 1)
                    );

                const visore = paginaElemento.querySelector("[data-item-viewer]");
                if (visore) {
                    let coordinataInizioX = null;
                    let coordinataInizioY = null;
                    let trascinamentoInCorso = false;

                    visore.addEventListener("pointerdown", (evento) => {
                        coordinataInizioX = evento.clientX;
                        coordinataInizioY = evento.clientY;
                        trascinamentoInCorso = true;
                    });

                    visore.addEventListener("pointerup", (evento) => {
                        if (!trascinamentoInCorso || coordinataInizioX === null) return;
                        const deltaX = evento.clientX - coordinataInizioX;
                        const deltaY = evento.clientY - (coordinataInizioY || 0);
                        trascinamentoInCorso = false;

                        if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY)) {
                            if (deltaX < 0) {
                                selezionaImmagine(immagineAttiva + 1);
                            } else {
                                selezionaImmagine(immagineAttiva - 1);
                            }
                        }
                        coordinataInizioX = null;
                        coordinataInizioY = null;
                    });

                    visore.addEventListener("pointercancel", () => {
                        trascinamentoInCorso = false;
                        coordinataInizioX = null;
                        coordinataInizioY = null;
                    });
                }

                const slotPrec = paginaElemento.querySelector("[data-item-prev-slot]");
                const slotSucc = paginaElemento.querySelector("[data-item-next-slot]");
                if (slotPrec) {
                    slotPrec.addEventListener("click", () => selezionaImmagine(immagineAttiva - 1));
                }
                if (slotSucc) {
                    slotSucc.addEventListener("click", () => selezionaImmagine(immagineAttiva + 1));
                }

                paginaElemento.querySelector("[data-order-link]").href =
                    `ordine.html?prodotto=${encodeURIComponent(elemento.id)}`;
                selezionaImmagine(0);
            } else {
                document.querySelector("[data-item-category]").textContent =
                    "Collezioni Nonna Emma";
                document.querySelector("[data-item-title]").textContent =
                    "Progetto non trovato";
                document.querySelector("[data-item-description]").textContent =
                    "Torna alle categorie per scegliere un progetto.";
                paginaElemento.querySelector("[data-item-content]").hidden = true;
            }
        }

        window.dispatchEvent(new Event("resize"));
    } catch (errore) {
        console.error("Impossibile caricare il catalogo delle creazioni.", errore);
        mostraErroreCatalogo([
            grigliaHome,
            grigliaHomeProgetti,
            paginaCategoria,
            paginaElemento && paginaElemento.querySelector("[data-item-content]"),
            tagPaginaProdotto,
        ]);
    }
};

void inizializzaCatalogo();

document.querySelectorAll("[data-project-card]").forEach((scheda) => {
    const pulsanti = scheda.querySelectorAll(".flip-toggle");

    pulsanti.forEach((pulsante) => {
        pulsante.addEventListener("click", () => {
            const mostraRetro = !scheda.classList.contains("is-flipped");

            scheda.classList.add("has-flip-choice");
            scheda.classList.toggle("is-flipped", mostraRetro);
            scheda
                .querySelector(".project-front")
                .setAttribute("aria-hidden", String(mostraRetro));
            scheda
                .querySelector(".project-back")
                .setAttribute("aria-hidden", String(!mostraRetro));
            pulsanti.forEach((elemento) => {
                elemento.setAttribute("aria-expanded", String(mostraRetro));
            });

            scheda.querySelector(".flip-toggle").focus({ preventScroll: true });
        });
    });

});

document.querySelectorAll("[data-carousel]").forEach((carosello) => {
    const viewport = carosello;
    const presentazione = carosello.querySelector(".carousel-track");
    const progetti = Array.from(presentazione.children);
    const contenitore = carosello.closest(".project-gallery");
    const stato = contenitore.querySelector("[data-carousel-status]");
    const precedente = contenitore.querySelector("[data-carousel-prev]");
    const successivo = contenitore.querySelector("[data-carousel-next]");
    let progettoAttivo = 0;
    let aggiornamentoCaroselloInAttesa = false;

    const aggiornaControlli = () => {
        stato.textContent = `Progetto ${progettoAttivo + 1} di ${progetti.length}`;
        precedente.disabled = progettoAttivo === 0;
        successivo.disabled = progettoAttivo === progetti.length - 1;
    };

    const trovaProgettoVisibile = () => {
        const centroViewport =
            viewport.getBoundingClientRect().left + viewport.clientWidth / 2;

        return progetti.reduce((migliore, progetto, indice) => {
            const rettangolo = progetto.getBoundingClientRect();
            const centroProgetto = rettangolo.left + rettangolo.width / 2;
            const distanza = Math.abs(centroViewport - centroProgetto);
            return distanza < migliore.distanza
                ? { indice, distanza }
                : migliore;
        }, { indice: 0, distanza: Infinity }).indice;
    };

    const aggiornaProgettoVisibile = () => {
        progettoAttivo = trovaProgettoVisibile();
        aggiornaControlli();
        aggiornamentoCaroselloInAttesa = false;
    };

    const pianificaAggiornamentoCarosello = () => {
        if (aggiornamentoCaroselloInAttesa) return;

        aggiornamentoCaroselloInAttesa = true;
        window.requestAnimationFrame(aggiornaProgettoVisibile);
    };

    const vaiAlProgetto = (indice) => {
        const progetto = progetti[indice];
        const riduciMovimento = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
        const posizione =
            viewport.scrollLeft +
            progetto.getBoundingClientRect().left -
            viewport.getBoundingClientRect().left -
            (viewport.clientWidth - progetto.getBoundingClientRect().width) / 2;

        progettoAttivo = indice;
        aggiornaControlli();
        viewport.scrollTo({
            left: posizione,
            behavior: riduciMovimento ? "auto" : "smooth",
        });
    };

    precedente.addEventListener("click", () => {
        if (progettoAttivo > 0) vaiAlProgetto(progettoAttivo - 1);
    });

    successivo.addEventListener("click", () => {
        if (progettoAttivo < progetti.length - 1) vaiAlProgetto(progettoAttivo + 1);
    });

    viewport.addEventListener("scroll", pianificaAggiornamentoCarosello, {
        passive: true,
    });
    window.addEventListener("resize", pianificaAggiornamentoCarosello, {
        passive: true,
    });
    aggiornaControlli();
});

document.querySelectorAll("[data-product-gallery]").forEach((galleria) => {
    const immaginePrincipale = galleria.querySelector("[data-gallery-main]");
    const miniature = galleria.querySelectorAll("[data-gallery-thumb]");

    miniature.forEach((miniatura) => {
        miniatura.addEventListener("click", () => {
            immaginePrincipale.src = miniatura.dataset.src;
            immaginePrincipale.alt = miniatura.dataset.alt;
            miniature.forEach((elemento) => {
                elemento.setAttribute(
                    "aria-pressed",
                    String(elemento === miniatura)
                );
            });
        });
    });
});

document.querySelectorAll("[data-color-picker]").forEach((selettore) => {
    const campioni = selettore.querySelectorAll("[data-color-value]");
    const coloreSelezionato = selettore.querySelector("[data-selected-color]");
    const campoColore = document.querySelector("[data-color-input]");

    campioni.forEach((campione) => {
        campione.addEventListener("click", () => {
            const colore = campione.dataset.colorValue;
            coloreSelezionato.textContent = colore;
            if (campoColore) campoColore.value = colore;

            const collegamentoOrdine = document.querySelector("[data-order-link]");
            if (collegamentoOrdine) {
                const destinazione = new URL(collegamentoOrdine.href);
                destinazione.searchParams.set("colore", colore);
                collegamentoOrdine.href = destinazione.href;
            }

            campioni.forEach((elemento) => {
                elemento.setAttribute(
                    "aria-pressed",
                    String(elemento === campione)
                );
            });
        });
    });
});

const generaIdUnivoco = (prefisso = "NE") => {
    const ora = new Date();
    const dataStr = ora.toISOString().slice(0, 10).replace(/-/g, "");
    const timeSalt = (Date.now() % 1000000).toString(36).toUpperCase();
    const randomSalt = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefisso}-${dataStr}-${timeSalt}${randomSalt}`;
};

const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbwmkMGuEsWHxT_7Dt5j2TqjnMFD2PnczqTtFk-9H3tV9tt19pXJ7MEWkBhECBKCKbho/exec";

const inviaModuloConFeedback = async ({ url, datiJson, elementoFeedback, testoCaricamento, testoSuccesso, resetForm }) => {
    if (elementoFeedback) {
        elementoFeedback.textContent = testoCaricamento;
        elementoFeedback.style.color = "var(--yarn-terracotta)";
    }

    try {
        if (!url || url.includes("PLACEHOLDER")) {
            // Se l'URL non è ancora configurato, usa mailto come fallback di sicurezza
            throw new Error("WEBAPP_URL_NOT_CONFIGURED");
        }

        const risposta = await fetch(url, {
            method: "POST",
            mode: "no-cors", // Per Web App Apps Script senza problemi di CORS
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datiJson)
        });

        if (elementoFeedback) {
            elementoFeedback.textContent = testoSuccesso;
            elementoFeedback.style.color = "#03543F";
        }
        if (typeof resetForm === "function") {
            resetForm();
        }
    } catch (errore) {
        if (errore.message === "WEBAPP_URL_NOT_CONFIGURED") {
            // Fallback trasparente su mailto se non è stato ancora pubblicato l'Apps Script
            console.warn("Apps Script Web App URL non ancora configurato. Utilizzo fallback mailto.");
            const oggetto = encodeURIComponent(`[${datiJson.orderId}] ${datiJson.tipo === "ordine" ? "Richiesta ordine" : "Richiesta info"}: ${datiJson.prodotto || datiJson.progetto} - ${datiJson.nome}`);
            const corpo = encodeURIComponent(datiJson.corpoMail);
            window.location.href = `mailto:nonnaemma.site@gmail.com?subject=${oggetto}&body=${corpo}`;
            if (elementoFeedback) {
                elementoFeedback.textContent = "Apertura client email in corso...";
            }
        } else {
            console.error("Errore invio richiesta:", errore);
            if (elementoFeedback) {
                elementoFeedback.textContent = "Errore durante l'invio. Riprova o scrivici direttamente via email.";
                elementoFeedback.style.color = "#771D1D";
            }
        }
    }
};

const moduloOrdine = document.querySelector("#order-form");

if (moduloOrdine) {
    const prodottoRichiesto = new URLSearchParams(window.location.search).get(
        "prodotto"
    );
    const sceltaProdotto = moduloOrdine.elements.namedItem("prodotto");

    if (sceltaProdotto && prodottoRichiesto) {
        const opzioneValida = Array.from(sceltaProdotto.options).some(
            (opz) => opz.value === prodottoRichiesto
        );
        if (opzioneValida) {
            sceltaProdotto.value = prodottoRichiesto;
        }
    }

    const feedbackEl = document.querySelector("#form-feedback");
    const pulsanteSubmit = moduloOrdine.querySelector("button[type='submit']");

    moduloOrdine.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        if (!moduloOrdine.reportValidity()) return;

        const dati = new FormData(moduloOrdine);
        const orderId = generaIdUnivoco("ORD");
        const nomeCliente = (dati.get("Nome") || "").toString().trim();
        const emailCliente = (dati.get("Email") || "").toString().trim();
        const telefonoCliente = (dati.get("Telefono") || "").toString().trim() || "Non indicato";
        const nomeProdotto = sceltaProdotto && sceltaProdotto.selectedOptions[0]
            ? sceltaProdotto.selectedOptions[0].textContent.trim()
            : (dati.get("prodotto") || "Non specificato");
        const codiceProdotto = dati.get("prodotto") || "";
        const misura = (dati.get("Misura o taglia") || "").toString().trim() || "Standard / Da concordare";
        const dettagli = (dati.get("Dettagli") || "").toString().trim() || "Nessun dettaglio aggiuntivo";
        const timestamp = new Date().toLocaleString("it-IT");

        const corpoMail = [
            "========================================",
            `ORDINE ID: ${orderId}`,
            `DATA: ${timestamp}`,
            "========================================",
            `CLIENTE: ${nomeCliente}`,
            `EMAIL: ${emailCliente}`,
            `TELEFONO: ${telefonoCliente}`,
            `PRODOTTO: ${nomeProdotto}`,
            `CODICE_PRODOTTO: ${codiceProdotto}`,
            `MISURA_TAGLIA: ${misura}`,
            "----------------------------------------",
            "DETTAGLI RICHIESTA:",
            dettagli,
            "========================================"
        ].join("\n");

        if (pulsanteSubmit) pulsanteSubmit.disabled = true;

        await inviaModuloConFeedback({
            url: WEBAPP_URL,
            datiJson: {
                tipo: "ordine",
                orderId,
                timestamp,
                nome: nomeCliente,
                email: emailCliente,
                telefono: telefonoCliente,
                prodotto: nomeProdotto,
                codiceProdotto,
                misura,
                dettagli,
                corpoMail
            },
            elementoFeedback: feedbackEl,
            testoCaricamento: "Invio richiesta in corso... ✨",
            testoSuccesso: `Grazie ${nomeCliente}! La tua richiesta [${orderId}] è stata inviata con successo. Ti ricontatteremo al più presto!`,
            resetForm: () => moduloOrdine.reset()
        });

        if (pulsanteSubmit) pulsanteSubmit.disabled = false;
    });
}

const moduloContattoHome = document.querySelector("#home-contact-form");

if (moduloContattoHome) {
    const feedbackHomeEl = document.querySelector("#home-contact-feedback");
    const pulsanteHomeSubmit = moduloContattoHome.querySelector("button[type='submit']");

    moduloContattoHome.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        if (!moduloContattoHome.reportValidity()) return;

        const dati = new FormData(moduloContattoHome);
        const contactId = generaIdUnivoco("CONT");
        const nomeCliente = (dati.get("Nome") || "").toString().trim();
        const emailCliente = (dati.get("Email") || "").toString().trim();
        const progetto = (dati.get("Progetto") || "").toString().trim() || "Idea libera";
        const dettagli = (dati.get("Dettagli") || "").toString().trim() || "Nessun messaggio";
        const timestamp = new Date().toLocaleString("it-IT");

        const corpoMail = [
            "========================================",
            `RICHIESTA INFO ID: ${contactId}`,
            `DATA: ${timestamp}`,
            "========================================",
            `CLIENTE: ${nomeCliente}`,
            `EMAIL: ${emailCliente}`,
            `AMBITO_PROGETTO: ${progetto}`,
            "----------------------------------------",
            "MESSAGGIO:",
            dettagli,
            "========================================"
        ].join("\n");

        if (pulsanteHomeSubmit) pulsanteHomeSubmit.disabled = true;

        await inviaModuloConFeedback({
            url: WEBAPP_URL,
            datiJson: {
                tipo: "contatto",
                orderId: contactId,
                timestamp,
                nome: nomeCliente,
                email: emailCliente,
                telefono: "Non indicato",
                progetto,
                dettagli,
                corpoMail
            },
            elementoFeedback: feedbackHomeEl,
            testoCaricamento: "Invio in corso... 🧶",
            testoSuccesso: `Grazie ${nomeCliente}! Il tuo messaggio [${contactId}] è stato inviato con successo. Ti risponderemo prestissimo!`,
            resetForm: () => moduloContattoHome.reset()
        });

        if (pulsanteHomeSubmit) pulsanteHomeSubmit.disabled = false;
    });
}
