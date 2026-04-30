<?php
require __DIR__ . '/../includes/auth.php';
unset($_SESSION['impersonating_as']);
header('Location: /super/');
exit;
