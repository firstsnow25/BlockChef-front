// src/blockly/custom_renderer.js
import * as Blockly from "blockly";

/** 커스텀 상수 공급자 */
class BlockChefConstants extends Blockly.blockRendering.ConstantProvider {
  shapeFor(connection) {
    let check = connection.getCheck();
    if (!check && connection.targetConnection) {
      check = connection.targetConnection.getCheck();
    }

    // ✅ ING_NAME 전용 → 사각형 이음새
    if (check && check.includes("ING_NAME")) {
      return {
        type: this.SHAPES.PUZZLE,
        width: this.TAB_WIDTH,
        height: this.TAB_HEIGHT,
        pathUp: Blockly.utils.svgPaths.line([
          Blockly.utils.svgPaths.point(-this.TAB_WIDTH, -this.TAB_HEIGHT / 2),
          Blockly.utils.svgPaths.point(this.TAB_WIDTH, -this.TAB_HEIGHT / 2),
        ]),
        pathDown: Blockly.utils.svgPaths.line([
          Blockly.utils.svgPaths.point(-this.TAB_WIDTH, this.TAB_HEIGHT / 2),
          Blockly.utils.svgPaths.point(this.TAB_WIDTH, this.TAB_HEIGHT / 2),
        ]),
      };
    }

    // 나머지는 기본 유지
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
