// SM2 Spaced Repetition Algorithm Implementation
export interface SM2Result {
  easinessFactor: number;
  repetitionCount: number;
  intervalDays: number;
  nextReviewDate: Date;
}

export interface CardProgress {
  easiness_factor: number;
  repetition_count: number;
  interval_days: number;
  next_review_date: string;
}

// SM2 Rating values
export const SM2_RATINGS = {
  AGAIN: 0,  // Complete blackout
  HARD: 1,   // Incorrect response, but remembered upon seeing answer
  GOOD: 2,   // Correct response with some hesitation
  EASY: 3    // Perfect response
} as const;

export type SM2Rating = typeof SM2_RATINGS[keyof typeof SM2_RATINGS];

/**
 * Calculate next review parameters using SM2 algorithm
 * @param rating - User's rating of the card (0-3)
 * @param currentProgress - Current progress data for the card
 * @returns New SM2 parameters
 */
export function calculateSM2(rating: SM2Rating, currentProgress?: CardProgress): SM2Result {
  let easinessFactor = currentProgress?.easiness_factor || 2.5;
  let repetitionCount = currentProgress?.repetition_count || 0;
  let intervalDays = currentProgress?.interval_days || 1;

  // Update easiness factor based on rating
  if (rating >= 3) {
    // Correct response
    easinessFactor = easinessFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  } else {
    // Incorrect response
    easinessFactor = easinessFactor - 0.8 + 0.28 * rating - 0.02 * rating * rating;
  }

  // Ensure easiness factor stays within bounds
  easinessFactor = Math.max(1.3, easinessFactor);

  if (rating < 3) {
    // Incorrect response - reset repetition count and set short interval
    repetitionCount = 0;
    intervalDays = 1;
  } else {
    // Correct response - increment repetition count and calculate new interval
    repetitionCount += 1;
    
    if (repetitionCount === 1) {
      intervalDays = 1;
    } else if (repetitionCount === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easinessFactor);
    }
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

  return {
    easinessFactor: Math.round(easinessFactor * 100) / 100, // Round to 2 decimal places
    repetitionCount,
    intervalDays,
    nextReviewDate
  };
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