"use strict";

const filoScroll = document.querySelector(".filo-scroll");

if (filoScroll) {
    const filoPercorso = filoScroll.querySelector(".filo-percorso");
    const bobinaFilato = filoScroll.querySelector(".bobina-filato");
    const estremitaFilo = filoScroll.querySelector(".filo-estremita");
    let aggiornamentoFiloInAttesa = false;

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
        const lunghezzaFilo = filoPercorso.getTotalLength();
        const puntoFilo = filoPercorso.getPointAtLength(
            lunghezzaFilo * avanzamento
        );

        filoScroll.style.setProperty(
            "--filo-avanzamento",
            String(trattoRimanente)
        );
        bobinaFilato.style.setProperty(
            "--rotazione-bobina",
            `${avanzamento * 720}deg`
        );
        estremitaFilo.setAttribute("cx", String(puntoFilo.x));
        estremitaFilo.setAttribute("cy", String(puntoFilo.y));
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
    window.addEventListener("pageshow", pianificaAggiornamentoFilo);
    window.addEventListener("load", pianificaAggiornamentoFilo, { once: true });
    aggiornaFilo();
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
