const commonWords = [
  "accommodate",
  "terrified",
  "acknowledge",
  "achieve",
  "acquire",
  "address",
  "argument",
  "beautiful",
  "because",
  "beginning",
  "believe",
  "business",
  "calendar",
  "category",
  "commitment",
  "committee",
  "completely",
  "conscience",
  "conscious",
  "definitely",
  "dependent",
  "disappear",
  "disappoint",
  "embarrass",
  "environment",
  "existence",
  "experience",
  "familiar",
  "finally",
  "foreign",
  "forty",
  "friend",
  "grammar",
  "grateful",
  "guarantee",
  "harass",
  "height",
  "humorous",
  "immediately",
  "independent",
  "intelligence",
  "interrupt",
  "knowledge",
  "leisure",
  "library",
  "lightning",
  "maintenance",
  "marriage",
  "minute",
  "necessary",
  "neighbour",
  "noticeable",
  "occasion",
  "occurrence",
  "official",
  "parallel",
  "parliament",
  "particular",
  "perform",
  "personnel",
  "possession",
  "possible",
  "preferred",
  "principal",
  "privilege",
  "probably",
  "professional",
  "publicly",
  "really",
  "receive",
  "recommend",
  "referred",
  "relevant",
  "religious",
  "remember",
  "resistance",
  "restaurant",
  "rhythm",
  "schedule",
  "separate",
  "sergeant",
  "similar",
  "successful",
  "supersede",
  "surprise",
  "tomorrow",
  "tremendous",
  "truly",
  "unfortunately",
  "until",
  "vacuum",
  "village",
  "weather",
  "weird",
  "whether",
  "writing",
  "yacht",
  "yourself",
  "across",
  "against",
  "although",
  "among",
  "algorithm",
  "hello",
  "free",
  "love",
  "amazing",
  "amazed",
  "going",
  "information"
];

// Accepts optional hasWord(word) predicate to check against a larger dictionary (e.g., Trie.contains)
export function getCorrection(rawWord, hasWord) {
  if (!rawWord) return rawWord;

  const lower = rawWord.toLowerCase();

  const inCommon = (w) => commonWords.includes(w);
  const isWord = (w) => (hasWord ? !!hasWord(w) : false) || inCommon(w);

  // Early exit if already a known word
  if (isWord(lower)) return rawWord;

  // Generate candidate corrections targeting typical typos:
  // - extra letters (repetition)
  // - missing a letter (single insertion)
  // - single deletion/substitution
  const candidates = new Set();

  // 1) Repeated letters normalization: produce variants with run length 1 and 2
  for (const v of repeatVariants(lower)) candidates.add(v);

  // 2) Single deletion (handles extra letter)
  for (let i = 0; i < lower.length; i++) {
    candidates.add(lower.slice(0, i) + lower.slice(i + 1));
  }

  // 3) Single insertion (handles missing letter)
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i <= lower.length; i++) {
    for (const ch of alphabet) {
      candidates.add(lower.slice(0, i) + ch + lower.slice(i));
    }
  }

  // 4) Single substitution
  for (let i = 0; i < lower.length; i++) {
    for (const ch of alphabet) {
      if (ch !== lower[i]) candidates.add(lower.slice(0, i) + ch + lower.slice(i + 1));
    }
  }

  // Filter to plausible dictionary hits
  const hits = [];
  candidates.forEach((c) => {
    if (!c) return;
    if (isWord(c)) hits.push(c);
  });

  // If we found any hits, pick the best by edit distance and commonWords preference
  if (hits.length) {
    let best = null;
    let bestScore = Infinity;
    for (const h of hits) {
      const d = levenshtein(lower, h);
      // Prefer closer distance; tie-break by whether it's in common list
      const bias = inCommon(h) ? 0 : 0.25; // tiny bias toward common words
      const score = d + bias;
      if (score < bestScore) {
        bestScore = score;
        best = h;
      }
    }
    return preserveCase(rawWord, best);
  }

  // Fallback: scan commonWords by distance (small set, fast)
  let best = lower;
  let bestDist = 3;
  for (const w of commonWords) {
    const d = levenshtein(lower, w);
    if (d < bestDist) {
      best = w;
      bestDist = d;
    }
  }
  return bestDist <= 2 ? preserveCase(rawWord, best) : rawWord;
}

// simple Levenshtein distance
function levenshtein(a, b) {
  const dp = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

// Produce variants where repeated runs are reduced to 1 and/or 2 occurrences
function repeatVariants(word) {
  const runs = [];
  let i = 0;
  while (i < word.length) {
    let j = i + 1;
    while (j < word.length && word[j] === word[i]) j++;
    const len = j - i;
    runs.push({ ch: word[i], len });
    i = j;
  }

  // Backtracking to generate variants
  const variants = new Set();
  const backtrack = (idx, acc) => {
    if (idx === runs.length) {
      variants.add(acc);
      return;
    }
    const { ch, len } = runs[idx];
    if (len === 1) {
      backtrack(idx + 1, acc + ch);
    } else {
      // length 1
      backtrack(idx + 1, acc + ch);
      // length 2 (common legitimate doubles like 'letter', 'cool')
      backtrack(idx + 1, acc + ch + ch);
    }
  };
  backtrack(0, "");
  return variants;
}

// Preserve capitalization style of the original token
function preserveCase(original, corrected) {
  if (!corrected) return original;
  // ALL CAPS
  if (original.toUpperCase() === original) return corrected.toUpperCase();
  // Capitalized
  if (original[0] && original[0].toUpperCase() === original[0]) {
    return corrected[0].toUpperCase() + corrected.slice(1);
  }
  return corrected;
}
