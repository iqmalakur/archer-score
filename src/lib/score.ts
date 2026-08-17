import { Practice } from "./db";

export interface ScoreSummary {
  maxScore: number;
  totalScore: number;
  percentage: number;
  isPassed: boolean;
}

export function calculateScore(
  practice: Practice,
  minimumPassedScore: number = 50,
): ScoreSummary {
  const { targetScores, userScores, arrowCount, endCount } = practice;
  const maxScore =
    targetScores && targetScores.length > 0
      ? Math.max(...targetScores) * arrowCount * endCount
      : 0;

  const totalScore = userScores
    ? userScores.flat().reduce((acc, score) => acc + score, 0)
    : 0;

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const isPassed = percentage > minimumPassedScore;

  return {
    maxScore,
    totalScore,
    percentage,
    isPassed,
  };
}
