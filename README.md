# 한울 · HWP/HWPX for VS Code

한컴오피스 설치 없이 한글 문서를 작성하고 편집하는 **0.1.0 시제품**입니다. 문서 엔진과 편집 UI는 [rhwp](https://github.com/edwardkim/rhwp)를 사용하며, 이 저장소는 VS Code 통합과 저장 보호 기능을 구현합니다. 기존 제품보다 품질이 높다는 비교 검증은 아직 진행하지 않았습니다.

## 바로 사용하기

1. VS Code 확장 탭에서 `…` → **VSIX에서 설치**를 선택합니다.
2. `artifacts/hanul-hwpx-0.1.0.vsix`를 설치합니다.
3. 명령 팔레트에서 **한울: 새 HWPX 문서**, **한울: HWP/HWPX 문서 열기**, **한울: 예제 문서 만들기** 중 하나를 실행합니다.
4. 본문을 입력하거나 표를 만들고 `Ctrl+S` / macOS `Cmd+S`로 저장합니다. 새 문서는 `.hwpx` 확장자로 저장하세요.

기존 파일은 파일 탭 우클릭 → **다음으로 다시 열기** → **한울 한글 편집기**로 열 수도 있습니다. 다른 확장의 기본 연결을 덮어쓰지 않도록 기본 편집기 지정은 사용자가 선택합니다.

## 구현한 기능

- 빈 문서 작성, HWP/HWPX 열기와 같은 형식으로 저장.
- rhwp 기반 페이지 표시, 한글 입력, 글자·문단 서식, 표 생성·셀 편집, 실행 취소·다시 실행.
- VS Code의 저장, 다른 이름으로 저장, 변경 표시, 재열기, hot-exit 백업 인터페이스.
- 편집 없이 저장하면 원본 파일 바이트를 그대로 사용.
- 편집한 문서는 엔진의 내용 손실 보고 검사와 독립 문서 재열기 검사 후 저장. HWPX는 ZIP 구성과 XML 구문도 검사.
- 임시 파일 작성·동기화 후 파일 교체. 덮어쓰기 전 최초 원본을 `파일명.hanul-backup`으로 보관.
- 외부 변경 해시 검사. 충돌 시 원본을 덮어쓰지 않고 다른 이름으로 저장하거나 다시 열도록 안내.
- 문서 엔진, 기본 글꼴, UI 리소스를 확장에 포함. 문서 처리 중 외부 웹폰트 사용을 끄고 CSP로 네트워크 접근을 제한.

## 현재 범위와 검증

Windows의 Chromium과 실제 VS Code에서 한글 입력, 서식, Undo/Redo, 표 생성·셀 편집, HWPX 저장·재열기, HWP 내보내기·재열기를 검사합니다. 자동 검사 결과는 `artifacts/vscode-test-results.json`과 테스트 로그에서 확인할 수 있습니다.

플랫폼 전용 실행 파일을 사용하지 않는 TypeScript + WebAssembly 구조입니다. **macOS·Linux 실기기 입력·저장 검증과 한컴 한글에서의 호환성 검증은 아직 수행하지 않았습니다.** 복잡한 문서의 페이지·개체·서식 보존을 보증하는 출시 버전은 아닙니다.

- 암호 문서의 편집·저장은 지원하지 않습니다.
- HWP는 공개 5.x 형식을 중심으로 합니다. 모든 구버전 HWP 호환성을 약속하지 않습니다.
- 없는 글꼴은 대체 표시되어 줄바꿈·페이지 수가 달라질 수 있습니다.
- 문서 구조 경고를 화면에 표시합니다. 스키마·의미·한컴 호환성 검사를 모두 대체하는 것은 아닙니다.
- 실행 취소·다시 실행은 편집 화면의 단축키와 도구 모음을 사용합니다. VS Code 전역 Undo 스택과의 통합은 후속 작업입니다.
- 저장은 로컬 파일을 대상으로 합니다. VS Code Web/가상 파일 시스템은 검증하지 않았습니다.
- 현재 편집 화면은 rhwp UI를 재사용합니다. 독자적인 편집 UX와 비교 문서 평가가 후속 과제입니다.

## 개발 실행

Node.js 22 이상과 VS Code 1.95 이상을 사용합니다. Windows PowerShell에서 npm 실행 정책 오류가 나면 `npm.cmd`를 사용하세요.

```sh
npm ci
npm run check
npm run build
npm test
npx playwright install chromium
npm run test:ui
npm run test:vscode
npm run package
```

VS Code에서 이 폴더를 열고 `F5`를 누르면 개발용 확장이 실행됩니다. `npm run preview`는 `http://127.0.0.1:4317`에서 웹 편집 화면을 미리 보여줍니다. 미리보기 저장 결과는 `.preview/preview.hwpx`에 기록됩니다.

`test:vscode`는 독립 테스트 프로필로 VS Code를 실행합니다. Windows에서는 설치된 VS Code를 우선 사용하고, 다른 환경에서는 테스트용 VS Code를 다운로드합니다. `HANUL_VSCODE_EXECUTABLE`로 실행 파일을 지정할 수 있습니다.

`vendor/`에는 실제 사용한 런타임이 포함되어 있어 빌드 시 다운로드가 필요하지 않습니다. `npm run vendor`는 배포 원본을 다시 가져오며, 기존 manifest 해시와 다르면 중단합니다. 런타임 갱신은 manifest·어댑터·호환성 테스트를 함께 검토해야 합니다. 현재 어댑터는 고정된 번들의 내부 기호를 사용하므로 업스트림 업데이트에 자동 호환되지 않습니다.

## 구조

| 경로 | 역할 |
|---|---|
| `src/extension.ts` | VS Code Custom Editor, 파일 수명주기, 백업 |
| `src/storage.ts` | 파일 검증, 충돌 검사, 임시 파일 교체 |
| `src/html.ts` | 로컬 Webview 리소스와 CSP |
| `media/host.js` | 편집기 ↔ 확장 메시지, 저장 상태, 단축키 |
| `media/engine-adapter.js` | 고정된 rhwp 런타임과의 연결 |
| `scripts/smoke.mjs` | 외부 연결을 차단한 편집·저장 시나리오 |
| `tests/vscode.cjs` | 실제 VS Code 통합 검사 |
| `vendor/runtime-manifest.json` | 런타임 출처, 다운로드 시점, 리소스별 SHA-256 |

## 출처와 라이선스

한울 코드는 MIT입니다. 포함한 rhwp 런타임의 MIT 고지와 의존성·글꼴 고지는 `vendor/studio/LICENSE`, `vendor/studio/THIRD_PARTY_LICENSES.md`, `vendor/studio/fonts/FONTS.md`에 있습니다. 정확한 리소스 출처와 해시는 `vendor/runtime-manifest.json`을 참고하세요.

본 제품은 한컴의 HWP 문서 파일(.hwp) 공개 문서를 참고하여 개발하였습니다. 한글과컴퓨터와 제휴·후원·승인 관계가 없는 독립 프로젝트입니다.
