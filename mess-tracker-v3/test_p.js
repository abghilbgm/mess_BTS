import { parseCopiedVotesText } from './src/utils/parser.js';

const txt = `Breakfast
~ Shravani H
+91 70260 26867
6/26/2026 at 7:39 PM
Nikita
6/26/2026 at 6:30 PM`;

console.log(parseCopiedVotesText(txt, new Date()));
