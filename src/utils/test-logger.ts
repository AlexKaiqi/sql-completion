/**
 * 测试日志工具类
 * 用于在测试过程中记录详细的日志信息
 */
export class TestLogger {
  /**
   * 记录测试开始信息
   * @param testName 测试名称
   */
  static logTestStart(testName: string): void {
    console.log('\n' + '='.repeat(80));
    console.log(`测试开始: ${testName}`);
    console.log('='.repeat(80));
  }

  /**
   * 记录测试结束信息
   * @param testName 测试名称
   * @param success 测试是否成功
   */
  static logTestEnd(testName: string, success: boolean): void {
    console.log('='.repeat(80));
    console.log(`测试结束: ${testName} - ${success ? '成功' : '失败'}`);
    console.log('='.repeat(80) + '\n');
  }

  /**
   * 记录测试用例信息
   * @param caseName 用例名称
   * @param data 测试数据
   */
  static logTestCase(caseName: string, data: Record<string, any>): void {
    console.log('\n' + '-'.repeat(40));
    console.log(`测试用例: ${caseName}`);
    console.log('-'.repeat(40));
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object') {
        console.log(`${key}:`);
        console.log(JSON.stringify(value, null, 2));
      } else {
        console.log(`${key}: ${value}`);
      }
    }
  }

  /**
   * 记录测试结果信息
   * @param resultName 结果名称
   * @param result 测试结果
   */
  static logTestResult(resultName: string, result: any): void {
    console.log('\n' + '-'.repeat(40));
    console.log(`测试结果: ${resultName}`);
    console.log('-'.repeat(40));
    
    if (typeof result === 'object') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result);
    }
  }

  /**
   * 记录测试错误信息
   * @param error 错误信息
   */
  static logTestError(error: any): void {
    console.error('\n' + '!'.repeat(40));
    console.error('测试错误:');
    console.error('!'.repeat(40));
    
    if (error instanceof Error) {
      console.error(`错误名称: ${error.name}`);
      console.error(`错误消息: ${error.message}`);
      console.error(`错误堆栈: ${error.stack}`);
    } else {
      console.error(error);
    }
  }
} 