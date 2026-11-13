"use strict";

const filoScroll = document.querySelector(".filo-scroll");

if (filoScroll) {
    const intestazione = document.querySelector(".navbar");
    const filoPercorso = filoScroll.querySelector(".filo-percorso");
    const bobinaFilato = filoScroll.querySelector(".bobina-filato");
    let aggiornamentoFiloInAttesa = false;

    const aggiornaPosizioneFilo = () => {
        filoScroll.style.setProperty(
            "--filo-top",
            `${intestazione.getBoundingClientRect().height + 1}px`
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
            && tags.every((tag) => typeof tag === "string" && tag.trim())
        );

    catalogo.categorie.forEach((categoria) => {
        if (
            !categoria
            || !slugValido.test(categoria.id)
            || idCategorie.has(categoria.id)
            || typeof categoria.nome !== "string"
            || !categoria.nome.trim()
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
                || typeof elemento.alt !== "string"
                || !elemento.alt.trim()
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

const chiaveTag = (tag) => tag.trim().toLocaleLowerCase("it");
let coloriPerTag = new Map();

const raccogliTagUnici = (tags) => {
    const tagUnici = new Map();

    tags.forEach((tag) => {
        const testo = tag.trim();
        const chiave = chiaveTag(testo);
        if (!tagUnici.has(chiave)) tagUnici.set(chiave, testo);
    });

    return [...tagUnici.values()];
};

const creaEtichettaTag = (testo, pulsante = false) => {
    const etichetta = document.createElement(pulsante ? "button" : "span");
    etichetta.className = "creation-tag";
    etichetta.dataset.tagColor = String(coloriPerTag.get(chiaveTag(testo)) || 0);
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

const tagDellaCreazione = (elemento) =>
    raccogliTagUnici(elemento.immagini.flatMap((immagine) => immagine.tag || []));

const inizializzaFiltroTag = (creazioni, griglia) => {
    const barraFiltro = document.querySelector("[data-tag-filter]");
    const opzioniFiltro = document.querySelector("[data-tag-filters]");
    const statoFiltro = document.querySelector("[data-tag-filter-status]");
    const pulsanteAzzera = document.querySelector("[data-clear-tag-filters]");

    if (!barraFiltro || !opzioniFiltro || !statoFiltro || !pulsanteAzzera) return;

    const schede = Array.from(griglia.children);
    const tagPerCreazione = creazioni.map(tagDellaCreazione);
    const tagDisponibili = raccogliTagUnici(tagPerCreazione.flat());

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
                !selezionati.size
                || [...selezionati].some((tag) => tagCreazione.has(tag));
            scheda.hidden = !corrisponde;
            if (corrisponde) visibili += 1;
        });

        statoFiltro.textContent = visibili === 0
            ? "Nessuna creazione corrisponde ai tag selezionati."
            : `${visibili} ${visibili === 1 ? "creazione" : "creazioni"} trovate.`;
        pulsanteAzzera.hidden = !selezionati.size;
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
    immagine.alt = categoria.elementi[0].alt;

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
    immagine.alt = elemento.alt;

    const contenuto = document.createElement("div");
    contenuto.className = "card-info";
    const titolo = document.createElement("h2");
    titolo.textContent = elemento.nome;
    const descrizione = document.createElement("p");
    descrizione.textContent = elemento.descrizione;
    const invito = document.createElement("span");
    invito.className = "card-cta";
    invito.textContent = elemento.immagini.length > 1
        ? `${elemento.immagini.length} foto · Guarda il progetto →`
        : "Guarda il progetto →";

    contenuto.append(
        titolo,
        descrizione,
        creaElencoTag(tagDellaCreazione(elemento)),
        invito
    );
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

        const categorieCreazioni = verificaCatalogo(await risposta.json());
        const elementiCreazioni = categorieCreazioni.flatMap((categoria) =>
            categoria.elementi.map((elemento) => ({ ...elemento, categoria }))
        );
        coloriPerTag = new Map(
            raccogliTagUnici(
                elementiCreazioni.flatMap(tagDellaCreazione)
            ).map((tag, indice) => [chiaveTag(tag), indice % 6])
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
                progettoProdotto.immagini[0].tag || []
            );
        }

        if (grigliaHome) {
            grigliaHome.dataset.categoryCount = categorieCreazioni.length;
            grigliaHome.replaceChildren(
                ...categorieCreazioni.map(creaSchedaCategoria)
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
                paginaCategoria.replaceChildren(
                    ...categoria.elementi.map(creaSchedaProgetto)
                );
                inizializzaFiltroTag(categoria.elementi, paginaCategoria);
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
                document.querySelector("[data-item-category-link]").href =
                    `categoria.html?categoria=${encodeURIComponent(elemento.categoria.id)}`;

                const immaginePrincipale =
                    document.querySelector("[data-item-image]");
                const statoGalleria =
                    document.querySelector("[data-item-status]");
                const tagImmagine =
                    document.querySelector("[data-item-tags]");
                const miniature =
                    document.querySelector("[data-item-thumbnails]");
                let immagineAttiva = 0;

                const selezionaImmagine = (indice) => {
                    immagineAttiva =
                        (indice + elemento.immagini.length) % elemento.immagini.length;
                    const foto = elemento.immagini[immagineAttiva];
                    immaginePrincipale.src = foto.percorso;
                    immaginePrincipale.alt =
                        `${elemento.alt}, foto ${immagineAttiva + 1}`;
                    statoGalleria.textContent =
                        `Foto ${immagineAttiva + 1} di ${elemento.immagini.length}`;
                    aggiornaElencoTag(tagImmagine, foto.tag || []);
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
                paginaElemento.querySelector("[data-order-link]").href =
                    "ordine.html";
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

const moduloOrdine = document.querySelector("#order-form");

if (moduloOrdine) {
    const prodottoRichiesto = new URLSearchParams(window.location.search).get(
        "prodotto"
    );
    const sceltaProdotto = moduloOrdine.elements.namedItem("prodotto");
    const prodottiDisponibili = Array.from(sceltaProdotto.options).map(
        (opzione) => opzione.value
    );

    if (prodottoRichiesto && prodottiDisponibili.includes(prodottoRichiesto)) {
        sceltaProdotto.value = prodottoRichiesto;
    }

    const coloreRichiesto = new URLSearchParams(window.location.search).get(
        "colore"
    );
    const campoColore = moduloOrdine.querySelector("[data-color-input]");
    const selettoreColore = moduloOrdine.querySelector("[data-color-picker]");
    const opzioneColore = Array.from(
        selettoreColore.querySelectorAll("[data-color-value]")
    ).find((campione) => campione.dataset.colorValue === coloreRichiesto);

    if (opzioneColore) opzioneColore.click();

    if (campoColore && !opzioneColore && coloreRichiesto) {
        campoColore.value = coloreRichiesto;
        selettoreColore.querySelector("[data-selected-color]").textContent =
            coloreRichiesto;
    }

    moduloOrdine.addEventListener("submit", (evento) => {
        evento.preventDefault();
        if (!moduloOrdine.reportValidity()) return;

        const dati = new FormData(moduloOrdine);
        const righe = Array.from(dati.entries()).map(([campo, valore]) => {
            const testo =
                campo === "prodotto"
                    ? sceltaProdotto.selectedOptions[0].textContent
                    : valore;
            return `${campo}: ${testo}`;
        });
        const oggetto = encodeURIComponent("Richiesta personalizzata | Nonna Emma");
        const corpo = encodeURIComponent(righe.join("\n"));

        window.location.href =
            `mailto:nonnaemma.site@gmail.com?subject=${oggetto}&body=${corpo}`;
    });
}

const moduloContattoHome = document.querySelector("#home-contact-form");

if (moduloContattoHome) {
    moduloContattoHome.addEventListener("submit", (evento) => {
        evento.preventDefault();
        if (!moduloContattoHome.reportValidity()) return;

        const righe = Array.from(new FormData(moduloContattoHome).entries()).map(
            ([campo, valore]) => `${campo}: ${valore}`
        );
        const oggetto = encodeURIComponent("Una nuova idea | Nonna Emma");
        const corpo = encodeURIComponent(righe.join("\n"));

        window.location.href =
            `mailto:nonnaemma.site@gmail.com?subject=${oggetto}&body=${corpo}`;
    });
}
