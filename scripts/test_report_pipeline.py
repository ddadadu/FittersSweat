import os
import zipfile
import xml.etree.ElementTree as ET

ORIGINAL_DOCX = "report/HYROX_국내_커뮤니티_커머스_프로젝트_계획서_최종 (1).docx"

def test_original_exists():
    assert os.path.exists(ORIGINAL_DOCX), f"Original docx missing: {ORIGINAL_DOCX}"
    with zipfile.ZipFile(ORIGINAL_DOCX) as z:
        namelist = z.namelist()
        assert "word/document.xml" in namelist, "word/document.xml missing in docx"
        assert "word/media/image1.png" in namelist, "image1.png missing"
        assert "word/media/image2.png" in namelist, "image2.png missing"
        assert "word/media/image3.png" in namelist, "image3.png missing"
        assert "word/media/image4.jpeg" in namelist, "image4.jpeg missing"
        assert "word/media/image5.png" in namelist, "image5.png missing"
    print("test_original_exists: PASS")

def test_xml_parseable():
    with zipfile.ZipFile(ORIGINAL_DOCX) as z:
        content = z.read("word/document.xml")
        root = ET.fromstring(content)
        assert root.tag.endswith("document"), f"Unexpected root tag: {root.tag}"
    print("test_xml_parseable: PASS")

if __name__ == "__main__":
    test_original_exists()
    test_xml_parseable()
    print("ALL PIPELINE TESTS PASSED")
