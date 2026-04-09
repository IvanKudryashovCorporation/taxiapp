from __future__ import annotations

from pathlib import Path

from kivy.core.text import LabelBase
from kivy.utils import platform as kivy_platform


def prepare_fonts() -> tuple[str, str]:
    regular = "Roboto"
    bold = "Roboto-Bold"

    if kivy_platform not in ("android", "ios"):
        try:
            windows_fonts = Path(r"C:\Windows\Fonts")
            regular_path = windows_fonts / "segoeui.ttf"
            bold_path = windows_fonts / "seguisb.ttf"

            if not bold_path.exists():
                bold_path = windows_fonts / "segoeuib.ttf"

            if regular_path.exists() and bold_path.exists():
                LabelBase.register(name="RassvetRegular", fn_regular=str(regular_path))
                LabelBase.register(name="RassvetBold", fn_regular=str(bold_path))
                regular = "RassvetRegular"
                bold = "RassvetBold"
        except Exception:
            pass

    return regular, bold
