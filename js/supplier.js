class SupplierDashboard {
    constructor() {
        this.charts = {};
        this.bindNav();
        this.loadDashboard();
        this.updateNotifCount();
    }

    bindNav() {
        $('#dashboardLink').on('click',          (e) => { e.preventDefault(); this.loadDashboard(); });
        $('#viewStocksLink').on('click',         (e) => { e.preventDefault(); this.loadMyStocks(); });
        $('#requestNotifLink').on('click',       (e) => { e.preventDefault(); this.loadNotifications(); this.updateNotifCount(); });
        $('#transactionHistoryLink').on('click', (e) => { e.preventDefault(); this.loadTransactions(); });
    }

    destroyCharts() {
        for (let key in this.charts) {
            if (this.charts[key]) this.charts[key].destroy();
        }
        this.charts = {};
    }

    render(html) {
        this.destroyCharts();
        $('#contentArea').hide().html(html).fadeIn(220);
    }

    updateNotifCount() {
        $.ajax({
            url     : '../php/request_crud.php',
            method  : 'GET',
            data    : { action: 'notif_count' },
            dataType: 'json',
            success : (data) => {
                let count = data.success ? data.count : 0;
                $('#notifCount').text(count).toggle(count > 0);
            }
        });
    }

    loadDashboard() {
        setActive('dashboardLink');
        this.destroyCharts();
        $('#contentArea').html('<div class="empty-state"><p>Loading dashboard…</p></div>');

        $.when(
            $.ajax({ url: '../php/request_crud.php',        method: 'GET', data: { action: 'read', filter: 'supplier' }, dataType: 'json' }),
            $.ajax({ url: '../php/supplier_stock_crud.php', method: 'GET', data: { action: 'read' }, dataType: 'json' })
        ).then((requestsRes, stocksRes) => {
            let rows   = requestsRes[0].success ? requestsRes[0].data : [];
            let stocks = stocksRes[0].success   ? stocksRes[0].data  : [];

            let counts     = { Approved: 0, 'Out for Delivery': 0, Delivered: 0, Rejected: 0 };
            let totalValue = 0;

            for (let i = 0; i < rows.length; i++) {
                let r = rows[i];
                if (counts.hasOwnProperty(r.status)) counts[r.status]++;
                if (r.status === 'Delivered') {
                    totalValue += parseFloat(r.unit_price) * parseInt(r.quantity);
                }
            }

            let recentOrders = [];
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].status !== 'Delivered' && rows[i].status !== 'Rejected') {
                    recentOrders.push(rows[i]);
                }
                if (recentOrders.length >= 5) break;
            }

            let badgeMap = {
                'Pending Admin Approval': 'badge-pending',
                'Approved'              : 'badge-approved',
                'Declined'              : 'badge-declined',
                'Out for Delivery'      : 'badge-delivery',
                'Delivered'             : 'badge-delivered',
                'Rejected'              : 'badge-rejected'
            };

            let recentRows = '';
            if (recentOrders.length === 0) {
                recentRows =
                    '<tr><td colspan="6" style="text-align:center;padding:24px;">' +
                    '<span class="text-muted text-sm">No pending orders at the moment.</span></td></tr>';
            } else {
                for (let i = 0; i < recentOrders.length; i++) {
                    let r         = recentOrders[i];
                    let badge     = badgeMap[r.status] || '';
                    let date      = (r.created_at || '').substring(0, 10);
                    let actionBtn = '';

                    if (r.status === 'Approved') {
                        actionBtn =
                            '<div style="display:flex;gap:5px;">' +
                            '<button class="btn btn-sm btn-success acceptItem" data-id="' + r.item_id + '">Accept</button>' +
                            '<button class="btn btn-sm btn-danger rejectItem"  data-id="' + r.item_id + '">Reject</button>' +
                            '</div>';
                    } else if (r.status === 'Out for Delivery') {
                        actionBtn = '<button class="btn btn-sm btn-primary deliverItem" data-id="' + r.item_id + '">Mark Delivered</button>';
                    } else {
                        actionBtn = '<span class="text-muted text-sm" style="font-style:italic;">Waiting…</span>';
                    }

                    recentRows +=
                        '<tr>' +
                        '<td><strong>' + escHtml(r.product_name) + '</strong></td>' +
                        '<td>' + escHtml(r.requested_by_name) + '</td>' +
                        '<td>' + r.quantity + '</td>' +
                        '<td><span class="text-muted text-sm">' + date + '</span></td>' +
                        '<td><span class="badge ' + badge + '">' + r.status + '</span></td>' +
                        '<td>' + actionBtn + '</td>' +
                        '</tr>';
                }
            }

            let html =
                '<div class="page-header">' +
                    '<div class="page-header-left">' +
                        '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">Dashboard</span></div>' +
                        '<h2>Dashboard</h2>' +
                        '<div class="sub">Welcome back, ' + escHtml(SESSION_USER_NAME) + '</div>' +
                    '</div>' +
                    '<div class="page-header-actions">' +
                        '<button class="btn btn-primary" onclick="openModal(\'addStockModal\')">Add Stock</button>' +
                    '</div>' +
                '</div>' +
                '<div class="stat-grid">' +
                    statCard(counts['Approved'],         'Pending Orders',    'stat-yellow') +
                    statCard(counts['Out for Delivery'], 'Out for Delivery',  'stat-blue')   +
                    statCard(counts['Delivered'],        'Delivered',         'stat-green')  +
                    statCard(counts['Rejected'],         'Rejected',          'stat-red')    +
                    statCard(formatPrice(totalValue),    'Revenue Delivered', 'stat-indigo') +
                '</div>' +
                '<div class="charts-container">' +
                    '<div class="chart-card"><h3>Product Stock Levels</h3><canvas id="stockBarChart"></canvas></div>' +
                    '<div class="chart-card"><h3>Best Requested Products</h3><canvas id="bestRequestedChart"></canvas></div>' +
                '</div>' +
                '<div class="page-header mt-2">' +
                    '<div class="page-header-left">' +
                        '<h2>Pending Orders</h2>' +
                        '<div class="sub">Orders that need your attention</div>' +
                    '</div>' +
                    '<button class="btn btn-ghost btn-sm" onclick="$(\'#requestNotifLink\').click()">View All →</button>' +
                '</div>' +
                '<div class="table-wrap"><table>' +
                '<thead><tr>' +
                '<th>Product</th><th>Requested By</th><th>Qty</th><th>Date</th><th>Status</th><th>Action</th>' +
                '</tr></thead>' +
                '<tbody>' + recentRows + '</tbody>' +
                '</table></div>';

            this.render(html);

            // Render charts after DOM is updated
            setTimeout(() => renderSupplierCharts(this.charts, stocks, rows, counts), 100);
        });
    }

    loadMyStocks() {
        setActive('viewStocksLink');

        $.ajax({
            url     : '../php/supplier_stock_crud.php',
            method  : 'GET',
            data    : { action: 'read' },
            dataType: 'json',
            success : (data) => {
                let stocks = data.success ? data.data : [];
                let rows   = '';

                for (let i = 0; i < stocks.length; i++) {
                    let p = stocks[i];
                    rows +=
                        '<tr data-name="' + escHtml(p.name).toLowerCase() + '">' +
                        '<td><span class="font-bold" style="color:#6366f1">#' + p.id + '</span></td>' +
                        '<td><strong>' + escHtml(p.name) + '</strong></td>' +
                        '<td><span class="text-sm text-muted">' + escHtml(p.description || '—') + '</span></td>' +
                        '<td>' + formatPrice(p.price) + '</td>' +
                        '<td>' +
                            '<span class="font-bold">' + p.stock + '</span>' +
                            (parseInt(p.stock) <= 5
                                ? ' <span class="badge badge-low" style="margin-left:6px;">Low</span>'
                                : '') +
                        '</td>' +
                        '<td>' +
                            '<div style="display:flex;gap:5px;">' +
                                '<button class="btn btn-sm btn-warning editStockBtn"' +
                                    ' data-id="'    + p.id             + '"' +
                                    ' data-name="'  + escHtml(p.name)  + '"' +
                                    ' data-price="' + p.price          + '"' +
                                    ' data-stock="' + p.stock          + '">Edit</button>' +
                                '<button class="btn btn-sm btn-danger deleteStockBtn"' +
                                    ' data-id="'   + p.id             + '"' +
                                    ' data-name="' + escHtml(p.name)  + '">Delete</button>' +
                            '</div>' +
                        '</td>' +
                        '</tr>';
                }

                let html =
                    '<div class="page-header">' +
                        '<div class="page-header-left">' +
                            '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">My Stocks</span></div>' +
                            '<h2>My Stocks</h2>' +
                            '<div class="sub">' + stocks.length + ' product(s)</div>' +
                        '</div>' +
                        '<div class="page-header-actions">' +
                            '<button class="btn btn-primary" onclick="openModal(\'addStockModal\')">Add Stock</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="filter-bar">' +
                        '<input type="search" id="stockSearch" placeholder="Search stocks…">' +
                    '</div>' +
                    '<div class="table-wrap"><table>' +
                    '<thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>' +
                    '<tbody id="stockTableBody">' +
                    (stocks.length
                        ? rows
                        : '<tr><td colspan="6">' + TableBuilder.emptyState('No Stocks', 'Add your products using the button above.') + '</td></tr>'
                    ) +
                    '</tbody></table></div>';

                this.render(html);

                $('#stockSearch').on('input', function () {
                    let s = $(this).val().toLowerCase();
                    $('#stockTableBody tr').each(function () {
                        $(this).toggle(!s || $(this).data('name').includes(s));
                    });
                });
            }
        });
    }

    loadNotifications() {
        setActive('requestNotifLink');

        $.ajax({
            url     : '../php/request_crud.php',
            method  : 'GET',
            data    : { action: 'read', filter: 'supplier' },
            dataType: 'json',
            success : (data) => {
                this.render(
                    '<div class="page-header"><div class="page-header-left">' +
                    '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">Notifications</span></div>' +
                    '<h2>Request Notifications</h2></div></div>' +
                    buildRequestTable(data.data || [], 'Supplier')
                );
            }
        });
    }

    loadTransactions() {
        setActive('transactionHistoryLink');

        $.ajax({
            url     : '../php/request_crud.php',
            method  : 'GET',
            data    : { action: 'read', filter: 'supplier' },
            dataType: 'json',
            success : (data) => {
                this.render(
                    '<div class="page-header"><div class="page-header-left">' +
                    '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">Transactions</span></div>' +
                    '<h2>Transaction History</h2></div></div>' +
                    buildTransactionTable(data.data || [])
                );
            }
        });
    }
}

$(document).ready(function () {
    let dashboard = new SupplierDashboard();

    //Add Stock
    $('#addSupplierStockForm').on('submit', function (e) {
        e.preventDefault();
        hideFormError('addStockError');

        let name  = $('#supplier-product-name').val().trim();
        let desc  = $('#supplier-product-description').val().trim();
        let price = parseFloat($('#supplier-product-price').val());
        let stock = parseInt($('#supplier-product-stock').val());

        let err = FormValidator.required(name, 'Product name')  ||
                  FormValidator.required(desc, 'Description')    ||
                  FormValidator.positiveNumber(price, 'Price')   ||
                  FormValidator.minValue(stock, 0, 'Stock');
        if (err) { showFormError('addStockError', err); return; }

        $.ajax({
            url     : '../php/supplier_stock_crud.php',
            method  : 'POST',
            data    : { action: 'create', name, description: desc, price, stock },
            dataType: 'json',
            success : (data) => {
                if (data.success) {
                    closeModal('addStockModal');
                    $('#addSupplierStockForm')[0].reset();
                    showToast(data.message, 'success');
                    dashboard.loadMyStocks();
                } else {
                    showFormError('addStockError', data.message);
                }
            }
        });
    });

    $(document).on('click', '.editStockBtn', function () {
        $('#edit-stock-id').val($(this).data('id'));
        $('#edit-stock-name').val($(this).data('name'));
        $('#edit-stock-price').val(parseFloat($(this).data('price')).toFixed(2));
        $('#edit-stock-qty').val($(this).data('stock'));
        hideFormError('editStockError');
        openModal('editStockModal');
    });

    //Submit Edit Stock Form
    $('#editSupplierStockForm').on('submit', function (e) {
        e.preventDefault();
        hideFormError('editStockError');

        let id    = $('#edit-stock-id').val();
        let price = parseFloat($('#edit-stock-price').val());
        let stock = parseInt($('#edit-stock-qty').val());

        let err = FormValidator.positiveNumber(price, 'Price') ||
                  FormValidator.minValue(stock, 0, 'Stock');
        if (err) { showFormError('editStockError', err); return; }

        $.ajax({
            url     : '../php/supplier_stock_crud.php',
            method  : 'POST',
            data    : { action: 'update', id, price, stock },
            dataType: 'json',
            success : (data) => {
                if (data.success) {
                    closeModal('editStockModal');
                    showToast(data.message, 'success');
                    dashboard.loadMyStocks();
                } else {
                    showFormError('editStockError', data.message);
                }
            }
        });
    });

    //Delete Stock
    $(document).on('click', '.deleteStockBtn', function () {
        let id   = $(this).data('id');
        let name = $(this).data('name');

        showConfirm(
            'Delete "' + name + '" from your stocks? This cannot be undone.',
            () => {
                $.ajax({
                    url     : '../php/supplier_stock_crud.php',
                    method  : 'POST',
                    data    : { action: 'delete', id },
                    dataType: 'json',
                    success : (data) => {
                        showToast(data.message || (data.success ? 'Deleted.' : 'Failed.'), data.success ? 'success' : 'error');
                        if (data.success) dashboard.loadMyStocks();
                    }
                });
            },
            { title: 'Delete Stock', type: 'danger', confirmText: 'Yes, Delete' }
        );
    });

    $(document).on('click', '.acceptItem', function () {
        let id = $(this).data('id');
        showConfirm('Accept this order and mark Out for Delivery?',
            () => updateItemStatus(id, 'Out for Delivery', () => {
                dashboard.loadDashboard();
                dashboard.updateNotifCount();
            }),
            { title: 'Accept Order', type: 'success', confirmText: 'Yes, Accept' }
        );
    });

    $(document).on('click', '.rejectItem', function () {
        let id = $(this).data('id');
        showConfirm('Reject this order? The admin will be notified.',
            () => updateItemStatus(id, 'Rejected', () => {
                dashboard.loadDashboard();
                dashboard.updateNotifCount();
            }),
            { title: 'Reject Order', type: 'danger', confirmText: 'Yes, Reject' }
        );
    });

    $(document).on('click', '.deliverItem', function () {
        let id = $(this).data('id');
        showConfirm('Confirm delivery? Stock will be deducted and inventory updated.',
            () => updateItemStatus(id, 'Delivered', () => {
                dashboard.loadDashboard();
                dashboard.updateNotifCount();
            }),
            { title: 'Confirm Delivery', type: 'success', confirmText: 'Yes, Mark Delivered' }
        );
    });
});