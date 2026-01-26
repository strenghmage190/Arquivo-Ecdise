const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const ROTOR_SPECS = {
  I: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  II: { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
};
const REFLECTOR_B = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';

class Rotor {
  constructor(spec, position = 0, ring = 0) {
    this.wiring = spec.wiring;
    this.notch = spec.notch;
    this.position = position % 26;
    this.ring = ring % 26;
  }
  atNotch() { return this.notch.includes(ALPHABET[this.position]); }
  rotate() { this.position = (this.position + 1) % 26; }
  forward(c) {
    const idx = ALPHABET.indexOf(c);
    const shifted = (idx + this.position - this.ring + 26) % 26;
    const wired = this.wiring[shifted];
    const out = (ALPHABET.indexOf(wired) - this.position + this.ring + 26) % 26;
    return ALPHABET[out];
  }
  backward(c) {
    const idx = ALPHABET.indexOf(c);
    const shifted = (idx + this.position - this.ring + 26) % 26;
    const wireIndex = this.wiring.indexOf(ALPHABET[shifted]);
    const out = (wireIndex - this.position + this.ring + 26) % 26;
    return ALPHABET[out];
  }
}

function applyPlugboard(c, pairs) {
  if (!pairs) return c;
  const mapping = {};
  pairs.split(/\s+/).forEach(pair => {
    if (pair.length === 2) {
      const a = pair[0].toUpperCase();
      const b = pair[1].toUpperCase();
      mapping[a] = b; mapping[b] = a;
    }
  });
  return mapping[c] || c;
}

function makeRotorsFromLeftToRight(labels, initialPositions, ringSettings) {
  // labels: ['I','II','III'] left->right
  // return array [right,middle,left]
  const left = new Rotor(ROTOR_SPECS[labels[0]], ALPHABET.indexOf(initialPositions[0]), ringSettings[0]);
  const middle = new Rotor(ROTOR_SPECS[labels[1]], ALPHABET.indexOf(initialPositions[1]), ringSettings[1]);
  const right = new Rotor(ROTOR_SPECS[labels[2]], ALPHABET.indexOf(initialPositions[2]), ringSettings[2]);
  return [right, middle, left];
}

function stepRotors(rotors) {
  const right = rotors[0];
  const middle = rotors[1];
  const left = rotors[2];
  if (middle.atNotch()) {
    middle.rotate(); left.rotate();
  } else if (right.atNotch()) {
    middle.rotate();
  }
  right.rotate();
}

function encodeString(message, config) {
  const { labels, initialPositions, ringSettings, plugPairs } = config;
  let rotors = makeRotorsFromLeftToRight(labels, initialPositions, ringSettings);
  let out = '';
  for (const ch of message.toUpperCase()) {
    if (ALPHABET.indexOf(ch) === -1) { out += ch; continue; }
    stepRotors(rotors);
    let c = applyPlugboard(ch, plugPairs);
    c = rotors[0].forward(c);
    c = rotors[1].forward(c);
    c = rotors[2].forward(c);
    c = REFLECTOR_B[ALPHABET.indexOf(c)];
    c = rotors[2].backward(c);
    c = rotors[1].backward(c);
    c = rotors[0].backward(c);
    c = applyPlugboard(c, plugPairs);
    out += c;
  }
  return out;
}

// Example 1 from reference
const config = {
  labels: ['I','II','III'], // left->right
  initialPositions: ['A','A','Z'],
  ringSettings: [0,0,0], // ring "01" -> 0
  plugPairs: 'HL MO AJ CX BZ SR NI YW DG PK'
};

const input = 'HELLOWORLD';
const encoded = encodeString(input, config);
console.log('input:', input);
console.log('encoded:', encoded);

if (encoded === 'RFKTMBXVVW') {
  console.log('TEST PASSED');
  process.exit(0);
} else {
  console.error('TEST FAILED (expected RFKTMBXVVW)');
  process.exit(2);
}
