import argparse
import base64
import json
import logging
import re
import sys
from pathlib import Path
from typing import cast

from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
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

TEXT_ASSET_TYPE = "TextAsset"

KEY = b"UKu52ePUBwetZ9wNX88o54dnfKRu0T1l"

# Must accept empty content
ENTRY_PATTERN = re.compile(r'<entry name="([^"]+)">([^<]*)</entry>')

DialogueData = dict[str, dict[str, dict[str, str]]]


def decrypt_string(encrypted_string: str) -> str:
    """
    Decrypts a base64 encoded string using AES-256 ECB, then decodes from UTF-8.

    This function mimics the C# decryption logic provided.

    Args:
        encrypted_string: The base64 encoded string to decrypt.

    Returns:
        The decrypted, human-readable string.
    """
    try:
        # 1. Decode the string from Base64 to get the raw encrypted bytes
        encrypted_bytes = base64.b64decode(encrypted_string)

        # 2. Create an AES cipher object in ECB mode
        cipher = AES.new(KEY, AES.MODE_ECB)

        # 3. Decrypt the bytes
        decrypted_bytes_padded = cipher.decrypt(encrypted_bytes)

        # 4. Remove the PKCS7 padding
        # The block size for AES is 16 bytes
        decrypted_bytes = unpad(decrypted_bytes_padded, AES.block_size)

        # 5. Decode the raw bytes into a UTF-8 string
        return decrypted_bytes.decode("utf-8")

    except Exception as e:
        logger.error(f"Decryption failed: {e}, encrypted_string: {encrypted_string}")
        raise e


def parse_asset(asset_path: Path, language: str) -> DialogueData:
    env = UnityPy.load(str(asset_path))

    result: DialogueData = {}

    # Minimal safe summary that matches DialogueData shape expected by UI
    # Top-level keys: scenes/areas; inner keys: entries with originalContent
    # Since we don't know the real structure, provide a diagnostic entry.
    for obj in env.objects:
        if obj.type.name == TEXT_ASSET_TYPE:
            data: TextAsset = cast(TextAsset, obj.read())

            if not data.m_Name.startswith(f"{language}_"):
                continue

            xml_string = decrypt_string(data.m_Script)

            raw_entries = ENTRY_PATTERN.findall(xml_string)
            name_to_raw_content = {name: content for name, content in raw_entries}

            result[data.m_Name] = {}
            for entry_name, entry_content in name_to_raw_content.items():
                if entry_name is None:
                    continue

                result[data.m_Name][entry_name] = {
                    "originalContent": entry_content or ""
                }

    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse Unity assets file")

    _ = parser.add_argument("asset_path", type=str, help="Path to the assets file")
    _ = parser.add_argument(
        "--language",
        type=str,
        choices=["EN", "ZH"],
        required=True,
        help="Language prefix to filter",
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

    try:
        result = parse_asset(asset_path, args.language)
        # Output result ONLY to stdout - this is the contract
        print(json.dumps(result))
        return 0
    except Exception as e:
        logger.exception("Failed to parse asset")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
