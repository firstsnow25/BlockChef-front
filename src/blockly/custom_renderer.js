import * as Blockly from "blockly";

/** 작은 유틸: 정사각형 path 생성 */
function rectPath(x, y, w, h) {
  return `M ${x},${y} h ${w} v ${h} h ${-w} Z`;
}

/** 값 입력(Value input) 판별 (inputTypes 미의존) */
function isValueInput(input) {
  if (!input) return false;
  // v10+ 정식: connection.type 으로 확인
  const ct = Blockly.ConnectionType;
  if (ct && input.connection && typeof input.connection.type === "number") {
    return input.connection.type === ct.INPUT_VALUE;
  }
  // 폴백: 대부분 VALUE=1
  return input.type === 1;
}

/** ===== Constants (Geras 기반) ===== */
class ChefConstants extends Blockly.blockRendering.ConstantProvider {
  constructor() {
    super();
    // 정사각형 크기 (필요시 10~14 조정)
    this.SQUARE_W = 12;
    this.SQUARE_H = 12;
  }
}

/** ===== 커스텀 인라인 입력(ING_NAME만 사각형으로 처리) ===== */
class ChefInlineSquareMeasurable extends Blockly.blockRendering.InlineInput {
  constructor(constants, input) {
    super(constants, input);
    this.squareWidth = constants.SQUARE_W;
    this.squareHeight = constants.SQUARE_H;
    // 오른쪽 패딩을 조금 더해 레이아웃 겹침 방지
    this.width = Math.max(this.width, this.squareWidth + 6);
    this.height = Math.max(this.height, this.squareHeight);
  }
}

/** ===== RenderInfo: ING_NAME 인라인 입력을 커스텀 측정치로 치환 ===== */
class ChefRenderInfo extends Blockly.blockRendering.RenderInfo {
  addInput_(input, activeRow) {
    // 인라인 값 입력 + check가 ING_NAME 인 경우만 네모 슬롯로 그리기
    const check = (input.connection && input.connection.getCheck && input.connection.getCheck()) || [];
    const hasIngName =
      (Array.isArray(check) && check.includes("ING_NAME")) ||
      (input.connection &&
        input.connection.targetConnection &&
        Array.isArray(input.connection.targetConnection.getCheck?.()) &&
        input.connection.targetConnection.getCheck().includes("ING_NAME"));

    if (isValueInput(input) && hasIngName) {
      activeRow.elements.push(new ChefInlineSquareMeasurable(this.constants_, input));
      // 기본 인라인 입력 추가는 우리가 대체했으므로 여기서 종료
      return;
    }

    // 그 외는 기본(Geras) 로직
    super.addInput_(input, activeRow);
  }
}

/** ===== Drawer: 인라인 입력 그릴 때 사각형 구멍을 추가로 그림 ===== */
class ChefDrawer extends Blockly.blockRendering.Drawer {
  drawInternals_() {
    // Geras 기본 내부 드로잉 먼저 수행
    super.drawInternals_();

     const po = this.block_.pathObject;
   if (!po || !po.getPath) return;
   let acc = po.getPath() || "";


    for (const row of this.info_.rows) {
      for (const elem of row.elements) {
        if (elem instanceof ChefInlineSquareMeasurable) {
          const w = elem.squareWidth;
          const h = elem.squareHeight;
          const x = (elem.xPos ?? 0) + 2; // 살짝 안쪽으로 들이기
          const y = (elem.centerline ?? 0) - h / 2;

          if (Number.isFinite(x) && Number.isFinite(y)) {
            acc += " " + rectPath(x, y, w, h);
          }
        }
      }
    }

    if (acc) po.setPath(acc);
  }
}

/** ===== Renderer 본체: Geras를 베이스로 커스텀 클래스 주입 ===== */
class BlockChefRenderer extends Blockly.blockRendering.Renderer {
  constructor(name) { super(name); }
  makeConstants_() { return new ChefConstants(); }
  makeRenderInfo_(block) { return new ChefRenderInfo(this, block); }
  makeDrawer_(block, info) { return new ChefDrawer(block, info); }
}

/** 등록 */
Blockly.blockRendering.register("blockchef_renderer", BlockChefRenderer);
export default BlockChefRenderer;








