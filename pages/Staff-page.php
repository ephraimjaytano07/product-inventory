<?php
$pageTitle = 'Staff Dashboard';
include 'layout.php';
if ($role !== 'Staff') { header('Location: ../index.php'); exit; }
?>
                <li><a class="nav-link active" id="dashboardLink" href="#">
                    Dashboard
                </a></li>

                <li><span class="section-label">Inventory</span></li>
                <li><a class="nav-link" id="productsLink" href="#">
                    Products
                </a></li>

                <li><span class="section-label">Requests</span></li>
                <li><a class="nav-link" href="#" onclick="openModal('requestStockModal')">
                    Request Stock
                </a></li>
                <li><a class="nav-link" id="cart-link" href="#">
                    Cart
                    <span class="badge" id="cartCount" style="display:none;">0</span>
                </a></li>
                <li><a class="nav-link" id="viewRequestsLink" href="#">
                    My Requests
                </a></li>

                <li style="margin-top:12px;">
                    <a class="nav-link danger" id="logOut" href="#">
                        Logout
                    </a>
                </li>

<?php include 'footer.php'; ?>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="../js/chart.js"></script>
<script src="../js/staff.js"></script>