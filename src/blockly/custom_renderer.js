// 정사각 슬롯: ING_NAME 값-입력만 각지게 (나머지는 기존 geras 그대로)
import * as Blockly from "blockly/core";

// ✅ Geras 전용 상수 공급자 상속 (예전 오류 원인 해결 포인트)
class ChefGerasConstants extends Blockly.geras.ConstantProvider {
  constructor() {
    super();
    // 정사각 슬롯 크기: geras 기본 탭 치수 기반으로 통일감 유지
    this.SQUARE_TAB_WIDTH = this.TAB_WIDTH;   // 보통 8~16
    this.SQUARE_TAB_HEIGHT = this.TAB_HEIGHT; // 보통 8~16

    // 도형 객체(위/아래 경계선을 평평한 선으로) — 사각형 슬롯
    this.SQUARE_TAB = this.makeSquareTab_();
  }

  makeSquareTab_() {
    const w = this.SQUARE_TAB_WIDTH;
    const h = this.SQUARE_TAB_HEIGHT;
    const half = h / 2;

    // pathUp / pathDown 은 슬롯의 위/아래 “직선”만 그리면 됩니다.
    // 좌우(직각 모서리)는 블록 외곽 경로에서 자동으로 붙습니다.
    const up = Blockly.utils.svgPaths.line([
      Blockly.utils.svgPaths.point(-w, -half),
      Blockly.utils.svgPaths.point(+w, -half),
    ]);
    const down = Blockly.utils.svgPaths.line([
      Blockly.utils.svgPaths.point(-w, +half),
      Blockly.utils.svgPaths.point(+w, +half),
    ]);

    return {
      type: this.SHAPES.PUZZLE, // 퍼즐 탭 타입 유지(연결 로직은 그대로)
      width: w,
      height: h,
      pathUp: up,
      pathDown: down,
    };
  }

  // ✅ ING_NAME 체크를 쓰는 “값-입력”만 네모 슬롯으로
  shapeFor(connection) {
    let check = connection.getCheck();
    if (!check && connection.targetConnection) {
      check = connection.targetConnection.getCheck();
    }

    if (check && check.includes("ING_NAME")) {
      return this.SQUARE_TAB;
    }
    return super.shapeFor(connection);
  }
}

// ✅ Geras 기반 렌더러: 상수만 교체
class ChefGerasRenderer extends Blockly.geras.Renderer {
  makeConstants_() {
    return new ChefGerasConstants();
  }
}

// 전역 등록 → inject({ renderer: "chef_geras" })
Blockly.blockRendering.register("chef_geras", ChefGerasRenderer);








