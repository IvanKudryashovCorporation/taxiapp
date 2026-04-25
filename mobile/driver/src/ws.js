import { WS_URL } from "./config";

export class DriverSocket {
  constructor({ onEvent, onStateChange } = {}) {
    this.onEvent = onEvent || (() => {});
    this.onStateChange = onStateChange || (() => {});
    this.ws = null;
    this.token = null;
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.subscriptions = new Set();
    this.state = "offline";
  }

  setToken(token) {
    this.token = token;
    if (this.ws) this.disconnect();
    // Не подключаемся с тест-токеном — бэкенд его отвергнет и будет loop
    if (token && !token.startsWith("test-token-")) this.connect();
  }

  connect() {
    if (!this.token) return;
    this._setState("connecting");
    try {
      const url = `${WS_URL}?role=driver&token=${encodeURIComponent(this.token)}`;
      this.ws = new WebSocket(url);
    } catch {
      this._scheduleReconnect();
      return;
    }
    this.ws.onopen = () => {
      this._setState("online");
      this._startPing();
      for (const id of this.subscriptions) this._send({ action: "subscribe_order", order_id: id });
    };
    this.ws.onmessage = (evt) => {
      try {
        this.onEvent(JSON.parse(evt.data));
      } catch {}
    };
    this.ws.onerror = () => {};
    this.ws.onclose = () => {
      this._stopPing();
      this._setState("offline");
      this._scheduleReconnect();
    };
  }

  disconnect() {
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this._setState("offline");
  }

  subscribeOrder(orderId) {
    if (!orderId) return;
    this.subscriptions.add(orderId);
    this._send({ action: "subscribe_order", order_id: orderId });
  }

  unsubscribeOrder(orderId) {
    if (!orderId) return;
    this.subscriptions.delete(orderId);
    this._send({ action: "unsubscribe_order", order_id: orderId });
  }

  _send(payload) {
    if (this.ws && this.ws.readyState === 1) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch {}
    }
  }

  _startPing() {
    this._stopPing();
    this.pingTimer = setInterval(() => this._send({ action: "ping" }), 25000);
  }

  _stopPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  _scheduleReconnect() {
    if (this.reconnectTimer || !this.token) return;
    // Не переподключаемся с тест-токеном
    if (this.token.startsWith("test-token-")) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  _setState(next) {
    if (this.state !== next) {
      this.state = next;
      this.onStateChange(next);
    }
  }
}
