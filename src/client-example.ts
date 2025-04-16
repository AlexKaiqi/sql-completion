import fetch from 'node-fetch';

/**
 * 测试SQL上下文API的客户端示例
 */
async function testSQLContextAPI() {
  try {
    // 测试SQL语句和光标位置
    const sql = 'SELECT * FROM users WHERE id = 1';
    const position = {
      lineNumber: 1,
      column: 10  // 光标位于"*"后面
    };

    // 发送请求到API
    const response = await fetch('http://localhost:3000/api/context', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, position })
    });

    // 检查响应状态
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API请求失败:', errorData);
      return;
    }

    // 解析响应数据
    const data = await response.json();
    console.log('SQL上下文信息:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('请求出错:', error);
  }
}

// 运行测试
testSQLContextAPI(); 