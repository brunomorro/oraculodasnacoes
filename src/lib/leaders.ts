import archer from "@/assets/leaders/arqueiro.png";
import witch from "@/assets/leaders/bruxa.png";
import gladiator from "@/assets/leaders/gladiador.png";
import knight from "@/assets/leaders/cavaleiro.png";
import tyrant from "@/assets/leaders/tirano.png";
import blacksmith from "@/assets/leaders/ferreiro.png";
import oracle from "@/assets/leaders/oraculo.png";

export type LeaderId =
  | "archer"
  | "witch"
  | "gladiator"
  | "knight"
  | "tyrant"
  | "blacksmith"
  | "oracle";

export interface Leader {
  id: LeaderId;
  name: string;
  bio: string;
  specialty: string;
  portrait: string;
  frameColor: string; // oklch
  accent: "gold" | "blue" | "red" | "teal" | "green" | "copper" | "purple";
}

export const LEADERS: Leader[] = [
  {
    id: "archer",
    name: "O Arqueiro do Câmbio",
    bio: "Cresceu nas fronteiras onde moedas se cruzavam todos os dias, aprendendo a prever para onde o valor ia migrar antes de qualquer gráfico mostrar. Suas flechas não matam — elas marcam o ativo certo no momento certo. Dizem que ele consegue mirar em sete economias ao mesmo tempo, vendo cada uma com a clareza de quem lê uma cotação ao vivo.",
    specialty: "Vê melhor os atributos da maioria dos jogadores",
    portrait: archer,
    frameColor: "oklch(0.55 0.16 230)",
    accent: "blue",
  },
  {
    id: "witch",
    name: "A Bruxa do Crédito",
    bio: "Antes de ser temida nas mesas de disputa, era apenas uma estudiosa obcecada por entender por que o dinheiro de hoje vale menos que o de ontem. Sua bruxaria não vem de grimórios, vem de planilhas antigas reescritas como feitiços. Cada linha de crédito que ela toca se reorganiza sozinha, revelando o número exato que ninguém mais consegue calcular.",
    specialty: "Calcula com precisão atributos numéricos",
    portrait: witch,
    frameColor: "oklch(0.45 0.18 295)",
    accent: "purple",
  },
  {
    id: "gladiator",
    name: "O Gladiador da Inflação",
    bio: "Aprendeu, nas arenas mais duras do comércio, que o verdadeiro inimigo não é quem está na sua frente — é a corrosão lenta que desvaloriza tudo com o tempo. Sua armadura foi forjada para resistir justamente a isso: cada golpe que sofre, ele absorve sem perder valor. Em disputas de balança comercial, ninguém aguenta mais rodadas do que ele.",
    specialty: "Domina disputas pela balança comercial (PIB)",
    portrait: gladiator,
    frameColor: "oklch(0.42 0.14 40)",
    accent: "red",
  },
  {
    id: "knight",
    name: "O Cavaleiro do Tesouro",
    bio: "Jurou nunca deixar uma negociação morrer empatada. Onde um cavaleiro comum desembainha a espada, ele desenrola um pergaminho selado pelo próprio tesouro nacional — e de alguma forma, sempre encontra uma cláusula que vira o impasse a seu favor. Os outros líderes o respeitam por nunca tê-lo visto perder algo que já parecia perdido.",
    specialty: "Recupera cartas em empates",
    portrait: knight,
    frameColor: "oklch(0.50 0.10 250)",
    accent: "blue",
  },
  {
    id: "tyrant",
    name: "O Tirano das Tarifas",
    bio: "Não comanda exércitos — comanda fronteiras, e decide, com um gesto, quanto custa atravessá-las. Cada tarifa que impõe é uma sentença; cada embargo, um castigo. Contra outros líderes, larga qualquer cortesia: um confronto entre potências, para o Tirano, é a única guerra que vale a pena vencer sem hesitar.",
    specialty: "IA mais agressiva contra líderes",
    portrait: tyrant,
    frameColor: "oklch(0.38 0.16 20)",
    accent: "red",
  },
  {
    id: "blacksmith",
    name: "O Ferreiro do Déficit",
    bio: "Tem mãos que não temem ruína. Diante de uma economia quebrada, onde outros recuariam, ele já está forjando os primeiros pilares de uma nova estrutura — transformando o que sobrou do colapso em ferramenta de reconstrução. Conta-se que nenhuma dívida jamais foi grande o suficiente para deter seu martelo.",
    specialty: "Bônus contra economias com alta dívida",
    portrait: blacksmith,
    frameColor: "oklch(0.45 0.15 55)",
    accent: "copper",
  },
  {
    id: "oracle",
    name: "A Oráculo do Mercado",
    bio: "Não joga para o presente — joga para o instante em que tudo se decide. Como os grandes oráculos financeiros que enxergam décadas adiante, guarda sua melhor carta em silêncio, esperando o momento exato em que ele virar destino. Quando a partida chega ao fim, é sempre ela quem já sabia como terminaria.",
    specialty: "Vantagem em rodadas finais",
    portrait: oracle,
    frameColor: "oklch(0.40 0.17 300)",
    accent: "purple",
  },
];

export function getLeader(id: LeaderId): Leader {
  return LEADERS.find((l) => l.id === id)!;
}