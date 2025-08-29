// src/blockly/custom_renderer.js
import * as Blockly from "blockly";

/** 커스텀 상수 공급자 */
class BlockChefConstants extends Blockly.blockRendering.ConstantProvider {
  constructor() {
    super();
    // 사각형 탭 크기 (직접 지정해야 NaN 안 남)
    this.SQUARE_TAB_WIDTH = 12;
    this.SQUARE_TAB_HEIGHT = 8;
  }

  shapeFor(connection) {
    let check = connection.getCheck();
    if (!check && connection.targetConnection) {
      check = connection.targetConnection.getCheck();
    }

    // ING_NAME 타입 연결 → 사각형 이음새
    if (check && check.includes("ING_NAME")) {
      const width = this.SQUARE_TAB_WIDTH;
      const height = this.SQUARE_TAB_HEIGHT;
      return {
        type: this.SHAPES.PUZZLE,
        width,
        height,
        pathUp: Blockly.utils.svgPaths.line([
          Blockly.utils.svgPaths.point(-width, -height / 2),
          Blockly.utils.svgPaths.point(width, -height / 2),
        ]),
        pathDown: Blockly.utils.svgPaths.line([
          Blockly.utils.svgPaths.point(-width, height / 2),
          Blockly.utils.svgPaths.point(width, height / 2),
        ]),
      };
    }

    // 나머지는 기존 모양 유지
    return super.shapeFor(connection);
  }
}

/** 커스텀 렌더러 (Geras 기반) */
class BlockChefRenderer extends Blockly.geras.Renderer {
  makeConstants_() {
    return new BlockChefConstants();
  }
}

// 등록
Blockly.blockRendering.register("blockchef_renderer", BlockChefRenderer);

