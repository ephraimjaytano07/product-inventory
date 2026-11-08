<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

ob_start();
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
ob_clean();

class Database {
    private $host   = "localhost";
    private $user   = "root";
    private $pass   = "";
    private $dbname = "product_inventory_db";

    public $conn;

    public function __construct() {
        $this->conn = new mysqli(
            $this->host,
            $this->user,
            $this->pass,
            $this->dbname
        );

        if ($this->conn->connect_error) {
            die(json_encode([
                'success' => false,
                'message' => 'Database Connection Failed: ' . $this->conn->connect_error
            ]));
        }

        $this->conn->set_charset('utf8');
    }
}

$db   = new Database();
$conn = $db->conn;
?>