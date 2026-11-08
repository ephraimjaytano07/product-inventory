<?php
$pageTitle = 'Admin Dashboard — PIS';
include 'layout.php';
if ($role !== 'Admin') { header('Location: ../index.php'); exit; }
?>
                <!-- Dashboard -->
                <li><a class="nav-link active" id="dashboardLink" href="#">
                    Dashboard
                </a></li>

                <li><span class="section-label">Products</span></li>
                <li><a class="nav-link" id="productListLink" href="#">
                    All Products
                </a></li>
                <li><a class="nav-link" href="#" onclick="openModal('addProductModal')">
                    Add Product
                </a></li>
                <li><a class="nav-link" id="inventoryLink" href="#">
                    Inventory
                </a></li>
                <li><a class="nav-link" href="#" onclick="openModal('requestStockModal')">
                    Request Stock
                </a></li>
                <li><a class="nav-link" id="cart-link" href="#">
                    Cart
                    <span class="badge" id="cartCount" style="display:none;">0</span>
                </a></li>

                <li><span class="section-label">Requests</span></li>
                <li><a class="nav-link" id="viewRequestsLink" href="#">
                    My Requests
                </a></li>
                <li><a class="nav-link" id="viewStaffRequestsLink" href="#">
                    Staff Requests
                </a></li>
                <li><a class="nav-link" id="transactionHistoryLink" href="#">
                    Transactions
                </a></li>

                <li><span class="section-label">Users</span></li>
                <li><a class="nav-link" id="userListLink" href="#">
                    All Users
                </a></li>
                <li><a class="nav-link" href="#" onclick="openModal('addUserModal')">
                    Add User
                </a></li>

                <li style="margin-top:14px;">
                    <a class="nav-link danger" id="logOut" href="#">
                        Logout
                    </a>
                </li>

<?php include 'footer.php'; ?>

<!--ADD USER MODAL-->
<div class="modal-overlay" id="addUserModal">
    <div class="modal-box">
        <div class="modal-header">
            <div class="modal-header-left">
                <h3>Add New User</h3>
            </div>
            <button class="modal-close" onclick="closeModal('addUserModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="alert alert-danger" id="addUserError"></div>
            <form id="addUserForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="txt-full-name">Full Name</label>
                        <input type="text" id="txt-full-name" placeholder="Enter full name" autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label for="user-role">Role</label>
                        <select id="user-role">
                            <option value="Admin">Admin</option>
                            <option value="Supplier">Supplier</option>
                            <option value="Staff">Staff</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="txt-email">Email Address</label>
                    <input type="email" id="txt-email" placeholder="Enter email address" autocomplete="off">
                </div>
                <div class="form-group mb-0">
                    <label for="txt-password">Password</label>
                    <input type="password" id="txt-password" placeholder="Enter password">
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('addUserModal')">Cancel</button>
            <button type="submit" form="addUserForm" class="btn btn-primary">Create User</button>
        </div>
    </div>
</div>

<!--EDIT USER MODAL-->
<div class="modal-overlay" id="editUserModal">
    <div class="modal-box">
        <div class="modal-header">
            <div class="modal-header-left">
                <h3>Edit User</h3>
            </div>
            <button class="modal-close" onclick="closeModal('editUserModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="alert alert-danger" id="editUserError"></div>
            <form id="editUserForm">
                <input type="hidden" id="edit-user-id">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-user-name">Full Name</label>
                        <input type="text" id="edit-user-name" placeholder="Enter full name">
                    </div>
                    <div class="form-group">
                        <label for="edit-user-role">Role</label>
                        <select id="edit-user-role">
                            <option value="Admin">Admin</option>
                            <option value="Supplier">Supplier</option>
                            <option value="Staff">Staff</option>
                        </select>
                    </div>
                </div>
                <div class="form-group mb-0">
                    <label for="edit-user-email">Email Address</label>
                    <input type="email" id="edit-user-email" placeholder="Enter email address">
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('editUserModal')">Cancel</button>
            <button type="submit" form="editUserForm" class="btn btn-primary">Save Changes</button>
        </div>
    </div>
</div>

<!--ADD PRODUCT MODAL-->
<div class="modal-overlay" id="addProductModal">
    <div class="modal-box">
        <div class="modal-header">
            <div class="modal-header-left">
                <h3>Add New Product</h3>
            </div>
            <button class="modal-close" onclick="closeModal('addProductModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="alert alert-danger" id="addProductError"></div>
            <form id="addProductForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="product-name">Product Name</label>
                        <input type="text" id="product-name" placeholder="e.g. iPhone 15">
                    </div>
                    <div class="form-group">
                        <label for="product-category">Category</label>
                        <input type="text" id="product-category" placeholder="e.g. Smartphones">
                    </div>
                </div>
                <div class="form-group">
                    <label for="product-description">Description</label>
                    <input type="text" id="product-description" placeholder="Short product description">
                </div>
                <div class="form-group">
                    <label for="product-supplier-id">Supplier (optional)</label>
                    <select id="product-supplier-id">
                        <option value="0">— No Supplier —</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="product-purchase-price">Purchase Price</label>
                        <input type="number" id="product-purchase-price" step="0.01" min="0" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label for="product-selling-price">Selling Price</label>
                        <input type="number" id="product-selling-price" step="0.01" min="0" placeholder="0.00">
                    </div>
                </div>
                <div class="form-group mb-0">
                    <label for="product-stocks">Initial Stock</label>
                    <input type="number" id="product-stocks" min="0" placeholder="0">
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('addProductModal')">Cancel</button>
            <button type="submit" form="addProductForm" class="btn btn-primary">Add Product</button>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="../js/chart.js"></script>
<script src="../js/admin.js"></script>