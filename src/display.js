const chalk = require('chalk');

// Inner width of the box (between the two ║ borders)
const W = 38;
const SEP = '═'.repeat(W);

// All art lines must be exactly 10 chars so centering is consistent
const ART = {
  happy:  ['  (\\_/)   ', ' ( ^w^ )  ', ' (>   <)  '],
  normal: ['  (\\_/)   ', ' ( .w. )  ', ' (>   <)  '],
  hungry: ['  (\\_/)   ', ' ( OwO )  ', ' (>   <)  '],
  sleepy: ['  (\\_/)   ', ' (-w- )z  ', ' (>   <)  '],
  sad:    ['  (\\_/)   ', ' ( ;w; )  ', ' (>   <)  '],
  sick:   ['  (\\_/)   ', ' ( xwx )  ', ' (~   ~)  '],
  dead:   ['  (\\_/)   ', ' ( x_x )  ', ' (     )  '],
};

const MOOD_COLOR = {
  happy:  chalk.magentaBright,
  normal: chalk.cyanBright,
  hungry: chalk.yellowBright,
  sleepy: chalk.blueBright,
  sad:    chalk.blue,
  sick:   chalk.redBright,
  dead:   chalk.gray,
};

const MOOD_MSG = {
  happy:  '~ Living the best life! ~',
  normal: '~ Feeling okay today ~',
  hungry: '~ My tummy is growling... ~',
  sleepy: '~ So sleeeepy... zzz ~',
  sad:    '~ I could use some love... ~',
  sick:   '~ Not feeling great... ~',
  dead:   '~ Goodbye cruel world... ~',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function border(inner) {
  return chalk.yellowBright('║') + inner + chalk.yellowBright('║');
}

function blank() {
  return border(' '.repeat(W));
}

// Center a plain-text string inside W chars, then apply an optional chalk fn
function centered(text, colorFn) {
  const pad   = Math.max(0, W - text.length);
  const left  = Math.floor(pad / 2);
  const right = pad - left;
  const full  = ' '.repeat(left) + text + ' '.repeat(right);
  return colorFn ? colorFn(full) : full;
}

// Colored progress bar — 12 block chars, no brackets
function statBar(value) {
  const CELLS  = 12;
  const filled = Math.round((value / 100) * CELLS);
  const bar    = '█'.repeat(filled) + '░'.repeat(CELLS - filled);
  if (value > 60) return chalk.greenBright(bar);
  if (value > 30) return chalk.yellowBright(bar);
  return chalk.redBright(bar);
}

function formatAge(ticks) {
  if (ticks < 2)    return 'newborn';
  if (ticks < 120)  return `${ticks} mins`;
  if (ticks < 2880) return `${Math.floor(ticks / 120)} hrs`;
  return `${Math.floor(ticks / 2880)} days`;
}

// ─── main render ──────────────────────────────────────────────────────────────

// Pad-mode footer — button icons with PS colours
// Visual: " ✕ Feed   ○ Play   □ Sleep   △ Clean  " = 38 chars
function padFooter() {
  const X = chalk.blueBright('✕');
  const O = chalk.redBright('○');
  const S = chalk.magentaBright('□');
  const T = chalk.greenBright('△');

  // Visual width: 2+1+8+1+8+1+8+1+8 = 38 ✓
  const line1 = `  ${X} Feed   ${O} Play   ${S} Sleep  ${T} Clean  `;
  const line2 = centered('≡ Options → Quit', chalk.gray); // plain text → correct length
  return [line1, line2];
}

function render(pet, message, padMode = false) {
  const mood  = pet.mood;
  const art   = ART[mood];
  const color = MOOD_COLOR[mood] || chalk.white;
  const B     = chalk.yellowBright;

  const rows = [];

  // Top border
  rows.push(B(`╔${SEP}╗`));

  // Header:  "  [ NAME ]        Age: X  "
  // Computed dynamically so any name length works
  const nameTag  = `  [ ${pet.name.toUpperCase()} ]`;
  const ageTag   = `Age: ${formatAge(pet.age)}  `;
  const midSpace = ' '.repeat(Math.max(1, W - nameTag.length - ageTag.length));
  rows.push(border(
    chalk.bold.whiteBright(nameTag) + midSpace + chalk.whiteBright(ageTag)
  ));

  rows.push(B(`╠${SEP}╣`));
  rows.push(blank());

  // ASCII pet (each line is 10 chars → centered in W=38 → 14 pad each side)
  for (const line of art) {
    rows.push(border(centered(line, color)));
  }

  rows.push(blank());

  // Mood message
  rows.push(border(centered(MOOD_MSG[mood], chalk.italic)));
  rows.push(blank());
  rows.push(B(`╠${SEP}╣`));

  // Stat rows
  // Visual layout per row (38 chars total):
  //  1 (space) + 10 (label) + 1 (space) + 12 (bar) + 1 (space) + 4 (pct) + 9 (trail) = 38
  const TRAIL = ' '.repeat(W - 1 - 10 - 1 - 12 - 1 - 4);
  const stats = [
    { label: 'Hunger    ', value: pet.hunger },
    { label: 'Happiness ', value: pet.happiness },
    { label: 'Energy    ', value: pet.energy },
    { label: 'Health    ', value: pet.health },
  ];
  for (const s of stats) {
    const pct = `${Math.round(s.value)}%`.padStart(4);
    rows.push(border(
      ` ${chalk.white(s.label)} ${statBar(s.value)} ${chalk.white(pct)}${TRAIL}`
    ));
  }

  // Optional message banner
  if (message) {
    rows.push(B(`╠${SEP}╣`));
    const msg   = `  ${message}`;
    const trail = ' '.repeat(Math.max(0, W - msg.length));
    rows.push(border(chalk.cyanBright(msg) + trail));
  }

  // Pad-mode footer
  if (padMode) {
    rows.push(B(`╠${SEP}╣`));
    const [line1, line2] = padFooter();
    rows.push(border(line1));
    rows.push(border(line2));
  }

  rows.push(B(`╚${SEP}╝`));

  console.clear();
  console.log(rows.join('\n'));
}

module.exports = { render };
