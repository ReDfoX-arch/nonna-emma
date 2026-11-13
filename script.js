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

const categorieCreazioni = [
    {
        id: "maglia",
        nome: "Lavori a Maglia",
        descrizione: "Capi e accessori morbidi realizzati a mano con filati scelti.",
        elementi: [
            {
                id: "cappellino-baby",
                nome: "Cappellino Baby",
                descrizione: "Un cappellino morbido e caldo, lavorato a mano.",
                immagini: ["images/maglia/babyhat.jpeg"],
                alt: "Cappellino baby lavorato a maglia",
            },
            {
                id: "calzine-lana",
                nome: "Calzine di Lana",
                descrizione: "Calzine fatte a mano, disponibili in diversi colori.",
                immagini: ["images/maglia/calzine.jpeg"],
                alt: "Calzine di lana fatte a mano",
                pagina: "prodotto.html",
            },
            {
                id: "papera",
                nome: "Papera",
                descrizione: "Una piccola creazione lavorata a maglia.",
                immagini: ["images/maglia/papera.jpeg"],
                alt: "Creazione a maglia a forma di papera",
            },
            {
                id: "pecora",
                nome: "Pecora",
                descrizione: "Una piccola creazione lavorata a maglia.",
                immagini: ["images/maglia/pecora.jpeg"],
                alt: "Creazione a maglia a forma di pecora",
            },
        ],
    },
    {
        id: "ricamo",
        nome: "Ricami Decorativi",
        descrizione: "Ricami e decorazioni realizzati punto dopo punto.",
        elementi: [
            {
                id: "astuccio",
                nome: "Astuccio Ricamato",
                descrizione: "Un astuccio decorato con ricami fatti a mano.",
                immagini: ["images/ricamo/astuccio.jpeg"],
                alt: "Astuccio ricamato",
            },
            {
                id: "caminante",
                nome: "Il Caminante",
                descrizione: "Un ricamo decorativo realizzato a mano.",
                immagini: ["images/ricamo/caminante.jpeg"],
                alt: "Ricamo decorativo Il Caminante",
            },
            {
                id: "frutta",
                nome: "Frutta Ricamata",
                descrizione: "Una serie di fotografie dello stesso progetto ricamato.",
                immagini: Array.from({ length: 6 }, (_, indice) =>
                    `images/ricamo/frutto${indice}.jpeg`
                ),
                alt: "Ricamo a tema frutta",
            },
            {
                id: "mandala",
                nome: "Mandala",
                descrizione: "Un ricamo decorativo a mandala.",
                immagini: ["images/ricamo/mandala.jpeg"],
                alt: "Ricamo mandala",
            },
            {
                id: "pesci",
                nome: "Pesci",
                descrizione: "Un ricamo decorativo a tema marino.",
                immagini: ["images/ricamo/pesci.jpeg"],
                alt: "Ricamo decorativo con pesci",
            },
            {
                id: "piccolo-principe",
                nome: "Piccolo Principe",
                descrizione: "Un ricamo ispirato al Piccolo Principe.",
                immagini: ["images/ricamo/piccoloprincipe.jpeg"],
                alt: "Ricamo del Piccolo Principe",
            },
            {
                id: "rana",
                nome: "Rana",
                descrizione: "Un ricamo decorativo a forma di rana.",
                immagini: ["images/ricamo/rana_sing.jpeg"],
                alt: "Ricamo con una rana",
            },
            {
                id: "rane",
                nome: "Rane",
                descrizione: "Un ricamo decorativo con rane.",
                immagini: ["images/ricamo/rane.jpeg"],
                alt: "Ricamo con rane",
            },
            {
                id: "uccello-foglie",
                nome: "Uccello tra le Foglie",
                descrizione: "Un ricamo decorativo con uccello e foglie.",
                immagini: ["images/ricamo/uccfoglie.jpeg"],
                alt: "Ricamo con uccello tra le foglie",
            },
        ],
    },
    {
        id: "cucito",
        nome: "Cucito e Sartoria",
        descrizione: "Accessori e progetti realizzati con ago, filo e tessuti.",
        elementi: [
            {
                id: "luna",
                nome: "Fiocco Luna",
                descrizione: "Un accessorio in stoffa realizzato a mano.",
                immagini: ["images/cucito/luna.jpeg"],
                alt: "Fiocco per neonato in tessuto",
            },
            {
                id: "scap-obj",
                nome: "Progetto di Cucito",
                descrizione: "Un progetto sartoriale realizzato a mano.",
                immagini: ["images/cucito/scap_obj.jpeg"],
                alt: "Progetto di cucito fatto a mano",
            },
        ],
    },
    {
        id: "punto",
        nome: "Punto Croce",
        descrizione: "Piccole decorazioni e accessori ricamati a punto croce.",
        elementi: [
            {
                id: "fiore",
                nome: "Fiore Ricamato",
                descrizione: "Quattro fotografie dello stesso progetto floreale.",
                immagini: Array.from({ length: 4 }, (_, indice) =>
                    `images/punto/fiore${indice}.jpeg`
                ),
                alt: "Ricamo floreale a punto croce",
            },
            {
                id: "segnalibro",
                nome: "Segnalibro",
                descrizione: "Un segnalibro ricamato, mostrato in tre fotografie.",
                immagini: Array.from({ length: 3 }, (_, indice) =>
                    `images/punto/segnalibro${indice}.jpeg`
                ),
                alt: "Segnalibro ricamato a punto croce",
            },
        ],
    },
    {
        id: "feltro",
        nome: "Creazioni in Feltro",
        descrizione: "Decorazioni e piccoli oggetti realizzati in feltro.",
        elementi: [
            {
                id: "carota",
                nome: "Carota in Feltro",
                descrizione: "Una decorazione a forma di carota in feltro.",
                immagini: ["images/Feltro/carota.jpeg"],
                alt: "Carota realizzata in feltro",
            },
            {
                id: "ghiande",
                nome: "Ghiande in Feltro",
                descrizione: "Piccole ghiande decorative in feltro.",
                immagini: ["images/Feltro/ghiande.jpeg"],
                alt: "Ghiande decorative in feltro",
            },
        ],
    },
    {
        id: "gioielli",
        nome: "Gioielli",
        descrizione: "Gioielli artigianali e accessori decorativi.",
        elementi: [
            {
                id: "gioielli-foglia",
                nome: "Gioiello Foglia",
                descrizione: "Un gioiello artigianale con motivo a foglia.",
                immagini: ["images/Gioielli/gioielli_leaf.jpeg"],
                alt: "Gioiello artigianale a forma di foglia",
            },
            {
                id: "gioielli-collezione",
                nome: "Collezione di Gioielli",
                descrizione: "Una selezione di gioielli realizzati a mano.",
                immagini: ["images/Gioielli/gioielli_tot.jpeg"],
                alt: "Collezione di gioielli artigianali",
            },
        ],
    },
];

const elementiCreazioni = categorieCreazioni.flatMap((categoria) =>
    categoria.elementi.map((elemento) => ({ ...elemento, categoria }))
);

const creaSchedaCategoria = (categoria) => {
    const collegamento = document.createElement("a");
    collegamento.className = "card catalog-card stitch-border";
    collegamento.href = `categoria.html?categoria=${encodeURIComponent(categoria.id)}`;
    collegamento.setAttribute("aria-label", `Esplora ${categoria.nome}`);

    const immagine = document.createElement("img");
    immagine.src = categoria.elementi[0].immagini[0];
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

const grigliaCategorieHome = document.querySelector("[data-home-categories]");

if (grigliaCategorieHome) {
    categorieCreazioni.forEach((categoria) =>
        grigliaCategorieHome.append(creaSchedaCategoria(categoria))
    );
}

const paginaCategoria = document.querySelector("[data-category-grid]");

if (paginaCategoria) {
    const idCategoria = new URLSearchParams(window.location.search).get("categoria");
    const categoria = categorieCreazioni.find((elemento) => elemento.id === idCategoria);

    if (categoria) {
        document.title = `${categoria.nome} | Nonna Emma`;
        document.querySelector("[data-category-eyebrow]").textContent =
            `${categoria.elementi.length} progetti`;
        document.querySelector("[data-category-title]").textContent = categoria.nome;
        document.querySelector("[data-category-description]").textContent =
            categoria.descrizione;

        categoria.elementi.forEach((elemento) => {
            const collegamento = document.createElement("a");
            collegamento.className = "card catalog-card stitch-border";
            collegamento.href = elemento.pagina
                || `creazione.html?elemento=${encodeURIComponent(elemento.id)}`;
            collegamento.setAttribute("aria-label", `Scopri ${elemento.nome}`);

            const immagine = document.createElement("img");
            immagine.src = elemento.immagini[0];
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

            contenuto.append(titolo, descrizione, invito);
            collegamento.append(immagine, contenuto);
            paginaCategoria.append(collegamento);
        });
    } else {
        document.querySelector("[data-category-eyebrow]").textContent =
            "Collezioni Nonna Emma";
        document.querySelector("[data-category-title]").textContent =
            "Categoria non trovata";
        document.querySelector("[data-category-description]").textContent =
            "Scegli una categoria per esplorare i progetti.";
        categorieCreazioni.forEach((elemento) =>
            paginaCategoria.append(creaSchedaCategoria(elemento))
        );
    }
}

const paginaElemento = document.querySelector("[data-item-gallery]");

if (paginaElemento) {
    const idElemento = new URLSearchParams(window.location.search).get("elemento");
    const elemento = elementiCreazioni.find((progetto) => progetto.id === idElemento);

    if (elemento) {
        document.title = `${elemento.nome} | Nonna Emma`;
        document.querySelector("[data-item-category]").textContent =
            elemento.categoria.nome;
        document.querySelector("[data-item-title]").textContent = elemento.nome;
        document.querySelector("[data-item-description]").textContent =
            elemento.descrizione;
        document.querySelector("[data-item-category-link]").href =
            `categoria.html?categoria=${encodeURIComponent(elemento.categoria.id)}`;

        const immaginePrincipale = document.querySelector("[data-item-image]");
        const statoGalleria = document.querySelector("[data-item-status]");
        const miniature = document.querySelector("[data-item-thumbnails]");
        const precedente = document.querySelector("[data-item-previous]");
        const successiva = document.querySelector("[data-item-next]");
        let immagineAttiva = 0;

        const selezionaImmagine = (indice) => {
            immagineAttiva = (indice + elemento.immagini.length)
                % elemento.immagini.length;
            immaginePrincipale.src = elemento.immagini[immagineAttiva];
            immaginePrincipale.alt = `${elemento.alt}, foto ${immagineAttiva + 1}`;
            statoGalleria.textContent =
                `Foto ${immagineAttiva + 1} di ${elemento.immagini.length}`;
            miniature.querySelectorAll("button").forEach((pulsante, indiceMiniatura) => {
                pulsante.setAttribute(
                    "aria-pressed",
                    String(indiceMiniatura === immagineAttiva)
                );
            });
        };

        elemento.immagini.forEach((percorso, indice) => {
            const pulsante = document.createElement("button");
            pulsante.className = "item-thumbnail";
            pulsante.type = "button";
            pulsante.setAttribute("aria-label", `Mostra foto ${indice + 1}`);
            pulsante.setAttribute("aria-pressed", String(indice === 0));
            const immagine = document.createElement("img");
            immagine.src = percorso;
            immagine.alt = "";
            immagine.setAttribute("aria-hidden", "true");
            pulsante.append(immagine);
            pulsante.addEventListener("click", () => selezionaImmagine(indice));
            miniature.append(pulsante);
        });

        precedente.addEventListener("click", () =>
            selezionaImmagine(immagineAttiva - 1)
        );
        successiva.addEventListener("click", () =>
            selezionaImmagine(immagineAttiva + 1)
        );
        paginaElemento.querySelector("[data-order-link]").href = "ordine.html";
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
