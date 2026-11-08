<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }

if (!isset($_SESSION['user_id'])) {
    header('Location: ../index.php');
    exit;
}

$role     = $_SESSION['user_role'];
$userName = $_SESSION['user_name'];
$userId   = $_SESSION['user_id'];

$nameParts = explode(' ', trim($userName));
$initials  = strtoupper(
    (isset($nameParts[0]) ? substr($nameParts[0], 0, 1) : '') .
    (isset($nameParts[1]) ? substr($nameParts[1], 0, 1) : '')
);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle ?? 'Product Inventory System') ?></title>

    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/modal.css">

    <script>
        var SESSION_USER_ID   = <?= (int)$userId ?>;
        var SESSION_USER_NAME = <?= json_encode($userName) ?>;
        var SESSION_USER_ROLE = <?= json_encode($role) ?>;
    </script>

    <script src="../js/modal.js"></script>
</head>
<body>
<div class="app-wrapper">

    <!-- ── SIDEBAR ── -->
    <aside class="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-brand">
                <div>
                    <div class="brand-sub">Inventory System</div>
                </div>
            </div> <br>
            <div class="sidebar-user">
                <div class="user-info">
                    <div class="user-name"><?= htmlspecialchars($userName) ?></div>
                    <div class="user-role"><?= htmlspecialchars($role) ?></div>
                </div>
            </div>
        </div>
        <nav>
            <ul style="list-style:none;">