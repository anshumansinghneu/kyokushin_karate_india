/**
 * The logged-in member app keeps its own look (red on black, Montserrat).
 * Every other route is the public site, which wears the "dojo before dawn"
 * system (docs/superpowers/specs/2026-10-19-full-site-redesign-design.md).
 */
export const MEMBER_APP_PREFIXES = ["/dashboard", "/profile", "/payments", "/renew-membership", "/management"];

export function isMemberApp(pathname: string): boolean {
    return MEMBER_APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Runs in <head> before first paint, so a member-app page never flashes the
 * public palette (and vice versa). Client navigation keeps it in sync via
 * LayoutShell.
 */
export const SKIN_SCRIPT = `(function(){var p=location.pathname,a=${JSON.stringify(MEMBER_APP_PREFIXES)};for(var i=0;i<a.length;i++){if(p===a[i]||p.indexOf(a[i]+"/")===0){document.documentElement.classList.add("skin-app");return}}})();`;
