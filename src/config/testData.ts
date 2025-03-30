import { FlinkSQLContext } from '../types/sql';

export const testContext: FlinkSQLContext = {
    tables: [
        'users',
        'orders',
        'products',
        'categories',
        'order_items',
        'shipping_addresses',
    ],
    columns: {
        'users': ['id', 'name', 'email', 'created_at', 'updated_at'],
        'orders': ['id', 'user_id', 'order_date', 'status', 'total_amount'],
        'products': ['id', 'name', 'description', 'price', 'stock', 'category_id'],
        'categories': ['id', 'name', 'description', 'parent_id'],
        'order_items': ['id', 'order_id', 'product_id', 'quantity', 'unit_price'],
        'shipping_addresses': ['id', 'user_id', 'address', 'city', 'state', 'zip_code'],
    },
    functions: [
        'COUNT',
        'SUM',
        'AVG',
        'MAX',
        'MIN',
        'CONCAT',
        'SUBSTRING',
        'DATE_FORMAT',
        'TO_TIMESTAMP',
        'CAST',
        'COALESCE',
        'NULLIF',
        'IF',
        'CASE',
        'GROUP_CONCAT',
        'DISTINCT',
        'ORDER BY',
        'GROUP BY',
        'HAVING',
        'LIMIT'
    ]
}; 