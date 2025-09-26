import base64
import json
import shutil
import sys
import tempfile
import xml.etree.ElementTree as ET
from html import unescape
from pathlib import Path
from typing import cast

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from UnityPy.classes import TextAsset

try:
    import UnityPy
except Exception as e:
    print(json.dumps({"error": f"Failed to import UnityPy: {e}"}), file=sys.stderr)
    sys.exit(1)


TARGET_ASSETS_FILE_NAME = "resources.assets"
TEXT_ASSET_TYPE = "TextAsset"

# Must match the reader script
KEY = b"UKu52ePUBwetZ9wNX88o54dnfKRu0T1l"

DialogueEntry = dict[str, dict[str, str]]
DialogueData = dict[str, DialogueEntry]


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

    # DON'T OVERWRITE THE ORIGINAL FILE DIRECTLY
    # SAVE TO A TEMPORARY FILE AND THEN MOVE IT
    # OTHERWISE, IT WILL CAUSE AN ERROR.
    temp_dir = tempfile.mkdtemp(prefix="sse_export_")
    temp_asset_path = Path(temp_dir) / TARGET_ASSETS_FILE_NAME
    try:
        with open(temp_asset_path, "wb") as f:
            # UnityPy exposes file.save() at runtime; guard at runtime for safety
            file_obj = env.file
            save_fn = getattr(file_obj, "save", None)
            if not callable(save_fn):
                raise RuntimeError("UnityPy env.file.save() is unavailable")

            data_bytes: bytes = cast(bytes, save_fn())  # returns bytes
            _ = f.write(data_bytes)

        _ = shutil.move(str(temp_asset_path), asset_path)
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

    return {"result": "ok"}


def main() -> int:
    if len(sys.argv) < 2:
        print(
            json.dumps({"error": "Usage: write_assets_file.py <asset_path>"}),
            file=sys.stderr,
        )
        return 2

    asset_path = Path(sys.argv[1])
    if not asset_path.exists():
        print(json.dumps({"error": f"Asset not found: {asset_path}"}), file=sys.stderr)
        return 3

    dialogue_data: DialogueData
    try:
        raw = sys.stdin.read()
        dialogue_data = json.loads(raw) if raw else {}
    except Exception as e:
        print(json.dumps({"error": f"Invalid JSON on stdin: {e}"}), file=sys.stderr)
        return 4

    try:
        result = write_assets(asset_path, dialogue_data)
        print(json.dumps(result))
        return 0
    except Exception as e:
        print(json.dumps({"error": f"Failed to write asset: {e}"}), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
