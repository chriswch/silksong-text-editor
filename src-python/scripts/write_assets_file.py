import argparse
import base64
import json
import logging
import shutil
import sys
import re
import tempfile
from pathlib import Path
from typing import cast

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from UnityPy.classes import TextAsset

# Configure logging to stderr only (stdout reserved for result JSON)
logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
    stream=sys.stderr,
    force=True,
)
logger = logging.getLogger(__name__)

try:
    import UnityPy
except Exception as e:
    logger.error(f"Failed to import UnityPy: {e}")
    sys.exit(1)


TARGET_ASSETS_FILE_NAME = "resources.assets"
TEXT_ASSET_TYPE = "TextAsset"

KEY = b"UKu52ePUBwetZ9wNX88o54dnfKRu0T1l"

# Must accept empty content
ENTRY_PATTERN = re.compile(r'<entry name="([^"]+)">([^<]*)</entry>')

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
        logger.error(f"Decryption failed: {e}, encrypted_string: {encrypted_string}")
        raise e


def encrypt_string(plain_text: str) -> str:
    try:
        data = plain_text.encode("utf-8")
        padded = pad(data, AES.block_size)
        cipher = AES.new(KEY, AES.MODE_ECB)
        encrypted = cipher.encrypt(padded)
        return base64.b64encode(encrypted).decode("utf-8")
    except Exception as e:
        logger.error(f"Encryption failed: {e}, plain_text length: {len(plain_text)}")
        raise RuntimeError(f"Encryption failed: {e}")


def detect_source_language(dialogue_data: DialogueData) -> str:
    """
    Detect the source language from DialogueData keys.
    Returns "EN" or "ZH" based on the prefix of the first scene key.
    Defaults to "EN" if no keys or unrecognized prefix.
    """
    if not dialogue_data:
        raise RuntimeError("No dialogue data provided")

    first_key = next(iter(dialogue_data.keys()))
    if first_key.startswith("EN_"):
        return "EN"
    elif first_key.startswith("ZH_"):
        return "ZH"
    else:
        raise RuntimeError("Unrecognized language prefix")


def transform_dialogue_data_keys(
    dialogue_data: DialogueData, target_language: str
) -> DialogueData:
    """
    Transform DialogueData keys from source language to target language.
    Only transforms if source != target and pattern matches (EN↔ZH).
    Returns a new dictionary with transformed keys.
    """
    source_language = detect_source_language(dialogue_data)

    # No transformation needed if languages match
    if source_language == target_language:
        return dialogue_data

    # Only transform for EN↔ZH pattern
    if not (
        (source_language == "EN" and target_language == "ZH")
        or (source_language == "ZH" and target_language == "EN")
    ):
        return dialogue_data

    return {
        key.replace(f"{source_language}_", f"{target_language}_", 1): value
        for key, value in dialogue_data.items()
    }


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
        logger.debug("No scenes were modified")
        return

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
    parser = argparse.ArgumentParser(description="Write Unity assets file")
    _ = parser.add_argument("asset_path", type=str, help="Path to the assets file")
    _ = parser.add_argument(
        "--language",
        type=str,
        required=True,
        choices=["EN", "ZH"],
        help="Target language prefix for export",
    )
    _ = parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging",
    )

    args = parser.parse_args()

    # Adjust log level based on debug flag
    if args.debug:
        logger.setLevel(logging.DEBUG)
        logger.debug("Debug mode enabled")

    asset_path = Path(args.asset_path)
    if not asset_path.exists():
        logger.error(f"Asset not found: {asset_path}")
        return 3

    logger.debug(f"Target language: {args.language}")

    dialogue_data: DialogueData
    try:
        raw_bytes = sys.stdin.buffer.read()
        raw = raw_bytes.decode("utf-8")
        dialogue_data = json.loads(raw) if raw else {}
        logger.debug(f"Loaded {len(dialogue_data)} scene(s) from stdin")
    except Exception as e:
        logger.error(f"Invalid JSON on stdin: {e}")
        return 4

    # Pre-process dialogue data: transform keys if source and target languages differ
    try:
        transformed_data = transform_dialogue_data_keys(dialogue_data, args.language)
    except Exception as e:
        logger.error(f"Failed to transform dialogue data: {e}")
        return 5

    try:
        result = write_assets(asset_path, transformed_data)
        # Output result ONLY to stdout - this is the contract
        print(json.dumps(result))
        return 0
    except Exception as e:
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
