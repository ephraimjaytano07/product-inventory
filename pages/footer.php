</ul>
        </nav>
    </aside>
    <main class="main-content">
        <div id="contentArea"></div>
    </main>

</div>

<!--CART MODAL-->
<div class="modal-overlay" id="cartModal">
    <div class="modal-box modal-lg">
        <div class="modal-header">
            <div class="modal-header-left">
                <h3>Cart</h3>
            </div>
            <button class="modal-close" onclick="closeModal('cartModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Unit Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                            <th>Remove</th>
                        </tr>
                    </thead>
                    <tbody id="cartTable"></tbody>
                </table>
            </div>
            <div class="cart-total-bar">
                <span class="cart-total-label">Order Total</span>
                <span class="cart-total-value">&#8369;<span id="cartTotal">0.00</span></span>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('cartModal')">Close</button>
            <button class="btn btn-success" id="checkoutBtn">
                <?= ($_SESSION['user_role'] === 'Admin') ? 'Checkout' : 'Send Request' ?>
            </button>
        </div>
    </div>
</div>

<!--REQUEST STOCK MODAL-->
<div class="modal-overlay" id="requestStockModal">
    <div class="modal-box">
        <div class="modal-header">
            <div class="modal-header-left">
                <h3>Request Stock</h3>
            </div>
            <button class="modal-close" onclick="closeModal('requestStockModal')">&times;</button>
        </div>
        <div class="modal-body">
            <div class="alert alert-danger" id="requestStockError"></div>
            <form id="requestStockForm">
                <div class="form-group">
                    <label for="select-supplier">Supplier</label>
                    <select id="select-supplier" required>
                        <option value="">Select a Supplier</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="request-product-name">Product</label>
                    <select id="request-product-name" required>
                        <option value="">Select a Product</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group mb-0">
                        <label for="request-unit-price">Unit Price</label>
                        <input type="number" id="request-unit-price" readonly placeholder="Auto-filled">
                    </div>
                    <div class="form-group mb-0">
                        <label for="request-stocks">Quantity</label>
                        <input type="number" id="request-stocks" min="1" value="1" required>
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('requestStockModal')">Cancel</button>
            <button type="submit" form="requestStockForm" class="btn btn-primary">Add to Cart</button>
        </div>
    </div>
</div>

<script src="../js/common.js"></script>