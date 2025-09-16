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

  // Generate continuous date range from first to last test date
  const generateDateRange = (scores: TestScore[]) => {
    if (scores.length === 0) return []
    
    const startDate = new Date(scores[0].date)
    const endDate = new Date(scores[scores.length - 1].date)
    const dateRange: Date[] = []
    
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dateRange
  }

  const dateRange = generateDateRange(sortedScores)

  // Create labels for all dates in the range
  const labels = dateRange.map(date => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  })

  // Map scores to dates, using null for missing dates
  const scores = dateRange.map(date => {
    const testOnDate = sortedScores.find(score => {
      const scoreDate = new Date(score.date)
      return scoreDate.toDateString() === date.toDateString()
    })
    return testOnDate ? testOnDate.score : null
  })

  const maxScores = dateRange.map(date => {
    const testOnDate = sortedScores.find(score => {
      const scoreDate = new Date(score.date)
      return scoreDate.toDateString() === date.toDateString()
    })
    return testOnDate ? testOnDate.maxScore : null
  })

  const percentages = dateRange.map((date, index) => {
    const score = scores[index]
    const maxScore = maxScores[index]
    if (score !== null && maxScore !== null) {
      return Math.round((score / maxScore) * 100)
    }
    return null
  })

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
        spanGaps: false,
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
        spanGaps: false,
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
            
            // Skip tooltip for null values (dates without tests)
            if (score === null || maxScore === null) {
              return ''
            }
            
            const testOnDate = sortedScores.find(score => {
              const scoreDate = new Date(score.date)
              const labelDate = dateRange[index]
              return scoreDate.toDateString() === labelDate.toDateString()
            })
            
            if (context.datasetIndex === 0) {
              return [
                `Test: ${testOnDate?.testTitle || 'Unknown'}`,
                `Subject: ${testOnDate?.subject || 'Unknown'}`,
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