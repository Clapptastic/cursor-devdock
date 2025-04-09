import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Card, Form } from 'react-bootstrap';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ResponseCountChart = ({ responses }) => {
  const [timeframe, setTimeframe] = useState('30d');
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  
  useEffect(() => {
    if (!responses || responses.length === 0) return;
    
    const processResponseData = () => {
      // Get date range
      const now = new Date();
      let startDate;
      
      switch (timeframe) {
        case '7d':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case '90d':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 90);
          break;
        case 'all':
          // Find earliest response date
          startDate = new Date(Math.min(...responses.map(r => new Date(r.created_at).getTime())));
          break;
        case '30d':
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
          break;
      }
      
      // Create date buckets based on the timeframe
      const dateFormat = { month: 'short', day: 'numeric' };
      const buckets = [];
      const labels = [];
      
      let currentDate = new Date(startDate);
      
      // Calculate the appropriate interval based on timeframe
      let interval = 1; // default to daily
      if (timeframe === 'all') {
        const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
        if (daysDiff > 90) {
          interval = 7; // weekly
        } else if (daysDiff > 30) {
          interval = 3; // every 3 days
        }
      }
      
      while (currentDate <= now) {
        const dateString = currentDate.toLocaleDateString('en-US', dateFormat);
        labels.push(dateString);
        buckets.push({
          date: new Date(currentDate),
          count: 0
        });
        
        // Advance to next interval
        currentDate.setDate(currentDate.getDate() + interval);
      }
      
      // Count responses in each bucket
      responses.forEach(response => {
        const responseDate = new Date(response.created_at);
        
        if (responseDate >= startDate) {
          // Find the appropriate bucket
          const bucketIndex = buckets.findIndex((bucket, i) => {
            return responseDate >= bucket.date && 
                  (i === buckets.length - 1 || responseDate < buckets[i + 1].date);
          });
          
          if (bucketIndex !== -1) {
            buckets[bucketIndex].count++;
          }
        }
      });
      
      // Calculate cumulative counts
      const cumulativeCounts = buckets.reduce((acc, bucket, i) => {
        const prevCount = i > 0 ? acc[i - 1] : 0;
        acc.push(prevCount + bucket.count);
        return acc;
      }, []);
      
      // Set chart data
      setChartData({
        labels,
        datasets: [
          {
            label: 'New Responses',
            data: buckets.map(b => b.count),
            borderColor: 'rgba(53, 162, 235, 1)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            tension: 0.4
          },
          {
            label: 'Cumulative',
            data: cumulativeCounts,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderDash: [5, 5],
            fill: true,
            tension: 0.4
          }
        ]
      });
    };
    
    processResponseData();
  }, [responses, timeframe]);
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };
  
  return (
    <div className="response-count-chart">
      <div className="d-flex justify-content-end mb-3">
        <Form.Select 
          size="sm" 
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="all">All Time</option>
        </Form.Select>
      </div>
      
      {responses.length === 0 ? (
        <div className="text-center py-4 text-muted">
          No data available for the selected timeframe
        </div>
      ) : (
        <Line data={chartData} options={options} height={80} />
      )}
    </div>
  );
};

ResponseCountChart.propTypes = {
  responses: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    created_at: PropTypes.string,
    completion_rate: PropTypes.number
  })).isRequired
};

export default ResponseCountChart; 