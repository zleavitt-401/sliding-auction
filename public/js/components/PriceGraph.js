/**
 * PriceGraph Component
 * Real-time price visualization using Chart.js
 */

import { formatPrice } from '../utils/formatters.js';
import { generatePredictedPricePoints } from '../utils/priceCalculations.js';

const { useEffect, useRef } = React;

/**
 * Price graph component
 * @param {Object} props - Component props
 * @param {Object} props.auction - Auction data (for predicted line generation)
 * @param {Array} props.priceHistory - Array of price history points
 * @param {number} props.currentPrice - Current auction price
 * @param {number} props.floorPrice - Floor price
 * @param {number} props.startingPrice - Starting price
 * @returns {JSX.Element} Price graph
 */
export function PriceGraph({ auction, priceHistory = [], currentPrice, floorPrice, startingPrice }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Effect 1: Create chart instance ONCE when component mounts
  useEffect(() => {
    if (!canvasRef.current || chartRef.current) return;

    const ctx = canvasRef.current.getContext('2d');

    // Create chart with initial empty data
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0, // Disable animation on updates to prevent jitter
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
            annotations: {}
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
        id: 'chartjs-plugin-annotation'
      }]
    });

    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []); // Empty dependency array - runs ONCE

  // Effect 2: Update chart data when props change
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;

    // Prepare data based on pricing mode
    const isTransparent = auction?.pricingMode === 'transparent';
    const datasets = [];

    // For transparent mode: show predicted line split into past (solid) and future (dashed)
    if (isTransparent && auction) {
      // Generate full predicted price line
      const predictedPoints = generatePredictedPricePoints(auction, 100);
      const now = Date.now();

      // Split points into past and future
      const pastPoints = predictedPoints.filter(p => p.x <= now);
      const futurePoints = predictedPoints.filter(p => p.x >= now);

      // Past portion (solid, darker) - where price has already traveled
      if (pastPoints.length > 0) {
        datasets.push({
          label: 'Price Path (Traveled)',
          data: pastPoints,
          borderColor: 'rgba(100, 100, 100, 0.7)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [], // Solid line
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 0
        });
      }

      // Future portion (dashed, lighter) - where price will go
      if (futurePoints.length > 0) {
        datasets.push({
          label: 'Predicted Price',
          data: futurePoints,
          borderColor: 'rgba(150, 150, 150, 0.4)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 0
        });
      }
    }

    // Actual price history (always shown)
    const chartData = priceHistory.map(point => ({
      x: point.timestamp?.toMillis ? point.timestamp.toMillis() : point.timestamp,
      y: point.price / 100 // Convert cents to dollars
    }));

    // Add current price as the latest point
    // This ensures the chart shows immediately even before server writes price history
    if (currentPrice) {
      const currentPriceInDollars = currentPrice / 100;

      if (chartData.length === 0) {
        // No history yet - add current price as first point
        chartData.push({
          x: Date.now(),
          y: currentPriceInDollars
        });
      } else {
        // Add current price if different from last history point
        const lastPoint = chartData[chartData.length - 1];
        if (lastPoint.y !== currentPriceInDollars) {
          chartData.push({
            x: Date.now(),
            y: currentPriceInDollars
          });
        }
      }
    }

    // For transparent mode: don't show the actual price line (the dashed prediction shows the path)
    // For algorithmic mode: show the actual price line since there's no prediction
    if (!isTransparent) {
      // Actual price line (red, bold) - only for algorithmic mode
      datasets.push({
        label: 'Actual Price',
        data: chartData,
        borderColor: 'rgb(230, 57, 70)', // auction-red
        backgroundColor: 'rgba(230, 57, 70, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(230, 57, 70)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 2
      });
    }

    // Current price marker (moving point)
    if (currentPrice) {
      datasets.push({
        label: 'Current',
        data: [{
          x: Date.now(),
          y: currentPrice / 100
        }],
        borderColor: 'rgb(69, 123, 157)', // shield-blue
        backgroundColor: 'rgb(69, 123, 157)',
        borderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 10,
        showLine: false // Just the point, no line
      });
    }

    // Update chart datasets
    chart.data.datasets = datasets;

    // Update Y-axis bounds
    chart.options.scales.y.min = floorPrice ? (floorPrice / 100) * 0.9 : undefined;
    chart.options.scales.y.max = startingPrice ? (startingPrice / 100) * 1.05 : undefined;

    // Update annotations
    chart.options.plugins.annotation.annotations = {
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
      // Use chart's y-axis min (floorPrice * 0.9) as yMin so zone doesn't extend beyond visible area
      floorZone: floorPrice ? {
        type: 'box',
        yMin: (floorPrice / 100) * 0.9,
        yMax: floorPrice / 100,
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderWidth: 0
      } : undefined
    };

    // Update chart without animation to prevent jitter
    chart.update('none');
  }, [auction, priceHistory, currentPrice, floorPrice, startingPrice]);

  return html`
    <div class="price-graph">
      <canvas ref=${canvasRef} id="price-chart"></canvas>
    </div>
  `;
}
