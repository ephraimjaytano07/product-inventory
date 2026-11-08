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

    if ($_SESSION['user_role'] === 'Supplier') {
        $sid  = $_SESSION['user_id'];
        $stmt = $conn->prepare(
            "SELECT ss.*, u.name AS supplier_name
             FROM supplier_stocks ss
             JOIN users u ON ss.supplier_id = u.id
             WHERE ss.supplier_id = ?
             ORDER BY ss.id ASC"
        );
        $stmt->bind_param('i', $sid);
    } else {
        $stmt = $conn->prepare(
            "SELECT ss.*, u.name AS supplier_name
             FROM supplier_stocks ss
             JOIN users u ON ss.supplier_id = u.id
             ORDER BY ss.id ASC"
        );
    }

    $stmt->execute();
    $result   = $stmt->get_result();
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $products]);
    $stmt->close();

// READ BY SUPPLIER
} elseif ($action === 'read_by_supplier') {

    $sid  = intval($_GET['supplier_id'] ?? 0);
    $stmt = $conn->prepare(
        "SELECT * FROM supplier_stocks WHERE supplier_id = ? ORDER BY name ASC"
    );
    $stmt->bind_param('i', $sid);
    $stmt->execute();
    $result   = $stmt->get_result();
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $products]);
    $stmt->close();

// CREATE
} elseif ($action === 'create') {

    if ($_SESSION['user_role'] !== 'Supplier') {
        echo json_encode(['success' => false, 'message' => 'Suppliers only.']);
        exit;
    }

    $name        = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $price       = floatval($_POST['price'] ?? 0);
    $stock       = intval($_POST['stock'] ?? 0);
    $supplier_id = $_SESSION['user_id'];

    if (!$name || !$description || $price <= 0 || $stock < 0) {
        echo json_encode(['success' => false, 'message' => 'Please fill all fields correctly.']);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO supplier_stocks (supplier_id, name, description, price, stock)
         VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('issdi', $supplier_id, $name, $description, $price, $stock);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Stock added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add stock.']);
    }
    $stmt->close();

// UPDATE
} elseif ($action === 'update') {

    if ($_SESSION['user_role'] !== 'Supplier') {
        echo json_encode(['success' => false, 'message' => 'Suppliers only.']);
        exit;
    }

    $id    = intval($_POST['id'] ?? 0);
    $price = floatval($_POST['price'] ?? 0);
    $stock = intval($_POST['stock'] ?? 0);

    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Invalid product ID.']);
        exit;
    }
    if ($price <= 0) {
        echo json_encode(['success' => false, 'message' => 'Price must be a positive number.']);
        exit;
    }
    if ($stock < 0) {
        echo json_encode(['success' => false, 'message' => 'Stock cannot be negative.']);
        exit;
    }

    $chk = $conn->prepare(
        "SELECT id FROM supplier_stocks WHERE id = ? AND supplier_id = ? LIMIT 1"
    );
    $chk->bind_param('ii', $id, $_SESSION['user_id']);
    $chk->execute();
    $chk->store_result();

    if ($chk->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Product not found or access denied.']);
        $chk->close();
        exit;
    }
    $chk->close();

    $stmt = $conn->prepare(
        "UPDATE supplier_stocks SET price = ?, stock = ? WHERE id = ? AND supplier_id = ?"
    );
    $stmt->bind_param('diii', $price, $stock, $id, $_SESSION['user_id']);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Product updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update product.']);
    }
    $stmt->close();

// DELETE
} elseif ($action === 'delete') {

    if ($_SESSION['user_role'] !== 'Supplier') {
        echo json_encode(['success' => false, 'message' => 'Suppliers only.']);
        exit;
    }

    $id = intval($_POST['id'] ?? 0);

    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'Invalid product ID.']);
        exit;
    }

    $chk = $conn->prepare(
        "SELECT id FROM supplier_stocks WHERE id = ? AND supplier_id = ? LIMIT 1"
    );
    $chk->bind_param('ii', $id, $_SESSION['user_id']);
    $chk->execute();
    $chk->store_result();

    if ($chk->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Product not found or access denied.']);
        $chk->close();
        exit;
    }
    $chk->close();

    $stmt = $conn->prepare(
        "DELETE FROM supplier_stocks WHERE id = ? AND supplier_id = ?"
    );
    $stmt->bind_param('ii', $id, $_SESSION['user_id']);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Product deleted successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete product.']);
    }
    $stmt->close();

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
}

$conn->close();
?>