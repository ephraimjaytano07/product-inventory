class AdminDashboard {
    constructor() {
        this.charts = {};
        this.bindNav();
        this.loadDashboard();
    }

    bindNav() {
        $('#dashboardLink').on('click',          (e) => { e.preventDefault(); this.loadDashboard(); });
        $('#productListLink').on('click',        (e) => { e.preventDefault(); this.loadProducts(); });
        $('#inventoryLink').on('click',          (e) => { e.preventDefault(); this.loadInventory(); });
        $('#viewRequestsLink').on('click',       (e) => { e.preventDefault(); this.loadMyRequests(); });
        $('#viewStaffRequestsLink').on('click',  (e) => { e.preventDefault(); this.loadStaffRequests(); });
        $('#transactionHistoryLink').on('click', (e) => { e.preventDefault(); this.loadTransactions(); });
        $('#userListLink').on('click',           (e) => { e.preventDefault(); this.loadUsers(); });
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

        $.when(
            $.ajax({ url: '../php/request_crud.php', method: 'GET', data: { action: 'read', filter: 'mine'  }, dataType: 'json' }),
            $.ajax({ url: '../php/request_crud.php', method: 'GET', data: { action: 'read', filter: 'staff' }, dataType: 'json' }),
            $.ajax({ url: '../php/product_crud.php', method: 'GET', data: { action: 'read' }, dataType: 'json' })
        ).then((mineRes, staffRes, productsRes) => {
            let myItems    = mineRes[0].success     ? mineRes[0].data     : [];
            let staffItems = staffRes[0].success    ? staffRes[0].data    : [];
            let products   = productsRes[0].success ? productsRes[0].data : [];

            let allItems = myItems.concat(staffItems);

            let pendingAdmin    = 0;
            let outForDelivery  = 0;
            let pendingSupplier = 0;
            let lowStock        = 0;
            let totalRevenue    = 0;

            for (let i = 0; i < staffItems.length; i++) {
                if (staffItems[i].status === 'Pending Admin Approval') pendingAdmin++;
            }

            for (let i = 0; i < allItems.length; i++) {
                let r = allItems[i];
                if (r.status === 'Out for Delivery') outForDelivery++;
                if (r.status === 'Approved')         pendingSupplier++;
                if (r.status === 'Delivered') {
                    totalRevenue += parseFloat(r.unit_price) * parseInt(r.quantity);
                }
            }

            for (let i = 0; i < products.length; i++) {
                let s = parseInt(products[i].stock);
                if (s > 0 && s <= 10) lowStock++;
            }

            let html =
                '<div class="page-header">' +
                    '<div class="page-header-left">' +
                        '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">Dashboard</span></div>' +
                        '<h2>Overview</h2>' +
                        '<div class="sub">Welcome back, ' + escHtml(SESSION_USER_NAME) + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="stat-grid">' +
                    statCard(pendingAdmin,              'Pending Approvals',       'stat-yellow') +
                    statCard(outForDelivery,            'Out for Delivery',        'stat-blue')   +
                    statCard(pendingSupplier,           'Pending Supplier Action', 'stat-purple')  +
                    statCard(lowStock,                  'Low Stock Items',         'stat-red')    +
                    statCard(formatPrice(totalRevenue), 'Total Revenue',           'stat-green')  +
                '</div>' +
                (pendingAdmin > 0
                    ? '<div class="alert alert-danger show" style="margin-bottom:20px;">' + pendingAdmin + ' staff request(s) are awaiting your approval.</div>'
                    : '') +
                '<div class="charts-container">' +
                    '<div class="chart-card"><h3>Request Status Breakdown</h3><canvas id="statusDonutChart"></canvas></div>' +
                    '<div class="chart-card"><h3>Top Requested Products</h3><canvas id="topProductsChart"></canvas></div>' +
                    '<div class="chart-card"><h3>Monthly Request Volume</h3><canvas id="monthlyChart"></canvas></div>' +
                '</div>' +
                '<div class="page-header mt-2">' +
                    '<div class="page-header-left">' +
                        '<h2>Recent Products</h2>' +
                        '<div class="sub">Last ' + Math.min(8, products.length) + ' of ' + products.length + ' products</div>' +
                    '</div>' +
                    '<button class="btn btn-ghost btn-sm" onclick="$(\'#productListLink\').click()">View All →</button>' +
                '</div>' +
                this.buildProductTable(products.slice(0, 8));

            this.render(html);
            renderAdminCharts(this.charts, allItems);
        });
    }

    loadUsers() {
        setActive('userListLink');

        $.ajax({
            url     : '../php/user_crud.php',
            method  : 'GET',
            data    : { action: 'read' },
            dataType: 'json',
            success : (data) => {
                let users = data.success ? data.data : [];

                let badgeMap = {
                    Admin   : '<span class="badge badge-admin">Admin</span>',
                    Supplier: '<span class="badge badge-supplier">Supplier</span>',
                    Staff   : '<span class="badge badge-staff">Staff</span>'
                };

                let rows = '';
                for (let i = 0; i < users.length; i++) {
                    let u      = users[i];
                    let isSelf = (u.id == SESSION_USER_ID);
                    rows +=
                        '<tr data-name="' + escHtml(u.name).toLowerCase() + '" data-role="' + u.role + '">' +
                        '<td><span class="font-bold" style="color:#6366f1">#' + u.id + '</span></td>' +
                        '<td><strong>' + escHtml(u.name) + '</strong>' + (isSelf ? ' <span class="badge badge-admin" style="font-size:10px;">You</span>' : '') + '</td>' +
                        '<td>' + escHtml(u.email) + '</td>' +
                        '<td>' + (badgeMap[u.role] || u.role) + '</td>' +
                        '<td><span class="text-muted text-sm">' + (u.created_at || '').substring(0, 10) + '</span></td>' +
                        '<td>' +
                            '<div style="display:flex;gap:5px;">' +
                            '<button class="btn btn-sm btn-ghost editUserBtn"' +
                                ' data-id="'    + u.id          + '"' +
                                ' data-name="'  + escHtml(u.name)  + '"' +
                                ' data-email="' + escHtml(u.email) + '"' +
                                ' data-role="'  + u.role           + '"' +
                                ' data-self="'  + (isSelf ? '1' : '0') + '">Edit</button>' +
                            (isSelf
                                ? '<button class="btn btn-sm btn-danger" disabled title="Cannot delete your own account">Delete</button>'
                                : '<button class="btn btn-sm btn-danger deleteUserBtn"' +
                                  ' data-id="' + u.id + '"' +
                                  ' data-name="' + escHtml(u.name) + '">Delete</button>'
                            ) +
                            '</div>' +
                        '</td>' +
                        '</tr>';
                }

                let html =
                    '<div class="page-header">' +
                        '<div class="page-header-left">' +
                            '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">Users</span></div>' +
                            '<h2>All Users</h2>' +
                            '<div class="sub">' + users.length + ' user(s)</div>' +
                        '</div>' +
                        '<div class="page-header-actions">' +
                            '<button class="btn btn-primary" onclick="openModal(\'addUserModal\')">Add User</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="filter-bar">' +
                        '<input type="search" id="userSearch" placeholder="Search by name or email…">' +
                        '<select id="userRoleFilter">' +
                            '<option value="">All Roles</option>' +
                            '<option value="Admin">Admin</option>' +
                            '<option value="Supplier">Supplier</option>' +
                            '<option value="Staff">Staff</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="table-wrap"><table>' +
                    '<thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>' +
                    '<tbody id="userTableBody">' +
                    (users.length
                        ? rows
                        : '<tr><td colspan="6">' + TableBuilder.emptyState('No Users', 'No users found.') + '</td></tr>'
                    ) +
                    '</tbody></table></div>';

                this.render(html);
                this.bindUserFilters();
            }
        });
    }

    bindUserFilters() {
        function applyFilters() {
            let search = $('#userSearch').val().toLowerCase();
            let role   = $('#userRoleFilter').val();
            $('#userTableBody tr').each(function () {
                let nameMatch = !search || $(this).data('name').includes(search);
                let roleMatch = !role   || $(this).data('role') === role;
                $(this).toggle(nameMatch && roleMatch);
            });
        }
        $('#userSearch').on('input', applyFilters);
        $('#userRoleFilter').on('change', applyFilters);
    }

    buildProductTable(products) {
        if (!products || !products.length) {
            return TableBuilder.emptyState('No Products', 'No products have been added yet.');
        }

        let rows = '';
        for (let i = 0; i < products.length; i++) {
            let p     = products[i];
            let stock = parseInt(p.stock);
            let badge = stock <= 0
                ? '<span class="badge badge-out">Out of Stock</span>'
                : stock <= 10
                    ? '<span class="badge badge-low">Low Stock</span>'
                    : '<span class="badge badge-in-stock">In Stock</span>';

            rows +=
                '<tr data-name="' + escHtml(p.name).toLowerCase() + '" data-cat="' + escHtml(p.category || '').toLowerCase() + '">' +
                '<td><span class="font-bold" style="color:#6366f1">#' + p.id + '</span></td>' +
                '<td><strong>' + escHtml(p.name) + '</strong></td>' +
                '<td><span class="text-muted text-sm">' + escHtml(p.category || 'Uncategorized') + '</span></td>' +
                '<td><span class="text-sm">' + escHtml(p.description || '—') + '</span></td>' +
                '<td>' + escHtml(p.supplier_name || 'Admin') + '</td>' +
                '<td>' + formatPrice(p.purchase_price) + '</td>' +
                '<td>' + formatPrice(p.selling_price) + '</td>' +
                '<td>' + p.stock + '</td>' +
                '<td>' + badge + '</td>' +
                '</tr>';
        }

        return '<div class="table-wrap"><table>' +
            '<thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Description</th><th>Supplier</th>' +
            '<th>Purchase</th><th>Selling</th><th>Stock</th><th>Status</th></tr></thead>' +
            '<tbody id="productTableBody">' + rows + '</tbody></table></div>';
    }

    loadProducts() {
        setActive('productListLink');

        $.ajax({
            url     : '../php/product_crud.php',
            method  : 'GET',
            data    : { action: 'read' },
            dataType: 'json',
            success : (data) => {
                let products = data.success ? data.data : [];

                let cats = [];
                for (let i = 0; i < products.length; i++) {
                    let cat = products[i].category || 'Uncategorized';
                    if (cats.indexOf(cat) === -1) cats.push(cat);
                }

                let catOptions = '<option value="">All Categories</option>';
                for (let i = 0; i < cats.length; i++) {
                    catOptions += '<option value="' + cats[i].toLowerCase() + '">' + cats[i] + '</option>';
                }

                let html =
                    '<div class="page-header">' +
                        '<div class="page-header-left">' +
                            '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">Products</span></div>' +
                            '<h2>All Products</h2>' +
                            '<div class="sub">' + products.length + ' product(s)</div>' +
                        '</div>' +
                        '<div class="page-header-actions">' +
                            '<button class="btn btn-primary" onclick="openModal(\'addProductModal\')">Add Product</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="filter-bar">' +
                        '<input type="search" id="prodSearch" placeholder="Search products…">' +
                        '<select id="prodCatFilter">' + catOptions + '</select>' +
                    '</div>' +
                    this.buildProductTable(products);

                this.render(html);

                function applyFilters() {
                    let s   = $('#prodSearch').val().toLowerCase();
                    let cat = $('#prodCatFilter').val();
                    $('#productTableBody tr').each(function () {
                        let nm = !s   || $(this).data('name').includes(s);
                        let cm = !cat || $(this).data('cat') === cat;
                        $(this).toggle(nm && cm);
                    });
                }
                $('#prodSearch').on('input', applyFilters);
                $('#prodCatFilter').on('change', applyFilters);
            }
        });
    }

    loadInventory() {
        setActive('inventoryLink');

        $.ajax({
            url     : '../php/product_crud.php',
            method  : 'GET',
            data    : { action: 'read' },
            dataType: 'json',
            success : (data) => {
                let products = data.success ? data.data : [];
                let rows = '';

                for (let i = 0; i < products.length; i++) {
                    let p     = products[i];
                    let stock = parseInt(p.stock);
                    let label, badgeClass;

                    if (stock <= 0)       { label = 'Out of Stock'; badgeClass = 'badge-out'; }
                    else if (stock <= 10) { label = 'Low Stock';    badgeClass = 'badge-low'; }
                    else                  { label = 'In Stock';     badgeClass = 'badge-in-stock'; }

                    let pct = Math.min(100, Math.max(0, stock * 3));

                    rows +=
                        '<tr data-level="' + label + '" data-name="' + escHtml(p.name).toLowerCase() + '">' +
                        '<td><span class="font-bold" style="color:#6366f1">#' + p.id + '</span></td>' +
                        '<td><strong>' + escHtml(p.name) + '</strong></td>' +
                        '<td>' + escHtml(p.supplier_name || 'Admin') + '</td>' +
                        '<td>' +
                            '<div style="display:flex;align-items:center;gap:8px;">' +
                                '<span class="font-bold">' + stock + '</span>' +
                                '<div style="flex:1;height:6px;background:#f1f5f9;border-radius:3px;max-width:80px;">' +
                                    '<div style="width:' + pct + '%;height:100%;background:#6366f1;border-radius:3px;"></div>' +
                                '</div>' +
                            '</div>' +
                        '</td>' +
                        '<td><span class="badge ' + badgeClass + '">' + label + '</span></td>' +
                        '<td>' +
                            '<button class="btn btn-sm btn-danger deleteProductBtn"' +
                            ' data-id="' + p.id + '"' +
                            ' data-name="' + escHtml(p.name) + '">Delete</button>' +
                        '</td>' +
                        '</tr>';
                }

                let html =
                    '<div class="page-header">' +
                        '<div class="page-header-left">' +
                            '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">Inventory</span></div>' +
                            '<h2>Inventory</h2>' +
                            '<div class="sub">' + products.length + ' product(s) tracked</div>' +
                        '</div>' +
                        '<div class="page-header-actions">' +
                            '<button class="btn btn-primary" onclick="openModal(\'requestStockModal\')">Request Stock</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="filter-bar">' +
                        '<input type="search" id="invSearch" placeholder="Search">' +
                        '<select id="invStockFilter">' +
                            '<option value="">All Levels</option>' +
                            '<option value="In Stock">In Stock</option>' +
                            '<option value="Low Stock">Low Stock</option>' +
                            '<option value="Out of Stock">Out of Stock</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="table-wrap"><table>' +
                    '<thead><tr><th>ID</th><th>Name</th><th>Supplier</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead>' +
                    '<tbody id="inventoryBody">' +
                    (products.length
                        ? rows
                        : '<tr><td colspan="6">' + TableBuilder.emptyState('No Inventory', 'No products tracked yet.') + '</td></tr>'
                    ) +
                    '</tbody></table></div>';

                this.render(html);

                function applyFilters() {
                    let s     = $('#invSearch').val().toLowerCase();
                    let level = $('#invStockFilter').val();
                    $('#inventoryBody tr').each(function () {
                        let nm = !s     || $(this).data('name').includes(s);
                        let lm = !level || $(this).data('level') === level;
                        $(this).toggle(nm && lm);
                    });
                }
                $('#invSearch').on('input', applyFilters);
                $('#invStockFilter').on('change', applyFilters);
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
                    buildRequestTable(data.data || [], 'Admin')
                );
            }
        });
    }

    loadStaffRequests() {
        setActive('viewStaffRequestsLink');

        $.ajax({
            url     : '../php/request_crud.php',
            method  : 'GET',
            data    : { action: 'read', filter: 'staff' },
            dataType: 'json',
            success : (data) => {
                this.render(
                    '<div class="page-header"><div class="page-header-left">' +
                    '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">Staff Requests</span></div>' +
                    '<h2>Staff Requests</h2></div></div>' +
                    buildRequestTable(data.data || [], 'Admin')
                );
            }
        });
    }

    loadTransactions() {
        setActive('transactionHistoryLink');

        $.when(
            $.ajax({ url: '../php/request_crud.php', method: 'GET', data: { action: 'read', filter: 'mine'  }, dataType: 'json' }),
            $.ajax({ url: '../php/request_crud.php', method: 'GET', data: { action: 'read', filter: 'staff' }, dataType: 'json' })
        ).then((mineRes, staffRes) => {
            let all = (mineRes[0].data || []).concat(staffRes[0].data || []);
            this.render(
                '<div class="page-header"><div class="page-header-left">' +
                '<div class="breadcrumb"><span>Home</span> <span>›</span> <span class="current">Transactions</span></div>' +
                '<h2>Transaction History</h2></div></div>' +
                buildTransactionTable(all)
            );
        });
    }
}

function loadProductSupplierDropdown() {
    let $sel = $('#product-supplier-id');
    if (!$sel.length) return;

    $sel.html('<option value="0">— No Supplier —</option>');

    $.ajax({
        url     : '../php/user_crud.php',
        method  : 'GET',
        data    : { action: 'read' },
        dataType: 'json',
        success : function (data) {
            if (!data.success) return;
            for (let i = 0; i < data.data.length; i++) {
                let u = data.data[i];
                if (u.role === 'Supplier') {
                    $sel.append('<option value="' + u.id + '">' + escHtml(u.name) + '</option>');
                }
            }
        }
    });
}

let _origOpenModal = window.openModal;
window.openModal = function(id) {
    if (id === 'addProductModal') {
        loadProductSupplierDropdown();
    }
    _origOpenModal(id);
};

$(document).ready(function () {
    let dashboard = new AdminDashboard();

    $(document).on('click', '.deleteUserBtn', function () {
        let id   = $(this).data('id');
        let name = $(this).data('name');

        showConfirm(
            'Delete "' + name + '"? This cannot be undone.',
            function () {
                $.ajax({
                    url     : '../php/user_crud.php',
                    method  : 'POST',
                    data    : { action: 'delete', id: id },
                    dataType: 'json',
                    success : function (data) {
                        showToast(data.message || (data.success ? 'Deleted.' : 'Failed.'), data.success ? 'success' : 'error');
                        if (data.success) dashboard.loadUsers();
                    }
                });
            },
            { title: 'Delete User', type: 'danger', confirmText: 'Yes, Delete' }
        );
    });

    $(document).on('click', '.editUserBtn', function () {
        let id    = $(this).data('id');
        let name  = $(this).data('name');
        let email = $(this).data('email');
        let role  = $(this).data('role');
        let isSelf = $(this).data('self') == '1';

        $('#edit-user-id').val(id);
        $('#edit-user-name').val(name);
        $('#edit-user-email').val(email);
        $('#edit-user-role').val(role);
        $('#edit-user-role').prop('disabled', isSelf);

        openModal('editUserModal');
    });

    $('#editUserForm').on('submit', function (e) {
        e.preventDefault();
        hideFormError('editUserError');

        let id    = $('#edit-user-id').val();
        let name  = $('#edit-user-name').val().trim();
        let email = $('#edit-user-email').val().trim();
        let role  = $('#edit-user-role').val() || $('#edit-user-role').data('original');

        let err = FormValidator.required(name, 'Name')  ||
                  FormValidator.required(email, 'Email') ||
                  FormValidator.email(email);
        if (err) { showFormError('editUserError', err); return; }

        $.ajax({
            url     : '../php/user_crud.php',
            method  : 'POST',
            data    : { action: 'update', id, name, email, role },
            dataType: 'json',
            success : function (data) {
                if (data.success) {
                    closeModal('editUserModal');
                    showToast(data.message, 'success');
                    dashboard.loadUsers();
                } else {
                    showFormError('editUserError', data.message);
                }
            }
        });
    });

    $('#addUserForm').on('submit', function (e) {
        e.preventDefault();
        hideFormError('addUserError');

        let name  = $('#txt-full-name').val().trim();
        let email = $('#txt-email').val().trim();
        let pass  = $('#txt-password').val();
        let role  = $('#user-role').val();

        let err = FormValidator.required(name, 'Name')      ||
                  FormValidator.required(email, 'Email')     ||
                  FormValidator.email(email)                  ||
                  FormValidator.required(pass, 'Password');
        if (err) { showFormError('addUserError', err); return; }

        $.ajax({
            url     : '../php/user_crud.php',
            method  : 'POST',
            data    : { action: 'create', name, email, password: pass, role },
            dataType: 'json',
            success : function (data) {
                if (data.success) {
                    closeModal('addUserModal');
                    $('#addUserForm')[0].reset();
                    showToast(data.message, 'success');
                    dashboard.loadUsers();
                } else {
                    showFormError('addUserError', data.message);
                }
            }
        });
    });

    $(document).on('click', '.deleteProductBtn', function () {
        let id   = $(this).data('id');
        let name = $(this).data('name');

        showConfirm(
            'Remove "' + name + '" from inventory? Cannot be undone.',
            function () {
                $.ajax({
                    url     : '../php/product_crud.php',
                    method  : 'POST',
                    data    : { action: 'delete', id: id },
                    dataType: 'json',
                    success : function (data) {
                        showToast(data.message || (data.success ? 'Deleted.' : 'Failed.'), data.success ? 'success' : 'error');
                        if (data.success) dashboard.loadInventory();
                    }
                });
            },
            { title: 'Delete Product', type: 'danger', confirmText: 'Yes, Delete' }
        );
    });

    $('#addProductForm').on('submit', function (e) {
        e.preventDefault();
        hideFormError('addProductError');

        let name       = $('#product-name').val().trim();
        let desc       = $('#product-description').val().trim();
        let cat        = $('#product-category').val().trim();
        let supplierId = parseInt($('#product-supplier-id').val()) || 0;
        let pp         = parseFloat($('#product-purchase-price').val());
        let sp         = parseFloat($('#product-selling-price').val());
        let stk        = parseInt($('#product-stocks').val()) || 0;

        let err = FormValidator.required(name, 'Product name')       ||
                  FormValidator.positiveNumber(pp, 'Purchase price')  ||
                  FormValidator.positiveNumber(sp, 'Selling price');
        if (err) { showFormError('addProductError', err); return; }
        if (sp < pp) { showFormError('addProductError', 'Selling price must be >= purchase price.'); return; }

        $.ajax({
            url     : '../php/product_crud.php',
            method  : 'POST',
            data    : {
                action         : 'create',
                name           : name,
                description    : desc,
                category       : cat,
                supplier_id    : supplierId,
                purchase_price : pp,
                selling_price  : sp,
                stock          : stk
            },
            dataType: 'json',
            success : function (data) {
                if (data.success) {
                    closeModal('addProductModal');
                    $('#addProductForm')[0].reset();
                    showToast(data.message, 'success');
                    dashboard.loadProducts();
                } else {
                    showFormError('addProductError', data.message);
                }
            },
            error: function () {
                showFormError('addProductError', 'Network error. Please try again.');
            }
        });
    });

    $(document).on('click', '.approveItem', function () {
        let id = $(this).data('id');
        showConfirm('Approve this request? It will be forwarded to the supplier.',
            () => updateItemStatus(id, 'Approved', () => dashboard.loadStaffRequests()),
            { title: 'Approve Request', type: 'success', confirmText: 'Yes, Approve' });
    });

    $(document).on('click', '.declineItem', function () {
        let id = $(this).data('id');
        showConfirm('Decline this request?',
            () => updateItemStatus(id, 'Declined', () => dashboard.loadStaffRequests()),
            { title: 'Decline Request', type: 'danger', confirmText: 'Yes, Decline' });
    });

    $(document).on('click', '.completeItem', function () {
        let id = $(this).data('id');
        showConfirm('Mark this item as Delivered? Inventory will be updated.',
            () => updateItemStatus(id, 'Delivered', () => dashboard.loadMyRequests()),
            { title: 'Complete Delivery', type: 'success', confirmText: 'Yes, Mark Delivered' });
    });
});