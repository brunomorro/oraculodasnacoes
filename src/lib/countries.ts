export type Attribute = "pib" | "juros" | "inflacao" | "divida";

export interface Country {
  id: number;
  code: string; // ISO-2
  flag: string; // emoji
  name: string;
  pib: number; // in trillions USD (B converted to T)
  juros: number; // % a.a.
  inflacao: number; // % a.a.
  divida: number; // % PIB
}

export const ATTRIBUTES: { key: Attribute; label: string; short: string; higherIsBetter: boolean; suffix: string }[] = [
  { key: "pib", label: "PIB", short: "PIB", higherIsBetter: true, suffix: " T USD" },
  { key: "juros", label: "Juros", short: "JUROS", higherIsBetter: false, suffix: "% a.a." },
  { key: "inflacao", label: "Inflação", short: "INFLAÇÃO", higherIsBetter: false, suffix: "% a.a." },
  { key: "divida", label: "Dívida Externa", short: "DÍV. EXT.", higherIsBetter: false, suffix: "% PIB" },
];

function flag(code: string): string {
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0)),
  );
}

const RAW: Omit<Country, "flag">[] = [
  { id: 1,  code: "BR", name: "Brasil",           pib: 2.17,  juros: 14.75, inflacao: 4.5,  divida: 35 },
  { id: 2,  code: "US", name: "Estados Unidos",   pib: 27.72, juros: 4.5,   inflacao: 3.0,  divida: 95 },
  { id: 3,  code: "CN", name: "China",            pib: 17.80, juros: 3.1,   inflacao: 0.3,  divida: 14 },
  { id: 4,  code: "DE", name: "Alemanha",         pib: 4.50,  juros: 3.65,  inflacao: 2.2,  divida: 156 },
  { id: 5,  code: "JP", name: "Japão",            pib: 4.20,  juros: 0.5,   inflacao: 2.5,  divida: 90 },
  { id: 6,  code: "IN", name: "Índia",            pib: 3.70,  juros: 6.5,   inflacao: 5.5,  divida: 19 },
  { id: 7,  code: "GB", name: "Reino Unido",      pib: 3.40,  juros: 4.75,  inflacao: 2.2,  divida: 280 },
  { id: 8,  code: "FR", name: "França",           pib: 3.00,  juros: 3.65,  inflacao: 2.2,  divida: 250 },
  { id: 9,  code: "IT", name: "Itália",           pib: 2.30,  juros: 3.65,  inflacao: 1.1,  divida: 117 },
  { id: 10, code: "CA", name: "Canadá",           pib: 2.14,  juros: 3.25,  inflacao: 2.0,  divida: 158 },
  { id: 11, code: "RU", name: "Rússia",           pib: 2.00,  juros: 21.0,  inflacao: 8.5,  divida: 16 },
  { id: 12, code: "MX", name: "México",           pib: 1.85,  juros: 10.25, inflacao: 4.5,  divida: 35 },
  { id: 13, code: "KR", name: "Coreia do Sul",    pib: 1.71,  juros: 3.0,   inflacao: 1.5,  divida: 39 },
  { id: 14, code: "AU", name: "Austrália",        pib: 1.72,  juros: 4.1,   inflacao: 2.8,  divida: 156 },
  { id: 15, code: "ES", name: "Espanha",          pib: 1.58,  juros: 3.65,  inflacao: 2.4,  divida: 174 },
  { id: 16, code: "ID", name: "Indonésia",        pib: 1.37,  juros: 6.0,   inflacao: 1.7,  divida: 30 },
  { id: 17, code: "TR", name: "Turquia",          pib: 1.15,  juros: 47.5,  inflacao: 49.4, divida: 44 },
  { id: 18, code: "NL", name: "Holanda",          pib: 1.14,  juros: 3.65,  inflacao: 3.3,  divida: 396 },
  { id: 19, code: "SA", name: "Arábia Saudita",   pib: 1.07,  juros: 5.5,   inflacao: 1.8,  divida: 29 },
  { id: 20, code: "CH", name: "Suíça",            pib: 0.885, juros: 0.5,   inflacao: 1.1,  divida: 248 },
  { id: 21, code: "PL", name: "Polônia",          pib: 0.811, juros: 5.75,  inflacao: 4.9,  divida: 50 },
  { id: 22, code: "AR", name: "Argentina",        pib: 0.640, juros: 35.0,  inflacao: 117.0,divida: 43 },
  { id: 23, code: "BE", name: "Bélgica",          pib: 0.645, juros: 3.65,  inflacao: 4.3,  divida: 232 },
  { id: 24, code: "SE", name: "Suécia",           pib: 0.585, juros: 2.25,  inflacao: 1.6,  divida: 174 },
  { id: 25, code: "IE", name: "Irlanda",          pib: 0.545, juros: 3.65,  inflacao: 1.7,  divida: 550 },
  { id: 26, code: "IL", name: "Israel",           pib: 0.510, juros: 4.5,   inflacao: 3.4,  divida: 29 },
  { id: 27, code: "TH", name: "Tailândia",        pib: 0.515, juros: 2.25,  inflacao: 1.0,  divida: 39 },
  { id: 28, code: "NO", name: "Noruega",          pib: 0.485, juros: 4.5,   inflacao: 3.0,  divida: 167 },
  { id: 29, code: "EG", name: "Egito",            pib: 0.380, juros: 27.25, inflacao: 26.0, divida: 42 },
  { id: 30, code: "AE", name: "Emirados Árabes",  pib: 0.510, juros: 4.4,   inflacao: 2.0,  divida: 45 },
  { id: 31, code: "ZA", name: "África do Sul",    pib: 0.400, juros: 7.5,   inflacao: 4.4,  divida: 39 },
  { id: 32, code: "PH", name: "Filipinas",        pib: 0.437, juros: 5.5,   inflacao: 3.0,  divida: 29 },
  { id: 33, code: "CO", name: "Colômbia",         pib: 0.364, juros: 9.25,  inflacao: 5.2,  divida: 55 },
  { id: 34, code: "BD", name: "Bangladesh",       pib: 0.451, juros: 9.5,   inflacao: 9.9,  divida: 23 },
  { id: 35, code: "VN", name: "Vietnã",           pib: 0.430, juros: 4.5,   inflacao: 3.0,  divida: 31 },
  { id: 36, code: "CL", name: "Chile",            pib: 0.335, juros: 5.0,   inflacao: 4.7,  divida: 78 },
  { id: 37, code: "RO", name: "Romênia",          pib: 0.355, juros: 6.5,   inflacao: 5.1,  divida: 52 },
  { id: 38, code: "CZ", name: "Rep. Tcheca",      pib: 0.330, juros: 4.0,   inflacao: 2.7,  divida: 70 },
  { id: 39, code: "FI", name: "Finlândia",        pib: 0.300, juros: 3.65,  inflacao: 1.0,  divida: 197 },
  { id: 40, code: "PT", name: "Portugal",         pib: 0.290, juros: 3.65,  inflacao: 2.4,  divida: 176 },
  { id: 41, code: "NZ", name: "Nova Zelândia",    pib: 0.260, juros: 4.25,  inflacao: 2.2,  divida: 77 },
  { id: 42, code: "PE", name: "Peru",             pib: 0.267, juros: 4.75,  inflacao: 2.0,  divida: 34 },
  { id: 43, code: "GR", name: "Grécia",           pib: 0.245, juros: 3.65,  inflacao: 2.5,  divida: 241 },
  { id: 44, code: "QA", name: "Catar",            pib: 0.235, juros: 5.2,   inflacao: 1.0,  divida: 74 },
  { id: 45, code: "HU", name: "Hungria",          pib: 0.215, juros: 6.5,   inflacao: 3.7,  divida: 88 },
  { id: 46, code: "DZ", name: "Argélia",          pib: 0.220, juros: 3.0,   inflacao: 4.1,  divida: 2 },
  { id: 47, code: "MA", name: "Marrocos",         pib: 0.145, juros: 2.5,   inflacao: 1.0,  divida: 46 },
  { id: 48, code: "NG", name: "Nigéria",          pib: 0.253, juros: 27.5,  inflacao: 33.0, divida: 17 },
  { id: 49, code: "UA", name: "Ucrânia",          pib: 0.180, juros: 14.5,  inflacao: 11.2, divida: 89 },
  { id: 50, code: "EC", name: "Equador",          pib: 0.120, juros: 9.25,  inflacao: 1.3,  divida: 66 },
  { id: 51, code: "KE", name: "Quênia",           pib: 0.115, juros: 10.75, inflacao: 4.5,  divida: 70 },
  { id: 52, code: "VE", name: "Venezuela",        pib: 0.097, juros: 60.0,  inflacao: 60.0, divida: 160 },
];

export const COUNTRIES: Country[] = RAW.map((c) => ({ ...c, flag: flag(c.code) }));

export function formatAttr(c: Country, key: Attribute): string {
  switch (key) {
    case "pib":
      return c.pib >= 1 ? `${c.pib.toFixed(2)} T` : `${(c.pib * 1000).toFixed(0)} B`;
    case "juros":
      return `${c.juros.toFixed(c.juros >= 10 ? 1 : 2)}%`;
    case "inflacao":
      return `${c.inflacao.toFixed(1)}%`;
    case "divida":
      return `${c.divida}%`;
  }
}