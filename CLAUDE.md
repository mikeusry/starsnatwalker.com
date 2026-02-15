# Stars National Walker Website

## TODO

### Next Session
- [ ] Test coach inquiry form (submit test, verify Supabase storage + SendGrid email)
- [ ] Test PD Dashboard pixel and towns integration
- [ ] Get email addresses for all players and set up forwarding

## Recent Work

### Recruiting Features (Feb 2026)
- Created `/recruiting` - main coach recruiting hub with lead capture form
- Created position pages: `/pitchers`, `/catchers`, `/infielders`, `/outfielders`
- Created event landing pages: `/events/[slug]` for each tournament
- Form submissions go to Supabase `coach_inquiries` table + SendGrid email to mike@southlandorganics.com
- Updated navigation with Positions dropdown

### Player Updates
- Ayn Parker Usry: Updated bio, added NCAA ID 2509718485

## Stack
- Astro static site
- Cloudflare Pages (deployment + functions)
- Supabase (data storage)
- SendGrid (transactional email)
- Mux (video hosting)

## Deploy
Site is built but NOT deployed pending approval. Run `npm run deploy` when ready.
