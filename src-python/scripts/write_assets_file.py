import base64
import json
import os
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import cast

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from UnityPy.classes import TextAsset
from html import unescape

try:
    import UnityPy
except Exception as e:
    print(json.dumps({"error": f"Failed to import UnityPy: {e}"}))
    sys.exit(1)


TEXT_ASSET_TYPE = "TextAsset"


# Must match the reader script
KEY = b"UKu52ePUBwetZ9wNX88o54dnfKRu0T1l"


type DialogueEntry = dict[str, dict[str, str]]
type DialogueData = dict[str, DialogueEntry]


def decrypt_string(encrypted_string: str) -> str:
    try:
        encrypted_bytes = base64.b64decode(encrypted_string)
        cipher = AES.new(KEY, AES.MODE_ECB)
        decrypted_bytes_padded = cipher.decrypt(encrypted_bytes)
        decrypted_bytes = unpad(decrypted_bytes_padded, AES.block_size)
        return decrypted_bytes.decode("utf-8")
    except Exception:
        return ""


def encrypt_string(plain_text: str) -> str:
    try:
        data = plain_text.encode("utf-8")
        padded = pad(data, AES.block_size)
        cipher = AES.new(KEY, AES.MODE_ECB)
        encrypted = cipher.encrypt(padded)
        return base64.b64encode(encrypted).decode("utf-8")
    except Exception as e:
        raise RuntimeError(f"Encryption failed: {e}")


def apply_scene_updates_to_root(
    root: ET.Element, scene_updates: dict[str, dict[str, str]]
):
    # scene_updates: name -> { originalContent, editedContent? }
    existing_by_name: dict[str, ET.Element] = {}
    for entry in root.findall("entry"):
        name = entry.get("name")
        if name:
            existing_by_name[name] = entry

    for name, content in scene_updates.items():
        raw_text = content.get("editedContent") or content.get("originalContent") or ""
        new_text = unescape(raw_text)
        if name in existing_by_name:
            existing_by_name[name].text = new_text


def write_assets(asset_path: Path, dialogue_data: DialogueData):
    env = UnityPy.load(str(asset_path))

    changed = False
    for obj in env.objects:
        if obj.type.name != TEXT_ASSET_TYPE:
            continue

        data: TextAsset = cast(TextAsset, obj.read())
        scene_name = getattr(data, "m_Name", None)
        if not scene_name or scene_name not in dialogue_data:
            continue

        # Build/modify XML root from current decrypted script
        xml_string = decrypt_string(data.m_Script)
        root = ET.fromstring(xml_string)

        apply_scene_updates_to_root(root, dialogue_data[scene_name])

        new_xml = ET.tostring(root, encoding="unicode")
        data.m_Script = encrypt_string(new_xml)
        data.save()
        changed = True

    if not changed:
        return {"result": "no_changes"}

    # Save back to the same directory, overwriting the file
    out_dir = os.path.dirname(str(asset_path))
    env.save(pack="none", out_path=out_dir)
    return {"result": "ok"}


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: write_assets_file.py <asset_path>"}))
        return 2

    asset_path = Path(sys.argv[1])
    if not asset_path.exists():
        print(json.dumps({"error": f"Asset not found: {asset_path}"}))
        return 3

    dialogue_data: DialogueData
    try:
        raw = sys.stdin.read()
        dialogue_data = json.loads(raw) if raw else {}
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON on stdin: {e}"}))
        return 4

    try:
        result = write_assets(asset_path, dialogue_data)
        print(json.dumps(result))
        return 0
    except Exception as e:
        print(json.dumps({"error": f"Failed to write asset: {e}"}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
