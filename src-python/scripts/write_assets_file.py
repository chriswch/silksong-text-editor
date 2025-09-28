import base64
import json
import shutil
import sys
import re
import tempfile
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
ENTRY_PATTERN = re.compile(r'<entry name="([^"]+)">([^<]+)</entry>')

DialogueEntry = dict[str, dict[str, str]]
DialogueData = dict[str, DialogueEntry]


def decrypt_string(encrypted_string: str) -> str:
    try:
        encrypted_bytes = base64.b64decode(encrypted_string)
        cipher = AES.new(KEY, AES.MODE_ECB)
        decrypted_bytes_padded = cipher.decrypt(encrypted_bytes)
        decrypted_bytes = unpad(decrypted_bytes_padded, AES.block_size)
        return decrypted_bytes.decode("utf-8")
    except Exception as e:
        print(
            json.dumps(
                {
                    "error": f"Decryption failed: {e}",
                    "encrypted_string": encrypted_string,
                }
            ),
            file=sys.stderr,
        )
        raise e


def encrypt_string(plain_text: str) -> str:
    try:
        data = plain_text.encode("utf-8")
        padded = pad(data, AES.block_size)
        cipher = AES.new(KEY, AES.MODE_ECB)
        encrypted = cipher.encrypt(padded)
        return base64.b64encode(encrypted).decode("utf-8")
    except Exception as e:
        print(
            json.dumps({"error": f"Encryption failed: {e}", "plain_text": plain_text}),
            file=sys.stderr,
        )
        raise RuntimeError(f"Encryption failed: {e}")


def apply_scene_updates_to_root(
    name_to_raw_content: dict[str, str], scene_updates: dict[str, dict[str, str]]
):
    for name, content in scene_updates.items():
        raw_text = content.get("editedContent") or content.get("originalContent") or ""
        if name in name_to_raw_content:
            name_to_raw_content[name] = raw_text


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

        raw_entries = ENTRY_PATTERN.findall(xml_string)
        name_to_raw_content = {name: content for name, content in raw_entries}
        apply_scene_updates_to_root(name_to_raw_content, dialogue_data[scene_name])

        new_xml = (
            "<entries>\n"
            + "\n".join(
                f'<entry name="{name}">{content}</entry>'
                for name, content in name_to_raw_content.items()
            )
            + "\n</entries>\n"
        )

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
        raw_bytes = sys.stdin.buffer.read()
        raw = raw_bytes.decode("utf-8")
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
