/**
 * Text Analysis Service
 * - Profanity detection
 * - Sentiment analysis
 * - Hate speech detection
 * - Keyword extraction
 */

// Profanity word lists (can be extended)
const profanityList = [
  // Common profanity (censored for code)
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'bastard', 'dick', 'cock', 'pussy',
  'asshole', 'bullshit', 'motherfucker', 'fucker', 'fucking', 'shitty', 'dumbass',
  'piss', 'cunt', 'whore', 'slut', 'fag', 'nigger', 'retard', 'retarded'
];

const mildProfanityList = [
  'hell', 'damn', 'crap', 'suck', 'sucks', 'piss', 'ass'
];

const hateSpeechKeywords = [
  'kill', 'murder', 'die', 'death', 'hate', 'terrorist', 'bomb', 'attack',
  'genocide', 'holocaust', 'nazi', 'white power', 'racial slur',
  'n-word', 'f-word', 'homophobic', 'transphobic', 'xenophobic'
];

const violenceKeywords = [
  'kill', 'murder', 'stab', 'shoot', 'gun', 'knife', 'weapon', 'blood',
  'fight', 'punch', 'kick', 'beat', 'assault', 'attack', 'hurt', 'pain',
  'torture', 'abuse', 'rape', 'violence', 'violent', 'dead', 'death'
];

const drugKeywords = [
  'drug', 'drugs', 'cocaine', 'heroin', 'meth', 'weed', 'marijuana', 'cannabis',
  'lsd', 'ecstasy', 'mdma', 'pills', 'overdose', 'high', 'stoned', 'drunk',
  'alcohol', 'beer', 'vodka', 'whiskey', 'smoke', 'smoking', 'vape'
];

const sexualKeywords = [
  'sex', 'sexual', 'porn', 'nude', 'naked', 'boobs', 'breasts', 'genitals',
  'erotic', 'orgasm', 'masturbate', 'intercourse', 'explicit'
];

class TextAnalysisService {
  constructor() {
    this.version = 'text-analysis-v1.0';
  }

  /**
   * Analyze text for profanity
   * @returns {object} - { score, flaggedWords, instances }
   */
  analyzeProfanity(text) {
    if (!text) return { score: 0, flaggedWords: [], instances: [] };

    const words = text.toLowerCase().split(/\s+/);
    const flaggedWords = [];
    const instances = [];

    words.forEach((word, index) => {
      // Clean word of punctuation
      const cleanWord = word.replace(/[^a-z]/g, '');
      
      if (profanityList.includes(cleanWord)) {
        flaggedWords.push(cleanWord);
        instances.push({
          word: cleanWord,
          severity: 'high',
          position: index
        });
      } else if (mildProfanityList.includes(cleanWord)) {
        flaggedWords.push(cleanWord);
        instances.push({
          word: cleanWord,
          severity: 'mild',
          position: index
        });
      }
    });

    // Calculate profanity density score (0-1)
    const highCount = instances.filter(i => i.severity === 'high').length;
    const mildCount = instances.filter(i => i.severity === 'mild').length;
    const totalWords = words.length;
    
    // Weighted score: high profanity counts more
    const score = Math.min(
      ((highCount * 3 + mildCount) / totalWords) * 5, // Amplify for sensitivity
      1.0
    );

    return {
      score: Math.round(score * 100) / 100,
      flaggedWords: [...new Set(flaggedWords)],
      instances,
      highCount,
      mildCount
    };
  }

  /**
   * Analyze text for hate speech indicators
   */
  analyzeHateSpeech(text) {
    if (!text) return { score: 0, flaggedPhrases: [] };

    const lowerText = text.toLowerCase();
    const flaggedPhrases = [];

    hateSpeechKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        flaggedPhrases.push(keyword);
      }
    });

    // Score based on presence and frequency
    const score = Math.min(flaggedPhrases.length * 0.2, 1.0);

    return {
      score: Math.round(score * 100) / 100,
      flaggedPhrases
    };
  }

  /**
   * Analyze text for violence-related content
   */
  analyzeViolence(text) {
    if (!text) return { score: 0, flaggedWords: [] };

    const lowerText = text.toLowerCase();
    const flaggedWords = [];

    violenceKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        flaggedWords.push(keyword);
      }
    });

    const score = Math.min(flaggedWords.length * 0.1, 1.0);

    return {
      score: Math.round(score * 100) / 100,
      flaggedWords
    };
  }

  /**
   * Analyze text for drug-related content
   */
  analyzeDrugContent(text) {
    if (!text) return { score: 0, flaggedWords: [] };

    const lowerText = text.toLowerCase();
    const flaggedWords = [];

    drugKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        flaggedWords.push(keyword);
      }
    });

    const score = Math.min(flaggedWords.length * 0.15, 1.0);

    return {
      score: Math.round(score * 100) / 100,
      flaggedWords
    };
  }

  /**
   * Analyze text for sexual content
   */
  analyzeSexualContent(text) {
    if (!text) return { score: 0, flaggedWords: [] };

    const lowerText = text.toLowerCase();
    const flaggedWords = [];

    sexualKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        flaggedWords.push(keyword);
      }
    });

    const score = Math.min(flaggedWords.length * 0.2, 1.0);

    return {
      score: Math.round(score * 100) / 100,
      flaggedWords
    };
  }

  /**
   * Simple sentiment analysis (positive/neutral/negative)
   * In production, use a proper NLP library or API
   */
  analyzeSentiment(text) {
    if (!text) return { sentiment: 'neutral', score: 0 };

    const positiveWords = [
      'good', 'great', 'awesome', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'love', 'like', 'happy', 'joy', 'beautiful', 'perfect', 'best', 'nice',
      'thank', 'thanks', 'please', 'welcome', 'yes', 'agree', 'cool', 'fun'
    ];

    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry',
      'sad', 'depressed', 'ugly', 'worst', 'wrong', 'no', 'never', 'disagree',
      'annoying', 'boring', 'stupid', 'dumb', 'fail', 'failure', 'problem'
    ];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (positiveWords.includes(cleanWord)) positiveCount++;
      if (negativeWords.includes(cleanWord)) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { sentiment: 'neutral', score: 0, positiveCount: 0, negativeCount: 0 };
    }

    const score = (positiveCount - negativeCount) / total;
    let sentiment = 'neutral';
    if (score > 0.2) sentiment = 'positive';
    if (score < -0.2) sentiment = 'negative';

    return {
      sentiment,
      score: Math.round(score * 100) / 100,
      positiveCount,
      negativeCount
    };
  }

  /**
   * Analyze transcript segments with timestamps
   * @param {Array} segments - [{time, text}]
   * @returns {Array} - Analyzed segments with flags
   */
  analyzeTranscriptSegments(segments) {
    return segments.map(segment => {
      const profanity = this.analyzeProfanity(segment.text);
      const hateSpeech = this.analyzeHateSpeech(segment.text);
      const violence = this.analyzeViolence(segment.text);
      const drugs = this.analyzeDrugContent(segment.text);
      const sexual = this.analyzeSexualContent(segment.text);
      const sentiment = this.analyzeSentiment(segment.text);

      const flagged = profanity.score > 0.1 || 
                      hateSpeech.score > 0.1 || 
                      violence.score > 0.3 ||
                      drugs.score > 0.2 ||
                      sexual.score > 0.2;

      // Determine primary category if flagged
      let category = null;
      let maxScore = 0;
      
      const categories = [
        { name: 'profanity', score: profanity.score },
        { name: 'hate_speech', score: hateSpeech.score },
        { name: 'violence', score: violence.score },
        { name: 'drug_use', score: drugs.score },
        { name: 'sexual_content', score: sexual.score }
      ];

      categories.forEach(cat => {
        if (cat.score > maxScore) {
          maxScore = cat.score;
          category = cat.name;
        }
      });

      return {
        ...segment,
        flagged,
        category: flagged ? category : null,
        scores: {
          profanity: profanity.score,
          hate_speech: hateSpeech.score,
          violence: violence.score,
          drug_use: drugs.score,
          sexual_content: sexual.score
        },
        flaggedWords: [
          ...profanity.flaggedWords,
          ...hateSpeech.flaggedPhrases,
          ...violence.flaggedWords,
          ...drugs.flaggedWords,
          ...sexual.flaggedWords
        ],
        sentiment: sentiment.sentiment
      };
    });
  }

  /**
   * Generate overall text analysis scores
   */
  aggregateTextScores(analyzedSegments) {
    if (!analyzedSegments.length) {
      return {
        profanity: 0,
        hate_speech: 0,
        violence: 0,
        drug_use: 0,
        sexual_content: 0
      };
    }

    // Use max scores (worst case) with weighted average
    const scores = {
      profanity: 0,
      hate_speech: 0,
      violence: 0,
      drug_use: 0,
      sexual_content: 0
    };

    analyzedSegments.forEach(seg => {
      Object.keys(scores).forEach(key => {
        scores[key] = Math.max(scores[key], seg.scores[key] || 0);
      });
    });

    // Round scores
    Object.keys(scores).forEach(key => {
      scores[key] = Math.round(scores[key] * 100) / 100;
    });

    return scores;
  }

  /**
   * Get flagged timeline events from text analysis
   */
  getTextTimeline(analyzedSegments) {
    return analyzedSegments
      .filter(seg => seg.flagged)
      .map(seg => ({
        start: seg.time,
        end: seg.time + 3, // Approximate 3-second window
        category: seg.category,
        score: Math.max(...Object.values(seg.scores)),
        excerpt: seg.text.substring(0, 100),
        note: `Flagged words: ${seg.flaggedWords.slice(0, 5).join(', ')}`
      }));
  }

  getVersion() {
    return this.version;
  }
}

module.exports = new TextAnalysisService();
