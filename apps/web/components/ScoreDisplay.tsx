import { Score } from '../lib/types'

interface Props {
  score: Score
}

export function ScoreDisplay({ score }: Props) {
  const total = score.correct + score.incorrect
  const pct = total > 0 ? Math.round((score.correct / total) * 100) : null

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-green-600 font-medium">✓ {score.correct}</span>
      <span className="text-red-500 font-medium">✗ {score.incorrect}</span>
      {pct !== null && (
        <span className="text-gray-400">{pct}%</span>
      )}
    </div>
  )
}
