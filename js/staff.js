class StaffDashboard {
    constructor() {
        this.charts = {};
        this.bindNav();
        this.loadDashboard();
    }

    bindNav() {
        $('#dashboardLink').on('click',    (e) => { e.preventDefault(); this.loadDashboard(); });
        $('#productsLink').on('click',     (e) => { e.preventDefault(); this.loadProducts(); });
        $('#viewRequestsLink').on('click', (e) => { e.preventDefault(); this.loadMyRequests(); });
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

    loadDashboard() {
        setActive('dashboardLink');
        this.render('<div class="empty-state"><p>Loading dashboard…</p></div>');

        $.ajax({
            url     : '../php/request_crud.php',
            method  : 'GET',
            data    : { action: 'read', filter: 'mine' },
            dataType: 'json',
            success : (data) => {
                let items = data.success ? data.data : [];

                let total       = items.length;
                let pending     = 0, approved = 0, delivered = 0;
                let declined    = 0, outDelivery = 0, rejected = 0;

                for (let i = 0; i < items.length; i++) {
                    let s = items[i].status;
                    if (s === 'Pending Admin Approval') pending++;
                    else if (s === 'Approved')          approved++;
                    else if (s === 'Out for Delivery')  outDelivery++;
                    else if (s === 'Delivered')         delivered++;
                    else if (s === 'Declined')          declined++;
                    else if (s === 'Rejected')          rejected++;
                }

                let recent = items.slice(0, 5);

                let badgeMap = {
                    'Pending Admin Approval': 'badge-pending',
                    'Approved'              : 'badge-approved',
                    'Declined'              : 'badge-declined',
                    'Out for Delivery'      : 'badge-delivery',
                    'Delivered'             : 'badge-delivered',
                    'Rejected'              : 'badge-rejected'
                };

                let recentRows = '';
                if (recent.length === 0) {
                    recentRows =
                        '<tr><td colspan="6" style="text-align:center;padding:28px;">' +
                        '<span class="text-muted text-sm">No requests submitted yet.</span>' +
                        '</td></tr>';
                } else {
                    for (let i = 0; i < recent.length; i++) {
                        let r         = recent[i];
                        let badge     = badgeMap[r.status] || '';
                        let date      = (r.created_at || '').substring(0, 10);
                        let itemTotal = formatPrice(parseFloat(r.unit_price) * parseInt(r.quantity));

                        recentRows +=
                            '<tr>' +
                            '<td><span class="font-bold text-sm" style="color:#6366f1">#' + r.item_id + '</span></td>' +
                            '<td><strong>' + escHtml(r.product_name) + '</strong></td>' +
                            '<td>' + r.quantity + '</td>' +
                            '<td><strong>' + itemTotal + '</strong></td>' +
                            '<td><span class="text-muted text-sm">' + date + '</span></td>' +
                            '<td><span class="badge ' + badge + '">' + r.status + '</span></td>' +
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
                            '<button class="btn btn-primary" onclick="openModal(\'requestStockModal\')">Request Stock</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="stat-grid">' +
                        statCard(total,               'Total Requests',      'stat-blue')   +
                        statCard(pending,             'Pending Approval',    'stat-yellow') +
                        statCard(approved,            'Approved',            'stat-purple') +
                        statCard(outDelivery,         'Out for Delivery',    'stat-teal')   +
                        statCard(delivered,           'Delivered',           'stat-green')  +
                        statCard(declined + rejected, 'Declined / Rejected', 'stat-red')    +
                    '</div>' +
                    '<div class="charts-container">' +
                        '<div class="chart-card"><h3>My Request Status Breakdown</h3><canvas id="staffStatusChart"></canvas></div>' +
                        '<div class="chart-card"><h3>My Top Requested Products</h3><canvas id="staffProductChart"></canvas></div>' +
                    '</div>' +
                    '<div class="page-header mt-2">' +
                        '<div class="page-header-left">' +
                            '<h2>Recent Requests</h2>' +
                            '<div class="sub">Your last 5 submitted requests</div>' +
                        '</div>' +
                        '<button class="btn btn-ghost btn-sm" onclick="$(\'#viewRequestsLink\').click()">View All →</button>' +
                    '</div>' +
                    '<div class="table-wrap"><table>' +
                    '<thead><tr><th>Req #</th><th>Product</th><th>Qty</th><th>Total</th><th>Date</th><th>Status</th></tr></thead>' +
                    '<tbody>' + recentRows + '</tbody>' +
                    '</table></div>';

                this.render(html);
                renderStaffCharts(this.charts, items, pending, approved, outDelivery, delivered, declined, rejected);
            }
        });
    }

    loadProducts() {
        setActive('productsLink');

        $.ajax({
            url     : '../php/product_crud.php',
            method  : 'GET',
            data    : { action: 'read' },
            dataType: 'json',
            success : (data) => {
                let products = data.success ? data.data : [];

                let headerHtml =
                    '<div class="page-header">' +
                        '<div class="page-header-left">' +
                            '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">Products</span></div>' +
                            '<h2>Available Products</h2>' +
                            '<div class="sub">' + products.length + ' product(s) listed</div>' +
                        '</div>' +
                        '<div class="page-header-actions">' +
                            '<button class="btn btn-primary" onclick="openModal(\'requestStockModal\')">Request Stock</button>' +
                        '</div>' +
                    '</div>';

                if (!products.length) {
                    this.render(headerHtml + TableBuilder.emptyState('No Products', 'No products are available yet.'));
                    return;
                }

                let rows = '';
                for (let i = 0; i < products.length; i++) {
                    let p     = products[i];
                    let stock = parseInt(p.stock);
                    let label, badgeClass;

                    if (stock <= 0)       { label = 'Out of Stock'; badgeClass = 'badge-out'; }
                    else if (stock <= 10) { label = 'Low Stock';    badgeClass = 'badge-low'; }
                    else                  { label = 'In Stock';     badgeClass = 'badge-in-stock'; }

                    rows +=
                        '<tr data-name="' + escHtml(p.name).toLowerCase() + '" data-level="' + label + '">' +
                        '<td><strong>' + escHtml(p.name) + '</strong></td>' +
                        '<td><span class="text-muted text-sm">' + escHtml(p.category || 'Uncategorized') + '</span></td>' +
                        '<td><span class="text-sm">' + escHtml(p.description || '—') + '</span></td>' +
                        '<td>' + escHtml(p.supplier_name || '—') + '</td>' +
                        '<td>' + formatPrice(p.selling_price) + '</td>' +
                        '<td><strong>' + stock + '</strong></td>' +
                        '<td><span class="badge ' + badgeClass + '">' + label + '</span></td>' +
                        '</tr>';
                }

                let html =
                    headerHtml +
                    '<div class="filter-bar">' +
                        '<input type="search" id="staffProdSearch" placeholder="Search by name…">' +
                        '<select id="staffStockFilter">' +
                            '<option value="">All Stock Levels</option>' +
                            '<option value="In Stock">In Stock</option>' +
                            '<option value="Low Stock">Low Stock</option>' +
                            '<option value="Out of Stock">Out of Stock</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="table-wrap"><table>' +
                    '<thead><tr><th>Name</th><th>Category</th><th>Description</th><th>Supplier</th><th>Selling Price</th><th>Stock</th><th>Status</th></tr></thead>' +
                    '<tbody id="staffProdBody">' + rows + '</tbody>' +
                    '</table></div>';

                this.render(html);

                function applyFilter() {
                    let s     = $('#staffProdSearch').val().toLowerCase();
                    let level = $('#staffStockFilter').val();
                    $('#staffProdBody tr').each(function () {
                        let nm = !s     || $(this).data('name').includes(s);
                        let lm = !level || $(this).data('level') === level;
                        $(this).toggle(nm && lm);
                    });
                }
                $('#staffProdSearch').on('input', applyFilter);
                $('#staffStockFilter').on('change', applyFilter);
            }
        });
    }

    loadMyRequests() {
        setActive('viewRequestsLink');

        $.ajax({
            url     : '../php/request_crud.php',
            method  : 'GET',
            data    : { action: 'read', filter: 'mine' },
            dataType: 'json',
            success : (data) => {
                this.render(
                    '<div class="page-header"><div class="page-header-left">' +
                    '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">My Requests</span></div>' +
                    '<h2>My Requests</h2></div></div>' +
                    buildRequestTable(data.data || [], 'Staff')
                );
            }
        });
    }
}

$(document).ready(function () {
    new StaffDashboard();
});