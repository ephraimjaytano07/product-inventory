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
$uid    = $_SESSION['user_id'];
$urole  = $_SESSION['user_role'];

// READ REQUESTS
if ($action === 'read') {

    $filter = $_GET['filter'] ?? 'mine';

    if ($filter === 'mine') {
        $stmt = $conn->prepare(
            "SELECT r.id, r.created_at, r.requested_by_role,
                    u.name AS requested_by_name,
                    ri.id AS item_id, ri.supplier_id, ri.product_name,
                    ri.unit_price, ri.quantity, ri.status,
                    s.name AS supplier_name
             FROM requests r
             JOIN users u ON r.requested_by = u.id
             JOIN request_items ri ON ri.request_id = r.id
             LEFT JOIN users s ON ri.supplier_id = s.id
             WHERE r.requested_by = ?
             ORDER BY r.id DESC"
        );
        $stmt->bind_param('i', $uid);

    } elseif ($filter === 'staff') {
        $stmt = $conn->prepare(
            "SELECT r.id, r.created_at, r.requested_by_role,
                    u.name AS requested_by_name,
                    ri.id AS item_id, ri.supplier_id, ri.product_name,
                    ri.unit_price, ri.quantity, ri.status,
                    s.name AS supplier_name
             FROM requests r
             JOIN users u ON r.requested_by = u.id
             JOIN request_items ri ON ri.request_id = r.id
             LEFT JOIN users s ON ri.supplier_id = s.id
             WHERE r.requested_by_role = 'Staff'
             ORDER BY r.id DESC"
        );

    } elseif ($filter === 'supplier') {
        $stmt = $conn->prepare(
            "SELECT r.id, r.created_at, r.requested_by_role,
                    u.name AS requested_by_name,
                    ri.id AS item_id, ri.supplier_id, ri.product_name,
                    ri.unit_price, ri.quantity, ri.status,
                    s.name AS supplier_name
             FROM requests r
             JOIN users u ON r.requested_by = u.id
             JOIN request_items ri ON ri.request_id = r.id
             LEFT JOIN users s ON ri.supplier_id = s.id
             WHERE ri.supplier_id = ?
               AND ri.status IN ('Approved','Out for Delivery','Delivered','Rejected')
             ORDER BY r.id DESC"
        );
        $stmt->bind_param('i', $uid);

    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid filter.']);
        exit;
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $rows   = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $rows]);
    $stmt->close();

// CHECKOUT
} elseif ($action === 'checkout') {

    $items = json_decode($_POST['items'] ?? '[]', true);

    if (empty($items)) {
        echo json_encode(['success' => false, 'message' => 'Cart is empty.']);
        exit;
    }

    foreach ($items as $item) {
        $sid   = intval($item['supplierId']);
        $pname = trim($item['productName']);
        $qty   = intval($item['quantity']);

        $stockChk = $conn->prepare(
            "SELECT stock, name FROM supplier_stocks
             WHERE supplier_id = ? AND LOWER(name) = LOWER(?) LIMIT 1"
        );
        $stockChk->bind_param('is', $sid, $pname);
        $stockChk->execute();
        $stockRow = $stockChk->get_result()->fetch_assoc();
        $stockChk->close();

        if (!$stockRow) {
            echo json_encode([
                'success' => false,
                'message' => '"' . $pname . '" was not found in the supplier\'s stock. Please remove it from your cart and try again.'
            ]);
            exit;
        }

        if ($qty > intval($stockRow['stock'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Requested quantity (' . $qty . ') for "' . $pname . '" exceeds available supplier stock (' . intval($stockRow['stock']) . '). Please update your cart.'
            ]);
            exit;
        }

        if ($qty <= 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Quantity for "' . $pname . '" must be at least 1.'
            ]);
            exit;
        }
    }

    $initStatus = ($urole === 'Admin') ? 'Approved' : 'Pending Admin Approval';

    $rStmt = $conn->prepare("INSERT INTO requests (requested_by, requested_by_role) VALUES (?, ?)");
    $rStmt->bind_param('is', $uid, $urole);
    $rStmt->execute();
    $requestId = $conn->insert_id;
    $rStmt->close();

    $iStmt = $conn->prepare(
        "INSERT INTO request_items (request_id, supplier_id, product_name, unit_price, quantity, status)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    foreach ($items as $item) {
        $sid   = intval($item['supplierId']);
        $pname = $item['productName'];
        $price = floatval($item['unitPrice']);
        $qty   = intval($item['quantity']);
        $iStmt->bind_param('issdis', $requestId, $sid, $pname, $price, $qty, $initStatus);
        $iStmt->execute();
    }
    $iStmt->close();

    echo json_encode(['success' => true, 'message' => 'Request submitted successfully.']);

// UPDATE STATUS
} elseif ($action === 'update_status') {

    $item_id   = intval($_POST['item_id'] ?? 0);
    $newStatus = $_POST['status'] ?? '';

    $allowed = ['Approved', 'Declined', 'Out for Delivery', 'Rejected', 'Delivered'];
    if (!in_array($newStatus, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Invalid status.']);
        exit;
    }

    if (in_array($newStatus, ['Approved', 'Declined']) && $urole !== 'Admin') {
        echo json_encode(['success' => false, 'message' => 'Admins only can approve or decline.']);
        exit;
    }

    if (in_array($newStatus, ['Out for Delivery', 'Rejected', 'Delivered']) && $urole !== 'Supplier') {
        echo json_encode(['success' => false, 'message' => 'Suppliers only for this action.']);
        exit;
    }

    if ($newStatus === 'Delivered') {

        $iStmt = $conn->prepare(
            "SELECT ri.*, r.requested_by_role
             FROM request_items ri
             JOIN requests r ON r.id = ri.request_id
             WHERE ri.id = ?"
        );
        $iStmt->bind_param('i', $item_id);
        $iStmt->execute();
        $item = $iStmt->get_result()->fetch_assoc();
        $iStmt->close();

        if (!$item) {
            echo json_encode(['success' => false, 'message' => 'Item not found.']);
            exit;
        }

        $dsStmt = $conn->prepare(
            "UPDATE supplier_stocks
             SET stock = stock - ?
             WHERE supplier_id = ? AND LOWER(name) = LOWER(?) AND stock >= ?"
        );
        $dsStmt->bind_param('iisi', $item['quantity'], $item['supplier_id'], $item['product_name'], $item['quantity']);
        $dsStmt->execute();

        if ($conn->affected_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Insufficient supplier stock to deliver.']);
            exit;
        }
        $dsStmt->close();

        $chkStmt = $conn->prepare(
            "SELECT id, stock FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1"
        );
        $chkStmt->bind_param('s', $item['product_name']);
        $chkStmt->execute();
        $existing = $chkStmt->get_result()->fetch_assoc();
        $chkStmt->close();

        if ($existing) {
            $newStock = $existing['stock'] + $item['quantity'];
            $upd      = $conn->prepare("UPDATE products SET stock = ? WHERE id = ?");
            $upd->bind_param('ii', $newStock, $existing['id']);
            $upd->execute();
            $upd->close();
        } else {
            $sellPrice = round($item['unit_price'] * 1.2, 2);
            $desc      = 'Auto-added from delivery';
            $ins = $conn->prepare(
                "INSERT INTO products (name, description, supplier_id, purchase_price, selling_price, stock)
                 VALUES (?, ?, ?, ?, ?, ?)"
            );
            $ins->bind_param('ssiidi',
                $item['product_name'], $desc, $item['supplier_id'],
                $item['unit_price'], $sellPrice, $item['quantity']
            );
            $ins->execute();
            $ins->close();
        }
    }

    $stmt = $conn->prepare("UPDATE request_items SET status = ? WHERE id = ?");
    $stmt->bind_param('si', $newStatus, $item_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Status updated.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update status.']);
    }
    $stmt->close();

// NOTIF COUNT
} elseif ($action === 'notif_count') {

    $stmt = $conn->prepare(
        "SELECT COUNT(*) AS cnt FROM request_items WHERE supplier_id = ? AND status = 'Approved'"
    );
    $stmt->bind_param('i', $uid);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    echo json_encode(['success' => true, 'count' => intval($row['cnt'])]);
    $stmt->close();

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action.']);
}

$conn->close();
?>