// Lcode: no sign-in gate. Upstream's kit signs a browser in with a one-time owner link (`./owner.ts`) and keeps a
// sign-in per browser or device (`./sign-ins.ts`), so every request carries a cookie or a bearer token. This facet
// answers every request as the owner instead: the link and its cookie still work, nothing needs them.

import { defineFacet, type Facet } from "@earendil-works/chord";
import { Authenticators } from "@earendil-works/chord/http";
import { PRINCIPALS } from "../app.ts";
import type { P3Principal } from "../principals.ts";

/** Every request is the owner: no cookie, no bearer token, no owner link. */
export const noGateFacet: Facet<P3Principal> = defineFacet<P3Principal>((_host, self) => {
	self.contribute(Authenticators, () => PRINCIPALS.owner);
});
