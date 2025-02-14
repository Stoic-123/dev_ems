
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('attendanceChart').getContext('2d');

    const attendanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent', 'Day left'],
            datasets: [{
                data: [18, 3, 9],
                backgroundColor: [
                    '#0077cc',  // Present - Blue
                    '#dc3545',  // Absent - Red
                    '#bdbdbd'   // Days left - Gray
                ],
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            cutout: '50%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label;
                        }
                    }
                }
            }
        },
        plugins: [{
            id: 'centerText',
            beforeDraw: function(chart) {
                const width = chart.width;
                const height = chart.height;
                const ctx = chart.ctx;
                ctx.restore();
                const fontSize = (height / 10).toFixed(2);
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.textBaseline = "middle";

                const text = "JAN";
                const textX = Math.round((width - ctx.measureText(text).width) / 2);
                const textY = height / 2;

                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }]
    });
});

// ========================

document.addEventListener("DOMContentLoaded", function() {
    const ctx = document.getElementById("salaryChart_6month").getContext("2d");

    const formatCurrency = function(value) {
        return "$" + value;
    };

    const data = {
        labels: ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE"],
        datasets: [
            {
                label: "Target Salary",
                data: [700, 700, 700, 700, 700, 700, 700, 700, 700, 700, 700, 700],
                backgroundColor: "#E5E7EB",
                borderRadius: {
                    topLeft: 32,
                    topRight: 32,
                    bottomLeft: 0,
                    bottomRight: 0
                },
                barPercentage: 0.2,
                categoryPercentage: 0.6,
                order: 2,
                yAxisID: 'y'
            },
            {
                label: "Actual Salary",
                data: [420, 480, 400, 490, 410, 500, 520, 410, 480, 380, 510, 600],
                backgroundColor: "#FB923C",
                borderRadius: {
                    topLeft: 32,
                    topRight: 32,
                    bottomLeft: 0,
                    bottomRight: 0
                },
                barPercentage: 0.2,
                categoryPercentage: 0.6,
                order: 1,
                yAxisID: 'y'
            }
        ]
    };

    const config = {
        type: "bar",
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 700,
                    ticks: {
                        stepSize: 100,
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        font: {
                            size: 14,
                            family: "system-ui",
                            weight: '600'
                        },
                        color: "#6B7280"
                    },
                    grid: {
                        color: "#F3F4F6",
                        drawBorder: false,
                        borderDash: [4, 4]
                    },
                    border: {
                        display: false
                    },
                    stacked: false
                },
                x: {
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            family: "system-ui",
                            weight: '600'
                        },
                        color: "#6B7280"
                    },
                    stacked: true
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: "rgba(17, 24, 39, 0.95)",
                    padding: {
                        top: 10,
                        right: 15,
                        bottom: 10,
                        left: 15
                    },
                    titleFont: {
                        size: 13,
                        family: "system-ui",
                        weight: '600'
                    },
                    bodyFont: {
                        size: 12,
                        family: "system-ui"
                    },
                    cornerRadius: 6,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;
                            return datasetLabel + ": " + formatCurrency(value);
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    };

    new Chart(ctx, config);
});

