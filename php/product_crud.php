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

    $result   = $conn->query("
        SELECT p.*, u.name AS supplier_name
        FROM products p
        LEFT JOIN users u ON p.supplier_id = u.id
        ORDER BY p.id ASC
    ");
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $products]);

// CREATE
} elseif ($action === 'create') {

    if ($_SESSION['user_role'] !== 'Admin') {
        echo json_encode(['success' => false, 'message' => 'Admins only.']);
        exit;
    }

    $name           = trim($_POST['name'] ?? '');
    $description    = trim($_POST['description'] ?? '');
    $category       = trim($_POST['category'] ?? '');
    $supplier_id    = intval($_POST['supplier_id'] ?? 0);
    $purchase_price = floatval($_POST['purchase_price'] ?? 0);
    $selling_price  = floatval($_POST['selling_price'] ?? 0);
    $stock          = intval($_POST['stock'] ?? 0);

    if (!$name) {
        echo json_encode(['success' => false, 'message' => 'Product name is required.']);
        exit;
    }
    if ($purchase_price <= 0 || $selling_price <= 0) {
        echo json_encode(['success' => false, 'message' => 'Enter valid prices.']);
        exit;
    }
    if ($selling_price < $purchase_price) {
        echo json_encode(['success' => false, 'message' => 'Selling price must be >= purchase price.']);
        exit;
    }

    if ($supplier_id > 0) {
        $chk = $conn->prepare("SELECT id FROM users WHERE id = ? AND role = 'Supplier' LIMIT 1");
        $chk->bind_param('i', $supplier_id);
        $chk->execute();
        $chk->store_result();
        $supplierExists = $chk->num_rows > 0;
        $chk->close();

        if (!$supplierExists) {
            echo json_encode(['success' => false, 'message' => 'Selected supplier does not exist.']);
            exit;
        }

        $stmt = $conn->prepare(
            "INSERT INTO products (name, description, category, supplier_id, purchase_price, selling_price, stock)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param('sssiddi', $name, $description, $category, $supplier_id, $purchase_price, $selling_price, $stock);
    } else {
        $stmt = $conn->prepare(
            "INSERT INTO products (name, description, category, supplier_id, purchase_price, selling_price, stock)
             VALUES (?, ?, ?, NULL, ?, ?, ?)"
        );
        $stmt->bind_param('sssddi', $name, $description, $category, $purchase_price, $selling_price, $stock);
    }

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Product added successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add product: ' . $stmt->error]);
    }
    $stmt->close();

// DELETE
} elseif ($action === 'delete') {

    if ($_SESSION['user_role'] !== 'Admin') {
        echo json_encode(['success' => false, 'message' => 'Admins only.']);
        exit;
    }

    $id   = intval($_POST['id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM products WHERE id = ?");
    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Product deleted.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete product.']);
    }
    $stmt->close();

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
}

$conn->close();
?>