import { nanoid } from 'nanoid';

export interface ParsedTestCase {
  scenario: string;
  precondition: string;
  steps: string;
  expectedResult: string;
  environment?: string;
  groupId?: string; // 用于标识同一场景的多个期望
}

export function parseGherkinToTestCases(gherkinContent: string): ParsedTestCase[] {
  const testCases: ParsedTestCase[] = [];
  const lines = gherkinContent.split('\n').map(line => line.trim());

  let currentScenario = '';
  let givens: string[] = [];
  let whens: string[] = [];
  let thens: string[] = [];
  let examples: string[][] = [];
  let isInExamples = false;
  let isScenarioOutline = false;
  let scenarioCount = 0; // 场景计数器

  // 背景（Background）相关
  let backgroundGivens: string[] = [];
  let isInBackground = false;

  const generateGroupId = () => nanoid(10); // 生成10位的短ID

  const createTestCasesFromScenario = () => {
    if (!currentScenario) return;

    scenarioCount++;
    const hasMultipleScenarios = gherkinContent.match(/Scenario(?:\s+Outline)?:/g)?.length || 0 > 1;

    // 合并背景条件到前置条件
    const allGivens = [...backgroundGivens, ...givens];

    if (isScenarioOutline) {
      // 场景大纲
      if (examples.length <= 1) {
        // Scenario Outline 没有 Examples，按字面内容生成1个测试用例（不替换占位符）
        if (thens.length > 1) {
          // 多个期望：拆分为多个测试用例
          const groupId = generateGroupId();
          thens.forEach((then) => {
            testCases.push({
              scenario: currentScenario,
              precondition: allGivens.join('\n'),
              steps: whens.join('\n'),
              expectedResult: then,
              groupId,
            });
          });
        } else {
          // 单个期望
          testCases.push({
            scenario: currentScenario,
            precondition: allGivens.join('\n'),
            steps: whens.join('\n'),
            expectedResult: thens.join('\n'),
          });
        }
        return;
      }

      // 有 Examples，为每个示例生成测试用例
      const headers = examples[0];
      const groupId = hasMultipleScenarios ? generateGroupId() : undefined; // 多场景时生成 groupId

      for (let j = 1; j < examples.length; j++) {
        const values = examples[j];
        let scenario = currentScenario;
        let precondition = allGivens.join('\n');
        let steps = whens.join('\n');

        // 替换占位符
        for (let k = 0; k < headers.length; k++) {
          const placeholder = `<${headers[k]}>`;
          const value = values[k] || '';
          scenario = scenario.replace(new RegExp(placeholder, 'g'), value);
          precondition = precondition.replace(new RegExp(placeholder, 'g'), value);
          steps = steps.replace(new RegExp(placeholder, 'g'), value);
        }

        // 如果有多个 Then，拆分为多个测试用例
        if (thens.length > 1) {
          const thenGroupId = generateGroupId();
          thens.forEach((then, index) => {
            let expectedResult = then;
            for (let k = 0; k < headers.length; k++) {
              const placeholder = `<${headers[k]}>`;
              const value = values[k] || '';
              expectedResult = expectedResult.replace(new RegExp(placeholder, 'g'), value);
            }
            // 构建环境信息：合并所有 Examples 列的值（排除已用于替换Then的列）
            const environmentParts: string[] = [];
            const thenText = thens.join('\n');
            for (let k = 0; k < headers.length; k++) {
              const header = headers[k];
              const value = values[k] || '';
              // 检查这个列是否在Then中被使用
              const placeholder = `<${header}>`;
              const isUsedInThen = thenText.includes(placeholder);

              // 只有不在Then中使用的列才加入环境信息
              if (!isUsedInThen) {
                if (value) {
                  environmentParts.push(`${header}: ${value}`);
                } else {
                  environmentParts.push(`${header}: (空)`);
                }
              }
            }
            const environment = environmentParts.length > 0 ? environmentParts.join(', ') : undefined;

            testCases.push({
              scenario, // 保持场景名称不变
              precondition,
              steps,
              expectedResult,
              environment,
              groupId: thenGroupId,
            });
          });
        } else {
          // 单个期望
          let expectedResult = thens.join('\n');
          for (let k = 0; k < headers.length; k++) {
            const placeholder = `<${headers[k]}>`;
            const value = values[k] || '';
            expectedResult = expectedResult.replace(new RegExp(placeholder, 'g'), value);
          }

          // 构建环境信息：合并所有 Examples 列的值（排除已用于替换Then的列）
          const environmentParts: string[] = [];
          const thenText = thens.join('\n');
          for (let k = 0; k < headers.length; k++) {
            const header = headers[k];
            const value = values[k] || '';
            // 检查这个列是否在Then中被使用
            const placeholder = `<${header}>`;
            const isUsedInThen = thenText.includes(placeholder);

            // 只有不在Then中使用的列才加入环境信息
            if (!isUsedInThen) {
              if (value) {
                environmentParts.push(`${header}: ${value}`);
              } else {
                environmentParts.push(`${header}: (空)`);
              }
            }
          }
          const environment = environmentParts.length > 0 ? environmentParts.join(', ') : undefined;

          testCases.push({
            scenario,
            precondition,
            steps,
            expectedResult,
            environment,
            groupId, // 多场景时使用 groupId 关联同一场景的不同示例
          });
        }
      }
    } else {
      // 普通场景
      if (thens.length > 1) {
        // 多个期望：拆分为多个测试用例
        const groupId = generateGroupId();
        thens.forEach((then, index) => {
          testCases.push({
            scenario: currentScenario, // 保持场景名称不变
            precondition: allGivens.join('\n'),
            steps: whens.join('\n'),
            expectedResult: then,
            groupId,
          });
        });
      } else {
        // 单个期望
        testCases.push({
          scenario: currentScenario,
          precondition: allGivens.join('\n'),
          steps: whens.join('\n'),
          expectedResult: thens.join('\n'),
        });
      }
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('Background:')) {
      // 进入背景部分
      isInBackground = true;
      backgroundGivens = [];
    } else if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
      // 退出背景部分
      isInBackground = false;

      // 保存上一个场景
      createTestCasesFromScenario();

      // 重置
      currentScenario = line.replace(/^Scenario(?: Outline)?:\s*/, '');
      isScenarioOutline = line.startsWith('Scenario Outline:');
      givens = [];
      whens = [];
      thens = [];
      examples = [];
      isInExamples = false;
    } else if (line.startsWith('Given ')) {
      const content = line.replace(/^Given\s+/, '');
      if (isInBackground) {
        backgroundGivens.push(content);
      } else {
        givens.push(content);
      }
    } else if (line.startsWith('And ') && (givens.length > 0 || backgroundGivens.length > 0) && whens.length === 0) {
      // And 可以跟随 Given
      const content = line.replace(/^And\s+/, '');
      if (isInBackground) {
        backgroundGivens.push(content);
      } else {
        givens.push(content);
      }
    } else if (line.startsWith('When ')) {
      whens.push(line.replace(/^When\s+/, ''));
    } else if (line.startsWith('And ') && whens.length > 0 && thens.length === 0) {
      // And 跟随 When
      whens.push(line.replace(/^And\s+/, ''));
    } else if (line.startsWith('Then ')) {
      thens.push(line.replace(/^Then\s+/, ''));
    } else if ((line.startsWith('And ') || line.startsWith('But ')) && thens.length > 0) {
      // And 或 But 跟随 Then
      const content = line.replace(/^(?:And|But)\s+/, '');
      thens.push(content);
    } else if (line.startsWith('Examples:')) {
      isInExamples = true;
    } else if (isInExamples && line.startsWith('|')) {
      const cells = line.split('|').map(cell => cell.trim());
      // 移除首尾的空字符串（因为行是以 | 开始和结束的）
      if (cells.length > 0 && cells[0] === '') cells.shift();
      if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop();

      // 保留空单元格，不要过滤掉
      if (cells.length > 0) {
        examples.push(cells);
      }
    }
  }

  // 保存最后一个场景
  createTestCasesFromScenario();

  return testCases;
}
