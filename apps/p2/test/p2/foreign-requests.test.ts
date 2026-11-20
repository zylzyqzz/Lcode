// Lcode: there is no foreign-request gate. Upstream authenticated nothing for a request another site made (Fetch
// Metadata `cross-site`/`same-site`), refused every Host header but loopback or an allowed tunnel, and answered any
// unauthenticated request with the sign-in page. Now every request is the owner, from any site and any Host header.

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { WebSocket } from "ws";
import { type Fixture, http, startFixture } from "./helpers.ts";

const NO_CORS = { "Sec-Fetch-Mode": "no-cors", "Sec-Fetch-Dest": "script" };
const NAVIGATE = { "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Dest": "document" };

/** Status of a WebSocket upgrade with these headers (101 when accepted). */
function upgrade(port: number, headers: Record<string, string>): Promise<number> {
	return new Promise((resolve) => {
		const socket = new WebSocket(`ws://127.0.0.1:${port}/chord`, { headers });
		socket.on("open", () => {
			socket.close();
			resolve(101);
		});
		socket.on("unexpected-response", (_request, response) => resolve(response.statusCode ?? 0));
		socket.on("error", () => resolve(0));
	});
}

describe("foreign browser requests", () => {
	let fixture: Fixture;
	let port: number;

	before(async () => {
		fixture = await startFixture({ web: true });
		port = fixture.server.port;
	});
	after(() => fixture?.close());

	it("serves another site's subresource, fetch, WebSocket, page and frame as the owner", async () => {
		for (const site of ["same-site", "cross-site"]) {
			const foreign = { ...NO_CORS, "Sec-Fetch-Site": site };
			assert.equal((await http(port, "/owner/check", { headers: foreign })).status, 200, `${site}: a fetch`);
			const socket = { "Sec-Fetch-Site": site, "Sec-Fetch-Mode": "websocket", "Sec-Fetch-Dest": "websocket" };
			assert.equal(await upgrade(port, socket), 101, `${site}: a WebSocket`);
			assert.equal((await http(port, "/", { headers: { ...NAVIGATE, "Sec-Fetch-Site": site } })).status, 200);
			const framed = { "Sec-Fetch-Site": site, "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Dest": "iframe" };
			assert.equal((await http(port, "/", { headers: framed })).status, 200, `${site}: a frame`);
			for (const mode of ["cors", "no-cors"]) {
				const fetched = { "Sec-Fetch-Site": site, "Sec-Fetch-Mode": mode, "Sec-Fetch-Dest": "empty" };
				assert.equal((await http(port, "/owner/check", { headers: fetched })).status, 200, `${site}: ${mode}`);
			}
		}
		// A client without Fetch Metadata (the TUI, scripts) is served the same.
		assert.equal((await http(port, "/owner/check")).status, 200);
		assert.equal(await upgrade(port, {}), 101);
	});

	it("serves any Host header, forwarded or not", async () => {
		assert.equal((await http(port, "/", { headers: { Host: `127.0.0.1:${port}` } })).status, 200);
		assert.equal((await http(port, "/", { headers: { Host: "p2.example.ngrok.app" } })).status, 200);
		const forwarded = { Host: "evil.example", "X-Forwarded-For": "10.0.0.1", "X-Forwarded-Proto": "https" };
		assert.equal((await http(port, "/", { headers: forwarded })).status, 200);
		assert.equal((await http(port, "/owner/check", { headers: forwarded })).status, 200);
	});
});
