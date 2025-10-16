export interface ParsedTestCase {
  scenario: string;
  precondition: string;
  steps: string;
  expectedResult: string;
  environment?: string;
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
      // 保存上一个场景
      if (currentScenario) {
        if (isScenarioOutline && examples.length > 1) {
          // 场景大纲：为每个示例生成一个测试用例
          const headers = examples[0];
          for (let j = 1; j < examples.length; j++) {
            const values = examples[j];
            let scenario = currentScenario;
            let precondition = givens.join('\n');
            let steps = whens.join('\n');
            let expectedResult = thens.join('\n');

            // 替换占位符
            for (let k = 0; k < headers.length; k++) {
              const placeholder = `<${headers[k]}>`;
              const value = values[k] || '';
              scenario = scenario.replace(new RegExp(placeholder, 'g'), value);
              precondition = precondition.replace(new RegExp(placeholder, 'g'), value);
              steps = steps.replace(new RegExp(placeholder, 'g'), value);
              expectedResult = expectedResult.replace(new RegExp(placeholder, 'g'), value);
            }

            testCases.push({
              scenario,
              precondition,
              steps,
              expectedResult,
              environment: values[0], // 假设第一列是环境
            });
          }
        } else {
          // 普通场景
          testCases.push({
            scenario: currentScenario,
            precondition: givens.join('\n'),
            steps: whens.join('\n'),
            expectedResult: thens.join('\n'),
          });
        }
      }

      // 重置
      currentScenario = line.replace(/^Scenario(?: Outline)?:\s*/, '');
      isScenarioOutline = line.startsWith('Scenario Outline:');
      givens = [];
      whens = [];
      thens = [];
      examples = [];
      isInExamples = false;
    } else if (line.startsWith('Given ')) {
      givens.push(line.replace(/^Given\s+/, ''));
    } else if (line.startsWith('And ') && givens.length > 0 && whens.length === 0) {
      givens.push(line.replace(/^And\s+/, ''));
    } else if (line.startsWith('When ')) {
      whens.push(line.replace(/^When\s+/, ''));
    } else if (line.startsWith('And ') && whens.length > 0 && thens.length === 0) {
      whens.push(line.replace(/^And\s+/, ''));
    } else if (line.startsWith('Then ')) {
      thens.push(line.replace(/^Then\s+/, ''));
    } else if (line.startsWith('And ') && thens.length > 0) {
      thens.push(line.replace(/^And\s+/, ''));
    } else if (line.startsWith('Examples:')) {
      isInExamples = true;
    } else if (isInExamples && line.startsWith('|')) {
      const row = line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);
      if (row.length > 0) {
        examples.push(row);
      }
    }
  }

  // 保存最后一个场景
  if (currentScenario) {
    if (isScenarioOutline && examples.length > 1) {
      const headers = examples[0];
      for (let j = 1; j < examples.length; j++) {
        const values = examples[j];
        let scenario = currentScenario;
        let precondition = givens.join('\n');
        let steps = whens.join('\n');
        let expectedResult = thens.join('\n');

        for (let k = 0; k < headers.length; k++) {
          const placeholder = `<${headers[k]}>`;
          const value = values[k] || '';
          scenario = scenario.replace(new RegExp(placeholder, 'g'), value);
          precondition = precondition.replace(new RegExp(placeholder, 'g'), value);
          steps = steps.replace(new RegExp(placeholder, 'g'), value);
          expectedResult = expectedResult.replace(new RegExp(placeholder, 'g'), value);
        }

        testCases.push({
          scenario,
          precondition,
          steps,
          expectedResult,
          environment: values[0],
        });
      }
    } else {
      testCases.push({
        scenario: currentScenario,
        precondition: givens.join('\n'),
        steps: whens.join('\n'),
        expectedResult: thens.join('\n'),
      });
    }
  }

  return testCases;
}
