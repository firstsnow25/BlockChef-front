// src/blockly/blocks.js
import * as Blockly from 'blockly/core';
import 'blockly/blocks';

/** ================= 재료(값) 블록 ================= **/
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
    this.setColour(40); // 초록
    this.setTooltip('재료를 값으로 반환');
  },
};

/** ================= 동작(Statement) 블록 with Mutator ================= **/
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
    for (let i = 0; i < this.ingCount_; i++) {
      Blockly.Mutator.reconnect(connections[i], this, 'ING' + i);
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
    this.setColour(10); // 주황/빨강 계열
    this.setTooltip('여러 재료를 받아 조리 동작 수행');
    this.setMutator(new Blockly.Mutator(['action_ingredient_item']));
    Object.assign(this, ACTION_MUTATOR_MIXIN);
  },
};

Blockly.Blocks['action_ingredients_container'] = {
  init() {
    this.appendDummyInput().appendField('재료 목록');
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

/** ================= 흐름(제어) 블록 ================= **/
Blockly.Blocks['flow_repeat'] = {
  init() {
    this.appendDummyInput()
      .appendField('반복')
      .appendField(new Blockly.FieldNumber(3, 1, 999, 1), 'COUNT')
      .appendField('회');
    this.appendStatementInput('DO').appendField('수행');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210); // 파랑
    this.setTooltip('지정 횟수만큼 수행');
  },
};

Blockly.Blocks['flow_if_else'] = {
  init() {
    this.appendValueInput('COND').appendField('만약 (조건)');
    this.appendStatementInput('DO').appendField('이면');
    this.appendStatementInput('ELSE').appendField('아니면');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(210);
    this.setTooltip('조건 분기');
  },
};

