class CartManager {
    constructor() {
        this.items = JSON.parse(sessionStorage.getItem('cart') || '[]');
    }

    getCount() {
        let total = 0;
        for (let i = 0; i < this.items.length; i++) {
            total += this.items[i].quantity;
        }
        return total;
    }

    getTotal() {
        let total = 0;
        for (let i = 0; i < this.items.length; i++) {
            total += this.items[i].unitPrice * this.items[i].quantity;
        }
        return total;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    save() {
        sessionStorage.setItem('cart', JSON.stringify(this.items));
        this.updateBadge();
    }

    updateBadge() {
        let count = this.getCount();
        $('#cartCount').text(count);
        $('#cartCount').toggle(count > 0);
    }

    addItem(supplierId, productName, unitPrice, quantity, maxStock) {
        let existingIdx = -1;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].supplierId === supplierId && this.items[i].productName === productName) {
                existingIdx = i;
                break;
            }
        }

        let adjusted = false;
        if (existingIdx !== -1) {
            this.items[existingIdx].quantity += quantity;
            if (maxStock && this.items[existingIdx].quantity > maxStock) {
                this.items[existingIdx].quantity = maxStock;
                adjusted = true;
            }
        } else {
            if (maxStock && quantity > maxStock) {
                quantity = maxStock;
                adjusted = true;
            }
            this.items.push({ supplierId, productName, unitPrice, quantity });
        }

        this.save();
        return { adjusted };
    }

    changeQty(index, delta) {
        if (!this.items[index]) return;
        this.items[index].quantity += delta;
        if (this.items[index].quantity <= 0) {
            this.items.splice(index, 1);
        }
        this.save();
    }

    removeItem(index) {
        let name = this.items[index] ? this.items[index].productName : '';
        this.items.splice(index, 1);
        this.save();
        return name;
    }

    clear() {
        this.items = [];
        this.save();
    }

    toJSON() {
        return JSON.stringify(this.items);
    }

    init() {
        this.updateBadge();
    }
}

class TableBuilder {
    static buildRequestTable(rows, role, showAction) {
        if (showAction === undefined) {
            showAction = (role === 'Supplier' || role === 'Admin');
        }

        if (!rows || !rows.length) {
            return TableBuilder.emptyState('No Requests Found', 'No requests have been made yet.');
        }

        let badgeMap = {
            'Pending Admin Approval': 'badge-pending',
            'Approved'              : 'badge-approved',
            'Declined'              : 'badge-declined',
            'Out for Delivery'      : 'badge-delivery',
            'Delivered'             : 'badge-delivered',
            'Rejected'              : 'badge-rejected'
        };

        let rowsHtml = '';
        for (let i = 0; i < rows.length; i++) {
            let r          = rows[i];
            let badgeClass = badgeMap[r.status] || '';
            let total      = (parseFloat(r.unit_price) * parseInt(r.quantity)).toFixed(2);
            let date       = (r.created_at || '').substring(0, 16).replace('T', ' ');

            rowsHtml +=
                '<tr>' +
                '<td><span class="font-bold text-sm" style="color:#6366f1">#' + r.id + '</span></td>' +
                '<td><span class="font-bold">' + escHtml(r.requested_by_name) + '</span></td>' +
                '<td>' + (r.supplier_name ? escHtml(r.supplier_name) : '<span class="text-muted">—</span>') + '</td>' +
                '<td><span class="font-bold">' + escHtml(r.product_name) + '</span></td>' +
                '<td>' + formatPrice(r.unit_price) + '</td>' +
                '<td>' + r.quantity + '</td>' +
                '<td><span class="font-bold">' + formatPrice(total) + '</span></td>' +
                '<td><span class="text-muted text-sm">' + date + '</span></td>' +
                '<td><span class="badge ' + badgeClass + '">' + r.status + '</span></td>' +
                (showAction ? '<td>' + TableBuilder.buildActionBtn(r, role) + '</td>' : '') +
                '</tr>';
        }

        return '<div class="table-wrap"><table>' +
            '<thead><tr>' +
            '<th>Req #</th><th>Requested By</th><th>Supplier</th><th>Product</th>' +
            '<th>Price</th><th>Qty</th><th>Total</th><th>Date</th><th>Status</th>' +
            (showAction ? '<th>Action</th>' : '') +
            '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div>';
    }

    static buildActionBtn(r, role) {
        if (role === 'Admin') {
            if (r.status === 'Pending Admin Approval') {
                return '<div style="display:flex;gap:5px;">' +
                    '<button class="btn btn-sm btn-success approveItem" data-id="' + r.item_id + '">Approve</button>' +
                    '<button class="btn btn-sm btn-danger declineItem" data-id="' + r.item_id + '">Decline</button>' +
                    '</div>';
            }
            if (r.status === 'Out for Delivery') {
                return '<button class="btn btn-sm btn-primary completeItem" data-id="' + r.item_id + '">Complete</button>';
            }
        }

        if (role === 'Supplier') {
            if (r.status === 'Approved') {
                return '<div style="display:flex;gap:5px;">' +
                    '<button class="btn btn-sm btn-success acceptItem" data-id="' + r.item_id + '">Accept</button>' +
                    '<button class="btn btn-sm btn-danger rejectItem" data-id="' + r.item_id + '">Reject</button>' +
                    '</div>';
            }
            if (r.status === 'Out for Delivery') {
                return '<button class="btn btn-sm btn-primary deliverItem" data-id="' + r.item_id + '">Mark Delivered</button>';
            }
        }

        return '<span class="text-muted text-sm" style="font-style:italic;">No action</span>';
    }

    static buildTransactionTable(rows) {
        let finished = [];
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].status === 'Delivered' || rows[i].status === 'Rejected') {
                finished.push(rows[i]);
            }
        }

        if (!finished.length) {
            return TableBuilder.emptyState('No Transactions Yet', 'Completed deliveries will appear here.');
        }

        let totalUnits     = 0;
        let totalValue     = 0;
        let deliveredCount = 0;

        for (let i = 0; i < finished.length; i++) {
            if (finished[i].status === 'Delivered') {
                deliveredCount++;
                totalUnits += parseInt(finished[i].quantity);
                totalValue += parseFloat(finished[i].unit_price) * parseInt(finished[i].quantity);
            }
        }

        let stats =
            '<div class="stat-grid">' +
            statCard(deliveredCount,          'Completed',       'stat-green')  +
            statCard(totalUnits,              'Units Delivered', 'stat-blue')   +
            statCard(formatPrice(totalValue), 'Total Value',     'stat-yellow') +
            '</div>';

        let rowsHtml = '';
        for (let i = 0; i < finished.length; i++) {
            let r          = finished[i];
            let badgeClass = r.status === 'Delivered' ? 'badge-delivered' : 'badge-rejected';
            let roleBadge  = r.requested_by_role === 'Admin'
                ? '<span class="badge badge-admin">Admin</span>'
                : '<span class="badge badge-staff">Staff</span>';
            let total = (parseFloat(r.unit_price) * parseInt(r.quantity)).toFixed(2);
            let date  = (r.created_at || '').substring(0, 16).replace('T', ' ');

            rowsHtml +=
                '<tr>' +
                '<td><span class="font-bold" style="color:#6366f1">#' + r.id + '</span></td>' +
                '<td>' + escHtml(r.requested_by_name) + '</td>' +
                '<td>' + roleBadge + '</td>' +
                '<td>' + (r.supplier_name || '—') + '</td>' +
                '<td>' + escHtml(r.product_name) + '</td>' +
                '<td>' + formatPrice(r.unit_price) + '</td>' +
                '<td>' + r.quantity + '</td>' +
                '<td><span class="font-bold">' + formatPrice(total) + '</span></td>' +
                '<td><span class="text-muted text-sm">' + date + '</span></td>' +
                '<td><span class="badge ' + badgeClass + '">' + r.status + '</span></td>' +
                '</tr>';
        }

        return stats +
            '<div class="table-wrap"><table>' +
            '<thead><tr><th>Req #</th><th>Requested By</th><th>Role</th><th>Supplier</th>' +
            '<th>Product</th><th>Price</th><th>Qty</th><th>Total</th><th>Date</th><th>Status</th>' +
            '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div>';
    }

    static emptyState(title, msg) {
        return '<div class="empty-state"><h4>' + title + '</h4><p>' + msg + '</p></div>';
    }
}

class FormValidator {
    static required(value, label) {
        if (!value || !String(value).trim()) return label + ' is required.';
        return null;
    }

    static email(value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address.';
        return null;
    }

    static positiveNumber(value, label) {
        if (isNaN(value) || parseFloat(value) <= 0) return label + ' must be a positive number.';
        return null;
    }

    static minValue(value, min, label) {
        if (parseFloat(value) < min) return label + ' must be at least ' + min + '.';
        return null;
    }
}

let cart = new CartManager();

function formatPrice(n) {
    return '₱' + parseFloat(n || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function statCard(value, label, colorClass) {
    return '<div class="stat-card ' + colorClass + '">' +
        '<div>' +
        '<div class="stat-value">' + value + '</div>' +
        '<div class="stat-label">' + label + '</div>' +
        '</div>' +
        '</div>';
}

function setActive(id) {
    $('.nav-link').removeClass('active');
    $('#' + id).addClass('active');
}

function showFormError(id, msg) {
    $('#' + id).html('<span>' + msg + '</span>').addClass('show');
}

function hideFormError(id) {
    $('#' + id).removeClass('show').html('');
}

function openModal(id) {
    $('#' + id).addClass('open');
    if (id === 'requestStockModal') {
        loadSupplierDropdown();
        $('#request-stocks').val(1);
    }
}

function closeModal(id) {
    $('#' + id).removeClass('open');
}

$(document).on('click', '.modal-overlay', function (e) {
    if ($(e.target).hasClass('modal-overlay')) {
        $(this).removeClass('open');
    }
});

function loadSupplierDropdown() {
    let $supplier = $('#select-supplier');
    let $product  = $('#request-product-name');
    let $price    = $('#request-unit-price');

    if (!$supplier.length) return;

    $supplier.html('<option value="">Select Supplier</option>');
    $product.html('<option value="">Select Product</option>');
    $price.val('');

    $.ajax({
        url     : '../php/user_crud.php',
        method  : 'GET',
        data    : { action: 'read' },
        dataType: 'json',
        success : (data) => {
            if (!data.success) return;
            for (let i = 0; i < data.data.length; i++) {
                let s = data.data[i];
                if (s.role === 'Supplier') {
                    $supplier.append('<option value="' + s.id + '">' + escHtml(s.name) + '</option>');
                }
            }
        }
    });
}

$(document).on('change', '#select-supplier', function () {
    let $product = $('#request-product-name');
    let $price   = $('#request-unit-price');
    let sid      = $(this).val();

    $product.html('<option value="">Select Product</option>');
    $price.val('');

    if (!sid) return;

    $.ajax({
        url     : '../php/supplier_stock_crud.php',
        method  : 'GET',
        data    : { action: 'read_by_supplier', supplier_id: sid },
        dataType: 'json',
        success : (data) => {
            if (!data.success) return;
            for (let i = 0; i < data.data.length; i++) {
                let p = data.data[i];
                $product.append(
                    $('<option>')
                        .val(p.name)
                        .data('price', p.price)
                        .data('stock', p.stock)
                        .text(p.name + ' — Stock: ' + p.stock)
                );
            }
        }
    });
});

$(document).on('change', '#request-product-name', function () {
    let selected = $(this).find(':selected');
    $('#request-unit-price').val(selected.data('price') || '');
});

$(document).on('submit', '#requestStockForm', function (e) {
    e.preventDefault();
    hideFormError('requestStockError');

    let supplierId  = parseInt($('#select-supplier').val());
    let $prodSel    = $('#request-product-name');
    let productName = $prodSel.val();
    let unitPrice   = parseFloat($('#request-unit-price').val());
    let quantity    = parseInt($('#request-stocks').val());
    let selected    = $prodSel.find(':selected');
    let maxStock    = parseInt(selected.data('stock')) || Infinity;

    let err = FormValidator.required(supplierId, 'Supplier') ||
              FormValidator.required(productName, 'Product')  ||
              FormValidator.positiveNumber(quantity, 'Quantity');

    if (err) { showFormError('requestStockError', err); return; }

    let result = cart.addItem(supplierId, productName, unitPrice, quantity, maxStock);

    if (result.adjusted) {
        showToast('Quantity adjusted to available stock: ' + maxStock, 'warning');
    }

    showToast(productName + ' added to cart.', 'success');
    this.reset();
    $prodSel.html('<option value="">Select Product</option>');
    $('#request-unit-price').val('');
    closeModal('requestStockModal');
});

$(document).on('click', '#cart-link', function (e) {
    e.preventDefault();
    renderCart();
    openModal('cartModal');
});

function renderCart() {
    let $tbody = $('#cartTable');
    let $total = $('#cartTotal');

    if (!$tbody.length) return;

    if (cart.isEmpty()) {
        $tbody.html(
            '<tr><td colspan="5" style="text-align:center;padding:32px;">' +
            '<p style="color:#9ca3af;font-size:13px;">Your cart is empty</p></td></tr>'
        );
        $total.text('0.00');
        return;
    }

    let rows = '';
    for (let i = 0; i < cart.items.length; i++) {
        let item = cart.items[i];
        rows +=
            '<tr>' +
            '<td><strong>' + escHtml(item.productName) + '</strong></td>' +
            '<td>' + formatPrice(item.unitPrice) + '</td>' +
            '<td>' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                    '<button class="btn btn-sm btn-ghost" onclick="window.cartChangeQty(' + i + ',-1)">&minus;</button>' +
                    '<span style="min-width:28px;text-align:center;font-weight:600;">' + item.quantity + '</span>' +
                    '<button class="btn btn-sm btn-ghost" onclick="window.cartChangeQty(' + i + ',1)">+</button>' +
                '</div>' +
            '</td>' +
            '<td><strong>' + formatPrice(item.unitPrice * item.quantity) + '</strong></td>' +
            '<td>' +
                '<button class="btn btn-sm btn-danger" onclick="window.cartRemoveItem(' + i + ')">Remove</button>' +
            '</td>' +
            '</tr>';
    }

    $tbody.html(rows);
    $total.text(cart.getTotal().toFixed(2));
}

window.cartChangeQty = function (index, delta) {
    cart.changeQty(index, delta);
    renderCart();
};

window.cartRemoveItem = function (index) {
    let name = cart.removeItem(index);
    renderCart();
    showToast(name + ' removed from cart.', 'warning');
};

$(document).on('click', '#checkoutBtn', function () {
    if (cart.isEmpty()) {
        showToast('Your cart is empty. Add items before checking out.', 'warning');
        return;
    }

    showConfirm(
        'Submit this request to the system?',
        () => {
            $.ajax({
                url     : '../php/request_crud.php',
                method  : 'POST',
                data    : { action: 'checkout', items: cart.toJSON() },
                dataType: 'json',
                success : (data) => {
                    if (data.success) {
                        cart.clear();
                        closeModal('cartModal');
                        showToast(data.message || 'Request submitted!', 'success');
                    } else {
                        showToast(data.message || 'Checkout failed.', 'error');
                    }
                },
                error: () => showToast('Network error. Please try again.', 'error')
            });
        },
        { title: 'Submit Request', type: 'success', confirmText: 'Yes, Submit', cancelText: 'Go Back' }
    );
});

$(document).on('click', '#logOut', function (e) {
    e.preventDefault();
    showConfirm(
        'You will be returned to the login page.',
        () => {
            $.ajax({
                url     : '../php/auth.php',
                method  : 'POST',
                data    : { action: 'logout' },
                dataType: 'json',
                success : () => {
                    cart.clear();
                    window.location.href = '../index.php';
                }
            });
        },
        { title: 'Log Out', type: 'danger', confirmText: 'Yes, Log Out', cancelText: 'Stay' }
    );
});

function updateItemStatus(itemId, newStatus, callback) {
    $.ajax({
        url     : '../php/request_crud.php',
        method  : 'POST',
        data    : { action: 'update_status', item_id: itemId, status: newStatus },
        dataType: 'json',
        success : (data) => {
            if (data.success) {
                showToast('Status updated to: ' + newStatus, 'success');
                if (typeof callback === 'function') callback();
            } else {
                showToast(data.message || 'Failed to update status.', 'error');
            }
        },
        error: () => showToast('Network error. Please try again.', 'error')
    });
}

function buildRequestTable(rows, role, showAction) { return TableBuilder.buildRequestTable(rows, role, showAction); }
function buildTransactionTable(rows)               { return TableBuilder.buildTransactionTable(rows); }

$(document).ready(function () {
    cart.init();
});