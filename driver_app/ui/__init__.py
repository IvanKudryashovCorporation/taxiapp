"""UI package for driver app — registers all widget/screen classes needed by KV."""

from driver_app.ui.map_panel import MapPanel  # noqa: F401
from driver_app.ui.root import DriverRoot  # noqa: F401
from driver_app.ui.screens.chat import ChatPanel  # noqa: F401
from driver_app.ui.screens.dashboard import DashboardScreen  # noqa: F401
from driver_app.ui.screens.login import LoginScreen  # noqa: F401
from driver_app.ui.widgets import MessageBubble, NavButton, OrderTile, PanelCard, PriceBubble, TaxiStripe  # noqa: F401
