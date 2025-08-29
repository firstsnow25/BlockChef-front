import * as Blockly from "blockly";

/**
 * ✅ 사각형 탭 정의
 */
function makeSquareTab(width, height) {
  return {
    width,
    height,
    pathUp:
      "m 0,0 v -" +
      height / 2 +
      " h " +
      width +
      " v " +
      height +
      " h -" +
      width +
      " z",
    pathDown:
      "m 0,0 v " +
      height / 2 +
      " h " +
      width +
      " v -" +
      height +
      " h -" +
      width +
      " z",
  };
}

/**
 * ✅ 커스텀 ConstantProvider
 */
class BlockChefConstants extends Blockly.blockRendering.ConstantProvider {
  constructor() {
    super();

    // 사각형 notch 크기
    this.SQUARE_TAB_WIDTH = 12;
    this.SQUARE_TAB_HEIGHT = 8;

    // 기본 퍼즐 탭도 필요할 경우 super.TAB_WIDTH / TAB_HEIGHT 사용 가능
  }

  /**
   * 연결 모양 결정
   */
  shapeFor(connection) {
    const check = connection.getCheck();

    // ING_NAME 타입 블럭 출력 → 재료 계량 블럭 입력 연결시 사용
    if (check && check.includes("ING_NAME")) {
      return makeSquareTab(this.SQUARE_TAB_WIDTH, this.SQUARE_TAB_HEIGHT);
    }

    // 그 외 → 기본 퍼즐 모양 유지
    return super.shapeFor(connection);
  }
}

/**
 * ✅ 커스텀 렌더러
 */
class BlockChefRenderer extends Blockly.blockRendering.Renderer {
  constructor(name) {
    super(name);
  }

  makeConstants_() {
    return new BlockChefConstants();
  }
}

/**
 * ✅ 등록
 */
Blockly.blockRendering.register("blockchef_renderer", BlockChefRenderer);

export default BlockChefRenderer;



