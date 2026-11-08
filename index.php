<?php
session_start();

if (!empty($_SESSION['user_id'])) {
    header('Location: pages/' . $_SESSION['user_role'] . '-page.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Inventory System – Login</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body class="login-body" id="loginBody">

    <div class="login-card">
        <h2>Product Inventory System</h2>

        <div class="alert alert-danger" id="loginError"></div>

        <div class="form-group">
            <label for="txt-email">Email Address</label>
            <input type="email" id="txt-email" placeholder="Enter your email">
        </div>

        <div class="form-group">
            <label for="txt-password">Password</label>
            <input type="password" id="txt-password" placeholder="Enter your password">
        </div>

        <div class="form-group">
            <label for="select-role">Login As</label>
            <select id="select-role">
                <option value="Admin">Admin</option>
                <option value="Supplier">Supplier</option>
                <option value="Staff">Staff</option>
            </select>
        </div>

        <button class="btn-login" id="btn-log-in">Login</button>
    </div>

    <script>

        var bgMap = {
            Admin   : 'assets/admin.jpg',
            Supplier: 'assets/supplier.jpg',
            Staff   : 'assets/staff.jpg'
        };

        function setBg(role) {
            document.getElementById('loginBody').style.backgroundImage =
                'url(' + (bgMap[role] || bgMap['Admin']) + ')';
        }

        setBg('Admin');

        // Change background when role changes
        document.getElementById('select-role').addEventListener('change', function () {
            setBg(this.value);
            showError('');
        });

        // Show / hide error message
        function showError(msg) {
            var el = document.getElementById('loginError');
            el.textContent = msg;
            el.classList.toggle('show', msg !== '');
        }

        // Handle login on button click or Enter key
        function doLogin() {
            var email    = document.getElementById('txt-email').value.trim();
            var password = document.getElementById('txt-password').value;
            var role     = document.getElementById('select-role').value;
            var btn      = document.getElementById('btn-log-in');

            showError('');

            if (!email || !password) {
                showError('Email and password are required.');
                return;
            }

            btn.textContent = 'Logging in...';
            btn.disabled = true;

            var body = new FormData();
            body.append('action',   'login');
            body.append('email',    email);
            body.append('password', password);
            body.append('role',     role);

            fetch('php/auth.php', { method: 'POST', body: body })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                    if (data.success) {
                        window.location.href = 'pages/' + data.role + '-page.php';
                    } else {
                        showError(data.message || 'Login failed.');
                        btn.textContent = 'Login';
                        btn.disabled = false;
                    }
                })
                .catch(function () {
                    showError('Server error. Please try again.');
                    btn.textContent = 'Login';
                    btn.disabled = false;
                });
        }

        document.getElementById('btn-log-in').addEventListener('click', doLogin);
        document.getElementById('txt-password').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') doLogin();
        });
    </script>
</body>
</html>