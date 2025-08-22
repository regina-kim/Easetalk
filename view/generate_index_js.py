#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
현재 작업 디렉터리의 '한 단계 하위 폴더'를 스캔해 index.js를 생성합니다.
- 각 폴더에 .html 파일이 1개 이상 있으면 대상에 포함
- 생성되는 index.js: window.FOLDERS = [{ name, href, note }, ...]
- 메모(note)는 빈 문자열 placeholder로 둡니다(공유 시 index.js를 직접 편집)
"""

import os
from pathlib import Path

# 제외하고 싶은 디렉터리 이름 패턴을 필요 시 여기에 추가
EXCLUDE_DIRS = {'.git', '__pycache__'}

def has_html_files(dir_path: Path) -> bool:
    # 폴더 내에 .html / .htm 파일이 있는지 검사
    for p in dir_path.iterdir():
        if p.is_file() and p.suffix.lower() in {'.html', '.htm'}:
            return True
    return False

def list_one_level_subdirs(base: Path):
    # 한 단계 하위 폴더만 나열
    for p in base.iterdir():
        if p.is_dir() and p.name not in EXCLUDE_DIRS and not p.name.startswith('.'):
            yield p

def make_entry(name: str) -> str:
    # window.FOLDERS에 들어갈 한 줄(JSON 유사 객체 문자열) 생성
    # note는 사용자가 index.js에서 직접 채우도록 빈 값으로 둠
    href = f"./{name}/"
    # JS 객체 리터럴 라인 생성 (따옴표 이스케이프 최소화)
    return f'  {{ name: "{name}", href: "{href}", note: "" }}'

def build_index_js(entries: list[str]) -> str:
    # index.js 파일 전체 문자열
    body = ",\n".join(entries)
    return (
        "// 자동 생성 파일: generate_index_js.py 를 통해 갱신됨\n"
        "// 메모는 이 파일에서 note 필드를 직접 수정해 공유하세요.\n"
        "window.FOLDERS = [\n"
        f"{body}\n"
        "];\n"
    )

def main():
    base = Path(os.getcwd())
    subdirs = list(list_one_level_subdirs(base))

    # 조건: 폴더 내부에 html 파일이 있을 때만 포함
    targets = [d for d in subdirs if has_html_files(d)]
    targets.sort(key=lambda p: p.name)

    entries = [make_entry(d.name) for d in targets]
    js_text = build_index_js(entries)

    out = base / "index.js"
    out.write_text(js_text, encoding="utf-8")

    # 간단한 출력 로그
    print(f"[OK] index.js 생성: {out}")
    print(f" - 폴더 수: {len(entries)}")
    for d in targets:
        print(f"   · {d.name}/")

if __name__ == "__main__":
    main()
