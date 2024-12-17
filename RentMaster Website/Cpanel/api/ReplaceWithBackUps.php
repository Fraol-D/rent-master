<?php
header('Content-Type: application/json');

// API key validation
$api_key = "HH(CzZuQoW@tB$By)e";
$headers = getallheaders();
if (!isset($headers['x-api-key']) || $headers['x-api-key'] !== $api_key) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized: Invalid API key']));
}
// Database connection
$servername = "localhost";
$username = "marketuz_SWB";
$password = "Plp5H9:Li(UO#6[y+26E";
$dbname = "marketuz_SWB";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

// Get input data
$input = json_decode(file_get_contents('php://input'), true);
$userId = $input['userId'];
$tables = $input['tables'];

// Start transaction
$conn->begin_transaction();

try {
    foreach ($tables as $tableName => $newRows) {
        // Delete existing rows
        $stmt = $conn->prepare("DELETE FROM $tableName WHERE userId = ?");
        $stmt->bind_param("s", $userId);
        $stmt->execute();

        // Insert new rows
        $columns = implode(", ", array_keys($newRows[0]));
        $placeholders = implode(", ", array_fill(0, count($newRows[0]), "?"));
        $stmt = $conn->prepare("INSERT INTO $tableName ($columns) VALUES ($placeholders)");

        foreach ($newRows as $row) {
            $stmt->bind_param(str_repeat("s", count($row)), ...array_values($row));
            $stmt->execute();
        }
    }

    // Commit transaction
    $conn->commit();
    echo json_encode(['message' => 'User data replaced successfully']);
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    echo json_encode(['error' => $e->getMessage()]);
}

$conn->close();
?>
