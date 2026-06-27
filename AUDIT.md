# RootX Production Audit — Issues Found

## Critical (runtime bugs / broken UX)
1. **request/page.tsx L261**: `agent.priceLabel` is now `optional` — renders `undefined` in the agent select dropdown label
2. **request/page.tsx L354**: `selectedAgentData.priceLabel` same issue — shows `undefined` in sidebar
3. **Navbar**: "Admin" link visible to all users in guest mode — should be hidden
4. **Navbar**: `isLoggedIn` always false when Supabase is disabled (demo mode shows no user controls)
5. **dashboard/agents/page.tsx**: imports `PLANS` but usage `PLANS[planId].name` may error if planId not in PLANS
6. **Footer**: no footer.tsx links checked yet

## UX Issues
7. **Mobile menu**: no close-on-route-change (stays open when navigating)
8. **Dashboard sidebar**: mobile view — sidebar overlaps entire screen on mobile without proper width
9. **DashboardShell**: on mobile, `marginLeft: sidebarOpen ? '240px' : '0'` — breaks layout on small screens
10. **request/page.tsx**: success state padding-top wrong (64px fixed but misaligned)
11. **ProfilePage**: missing `paddingTop: 64px` for navbar spacing 

## Polish / Consistency
12. **Terms/Privacy links** on login/signup point to plain text (no href) — dead links
13. **Footer**: needs audit for broken links
14. **Admin link in navbar**: should not be in main nav — security exposure
15. **Navbar mobile**: dropdown should close when user clicks a nav link
