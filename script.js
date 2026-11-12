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
