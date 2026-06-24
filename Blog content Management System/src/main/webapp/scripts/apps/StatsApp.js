import BlogAPI from '../api/BlogAPI.js';

export default class StatsApp {
    constructor() {
        this.api = new BlogAPI();
    }

    async init() {
         try {
             const stats = await this.api.getStats();
             this.renderStats(stats);
         } catch(e) {
             console.error('Failed to load stats', e);
         }
    }
    
    renderStats(stats) {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val !== undefined ? this.formatValue(val) : '0';
        };

        setVal('stat-presentations', stats.presentations);
        setVal('stat-views', stats.views);
        setVal('stat-reads', stats.reads);
        setVal('stat-likes', stats.likes);
        setVal('stat-followers', stats.followers);
        setVal('stat-subscribers', stats.subscribers);

        this.renderChart(stats);
    }

    renderChart(stats) {
        const ctx = document.getElementById('detailsChart');
        if (!ctx) return;

        // Mock Data Generation for "Forex" look (Last 30 days)
        const days = Array.from({length: 30}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // Generate data points that fluctuate like a stock chart
        let dataPoints = [];
        let cv = stats.views > 0 ? stats.views / 30 : 10;
        for (let i = 0; i < 30; i++) {
            let change = (Math.random() - 0.5) * (cv * 0.5); 
            cv = Math.max(0, cv + change);
            dataPoints.push(cv);
        }

        // Create Gradient
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(26, 137, 23, 0.5)'); // Green top
        gradient.addColorStop(1, 'rgba(26, 137, 23, 0.0)'); // Transparent bottom

        if (this.currentChart) {
            this.currentChart.destroy();
        }

        this.currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [{
                    label: 'Views',
                    data: dataPoints,
                    borderColor: '#1a8917', // Forex Green
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointRadius: 0, // Hide points for sleek look
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.1 // Slight curve, mostly straight lines
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleFont: { size: 13 },
                        bodyFont: { size: 14, weight: 'bold' },
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `Views: ${Math.floor(context.raw)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            maxTicksLimit: 8,
                            color: '#757575'
                        }
                    },
                    y: {
                        grid: {
                            color: '#e0e0e0',
                            borderDash: [5, 5], // Dashed grid lines
                            drawBorder: false
                        },
                        ticks: {
                            color: '#757575',
                            callback: (value) => value >= 1000 ? (value/1000).toFixed(1) + 'k' : Math.floor(value)
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    formatValue(val) {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
        return val;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new StatsApp();
    app.init();
});
