"use strict";

const normalizzaEtichetta = (valore) => {
    if (typeof valore !== "string") return "";
    const testo = valore.trim().replace(/\s+/g, " ");
    return testo
        ? testo.charAt(0).toLocaleUpperCase("it")
            + testo.slice(1).toLocaleLowerCase("it")
        : "";
};

const inizializzaSuggerimentiTag = async () => {
    const risposta = await fetch("../content/catalogo.json", {
        cache: "no-cache",
    });
    if (!risposta.ok) {
        throw new Error(`Caricamento dei tag esistenti non riuscito: ${risposta.status}`);
    }

    const catalogo = await risposta.json();
    const tag = new Set();
    (catalogo.categorie || []).forEach((categoria) => {
        (categoria.elementi || []).forEach((elemento) => {
            (elemento.immagini || []).forEach((immagine) => {
                (immagine.tag || []).forEach((voce) => {
                    const testo = normalizzaEtichetta(
                        typeof voce === "string"
                            ? voce
                            : voce && (voce.parola || voce.tag)
                    );
                    if (testo) tag.add(testo);
                });
            });
        });
    });

    const elenco = document.createElement("datalist");
    elenco.id = "suggerimenti-tag-catalogo";
    tag.forEach((voce) => {
        const opzione = document.createElement("option");
        opzione.value = voce;
        elenco.append(opzione);
    });
    document.body.append(elenco);

    const collegaSuggerimenti = () => {
        document.querySelectorAll("label").forEach((etichetta) => {
            const testoEtichetta = etichetta.textContent
                .trim()
                .replace(/\s+/g, " ")
                .replace(/\s*\*$/, "");
            if (testoEtichetta !== "Parola chiave") return;

            const input = etichetta.control
                || etichetta.parentElement.querySelector('input[type="text"]');
            if (!input) return;
            if (input.dataset.tagAutocomplete === "true") return;
            input.dataset.tagAutocomplete = "true";
            input.placeholder = "Es. Baby";
            input.setAttribute("list", elenco.id);
            input.addEventListener("change", () => {
                const testo = normalizzaEtichetta(input.value);
                if (!testo || tag.has(testo)) return;
                tag.add(testo);
                const opzione = document.createElement("option");
                opzione.value = testo;
                elenco.append(opzione);
            });
        });
    };

    new MutationObserver(collegaSuggerimenti).observe(document.body, {
        childList: true,
        subtree: true,
    });
    collegaSuggerimenti();
};

inizializzaSuggerimentiTag().catch((errore) => {
    console.error("Impossibile caricare i suggerimenti per i tag.", errore);
});
