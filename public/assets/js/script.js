function adjustSidebarAndLogo() {
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.header');
    const logoWrapper = document.querySelector('#logo-wrapper');
    const content = document.querySelector('#contentWrapper');


    // const leaveCardHeight = leaveCard.offsetHeight;
    // statisticCard.style.height = `${leaveCardHeight}px`;
    

    if (sidebar && header && logoWrapper) {
        const headerHeight = header.offsetHeight;
        sidebar.style.top = `${headerHeight}px`;

        const sidebarWidth = sidebar.offsetWidth;
        logoWrapper.style.width = `${sidebarWidth}px`;

        content.style.paddingTop = `${headerHeight}px`;
    } else {
        console.error('One or more elements not found!');
    }
}

window.onload = adjustSidebarAndLogo;
window.onresize = adjustSidebarAndLogo;




const dataAtt = {
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    datasets: [
        {
            label: 'JANUARY',
            data: [100, 33, 70, 100, 90, 100], // Y-axis data
            borderJoinStyle: 'round',
            borderColor: 'rgb(2, 76, 114)', 
            pointBackgroundColor: 'rgb(2, 76, 114)', 
            pointBorderColor: 'rgb(233, 242, 255)',
            pointBorderWidth: 5, 
            pointRadius: 7, 
            pointHoverRadius: 8, 
            fill: false, 
            tension: 0.2
        }
    ]
};
const configAtt = {
    type: 'line',
    data: dataAtt,
    options: {
        responsive: true,
        maintainAspectRatio: false,  
        transitions: {
            zoom: {
                animation: {
                    duration: 0
                }
            },
            resize: {
                animation: {
                    duration: 0  // This specifically prevents resize/zoom animations
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: true,
                    drawBorder: true,
                    lineWidth: 1,
                    borderDash: [5, 5],
                    color: 'rgba(0, 0, 0, 0.3)'
                },
                border: {
                    dash: [5, 5] 
                }
            },
            y: {
                grid: {
                    display: true,
                    drawBorder: true,
                    lineWidth: 1,
                    borderDash: [5, 5],
                    color: 'rgba(0, 0, 0, 0.3)'
                },
                border: {
                    dash: [5, 5]  // This is what makes the axis line dashed
                },
                beginAtZero: true, 
                ticks: {
                    stepSize: 20, 
                    callback: function(value) {
                        return value; 
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false 
            },
            zoom: {
                zoom: {
                    wheel: {
                        enabled: false  // Disable wheel zooming
                    },
                    pinch: {
                        enabled: false  // Disable pinch zooming
                    },
                    mode: 'none'
                }
            }
        },
        elements: {
            point: {
                radius: 6, 
                hoverRadius: 8,
                borderWidth: 2, 
                backgroundColor: 'rgb(2, 76, 114)', 
                borderColor: 'white' 
            }
        }
    }
};
const ctxAtt = document.getElementById('attChart').getContext('2d');
new Chart(ctxAtt, configAtt);


const DATA_COUNT = 5;
const NUMBER_CFG = {count: DATA_COUNT, min: 0, max: 100};
[100, 33, 70, 100, 90, 100]
const Utils = { 
    CHART_COLORS: {
        woman: 'rgb(255, 99, 132)',
        man: 'rgb(3, 110, 155)'
    }
};
const dataEm = {
    labels: ['Woman Percentages', 'Man Percentages'],
    datasets: [
        {
            label: 'Employee',
            data: [56, 44],
            backgroundColor: Object.values(Utils.CHART_COLORS),
        }
    ]
};
const configEm = {
    type: 'pie',
    data: dataEm,
    options: {
      responsive: true,
      plugins: {
        legend: {
            display: false,
        },
      }
    },
  };


const ctxEm = document.getElementById('emChart').getContext('2d');
new Chart(ctxEm, configEm);




