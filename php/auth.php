<?php
ob_start();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
ob_clean();
header('Content-Type: application/json');
require_once 'db.php';

$action   = $_POST['action'] ?? '';
$email    = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$role     = $_POST['role'] ?? '';

// LOGIN
if ($action === 'login') {

    if (!$email || !$password || !$role) {
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND role = ?");
    $stmt->bind_param('ss', $email, $role);
    $stmt->execute();
    $result = $stmt->get_result();
    $user   = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Account not found.']);
        exit;
    }

    $passwordOk = ($password === $user['password']) || password_verify($password, $user['password']);

    if ($passwordOk) {
        $_SESSION['user_id']   = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_role'] = $user['role'];

        echo json_encode([
            'success' => true,
            'role'    => $user['role'],
            'name'    => $user['name']
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Incorrect password.']);
    }

// LOGOUT
} elseif ($action === 'logout') {

    session_unset();
    session_destroy();
    echo json_encode(['success' => true]);

// SESSION CHECK
} elseif ($action === 'check') {

    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            'success'   => true,
            'logged_in' => true,
            'name'      => $_SESSION['user_name'],
            'role'      => $_SESSION['user_role']
        ]);
    } else {
        echo json_encode(['success' => true, 'logged_in' => false]);
    }

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
}

$conn->close();
?>