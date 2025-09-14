'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface TestScore {
  testTitle: string
  subject: string
  score: number
  maxScore: number
  date: string
}

interface StudentPerformanceChartProps {
  testScores: TestScore[]
  className?: string
}

export default function StudentPerformanceChart({
  testScores,
  className = ''
}: StudentPerformanceChartProps) {
  // Sort test scores by date
  const sortedScores = [...testScores].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Prepare data for the chart
  const labels = sortedScores.map(score => {
    const date = new Date(score.date)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  })

  const scores = sortedScores.map(score => score.score)
  const maxScores = sortedScores.map(score => score.maxScore)
  const percentages = sortedScores.map(score =>
    Math.round((score.score / score.maxScore) * 100)
  )

  const data = {
    labels,
    datasets: [
      {
        label: 'Score',
        data: scores,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'rgb(59, 130, 246)',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'Max Score',
        data: maxScores,
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
        pointBackgroundColor: 'rgb(156, 163, 175)',
        pointBorderColor: 'rgb(156, 163, 175)',
        pointBorderWidth: 2,
        pointRadius: 3,
      }
    ]
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      title: {
        display: true,
        text: 'Test Performance Over Time',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const index = context.dataIndex
            const score = scores[index]
            const maxScore = maxScores[index]
            const percentage = percentages[index]
            const testTitle = sortedScores[index].testTitle
            const subject = sortedScores[index].subject

            if (context.datasetIndex === 0) {
              return [
                `Test: ${testTitle}`,
                `Subject: ${subject}`,
                `Score: ${score}/${maxScore} (${percentage}%)`
              ]
            } else {
              return `Max Score: ${maxScore}`
            }
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Score'
        },
        ticks: {
          callback: function(value) {
            return value.toString()
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Test Date'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 8,
      }
    }
  }

  if (testScores.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center ${className}`}>
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Data Available</h3>
        <p className="text-gray-600">Complete some tests to see your performance chart.</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="h-80">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}