import * as Blockly from "blockly";

/** 정사각형 탭(플러그/소켓 공용) */
function squarePaths(width, height) {
  const w = width;
  const h = height;
  // 입력(소켓)과 출력(플러그)에 각각 쓰일 pathUp/pathDown
  // 기준선에서 '사각형'을 위/아래로 반 삽입한 모양
  const pathUp =
    "m 0,0 v -" + (h / 2) + " h " + w + " v " + h + " h -" + w + " z";
  const pathDown =
    "m 0,0 v " + (h / 2) + " h " + w + " v -" + h + " h -" + w + " z";
  return { pathUp, pathDown, width: w, height: h };
}

/** Constants: Geras 상수 기반 + ING_NAME만 사각 이음새 */
class BlockChefConstants extends Blockly.blockRendering.ConstantProvider {
  constructor() {
    super();
    // 정사각형 크기(필요하면 10/10, 12/12 아무거나 써도 됨)
    this.SQUARE_W = 10;
    this.SQUARE_H = 10;

    // 미리 만들어 둔다 (type을 꼭 SQUARE로!)
    const sq = squarePaths(this.SQUARE_W, this.SQUARE_H);
    this.ING_NAME_SQUARE = {
      type: this.SHAPES.SQUARE,
      width: sq.width,
      height: sq.height,
      pathUp: sq.pathUp,
      pathDown: sq.pathDown,
    };
  }

  /** 연결 타입별 이음새 모양 선택 */
  shapeFor(connection) {
    let check = connection.getCheck();
    // check가 없는 쪽(예: 입력)을 위해 타겟의 check도 함께 본다
    if (!check && connection.targetConnection) {
      check = connection.targetConnection.getCheck();
    }

    // ✅ 재료이름 타입(ING_NAME)만 정사각 이음새로
    if (check && check.includes("ING_NAME")) {
      return this.ING_NAME_SQUARE;
    }

    // 그 외는 Geras 기본 퍼즐 탭 유지
    return super.shapeFor(connection);
  }
}

/** Renderer 본체 */
class BlockChefRenderer extends Blockly.blockRendering.Renderer {
  constructor(name) {
    super(name);
  }
  makeConstants_() {
    return new BlockChefConstants();
  }
}

/** 등록 */
Blockly.blockRendering.register("blockchef_renderer", BlockChefRenderer);
export default BlockChefRenderer;





