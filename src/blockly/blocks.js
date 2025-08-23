// src/blockly/blocks.js
import * as Blockly from 'blockly/core';
import 'blockly/blocks';

/** =========== 재료(Value) =========== */
Blockly.Blocks['ingredient_value'] = {
  init() {
    this.appendDummyInput()
      .appendField('재료')
      .appendField(new Blockly.FieldDropdown([
        ['고체', 'SOLID'],
        ['액체', 'LIQUID'],
        ['분말', 'POWDER'],
      ]), 'PROP')
      .appendField(new Blockly.FieldDropdown([
        ['김치', 'KIMCHI'],
        ['소금', 'SALT'],
        ['돼지고기', 'PORK'],
        ['소고기', 'BEEF'],
        ['브로콜리', 'BROCCOLI'],
        ['감자', 'POTATO'],
        ['마늘', 'GARLIC'],
      ]), 'TAG');
    this.appendDummyInput()
      .appendField('양')
      .appendField(new Blockly.FieldNumber(1, 0, 9999, 1), 'AMOUNT')
      .appendField(new Blockly.FieldDropdown([
        ['개', 'EA'],
        ['g', 'G'],
        ['ml', 'ML'],
        ['컵', 'CUP'],
      ]), 'UNIT');
    this.setOutput(true, null);
    this.setColour(40);
    this.setTooltip('재료를 값으로 반환');
  },
};

/** =========== (확장 방식) 뮤테이터 믹스인 =========== */
const ACTION_MUTATOR_MIXIN = {
  ingCount_: 1,
  mutationToDom() {
    const container = document.createElement('mutation');
    container.setAttribute('ingredients', this.ingCount_);
    return container;
  },
  domToMutation(xml) {
    const n = parseInt(xml.getAttribute('ingredients'), 10);
    this.updateShape_(isNaN(n) ? 1 : n);
  },
  decompose(workspace) {
    const container = workspace.newBlock('action_ingredients_container');
    container.initSvg();
    let conn = container.getInput('STACK').connection;
    for (let i = 0; i < this.ingCount_; i++) {
      const item = workspace.newBlock('action_ingredient_item');
      item.initSvg();
      conn.connect(item.previousConnection);
      conn = item.nextConnection;
    }
    return container;
  },
  compose(container) {
    const connections = [];
    let item = container.getInputTargetBlock('STACK');
    while (item) {
      connections.push(item.valueConnection_);
      item = item.nextConnection && item.nextConnection.targetBlock();
    }
    this.updateShape_(connections.length);
    // 직접 재연결
    for (let i = 0; i < this.ingCount_; i++) {
      const targetInput = this.getInput('ING' + i);
      const toConnect = connections[i];
      if (targetInput && toConnect) {
        targetInput.connection.connect(toConnect);
      }
    }
  },
  saveConnections(container) {
    let item = container.getInputTargetBlock('STACK');
    let i = 0;
    while (item) {
      const input = this.getInput('ING' + i);
      item.valueConnection_ = input && input.connection.targetConnection;
      i++;
      item = item.nextConnection && item.nextConnection.targetBlock();
    }
  },
  updateShape_(newCount) {
    for (let i = 0; this.getInput('ING' + i); i++) this.removeInput('ING' + i);
    this.ingCount_ = Math.max(1, newCount);
    for (let i = 0; i < this.ingCount_; i++) {
      this.appendValueInput('ING' + i).appendField(i === 0 ? '재료' : '추가 재료');
    }
  },
};

/** 뮤테이터 등록 (blockly@12 방식) */
Blockly.Extensions.registerMutator(
  'action_mutator',
  ACTION_MUTATOR_MIXIN,
  undefined, // helperFn (필요 없으면 undefined)
  ['action_ingredient_item'] // sub-block 타입들
);

/** =========== 동작(Statement): 조리 =========== */
Blockly.Blocks['action_cook'] = {
  init() {
    this.appendDummyInput()
      .appendField('조리')
      .appendField(new Blockly.FieldDropdown([
        ['굽는다', 'BAKE'],
        ['삶는다', 'BOIL'],
        ['볶는다', 'STIRFRY'],
        ['조린다', 'SIMMER'],
      ]), 'METHOD')
      .appendField('시간(분)')
      .appendField(new Blockly.FieldNumber(5, 0, 600, 1), 'TIME');
    this.appendValueInput('ING0').appendField('재료');

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(10);
    this.setTooltip('여러 재료를 받아 조리 동작 수행');
    this.mixin(ACTION_MUTATOR_MIXIN);       // 믹스인 적용
    this.setMutator('action_mutator');      // 등록한 뮤테이터 이름으로 연결
  },
};

/** =========== 동작(Statement): 섞기 =========== */
Blockly.Blocks['action_mix'] = {
  init() {
    this.appendDummyInput()
      .appendField('섞는다')
      .appendField(new Blockly.FieldDropdown([
        ['약하게', 'LOW'],
        ['보통', 'MEDIUM'],
        ['강하게', 'HIGH'],
      ]), 'SPEED')
      .appendField('시간(초)')
      .appendField(new Blockly.FieldNumber(10, 0, 3600, 1), 'SECONDS');
    this.appendValueInput('ING0').appendField('재료');

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(20);
    this.setTooltip('여러 재료를 지정 세기로 섞습니다.');
    this.mixin(ACTION_MUTATOR_MIXIN);
    this.setMutator('action_mutator');
  },
};

/** =========== 뮤테이터 UI용 블록 =========== */
Blockly.Blocks['action_ingredients_container'] = {
  init() {
    this.appendDummyInput().appendField('재료 입력 목록');
    this.appendStatementInput('STACK');
    this.setColour(10);
    this.contextMenu = false;
  },
};
Blockly.Blocks['action_ingredient_item'] = {
  init() {
    this.appendDummyInput().appendField('재료 입력 추가');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(10);
    this.contextMenu = false;
  },
};

/** =========== 흐름(제어) =========== */
Blockly.Blocks['flow_repeat'] = {
  init() {
    this.appendDummyInput()
      .appendField('반복')
      .appendField(new Blockly.FieldNumber(3, 1, 999, 1), 'COUNT')
      .appendField('회');
    this.appendStatementInput('DO').appendField('수행');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
    this.setTooltip('지정 횟수만큼 수행');
  },
};

Blockly.Blocks['flow_until'] = {
  init() {
    this.appendValueInput('COND').appendField('다음까지 반복 (조건)');
    this.appendStatementInput('DO').appendField('수행');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
    this.setTooltip('조건이 참이 될 때까지 반복');
  },
};

Blockly.Blocks['cond_property'] = {
  init() {
    this.appendDummyInput()
      .appendField('조건:')
      .appendField(new Blockly.FieldDropdown([
        ['부드러워짐', 'TENDER'],
        ['갈색이 됨', 'BROWNED'],
        ['끓기 시작', 'BOILING'],
      ]), 'COND');
    this.setOutput(true, 'Boolean');
    this.setColour(200);
    this.setTooltip('상태 조건(Boolean)');
  },
};


