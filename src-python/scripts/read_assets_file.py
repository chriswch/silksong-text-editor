import json
import sys
from pathlib import Path
from typing import cast
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad
import base64
import xml.etree.ElementTree as ET

from UnityPy.classes import TextAsset

try:
    import UnityPy
except Exception as e:
    print(json.dumps({"error": f"Failed to import UnityPy: {e}"}))
    sys.exit(1)

TEXT_ASSET_TYPE = "TextAsset"
# Editable TextAsset names from resources.assets
TEXT_TARGET_ASSETS = [
    "ZH_Achievements",
    "ZH_AutoSaveNames",
    "ZH_Belltown",
    "ZH_Bonebottom",
    "ZH_Caravan",
    "ZH_City",
    "ZH_Coral",
    "ZH_Crawl",
    "ZH_Credits List",
    "ZH_Deprecated",
    "ZH_Dust",
    "ZH_Enclave",
    "ZH_Error",
    "ZH_Fast Travel",
    "ZH_Forge",
    "ZH_General",
    "ZH_Greymoor",
    "ZH_Inspect",
    "ZH_Journal",
    "ZH_Lore",
    "ZH_MainMenu",
    "ZH_Map Zones",
    "ZH_Peak",
    "ZH_Pilgrims",
    "ZH_Prompts",
    "ZH_Quests",
    "ZH_Shellwood",
    "ZH_Shop",
    "ZH_Song",
    "ZH_Titles",
    "ZH_Tools",
    "ZH_UI",
    "ZH_Under",
    "ZH_Wanderers",
    "ZH_Weave",
    "ZH_Wilds",
]


# Key must be in bytes, identical to the C# implementation
KEY = b"UKu52ePUBwetZ9wNX88o54dnfKRu0T1l"

type DialogueData = dict[str, dict[str, dict[str, str]]]


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
        print(json.dumps({"error": f"An error occurred during decryption: {e}"}))
        return ""


def parse_asset(asset_path: Path) -> DialogueData:
    env = UnityPy.load(str(asset_path))

    result: DialogueData = {}

    # Minimal safe summary that matches DialogueData shape expected by UI
    # Top-level keys: scenes/areas; inner keys: entries with originalContent
    # Since we don't know the real structure, provide a diagnostic entry.
    for obj in env.objects:
        if obj.type.name == TEXT_ASSET_TYPE:
            data: TextAsset = cast(TextAsset, obj.read())

            if data.m_Name not in TEXT_TARGET_ASSETS:
                continue

            xml_string = decrypt_string(data.m_Script)
            root = ET.fromstring(xml_string)

            result[data.m_Name] = {}
            for entry in root.findall("entry"):
                entry_name = entry.get("name")
                if entry_name is None:
                    continue

                result[data.m_Name][entry_name] = {"originalContent": entry.text or ""}

    return result


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: parse_unity_asset.py <asset_path>"}))
        return 2

    asset_path = Path(sys.argv[1])
    if not asset_path.exists():
        print(json.dumps({"error": f"Asset not found: {asset_path}"}))
        return 3

    try:
        result = parse_asset(asset_path)
        print(json.dumps(result))
        return 0
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse asset: {e}"}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
