
const BAD_WORDS = [
    "damn", "hell", "crap", "stupid", "idiot", // Basic list, expandable
    "abuse", "scam", "fraud", "fake",
    "hate", "kill", "death",
    // ... add more as needed
];

export function filterProfanity(text: string): { isClean: boolean; censored: string } {
    let censored = text;
    let isClean = true;

    // Very basic replacement strategy
    BAD_WORDS.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(censored)) {
            isClean = false;
            censored = censored.replace(regex, '*'.repeat(word.length));
        }
    });

    return { isClean, censored };
}
