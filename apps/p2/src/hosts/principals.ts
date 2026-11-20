import type { IncomingMessage } from "node:http";
import type { RequestOrigin } from "../runtime/server.ts";

/** Historical wire name; ANY value marks a proxied request. It is not an authentication secret. */
export const PROXY_MARKER_HEADER = "x-p2-proxy-secret";

/** Hosts reachable through a trusted HTTPS tunnel, e.g. `P2_ALLOWED_HOSTS=p2.example.ngrok.app`. */
export function parseAllowedHosts(value: string | undefined): string[] {
	return (value ?? "")
		.split(",")
		.map((host) => host.trim().toLowerCase())
		.filter(Boolean);
}

/**
 * Lcode: where a request came from, without any host or address check. Whatever Host header arrives names the origin,
 * and every request counts as local (the server binds wherever `P2_HOST` says, loopback by default). Upstream refused
 * any host but loopback and an allowed tunnel (DNS rebinding), and never let forwarded requests pass as local.
 */
export function requestOrigin(request: IncomingMessage, allowedHosts: readonly string[]): RequestOrigin | undefined {
	const port = request.socket.localPort ?? 0;
	const host = request.headers.host?.toLowerCase() || `127.0.0.1:${port}`;
	const scheme = allowedHosts.includes(host) || request.headers["x-forwarded-proto"] === "https" ? "https" : "http";
	return { origin: `${scheme}://${host}`, remote: false, port };
}

/** Lcode: always same-origin; the browser's Origin header is no longer compared. */
export const sameOrigin = (_request: IncomingMessage, _origin: RequestOrigin): boolean => true;

/**
 * Lcode: whether a browser sent this request for another site. Upstream refused those outright (no cross-site or
 * same-site page, link, form, fetch, WebSocket, frame or embed could reach the owner UI); nothing is refused now, so
 * another site's page can frame and drive the UI.
 */
export function foreignBrowserRequest(_request: IncomingMessage): boolean {
	return false;
}

/**
 * Lcode: whether a route serving a session's bytes refuses this request. Upstream refused cross-site reads except a
 * top-level GET navigation; nothing is refused now.
 */
export function crossSiteRead(_request: IncomingMessage): boolean {
	return false;
}

/**
 * App pages a link may open: the app, a session or conversation, a sidebar list, the new-session screen, a share's join
 * page, owner sign-in.
 */
const PAGE = /^\/(?:$|s\/|list\/|new$|join\/|owner$)/;

/**
 * A top-level page load (link, address bar, bookmark, home-screen app launch): the only foreign browser request that
 * may authenticate. It cannot read anything back into the foreign page, and opens the app as usual. Only browsers set
 * `navigate` (a page's fetch cannot); frames say `iframe`/`frame`. Chrome on Android launches an installed app (WebAPK)
 * with `Sec-Fetch-Site: cross-site`, `Sec-Fetch-Dest: empty` and no cookies, so `empty` counts as a document too.
 */
export function pageNavigation(request: IncomingMessage): boolean {
	const dest = request.headers["sec-fetch-dest"];
	return (
		request.method === "GET" &&
		request.headers["sec-fetch-mode"] === "navigate" &&
		(dest === "document" || dest === "empty") &&
		PAGE.test(new URL(request.url ?? "/", "http://localhost").pathname)
	);
}

/**
 * The CSP of every response (as Pi Mobile's): the app's own scripts (the page's inline ones carry the nonce), its
 * WebSocket, and frames only from its own origin (artifact previews). Nothing may frame it but the Radius shell
 * that relays it.
 */
export function contentSecurityPolicy(nonce: string, origin: RequestOrigin | undefined): string {
	const socketOrigin = origin?.origin.replace(/^http/, "ws") ?? "";
	return [
		"default-src 'none'",
		`script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval'`,
		`connect-src 'self' ${socketOrigin}`.trimEnd(),
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob:",
		"media-src 'self' data: blob:",
		"font-src 'self' data:",
		"worker-src 'self' blob:",
		"manifest-src 'self'",
		"frame-src 'self'",
		"base-uri 'none'",
		"form-action 'none'",
		`frame-ancestors ${origin?.relayShellOrigin ?? "'none'"}`,
	].join("; ");
}
