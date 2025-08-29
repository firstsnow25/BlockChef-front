import * as Blockly from "blockly";

/** 작은 유틸: 정사각형 path 생성 */
function rectPath(x, y, w, h) {
  return (
    "M " + x + "," + y +
    " h " + w +
    " v " + h +
    " h " + (-w) +
    " Z"
  );
}

/** ===== Constants (Geras 기반) ===== */
class ChefConstants extends Blockly.blockRendering.ConstantProvider {
  constructor() {
    super();
    // 정사각형 크기(원하면 10~14 선에서 조절)
    this.SQUARE_W = 12;
    this.SQUARE_H = 12;

    // 퍼즐탭/노치 등 나머지는 Geras 기본 유지
  }
}

/** ===== 커스텀 인라인 입력(ING_NAME만 사각형으로 처리) ===== */
class ChefInlineSquareMeasurable extends Blockly.blockRendering.InlineInput {
  constructor(constants, input) {
    super(constants, input);

    // 정사각형 크기 확정
    this.squareWidth = constants.SQUARE_W;
    this.squareHeight = constants.SQUARE_H;

    // 인라인 입력 총 가로폭에 ‘사각형 + 약간의 패딩’ 반영
    // (너무 작으면 텍스트/필드가 겹침)
    this.width = this.squareWidth + 6;   // 오른쪽 패딩 6px
    this.height = Math.max(this.height, this.squareHeight);
  }
}

/** ===== RenderInfo: ING_NAME 인라인 입력을 커스텀 측정치로 치환 ===== */
class ChefRenderInfo extends Blockly.blockRendering.RenderInfo {
  addInput_(input, activeRow) {
    if (
      input.type === Blockly.inputTypes.VALUE &&
      input.connection &&
      // 이 입력이 받는 타입이 ING_NAME이면, 사각형으로 드로잉
      ((input.connection.getCheck() || []).includes("ING_NAME") ||
        (input.connection.targetConnection &&
          (input.connection.targetConnection.getCheck() || []).includes("ING_NAME")))
    ) {
      activeRow.elements.push(new ChefInlineSquareMeasurable(this.constants_, input));
      // 기본 처리도 호출해서 필드 배치 등 잔여 요소를 채움
      // (super가 같은 input을 다시 push하지 않도록 하기 위해 return)
      return;
    }

    // 그 외는 기본(Geras) 로직
    super.addInput_(input, activeRow);
  }
}

/** ===== Drawer: 인라인 입력 그리기시에 사각형 구멍을 그려줌 ===== */
class ChefDrawer extends Blockly.blockRendering.Drawer {
  drawInternals_() {
    // Geras 기본 내부 드로잉 먼저
    super.drawInternals_();

    // 인라인 경로(PathObject)가 없다면 생성
    if (!this.inlinePath) {
      this.inlinePath = this.block_.pathObject.svgPath;
    }

    // rows를 순회하며 커스텀 인라인 입력만 따로 사각형을 그림
    for (const row of this.info_.rows) {
      for (const elem of row.elements) {
        if (elem instanceof ChefInlineSquareMeasurable) {
          const w = elem.squareWidth || this.constants_.SQUARE_W;
          const h = elem.squareHeight || this.constants_.SQUARE_H;

          // x/y 계산: 인라인 입력의 왼쪽위 기준을 구함
          const x = elem.xPos + 2; // 살짝 안쪽으로
          const y = (elem.centerline || 0) - h / 2;

          if (isFinite(x) && isFinite(y) && isFinite(w) && isFinite(h)) {
            const path = rectPath(x, y, w, h);

            // 인라인 내부 경로에 추가(겹치지 않게 누적)
            const old = this.inlinePath.getPath();
            this.inlinePath.setPath((old ? old + " " : "") + path);
          }
        }
      }
    }
  }
}

/** ===== Renderer 본체: Geras를 베이스로 커스텀 클래스 주입 ===== */
class BlockChefRenderer extends Blockly.blockRendering.Renderer {
  constructor(name) {
    super(name);
  }
  makeConstants_() { return new ChefConstants(); }
  makeRenderInfo_(block) { return new ChefRenderInfo(this, block); }
  makeDrawer_(block, info) { return new ChefDrawer(block, info); }
}

/** 등록 */
Blockly.blockRendering.register("blockchef_renderer", BlockChefRenderer);
export default BlockChefRenderer;






