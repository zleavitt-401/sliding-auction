/**
 * PriceGraph Component
 * Real-time price visualization using Chart.js
 */

import { formatPrice } from '../utils/formatters.js';

const { useEffect, useRef } = React;

/**
 * Price graph component
 * @param {Object} props - Component props
 * @param {Array} props.priceHistory - Array of price history points
 * @param {number} props.currentPrice - Current auction price
 * @param {number} props.floorPrice - Floor price
 * @param {number} props.startingPrice - Starting price
 * @returns {JSX.Element} Price graph
 */
export function PriceGraph({ priceHistory = [], currentPrice, floorPrice, startingPrice }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');

    // Destroy existing chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Prepare data
    const chartData = priceHistory.map(point => ({
      x: point.timestamp?.toMillis ? point.timestamp.toMillis() : point.timestamp,
      y: point.price / 100 // Convert cents to dollars
    }));

    // Add current price as the latest point if not already in history
    if (currentPrice && chartData.length > 0) {
      const lastPoint = chartData[chartData.length - 1];
      const currentPriceInDollars = currentPrice / 100;

      if (lastPoint.y !== currentPriceInDollars) {
        chartData.push({
          x: Date.now(),
          y: currentPriceInDollars
        });
      }
    }

    // Create chart
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Price',
            data: chartData,
            borderColor: 'rgb(230, 57, 70)', // auction-red
            backgroundColor: 'rgba(230, 57, 70, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4, // Smooth curves
            pointRadius: 0, // Hide points for cleaner look
            pointHoverRadius: 6,
            pointHoverBackgroundColor: 'rgb(230, 57, 70)',
            pointHoverBorderColor: 'white',
            pointHoverBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 300,
          easing: 'easeInOutQuad'
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgb(230, 57, 70)',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              title: (context) => {
                const date = new Date(context[0].parsed.x);
                return date.toLocaleTimeString();
              },
              label: (context) => {
                return `Price: $${context.parsed.y.toFixed(2)}`;
              }
            }
          },
          annotation: {
            annotations: {
              // Current price line
              currentPriceLine: currentPrice ? {
                type: 'line',
                yMin: currentPrice / 100,
                yMax: currentPrice / 100,
                borderColor: 'rgb(69, 123, 157)', // shield-blue
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  display: true,
                  content: `Current: ${formatPrice(currentPrice)}`,
                  position: 'end',
                  backgroundColor: 'rgb(69, 123, 157)',
                  color: 'white',
                  padding: 6,
                  font: {
                    size: 11,
                    weight: 'bold'
                  }
                }
              } : undefined,
              // Floor price line
              floorPriceLine: floorPrice ? {
                type: 'line',
                yMin: floorPrice / 100,
                yMax: floorPrice / 100,
                borderColor: 'rgb(220, 53, 69)', // red
                borderWidth: 2,
                label: {
                  display: true,
                  content: `Floor: ${formatPrice(floorPrice)}`,
                  position: 'start',
                  backgroundColor: 'rgb(220, 53, 69)',
                  color: 'white',
                  padding: 6,
                  font: {
                    size: 11,
                    weight: 'bold'
                  }
                }
              } : undefined,
              // Floor zone (red background below floor)
              floorZone: floorPrice ? {
                type: 'box',
                yMin: 0,
                yMax: floorPrice / 100,
                backgroundColor: 'rgba(220, 53, 69, 0.05)',
                borderWidth: 0
              } : undefined
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm',
                second: 'HH:mm:ss'
              }
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: '#6C757D',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6
            }
          },
          y: {
            beginAtZero: false,
            suggestedMin: floorPrice ? (floorPrice / 100) * 0.9 : undefined,
            suggestedMax: startingPrice ? (startingPrice / 100) * 1.05 : undefined,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: '#6C757D',
              callback: function(value) {
                return '$' + value.toFixed(2);
              }
            }
          }
        }
      },
      plugins: [{
        // Custom plugin to register annotation plugin
        id: 'chartjs-plugin-annotation'
      }]
    });

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [priceHistory, currentPrice, floorPrice, startingPrice]);

  return html`
    <div class="price-graph">
      <canvas ref=${canvasRef} id="price-chart"></canvas>
    </div>
  `;
}
