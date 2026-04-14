from __future__ import annotations

from pathlib import Path

from kivy.core.text import LabelBase
from kivy.utils import platform as kivy_platform


def prepare_fonts() -> tuple[str, str, str]:
    regular = "Roboto"
    bold = "Roboto-Bold"
    display = "Roboto-Bold"

    if kivy_platform not in ("android", "ios"):
        try:
            windows_fonts = Path(r"C:\Windows\Fonts")
            regular_path = windows_fonts / "segoeui.ttf"
            bold_path = windows_fonts / "seguisb.ttf"
            display_path = windows_fonts / "bahnschrift.ttf"

            if not bold_path.exists():
                bold_path = windows_fonts / "segoeuib.ttf"

            if regular_path.exists():
                LabelBase.register(name="RassvetRegular", fn_regular=str(regular_path))
                regular = "RassvetRegular"

            if bold_path.exists():
                LabelBase.register(name="RassvetBold", fn_regular=str(bold_path))
                bold = "RassvetBold"

            if display_path.exists():
                LabelBase.register(name="RassvetDisplay", fn_regular=str(display_path))
                display = "RassvetDisplay"
            else:
                display = bold
        except Exception:
            pass

    return regular, bold, display
