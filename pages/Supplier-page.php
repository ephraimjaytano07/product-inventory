<?php
$pageTitle = 'Supplier Dashboard';
include 'layout.php';
if ($role !== 'Supplier') { header('Location: ../index.php'); exit; }
?>
                <li><a class="nav-link active" id="dashboardLink" href="#">
                    Dashboard
                </a></li>

                <li><span class="section-label">Stock Management</span></li>

                <li><a class="nav-link" id="viewStocksLink" href="#">
                    My Stocks
                </a></li>
                <li><a class="nav-link" href="#" onclick="openModal('addStockModal')">
                    Add Stock
                </a></li>
                <li><a class="nav-link" id="requestNotifLink" href="#">
                    Notifications
                    <span class="badge" id="notifCount">0</span>
                </a></li>
                <li><a class="nav-link" id="transactionHistoryLink" href="#">
                    Transaction History
                </a></li>

                <li style="margin-top:12px;">
                    <a class="nav-link danger" id="logOut" href="#">
                        Logout
                    </a>
                </li>

<?php include 'footer.php'; ?>

<!--ADD STOCK MODAL-->
<div class="modal-overlay" id="addStockModal">
    <div class="modal-box">
        <div class="modal-header">
            <h3>Add Supplier Stock</h3>
            <button class="modal-close" onclick="closeModal('addStockModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="alert alert-danger" id="addStockError"></div>
            <form id="addSupplierStockForm">
                <div class="form-group">
                    <label for="supplier-product-name">Product Name</label>
                    <input type="text" id="supplier-product-name" placeholder="Enter product name" required>
                </div>
                <div class="form-group">
                    <label for="supplier-product-description">Description</label>
                    <textarea id="supplier-product-description" rows="2" placeholder="Short description" required></textarea>
                </div>
                <div class="form-group">
                    <label for="supplier-product-price">Price</label>
                    <input type="number" step="0.01" id="supplier-product-price" placeholder="0.00" required>
                </div>
                <div class="form-group">
                    <label for="supplier-product-stock">Stock Quantity</label>
                    <input type="number" id="supplier-product-stock" placeholder="0" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">Add Stock</button>
            </form>
        </div>
    </div>
</div>

<!--EDIT STOCK MODAL-->
<div class="modal-overlay" id="editStockModal">
    <div class="modal-box">
        <div class="modal-header">
            <div class="modal-header-left">
                <h3>Edit Stock</h3>
            </div>
            <button class="modal-close" onclick="closeModal('editStockModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="alert alert-danger" id="editStockError"></div>
            <form id="editSupplierStockForm">
                <input type="hidden" id="edit-stock-id">
                <div class="form-group">
                    <label for="edit-stock-name">Product Name</label>
                    <input type="text" id="edit-stock-name" readonly>
                </div>
                <div class="form-row">
                    <div class="form-group mb-0">
                        <label for="edit-stock-price">Price</label>
                        <input type="number" step="0.01" min="0.01" id="edit-stock-price" placeholder="0.00" required>
                    </div>
                    <div class="form-group mb-0">
                        <label for="edit-stock-qty">Stock Quantity</label>
                        <input type="number" min="0" id="edit-stock-qty" placeholder="0" required>
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('editStockModal')">Cancel</button>
            <button type="submit" form="editSupplierStockForm" class="btn btn-primary">Save Changes</button>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="../js/chart.js"></script>
<script src="../js/supplier.js"></script>