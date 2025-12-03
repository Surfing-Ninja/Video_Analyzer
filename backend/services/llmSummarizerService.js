/**
 * LLM Summarizer Service
 * Generates detailed human-friendly descriptions and content moderation reports
 */

const axios = require('axios');

class LLMSummarizerService {
  constructor() {
    this.version = 'llm-summarizer-v2.0-detailed';
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.useOpenAI = !!this.openaiApiKey;
  }

  /**
   * Generate detailed human-friendly summary
   */
  async generateDetailedSummary(analysisData) {
    if (this.useOpenAI) {
      try {
        return await this.generateWithOpenAI(analysisData);
      } catch (error) {
        console.error('OpenAI API error, falling back to detailed templates:', error.message);
        return this.generateDetailedWithTemplates(analysisData);
      }
    }
    return this.generateDetailedWithTemplates(analysisData);
  }

  /**
   * Backward compatible method
   */
  async generateSummary(analysisData) {
    return this.generateDetailedSummary(analysisData);
  }

  /**
   * Generate summary using OpenAI GPT
   */
  async generateWithOpenAI(analysisData) {
    const prompt = this.buildDetailedPrompt(analysisData);

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert content moderation AI. Analyze video analysis data and provide detailed, professional moderation reports. Be specific about what was detected, when it occurred, and why it matters. Your reports should be actionable and help human moderators make decisions.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0]?.message?.content;
    
    try {
      const result = JSON.parse(content);
      return {
        label: result.label || this.determineLabel(analysisData),
        description: result.description || this.generateDetailedDescription(analysisData),
        recommendedAction: result.recommended_action || this.determineAction(analysisData)
      };
    } catch {
      return {
        label: this.determineLabel(analysisData),
        description: content || this.generateDetailedDescription(analysisData),
        recommendedAction: this.determineAction(analysisData)
      };
    }
  }

  /**
   * Build detailed prompt for LLM
   */
  buildDetailedPrompt(analysisData) {
    return `Analyze this video content moderation data and provide a DETAILED report:

VIDEO METADATA:
- Duration: ${analysisData.duration || 0} seconds
- Resolution: ${analysisData.resolution?.width || 0}x${analysisData.resolution?.height || 0}
- Frames Analyzed: ${analysisData.frameCount || 0}
- Filename: ${analysisData.filename || 'unknown'}

CONTENT SAFETY SCORES (0-1 scale, higher = more concerning):
${JSON.stringify(analysisData.scores, null, 2)}

FLAGGED TIMELINE EVENTS (${analysisData.timeline?.length || 0} total):
${JSON.stringify(analysisData.timeline?.slice(0, 10), null, 2)}

DETECTED SCENES/OBJECTS:
${JSON.stringify([...new Set(analysisData.detectedScenes || [])].slice(0, 10), null, 2)}

TRANSCRIPT ANALYSIS:
- Total segments: ${analysisData.allTranscript?.length || 0}
- Flagged segments: ${analysisData.transcriptSnippets?.length || 0}
${analysisData.transcriptSnippets?.length > 0 ? 'Flagged content:\n' + JSON.stringify(analysisData.transcriptSnippets.slice(0, 5), null, 2) : 'No flagged speech detected'}

Provide your analysis as JSON:
{
  "label": "safe|neutral|review|flagged",
  "description": "Detailed 80-150 word analysis explaining: 1) What content was detected 2) Specific timestamps/locations 3) Severity assessment 4) Why this matters for moderation 5) Any patterns noticed",
  "recommended_action": "publish|age_restrict|manual_review|remove"
}`;
  }

  /**
   * Generate detailed summary using template-based approach (enhanced fallback)
   */
  generateDetailedWithTemplates(analysisData) {
    const label = this.determineLabel(analysisData);
    const description = this.generateDetailedDescription(analysisData);
    const recommendedAction = this.determineAction(analysisData);

    return {
      label,
      description,
      recommendedAction
    };
  }

  /**
   * Determine overall label based on scores - ENHANCED LOGIC
   */
  determineLabel(analysisData) {
    const { scores = {} } = analysisData;
    
    // Critical thresholds for immediate flagging
    if ((scores.nudity || 0) > 0.6) return 'flagged';
    if ((scores.violence || 0) > 0.7) return 'flagged';
    if ((scores.hate_speech || 0) > 0.5) return 'flagged';
    if ((scores.sexual_content || 0) > 0.6) return 'flagged';
    if ((scores.weapons || 0) > 0.7) return 'flagged';
    
    // Review thresholds
    const reviewCategories = ['nudity', 'violence', 'hate_speech', 'sexual_content', 'weapons', 'drug_use'];
    const needsReview = reviewCategories.some(cat => (scores[cat] || 0) > 0.3);
    
    if (needsReview) return 'review';
    
    // Neutral if any detection
    const hasAnyDetection = Object.values(scores).some(score => score > 0.1);
    if (hasAnyDetection) return 'neutral';
    
    // Check profanity separately (lower threshold for concern)
    if ((scores.profanity || 0) > 0.2) return 'neutral';
    
    return 'safe';
  }

  /**
   * Generate DETAILED human-readable description
   */
  generateDetailedDescription(analysisData) {
    const { 
      scores = {}, 
      timeline = [], 
      transcriptSnippets = [], 
      allTranscript = [],
      detectedObjects = [], 
      detectedScenes = [],
      duration = 0,
      frameCount = 0,
      resolution = {},
      filename = ''
    } = analysisData;
    
    const label = this.determineLabel(analysisData);
    const parts = [];

    // === HEADER ===
    const statusEmoji = {
      'safe': '✅',
      'neutral': '⚠️',
      'review': '🔍',
      'flagged': '🚫'
    };
    parts.push(`${statusEmoji[label] || '📊'} **Content Analysis Report**\n`);

    // === VIDEO INFO ===
    const minutes = Math.floor(duration / 60);
    const seconds = Math.round(duration % 60);
    const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    parts.push(`📹 Video: ${durationStr} duration, ${resolution.width || 0}x${resolution.height || 0} resolution, ${frameCount} frames analyzed.\n`);

    // === CONTENT CLASSIFICATION ===
    parts.push(`🏷️ **Classification: ${label.toUpperCase()}**\n`);

    // === DETAILED SCORE BREAKDOWN ===
    const significantScores = Object.entries(scores)
      .filter(([key, value]) => value > 0.05 && key !== 'overall_confidence')
      .sort((a, b) => b[1] - a[1]);

    if (significantScores.length > 0) {
      parts.push(`📊 **Detection Scores:**`);
      significantScores.forEach(([category, score]) => {
        const severity = this.getSeverityLevel(score);
        const categoryName = this.formatCategoryName(category);
        const bar = this.getScoreBar(score);
        parts.push(`  • ${categoryName}: ${bar} ${Math.round(score * 100)}% (${severity})`);
      });
      parts.push('');
    } else {
      parts.push(`📊 **Detection Scores:** No significant content flags detected.\n`);
    }

    // === TIMELINE ANALYSIS ===
    if (timeline.length > 0) {
      parts.push(`⏱️ **Timeline Analysis:** ${timeline.length} flagged moment(s) detected.`);
      
      // Group by category
      const byCategory = {};
      timeline.forEach(event => {
        if (!byCategory[event.category]) byCategory[event.category] = [];
        byCategory[event.category].push(event);
      });

      Object.entries(byCategory).forEach(([category, events]) => {
        const categoryName = this.formatCategoryName(category);
        const times = events.slice(0, 3).map(e => this.formatTimestamp(e.start)).join(', ');
        const maxScore = Math.max(...events.map(e => e.score));
        parts.push(`  • ${categoryName} at: ${times}${events.length > 3 ? ` (+${events.length - 3} more)` : ''} - Peak: ${Math.round(maxScore * 100)}%`);
      });
      parts.push('');
    }

    // === VISUAL CONTENT ANALYSIS ===
    if (detectedScenes.length > 0) {
      const uniqueScenes = [...new Set(detectedScenes)].slice(0, 5);
      parts.push(`🎬 **Visual Content:** ${uniqueScenes.join(', ')}.`);
    }

    if (detectedObjects.length > 0) {
      const uniqueObjects = [...new Set(detectedObjects.map(o => o.label || o))].slice(0, 8);
      parts.push(`🔍 **Detected Elements:** ${uniqueObjects.join(', ')}.`);
    }

    // === AUDIO/TRANSCRIPT ANALYSIS ===
    if (transcriptSnippets.length > 0) {
      parts.push(`\n🎤 **Audio Analysis:** ${transcriptSnippets.length} flagged speech segment(s).`);
      transcriptSnippets.slice(0, 3).forEach(seg => {
        const time = this.formatTimestamp(seg.time);
        const preview = seg.text.length > 50 ? seg.text.substring(0, 50) + '...' : seg.text;
        parts.push(`  • [${time}] "${preview}" (${seg.category || 'flagged'})`);
      });
    } else if (allTranscript.length > 0) {
      parts.push(`\n🎤 **Audio Analysis:** ${allTranscript.length} segments transcribed, no violations detected.`);
    }

    // === REASONING ===
    parts.push(`\n💡 **Assessment:**`);
    const reasoning = this.generateReasoning(scores, timeline, transcriptSnippets, label);
    parts.push(reasoning);

    // === RECOMMENDATION ===
    const action = this.determineAction(analysisData);
    const actionDescriptions = {
      'publish': '✅ **Recommendation: PUBLISH** - Content appears safe for general audience.',
      'age_restrict': '🔞 **Recommendation: AGE RESTRICT** - Content suitable for mature audiences only.',
      'manual_review': '👁️ **Recommendation: MANUAL REVIEW** - Human moderator should verify before publishing.',
      'remove': '🚫 **Recommendation: REMOVE** - Content likely violates community guidelines.'
    };
    parts.push(`\n${actionDescriptions[action]}`);

    // === CONFIDENCE ===
    const confidence = scores.overall_confidence || 0.7;
    parts.push(`\n📈 Analysis Confidence: ${Math.round(confidence * 100)}%`);

    return parts.join('\n');
  }

  /**
   * Generate reasoning for the assessment
   */
  generateReasoning(scores, timeline, transcriptSnippets, label) {
    const reasons = [];

    if (label === 'safe') {
      reasons.push('No concerning content patterns detected across visual and audio analysis.');
      reasons.push('All content safety scores are within acceptable thresholds.');
      return reasons.join(' ');
    }

    // Identify primary concerns
    const concerns = [];
    
    if ((scores.nudity || 0) > 0.3) {
      const severity = scores.nudity > 0.6 ? 'significant' : 'moderate';
      concerns.push(`${severity} nudity indicators (${Math.round(scores.nudity * 100)}%)`);
    }
    
    if ((scores.sexual_content || 0) > 0.3) {
      const severity = scores.sexual_content > 0.6 ? 'explicit' : 'suggestive';
      concerns.push(`${severity} sexual content (${Math.round(scores.sexual_content * 100)}%)`);
    }
    
    if ((scores.violence || 0) > 0.3) {
      const severity = scores.violence > 0.6 ? 'graphic' : 'moderate';
      concerns.push(`${severity} violence (${Math.round(scores.violence * 100)}%)`);
    }
    
    if ((scores.weapons || 0) > 0.3) {
      concerns.push(`weapons detected (${Math.round(scores.weapons * 100)}%)`);
    }
    
    if ((scores.hate_speech || 0) > 0.2) {
      concerns.push(`potential hate speech (${Math.round(scores.hate_speech * 100)}%)`);
    }
    
    if ((scores.profanity || 0) > 0.3) {
      concerns.push(`profane language (${Math.round(scores.profanity * 100)}%)`);
    }
    
    if ((scores.drug_use || 0) > 0.3) {
      concerns.push(`drug-related content (${Math.round(scores.drug_use * 100)}%)`);
    }

    if (concerns.length > 0) {
      reasons.push(`Primary concerns: ${concerns.join(', ')}.`);
    }

    // Timeline patterns
    if (timeline.length > 5) {
      reasons.push(`Multiple flagged moments (${timeline.length} events) suggest recurring problematic content.`);
    } else if (timeline.length > 0) {
      const firstTime = this.formatTimestamp(timeline[0].start);
      reasons.push(`First flag at ${firstTime}.`);
    }

    // Transcript issues
    if (transcriptSnippets.length > 0) {
      reasons.push(`${transcriptSnippets.length} audio segment(s) contain potentially violating content.`);
    }

    return reasons.join(' ') || 'Content requires review based on detected signals.';
  }

  /**
   * Get severity level string
   */
  getSeverityLevel(score) {
    if (score > 0.7) return 'HIGH';
    if (score > 0.4) return 'MEDIUM';
    if (score > 0.15) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Get visual score bar
   */
  getScoreBar(score) {
    const filled = Math.round(score * 10);
    const empty = 10 - filled;
    const color = score > 0.7 ? '🔴' : score > 0.4 ? '🟡' : '🟢';
    return color + '▓'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Format category name for display
   */
  formatCategoryName(category) {
    const names = {
      'nudity': '🔞 Nudity',
      'violence': '⚔️ Violence',
      'profanity': '🤬 Profanity',
      'hate_speech': '😠 Hate Speech',
      'sexual_content': '💋 Sexual Content',
      'drug_use': '💊 Drug Use',
      'weapons': '🔫 Weapons',
      'overall_confidence': '📊 Confidence'
    };
    return names[category] || category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Determine recommended action - ENHANCED LOGIC
   */
  determineAction(analysisData) {
    const { scores = {}, timeline = [] } = analysisData;
    
    // REMOVE: Extreme content
    if ((scores.nudity || 0) > 0.75) return 'remove';
    if ((scores.violence || 0) > 0.8) return 'remove';
    if ((scores.hate_speech || 0) > 0.6) return 'remove';
    if ((scores.sexual_content || 0) > 0.75) return 'remove';

    // MANUAL REVIEW: High flags or multiple concerns
    const highFlags = Object.values(scores).filter(s => s > 0.5).length;
    const moderateFlags = Object.values(scores).filter(s => s > 0.3).length;
    
    if (highFlags >= 1) return 'manual_review';
    if (moderateFlags >= 2) return 'manual_review';
    if (timeline.length > 10) return 'manual_review';

    // AGE RESTRICT: Moderate content
    if ((scores.nudity || 0) > 0.25) return 'age_restrict';
    if ((scores.violence || 0) > 0.35) return 'age_restrict';
    if ((scores.sexual_content || 0) > 0.3) return 'age_restrict';
    if ((scores.profanity || 0) > 0.4) return 'age_restrict';
    if ((scores.drug_use || 0) > 0.3) return 'age_restrict';
    if (moderateFlags === 1) return 'age_restrict';

    return 'publish';
  }

  /**
   * Format timestamp as MM:SS
   */
  formatTimestamp(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getVersion() {
    return this.version;
  }
}

module.exports = new LLMSummarizerService();
