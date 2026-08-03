# @aics/design-system

OOP 팀 프로젝트 앱의 Astryx integration boundary입니다.

## 구조

- `provider`: Astryx neutral theme provider
- `components`: Astryx 컴포넌트를 조합해야 할 때의 팀 규칙·문서 자리
- `primitives`: Astryx primitive inventory 문서 자리
- `patterns`: Astryx pattern/template mapping 문서 자리

`@astryxdesign/core`와 `@astryxdesign/theme-neutral`을 실제 런타임 의존성으로 사용합니다. 이 패키지는 OOP에서 Astryx import와 theme CSS 순서를 한 곳으로 묶고, component inventory를 팀 맥락에 맞게 기록합니다. Astryx의 component styling과 accessibility contract를 자체 구현으로 대체하지 않습니다.

## 경계

`Team`, `Milestone`, `Submission`, `Review` 같은 팀 프로젝트 도메인 컴포넌트는 이 패키지에 두지 않습니다. 해당 조합 UI는 OOP 앱 내부에 두고, 두 번째 강의 앱에서 실제 재사용 요구가 생길 때 `@aics/team-project-kit` 승격을 검토합니다.
