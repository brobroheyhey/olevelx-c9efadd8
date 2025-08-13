// Anki-style SM2 Spaced Repetition Algorithm Implementation

// Card states in the learning process
export const CARD_STATES = {
  NEW: 'new',
  LEARNING: 'learning', 
  REVIEW: 'review',
  LAPSED: 'lapsed'
} as const;

export type CardState = typeof CARD_STATES[keyof typeof CARD_STATES];

// SM2 Rating values mapped to Anki quality scale
export const SM2_RATINGS = {
  AGAIN: 0,  // Complete blackout (quality 0-1)
  HARD: 1,   // Incorrect response, but remembered upon seeing answer (quality 2)
  GOOD: 2,   // Correct response with some hesitation (quality 3-4) 
  EASY: 3    // Perfect response (quality 5)
} as const;

export type SM2Rating = typeof SM2_RATINGS[keyof typeof SM2_RATINGS];

// Anki default settings
export const ANKI_DEFAULTS = {
  // Learning steps in minutes
  LEARNING_STEPS: [1, 10, 5*60], // 1 min, 10 min, 5 hours
  // Lapse steps in minutes  
  LAPSE_STEPS: [10],
  // Initial ease factor (250% = 2.5)
  INITIAL_EASE: 2.5,
  // Minimum ease factor
  MIN_EASE: 1.3,
  // Ease factor changes
  EASE_AGAIN: -0.2,
  EASE_HARD: -0.15, 
  EASE_GOOD: 0,
  EASE_EASY: 0.15,
  // Interval multipliers
  HARD_INTERVAL_MULTIPLIER: 1.2,
  EASY_INTERVAL_MULTIPLIER: 1.3,
  // Leech threshold (number of lapses)
  LEECH_THRESHOLD: 8,
  // Interval fuzzing range (5% = 0.05)
  FUZZ_RANGE: 0.05
} as const;

export interface AnkiCardProgress {
  state: CardState;
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  learning_step: number;
  next_review_date: string;
  is_leech?: boolean;
}

export interface AnkiSM2Result {
  state: CardState;
  easinessFactor: number;
  intervalDays: number;
  intervalMinutes: number;
  repetitions: number;
  lapses: number;
  learningStep: number;
  nextReviewDate: Date;
  isLeech: boolean;
  graduatedFromLearning?: boolean;
  staysInSession: boolean;
}

/**
 * Apply interval fuzzing to add randomness like Anki
 */
function fuzzInterval(interval: number): number {
  if (interval < 2) return interval;
  
  const fuzzRange = ANKI_DEFAULTS.FUZZ_RANGE;
  const min = Math.max(1, interval * (1 - fuzzRange));
  const max = interval * (1 + fuzzRange);
  
  return Math.round(min + Math.random() * (max - min));
}

/**
 * Convert minutes to days for learning/lapse intervals
 */
function minutesToDays(minutes: number): number {
  return Math.max(1, Math.round(minutes / (24 * 60)));
}

/**
 * Get actual interval in minutes for short-term scheduling
 */
function getIntervalMinutes(state: CardState, learningStep: number, rating: SM2Rating, currentIntervalDays: number, easeFactor: number): number {
  if (state === CARD_STATES.LEARNING || state === CARD_STATES.NEW) {
    if (rating === SM2_RATINGS.AGAIN) {
      return ANKI_DEFAULTS.LEARNING_STEPS[0];
    } else {
      // For learning cards, use the current learning step interval
      if (learningStep < ANKI_DEFAULTS.LEARNING_STEPS.length) {
        return ANKI_DEFAULTS.LEARNING_STEPS[learningStep];
      }
    }
  } else if (state === CARD_STATES.LAPSED) {
    if (rating === SM2_RATINGS.AGAIN) {
      return ANKI_DEFAULTS.LAPSE_STEPS[0];
    } else {
      const nextStep = learningStep + 1;
      if (nextStep < ANKI_DEFAULTS.LAPSE_STEPS.length) {
        return ANKI_DEFAULTS.LAPSE_STEPS[nextStep];
      }
    }
  }
  
  // Default to days converted to minutes
  return currentIntervalDays * 24 * 60;
}

/**
 * Calculate next review using Anki-style SM2 algorithm
 * @param rating - User's rating of the card (0-3)
 * @param currentProgress - Current progress data for the card
 * @returns New Anki SM2 parameters with state management
 */
export function calculateAnkiSM2(rating: SM2Rating, currentProgress?: AnkiCardProgress): AnkiSM2Result {
  // Initialize defaults for new cards
  const current = {
    state: currentProgress?.state || CARD_STATES.NEW,
    easiness_factor: currentProgress?.easiness_factor || ANKI_DEFAULTS.INITIAL_EASE,
    interval_days: currentProgress?.interval_days || 1,
    repetitions: currentProgress?.repetitions || 0,
    lapses: currentProgress?.lapses || 0,
    learning_step: currentProgress?.learning_step || 0,
    is_leech: currentProgress?.is_leech || false
  };

  let newState = current.state;
  let newEase = current.easiness_factor;
  let newInterval = current.interval_days;
  let newReps = current.repetitions;
  let newLapses = current.lapses;
  let newLearningStep = current.learning_step;
  let isLeech = current.is_leech;
  let graduatedFromLearning = false;

  // Handle different states and ratings
  switch (current.state) {
    case CARD_STATES.NEW:
    case CARD_STATES.LEARNING:
      if (rating === SM2_RATINGS.AGAIN) {
        // Reset to first learning step
        newState = CARD_STATES.LEARNING;
        newLearningStep = 0;
        newInterval = minutesToDays(ANKI_DEFAULTS.LEARNING_STEPS[0]);
      } else {
        // Advance through learning steps
        newLearningStep = current.learning_step + 1;
        
        if (newLearningStep >= ANKI_DEFAULTS.LEARNING_STEPS.length) {
          // Graduate to review
          newState = CARD_STATES.REVIEW;
          newReps = 1;
          newInterval = rating === SM2_RATINGS.EASY ? 4 : 1;
          graduatedFromLearning = true;
        } else {
          // Continue learning
          newState = CARD_STATES.LEARNING;
          newInterval = minutesToDays(ANKI_DEFAULTS.LEARNING_STEPS[newLearningStep]);
        }
      }
      break;

    case CARD_STATES.REVIEW:
      // Update ease factor
      switch (rating) {
        case SM2_RATINGS.AGAIN:
          newEase += ANKI_DEFAULTS.EASE_AGAIN;
          break;
        case SM2_RATINGS.HARD:
          newEase += ANKI_DEFAULTS.EASE_HARD;
          break;
        case SM2_RATINGS.GOOD:
          newEase += ANKI_DEFAULTS.EASE_GOOD;
          break;
        case SM2_RATINGS.EASY:
          newEase += ANKI_DEFAULTS.EASE_EASY;
          break;
      }
      
      // Ensure ease stays within bounds
      newEase = Math.max(ANKI_DEFAULTS.MIN_EASE, newEase);

      if (rating === SM2_RATINGS.AGAIN) {
        // Card lapsed
        newState = CARD_STATES.LAPSED;
        newLapses += 1;
        newLearningStep = 0;
        newInterval = minutesToDays(ANKI_DEFAULTS.LAPSE_STEPS[0]);
        
        // Check for leech
        if (newLapses >= ANKI_DEFAULTS.LEECH_THRESHOLD) {
          isLeech = true;
        }
      } else if (rating === SM2_RATINGS.HARD) {
        // Hard cards go back to relearning for 5 minutes
        newState = CARD_STATES.LEARNING;
        newLearningStep = 2; // Skip to 5-minute step (index 2)
        newInterval = minutesToDays(ANKI_DEFAULTS.LEARNING_STEPS[2]); // 5 hours, but will be overridden by minutes
      } else {
        // Successful review (GOOD or EASY)
        newReps += 1;
        
        if (rating === SM2_RATINGS.EASY) {
          newInterval = Math.round(current.interval_days * newEase * ANKI_DEFAULTS.EASY_INTERVAL_MULTIPLIER);
        } else { // GOOD
          newInterval = Math.round(current.interval_days * newEase);
        }
        
        // Apply fuzzing
        newInterval = fuzzInterval(newInterval);
      }
      break;

    case CARD_STATES.LAPSED:
      if (rating === SM2_RATINGS.AGAIN) {
        // Reset to first lapse step
        newLearningStep = 0;
        newInterval = minutesToDays(ANKI_DEFAULTS.LAPSE_STEPS[0]);
      } else {
        // Advance through lapse steps
        newLearningStep = current.learning_step + 1;
        
        if (newLearningStep >= ANKI_DEFAULTS.LAPSE_STEPS.length) {
          // Return to review with reduced interval
          newState = CARD_STATES.REVIEW;
          newInterval = Math.max(1, Math.round(current.interval_days * 0.5)); // 50% of previous interval
        } else {
          // Continue lapse steps
          newInterval = minutesToDays(ANKI_DEFAULTS.LAPSE_STEPS[newLearningStep]);
        }
      }
      break;
  }

  // Calculate actual interval in minutes
  const intervalMinutes = getIntervalMinutes(newState, newLearningStep, rating, newInterval, newEase);
  
  // Determine if card stays in current session (< 1 day = 1440 minutes)
  const staysInSession = intervalMinutes < 1440;

  // Calculate next review date
  const nextReviewDate = new Date();
  if (staysInSession) {
    nextReviewDate.setMinutes(nextReviewDate.getMinutes() + intervalMinutes);
  } else {
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  }

  return {
    state: newState,
    easinessFactor: Math.round(newEase * 100) / 100,
    intervalDays: newInterval,
    intervalMinutes,
    repetitions: newReps,
    lapses: newLapses,
    learningStep: newLearningStep,
    nextReviewDate,
    isLeech,
    graduatedFromLearning,
    staysInSession
  };
}

/**
 * Legacy SM2 function for backward compatibility
 */
export function calculateSM2(rating: SM2Rating, currentProgress?: AnkiCardProgress): AnkiSM2Result {
  return calculateAnkiSM2(rating, currentProgress);
}

/**
 * Get rating button configurations with explanations
 */
export const SM2_BUTTON_CONFIG = [
  {
    value: SM2_RATINGS.AGAIN,
    label: 'Again',
    variant: 'destructive' as const,
    description: 'Complete blackout - I had no idea'
  },
  {
    value: SM2_RATINGS.HARD,
    label: 'Hard',
    variant: 'outline' as const,
    description: 'Incorrect, but I remembered when I saw the answer'
  },
  {
    value: SM2_RATINGS.GOOD,
    label: 'Good',
    variant: 'secondary' as const,
    description: 'Correct response with some hesitation'
  },
  {
    value: SM2_RATINGS.EASY,
    label: 'Easy',
    variant: 'default' as const,
    description: 'Perfect response - I knew it instantly'
  }
] as const;