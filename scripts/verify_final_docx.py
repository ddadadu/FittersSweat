#!/usr/bin/env python3
"""
verify_final_docx.py
--------------------
최종 생성된 졸업작품 최종보고서 docx 파일의 무결성 전수 검증 스크립트.
- ZIP 아카이브 구조 및 미디어 5종 보존 여부
- XML 스키마 적합성 및 문단 수(350+ 문단) 보존 여부
- 표지 메타데이터(최종보고서, 2026. 09. 20) 및 목차
- 신규 핵심 기술 스택 및 기술 선정 근거 키워드 전수 검증
- 구버전 미반영 키워드(OpenAI 1536, 계획서 등) 완전 배제 검증
"""

import os
import sys
import zipfile
import xml.etree.ElementTree as ET

DOCX_PATH = "report/HYROX_국내_커뮤니티_커머스_프로젝트_최종보고서_강민제.docx"

REQUIRED_MEDIA = [
    "word/media/image1.png",
    "word/media/image2.png",
    "word/media/image3.png",
    "word/media/image4.jpeg",
    "word/media/image5.png"
]

MUST_CONTAIN = [
    "컴퓨터공학과 졸업작품 최종보고서",
    "2026. 09. 20",
    "5. 추진 실적 및 최종 성과",
    "Google Gemini 3.5 Flash Lite",
    "gemini-embedding-001",
    "768차원",
    "pgvector",
    "113개",
    "하이브리드",
    "Toss Payments SDK v2",
    "Vercel",
    "Railway",
    "카카오 우편번호",
    "원자적",
    "선정 근거"
]

MUST_NOT_CONTAIN = [
    "컴퓨터공학과 졸업작품 계획서",
    "2026. 09. 01",
    "OpenAI text-embedding-3-small",
    "OpenAI GPT-4o-mini API",
    "1536차원 벡터 생성"
]

def run_verification():
    print(f"[*] Verifying {DOCX_PATH}...")
    if not os.path.exists(DOCX_PATH):
        print(f"[FAIL] Target docx file does not exist: {DOCX_PATH}")
        sys.exit(1)

    file_size = os.path.getsize(DOCX_PATH)
    print(f"[+] File size: {file_size:,} bytes")
    assert file_size > 500_000, f"File size too small ({file_size} bytes), media might be missing"

    with zipfile.ZipFile(DOCX_PATH, 'r') as z:
        namelist = z.namelist()
        assert "word/document.xml" in namelist, "word/document.xml missing"

        # 미디어 5종 전수 검사
        for m in REQUIRED_MEDIA:
            assert m in namelist, f"Required media missing: {m}"
            media_size = z.getinfo(m).file_size
            assert media_size > 0, f"Media file empty: {m}"
        print(f"[+] All 5 media files verified intact.")

        # XML 문법 및 트리 검사
        xml_content = z.read("word/document.xml").decode("utf-8")
        try:
            root = ET.fromstring(xml_content.encode("utf-8"))
        except Exception as e:
            print(f"[FAIL] XML Parsing error: {e}")
            sys.exit(1)
        print("[+] XML well-formed and schema parsed successfully.")

        # 문단 수 검사
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        paras = root.findall('.//w:p', ns)
        print(f"[+] Total paragraphs: {len(paras)}")
        assert len(paras) >= 350, f"Paragraph count too low ({len(paras)})"

        # 필수 키워드 검사
        missing_keywords = []
        for kw in MUST_CONTAIN:
            if kw not in xml_content:
                missing_keywords.append(kw)
        if missing_keywords:
            print(f"[FAIL] Missing required keywords: {missing_keywords}")
            sys.exit(1)
        print(f"[+] All {len(MUST_CONTAIN)} required keywords present.")

        # 구버전 키워드 배제 검사
        forbidden_found = []
        for kw in MUST_NOT_CONTAIN:
            if kw in xml_content:
                forbidden_found.append(kw)
        if forbidden_found:
            print(f"[FAIL] Outdated keywords still present: {forbidden_found}")
            sys.exit(1)
        print(f"[+] All {len(MUST_NOT_CONTAIN)} outdated keywords cleanly eliminated.")

    print("\n[✓✓✓] ALL FINAL REPORT VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_verification()
