// 커스텀 렌더러: ING_NAME 값-입력 연결만 "정사각 탭"으로 보이게
import * as Blockly from "blockly/core";

// 1) 상수 공급자: 정사각 탭 도형 정의 + shapeFor 커스터마이즈
class ChefConstants extends Blockly.blockRendering.ConstantProvider {
  constructor() {
    super();
    // 정사각 슬롯 크기(원하는 값으로 조정)
    this.SQUARE_TAB_WIDTH = 14;
    this.SQUARE_TAB_HEIGHT = 14;

    // 기본 퍼즐탭 대신 “평평한 위/아래 경로”를 주면 슬롯이 네모로 보입니다.
    this.SQUARE_TAB = this.makeSquareTab_();
  }

  makeSquareTab_() {
    const w = this.SQUARE_TAB_WIDTH;
    const h = this.SQUARE_TAB_HEIGHT;
    const half = h / 2;

    // MDN/Blockly 가이드 방식: pathUp / pathDown 은 탭의 위·아래 경계선만 그립니다.
    const up = Blockly.utils.svgPaths.line([
      Blockly.utils.svgPaths.point(-w, -half),
      Blockly.utils.svgPaths.point(+w, -half),
    ]);
    const down = Blockly.utils.svgPaths.line([
      Blockly.utils.svgPaths.point(-w, +half),
      Blockly.utils.svgPaths.point(+w, +half),
    ]);

    return {
      type: this.SHAPES.PUZZLE, // 퍼즐 탭 타입 그대로 사용
      width: w,
      height: h,
      pathUp: up,
      pathDown: down,
    };
  }

  // ✅ 특정 체크(ING_NAME)를 쓰는 “값 입력” 연결만 정사각 탭 적용
  shapeFor(connection) {
    let check = connection.getCheck();
    if (!check && connection.targetConnection) {
      check = connection.targetConnection.getCheck();
    }

    // 재료계량 NAME 입력은 setCheck("ING_NAME") 이므로 여기로 매칭됨
    if (check && check.includes("ING_NAME")) {
      return this.SQUARE_TAB;
    }
    return super.shapeFor(connection);
  }
}

// 2) Geras 기반 렌더러 등록(겉모습 그대로 유지하면서 상수만 교체)
class ChefRenderer extends Blockly.geras.Renderer {
  makeConstants_() {
    return new ChefConstants();
  }
}

// 전역 등록: inject({ renderer: "chef_geras" }) 로 사용
Blockly.blockRendering.register("chef_geras", ChefRenderer);






