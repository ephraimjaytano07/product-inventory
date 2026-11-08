<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
if (!empty($_SESSION['user_id'])) {
    header('Location: pages/' . $_SESSION['user_role'] . '-page.php');
} else {
    header('Location: index.php');
}
exit;
?>