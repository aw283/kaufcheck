// Wohnbauförderungs-Inhalte pro Bundesland.
// Bewusst OHNE konkrete Förderbeträge — die ändern sich laufend;
// verbindlich ist nur die offizielle Landesstelle.

export interface Foerderland {
  slug: string;
  name: string;
  intro: string;
  schwerpunkte: string[];
  besonderheit: string;
  offiziell: { label: string; url: string };
}

export const FOERDERLAENDER: Foerderland[] = [
  {
    slug: "wien",
    name: "Wien",
    intro:
      "Wien fördert Eigentum zurückhaltender als die Flächenbundesländer — der Schwerpunkt liegt traditionell auf gefördertem Mietwohnbau und Sanierung. Für Eigentumserwerber relevant sind vor allem die Eigentumsförderung für geförderte Neubauprojekte sowie Sanierungsförderungen für Bestandsobjekte. Wer in Wien ein gefördertes Eigentumsprojekt erwirbt, profitiert indirekt: Die Projekte unterliegen Preis- und Qualitätskriterien.",
    schwerpunkte: [
      "Eigentumsförderung im geförderten Neubau (über Bauträgerprojekte)",
      "Umfassende Sanierungsförderung (THEWOSAN) für Bestandswohnungen",
      "Eigenmittelersatzdarlehen in bestimmten Konstellationen",
      "Wohnbeihilfe als laufende Unterstützung bei niedrigem Einkommen",
    ],
    besonderheit:
      "In Wien lohnt der Blick auf geförderte Bauträgerprojekte: Dort sind Kaufpreise reguliert und die Finanzierung oft schon mit Landesmitteln strukturiert.",
    offiziell: { label: "Stadt Wien – Wohnbauförderung", url: "https://www.wien.gv.at" },
  },
  {
    slug: "noe",
    name: "Niederösterreich",
    intro:
      "Niederösterreich setzt auf ein Punktesystem: Familiengröße, Energieeffizienz und regionale Faktoren bestimmen die Höhe des geförderten Darlehens. Das Modell begünstigt Familien mit Kindern und energieeffizientes Bauen deutlich. Gefördert werden Neubau, Kauf und Sanierung — jeweils mit eigenen Schienen.",
    schwerpunkte: [
      "Gefördertes Landesdarlehen mit Punktesystem (Familie, Energie, Lage)",
      "Eigenheimförderung für Neubau und Ersterwerb",
      "Sanierungsförderung mit Öko-Schwerpunkt",
      "Junge-Familien-Komponenten im Punktesystem",
    ],
    besonderheit:
      "Das NÖ-Punktesystem belohnt Planung: Wer Energiestandard und Familienpunkte vor Antragstellung optimiert, holt spürbar mehr heraus.",
    offiziell: { label: "Land NÖ – Wohnbauförderung", url: "https://www.noe.gv.at" },
  },
  {
    slug: "ooe",
    name: "Oberösterreich",
    intro:
      "Oberösterreich kombiniert geförderte Darlehen mit Zuschuss-Elementen und hat eigene Schienen für junges Wohnen. Der Fokus liegt auf leistbarem Eigentum für Familien und Erstkäufer; Energiekriterien sind fest verankert. Auch der Kauf gebrauchter Objekte kann unter Bedingungen gefördert werden.",
    schwerpunkte: [
      "Wohnbauförderungs-Darlehen für Neubau und Kauf",
      "Junges-Wohnen-Schienen für Erstkäufer",
      "Sanierungsförderung inklusive Einzelmaßnahmen",
      "Zuschüsse in Kombination mit Energiestandards",
    ],
    besonderheit:
      "OÖ behandelt auch den Erwerb bestehender Eigenheime förderfähig — ein Vorteil gegenüber Ländern mit reinem Neubau-Fokus.",
    offiziell: { label: "Land OÖ – Wohnbauförderung", url: "https://www.land-oberoesterreich.gv.at" },
  },
  {
    slug: "sbg",
    name: "Salzburg",
    intro:
      "Salzburg fördert mit einer Mischung aus Zuschüssen und Darlehen und hat die Förderung zuletzt stärker an soziale Staffelung und Energieeffizienz geknüpft. Angesichts des hohen Preisniveaus im Zentralraum sind die Förderungen ein relevanter Hebel — die Einkommensgrenzen schließen aber Besserverdiener teilweise aus.",
    schwerpunkte: [
      "Errichtungsförderung für Eigenheime und Eigentumswohnungen",
      "Kaufförderung mit sozialer Staffelung",
      "Sanierungsförderung mit Energieboni",
      "Wohnbeihilfe als laufende Ergänzung",
    ],
    besonderheit:
      "Salzburg staffelt stark nach Einkommen und Haushaltsgröße — die exakte Einstufung vorab bei der Landesstelle klären, bevor Sie Objekte besichtigen.",
    offiziell: { label: "Land Salzburg – Wohnbauförderung", url: "https://www.salzburg.gv.at" },
  },
  {
    slug: "tirol",
    name: "Tirol",
    intro:
      "Tirol gehört zu den Ländern mit den höchsten Fördervolumina pro Vorhaben — als Antwort auf das höchste Preisniveau Westösterreichs. Gefördert wird über zinsgünstige Darlehen mit langen Laufzeiten, ergänzt um Zuschüsse für Familien und energieeffizientes Bauen. Die Vergabekriterien (Hauptwohnsitz, Einkommensgrenzen, Flächenobergrenzen) werden konsequent geprüft.",
    schwerpunkte: [
      "Zinsgünstige Landesdarlehen mit hohen Obergrenzen",
      "Wohnbauförderung für Neubau, Kauf und Ersterwerb",
      "Familienzuschläge und Kinderboni",
      "Impulspaket-Schienen für leistbares Wohnen",
    ],
    besonderheit:
      "Tirols Darlehen können einen erheblichen Teil der Finanzierung ersetzen — das senkt die Bankkredit-Summe und entspannt die KIM-V-Rechnung deutlich.",
    offiziell: { label: "Land Tirol – Wohnbauförderung", url: "https://www.tirol.gv.at" },
  },
  {
    slug: "vbg",
    name: "Vorarlberg",
    intro:
      "Vorarlberg verbindet Wohnbauförderung konsequent mit Energie- und Klimazielen: Wer nach hohen Effizienzstandards baut oder saniert, wird überproportional gefördert. Neben Darlehen gibt es Zuschüsse, die an Ökologie-Kriterien geknüpft sind. Das Land gilt als Vorreiter bei der Verknüpfung von Wohnbau- und Klimapolitik.",
    schwerpunkte: [
      "Wohnbauförderungs-Darlehen mit Öko-Staffelung",
      "Neubauförderung mit Energieausweis-Anforderungen",
      "Sanierungsförderung mit Klimaboni",
      "Eigenmittelersatz-Komponenten für junge Haushalte",
    ],
    besonderheit:
      "In Vorarlberg entscheidet der Energiestandard über die Förderhöhe — ein besseres Gebäudekonzept kann sich doppelt rechnen: niedrigere Betriebskosten plus höhere Förderung.",
    offiziell: { label: "Land Vorarlberg – Wohnbauförderung", url: "https://vorarlberg.at" },
  },
  {
    slug: "stmk",
    name: "Steiermark",
    intro:
      "Die Steiermark arbeitet traditionell mit Annuitätenzuschüssen: Das Land übernimmt über Jahre einen Teil Ihrer Kreditrate, statt selbst Darlehen zu vergeben. Das wirkt direkt auf die monatliche Belastung und damit auf Ihre Schuldendienstquote. Daneben existieren Schienen für Sanierung und für den Erwerb bestehender Objekte.",
    schwerpunkte: [
      "Annuitätenzuschüsse zur laufenden Kreditrate",
      "Eigenheim- und Wohnungsförderung für Neubau und Kauf",
      "Umfassende Sanierungsförderung",
      "Sozial gestaffelte Komponenten nach Einkommen",
    ],
    besonderheit:
      "Der steirische Annuitätenzuschuss senkt direkt Ihre Monatsrate — das verbessert die DSTI-Quote und kann eine grenzwertige Finanzierung über die Linie bringen.",
    offiziell: { label: "Land Steiermark – Wohnbauförderung", url: "https://www.wohnbau.steiermark.at" },
  },
  {
    slug: "ktn",
    name: "Kärnten",
    intro:
      "Kärnten fördert über zinsgünstige Darlehen und gewährt Zusatzpunkte für Familien und junge Haushalte. Das vergleichsweise moderate Preisniveau des Bundeslands macht die Förderung besonders wirksam: Der geförderte Anteil deckt hier einen größeren Teil der Gesamtkosten als in Hochpreisregionen.",
    schwerpunkte: [
      "Wohnbauförderungs-Darlehen für Neubau und Ersterwerb",
      "Jungfamilien-Begünstigungen",
      "Sanierungsförderung für Bestandsobjekte",
      "Wohnbeihilfe als laufende Unterstützung",
    ],
    besonderheit:
      "Kombination aus moderaten Kaufpreisen und solider Förderung: In Kärnten erreichen auch mittlere Einkommen realistisch Eigentum — die Förderung wirkt als Beschleuniger.",
    offiziell: { label: "Land Kärnten – Wohnbauförderung", url: "https://www.ktn.gv.at" },
  },
  {
    slug: "bgld",
    name: "Burgenland",
    intro:
      "Das Burgenland setzt stärker als andere Länder auf direkte Zuschussmodelle und hat wiederholt Sonderprogramme für Eigentumserwerb aufgelegt. Mit dem niedrigsten Preisniveau Österreichs ist die Eintrittshürde ins Eigentum hier ohnehin am geringsten — die Förderung verstärkt diesen Effekt.",
    schwerpunkte: [
      "Zuschussmodelle für Neubau und Kauf",
      "Sonderprogramme für Eigentum (zeitlich befristet, laufend prüfen)",
      "Sanierungs- und Ökoförderungen",
      "Unterstützung für junge Familien",
    ],
    besonderheit:
      "Burgenländische Sonderprogramme sind oft zeitlich befristet und schnell ausgeschöpft — wer kaufen will, sollte den Förderstatus früh und direkt bei der Landesstelle prüfen.",
    offiziell: { label: "Land Burgenland – Wohnbauförderung", url: "https://www.burgenland.at" },
  },
];

export function getFoerderland(slug: string): Foerderland | undefined {
  return FOERDERLAENDER.find((f) => f.slug === slug);
}
