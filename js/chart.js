function renderAdminCharts(chartInstances, allItems) {

    let statusCounts = {
        'Pending Admin Approval': 0,
        'Approved'              : 0,
        'Out for Delivery'      : 0,
        'Delivered'             : 0,
        'Declined'              : 0,
        'Rejected'              : 0
    };
    for (let i = 0; i < allItems.length; i++) {
        let s = allItems[i].status;
        if (statusCounts.hasOwnProperty(s)) statusCounts[s]++;
    }

    chartInstances.statusDonut = new Chart($('#statusDonutChart')[0], {
        type: 'doughnut',
        data: {
            labels  : Object.keys(statusCounts),
            datasets: [{
                data           : Object.values(statusCounts),
                backgroundColor: ['#f59e0b', '#6366f1', '#3b82f6', '#10b981', '#ef4444', '#dc2626'],
                borderWidth    : 0,
                hoverOffset    : 6
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } }
            },
            cutout: '0%'
        }
    });

    let productCounts = {};
    for (let i = 0; i < allItems.length; i++) {
        let name = allItems[i].product_name;
        productCounts[name] = (productCounts[name] || 0) + parseInt(allItems[i].quantity);
    }

    let sorted = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    chartInstances.topProducts = new Chart($('#topProductsChart')[0], {
        type: 'bar',
        data: {
            labels  : sorted.map(e => e[0]),
            datasets: [{
                label          : 'Units Requested',
                data           : sorted.map(e => e[1]),
                backgroundColor: 'rgba(99,102,241,0.8)',
                borderRadius   : 6,
                borderSkipped  : false
            }]
        },
        options: {
            scales : { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } } },
            plugins: { legend: { display: false } }
        }
    });

    let monthlyMap = {};
    for (let i = 0; i < allItems.length; i++) {
        let raw   = allItems[i].created_at || '';
        let parts = raw.substring(0, 7);
        if (!parts || parts.length < 7) continue;
        monthlyMap[parts] = (monthlyMap[parts] || 0) + 1;
    }

    let monthKeys   = Object.keys(monthlyMap).sort();
    let monthLabels = monthKeys.map(function (ym) {
        let d = new Date(ym + '-01');
        return d.toLocaleString('en-PH', { month: 'short', year: 'numeric' });
    });

    chartInstances.monthly = new Chart($('#monthlyChart')[0], {
        type: 'bar',
        data: {
            labels  : monthLabels.length ? monthLabels : ['No Data'],
            datasets: [{
                label          : 'Requests',
                data           : monthKeys.length ? monthKeys.map(k => monthlyMap[k]) : [0],
                backgroundColor: 'rgba(20,184,166,0.8)',
                borderRadius   : 6,
                barThickness   : 100,
                borderSkipped  : false
            }]
        },
        options: {
            scales : { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } } },
            plugins: { legend: { display: false } }
        }
    });
}

// js/staff-charts.js — Staff Dashboard Charts

function renderStaffCharts(chartInstances, items, pending, approved, outDelivery, delivered, declined, rejected) {

    let hasStatusData = (pending + approved + outDelivery + delivered + declined + rejected) > 0;

    chartInstances.status = new Chart($('#staffStatusChart')[0], {
        type: 'doughnut',
        data: {
            labels  : ['Pending', 'Approved', 'Out for Delivery', 'Delivered', 'Declined', 'Rejected'],
            datasets: [{
                data           : hasStatusData
                    ? [pending, approved, outDelivery, delivered, declined, rejected]
                    : [1],
                backgroundColor: hasStatusData
                    ? ['#f59e0b', '#6366f1', '#14b8a6', '#10b981', '#ef4444', '#dc2626']
                    : ['#e5e7eb'],
                borderWidth    : 0,
                hoverOffset    : 6
            }]
        },
        options: {
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            if (!hasStatusData) return ' No requests yet';
                            return ' ' + ctx.label + ': ' + ctx.parsed;
                        }
                    }
                }
            },
            cutout: '0%'
        }
    });

    let productCounts = {};
    for (let i = 0; i < items.length; i++) {
        let name = items[i].product_name;
        productCounts[name] = (productCounts[name] || 0) + parseInt(items[i].quantity);
    }

    let sorted       = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let hasProductData = sorted.length > 0;

    chartInstances.products = new Chart($('#staffProductChart')[0], {
        type: 'bar',
        data: {
            labels  : hasProductData ? sorted.map(e => e[0]) : ['No Data'],
            datasets: [{
                label          : 'Units Requested',
                data           : hasProductData ? sorted.map(e => e[1]) : [0],
                backgroundColor: 'rgba(99,102,241,0.8)',
                borderRadius   : 6,
                borderSkipped  : false
            }]
        },
        options: {
            scales : { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } } },
            plugins: { legend: { display: false } }
        }
    });
}

// Supplier Dashboard Charts

function renderSupplierCharts(chartInstances, stocks, rows, counts) {

    let stockCtx = document.getElementById('stockBarChart');
    if (!stockCtx) return;

    let sortedStocks = stocks.slice().sort((a, b) => parseInt(a.stock) - parseInt(b.stock));
    let top10        = sortedStocks.slice(0, 10);

    if (top10.length === 0) {
        stockCtx.parentElement.innerHTML =
            '<h3>Product Stock Levels</h3>' +
            '<div class="empty-state" style="padding:30px 0;"><p>No stock data yet.</p></div>';
    } else {

        let barcodeColors = top10.map(function (p) {
            let s = parseInt(p.stock);
            if (s <= 5)  return 'rgba(220,38,38,0.9)';
            if (s <= 15) return 'rgba(202,138,4,0.9)';   
            return 'rgba(17,24,39,0.85)';     
        });

        let borderColors = top10.map(function (p) {
            let s = parseInt(p.stock);
            if (s <= 5)  return 'rgba(185,28,28,1)';
            if (s <= 10) return 'rgba(161,98,7,1)';
            return 'rgba(0,0,0,0.7)';
        });

        chartInstances.stockBar = new Chart(stockCtx, {
            type: 'bar',
            data: {
                labels  : top10.map(p => p.name),
                datasets: [{
                    label          : 'Units in Stock',
                    data           : top10.map(p => parseInt(p.stock)),
                    backgroundColor: barcodeColors,
                    borderRadius   : 4,
                    borderSkipped  : false,
                    barThickness   : 100,
                    borderWidth    : 1,
                    borderColor    : borderColors
                }]
            },
            options: {
                scales: {
                    x: {
                        grid : { display: false },
                        ticks: { font: { size: 11 }, color: '#374151', maxRotation: 30, minRotation: 0 }
                    },
                    y: {
                        beginAtZero: true,
                        grid       : { color: 'rgba(0,0,0,0.06)', lineWidth: 1 },
                        ticks      : { font: { size: 11 }, stepSize: 1 }
                    }
                },
                plugins: {
                    legend : { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                let val   = ctx.parsed.y;
                                let level = val <= 5 ? ' ⚠ Critical' : val <= 15 ? ' Low' : ' OK';
                                return ' ' + val + ' units' + level;
                            }
                        }
                    }
                }
            }
        });
    }

    let bestCtx = document.getElementById('bestRequestedChart');
    if (!bestCtx) return;

    let productTally = {};
    for (let i = 0; i < rows.length; i++) {
        let name = rows[i].product_name;
        productTally[name] = (productTally[name] || 0) + parseInt(rows[i].quantity);
    }

    let sortedProducts = Object.entries(productTally)
        .sort(function (a, b) { return b[1] - a[1]; })
        .slice(0, 6);

    let hasProductData = sortedProducts.length > 0;

    if (!hasProductData) {
        bestCtx.parentElement.innerHTML =
            '<h3>Best Requested Products</h3>' +
            '<div class="empty-state" style="padding:30px 0;"><p>No request data yet.</p></div>';
    } else {
        // Gradient-like color palette for ranking
        let rankColors = [
            'rgba(99,102,241,0.9)',
            'rgba(139,92,246,0.85)',
            'rgba(59,130,246,0.85)',
            'rgba(20,184,166,0.8)',
            'rgba(245,158,11,0.8)',
            'rgba(239,68,68,0.8)'
        ];

        chartInstances.bestRequested = new Chart(bestCtx, {
            type: 'bar',
            data: {
                labels  : sortedProducts.map(e => e[0]),
                datasets: [{
                    label          : 'Total Units Requested',
                    data           : sortedProducts.map(e => e[1]),
                    backgroundColor: rankColors.slice(0, sortedProducts.length),
                    borderRadius   : 6,
                    barThickness   : 100,
                    borderSkipped  : false
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks      : { stepSize: 1 },
                        grid       : { color: 'rgba(0,0,0,0.04)' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 }, color: '#374151' }
                    }
                },
                plugins: {
                    legend : { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return ' ' + ctx.parsed.y + ' units requested';
                            }
                        }
                    }
                }
            }
        });
    }
}