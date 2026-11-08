<?php
ob_start();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
ob_clean();
header('Content-Type: application/json');
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// READ
if ($action === 'read') {

    $result = $conn->query("SELECT id, name, email, role, created_at FROM users ORDER BY id ASC");
    $users  = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $users]);

// CREATE
} elseif ($action === 'create') {

    if ($_SESSION['user_role'] !== 'Admin') {
        echo json_encode(['success' => false, 'message' => 'Admins only.']);
        exit;
    }

    $name     = trim($_POST['name'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role     = $_POST['role'] ?? '';

    if (!$name || !$email || !$password || !$role) {
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email address.']);
        exit;
    }

    $chk = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $chk->bind_param('s', $email);
    $chk->execute();
    $chk->store_result();
    if ($chk->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already exists.']);
        $chk->close();
        exit;
    }
    $chk->close();

    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('ssss', $name, $email, $password, $role);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User created successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create user.']);
    }
    $stmt->close();

// UPDATE
} elseif ($action === 'update') {

    if ($_SESSION['user_role'] !== 'Admin') {
        echo json_encode(['success' => false, 'message' => 'Admins only.']);
        exit;
    }

    $id    = intval($_POST['id'] ?? 0);
    $name  = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $role  = $_POST['role'] ?? '';

    if (!$id || !$name || !$email) {
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        exit;
    }

    if ($id == $_SESSION['user_id']) {
        $stmt = $conn->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
        $stmt->bind_param('ssi', $name, $email, $id);
    } else {
        $stmt = $conn->prepare("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?");
        $stmt->bind_param('sssi', $name, $email, $role, $id);
    }

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update user.']);
    }
    $stmt->close();

// DELETE
} elseif ($action === 'delete') {

    if ($_SESSION['user_role'] !== 'Admin') {
        echo json_encode(['success' => false, 'message' => 'Admins only.']);
        exit;
    }

    $id = intval($_POST['id'] ?? 0);

    if ($id == $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'You cannot delete your own account.']);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User deleted.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete user.']);
    }
    $stmt->close();

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
}

$conn->close();
?>