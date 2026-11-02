---
app: weekend-planner
place: Lonavala, Maharashtra
dates: Sat 17 – Sun 18 Oct 2026
travellers: 2
sample: yes
---

<!--
HOW TO CHANGE THIS PLAN (instructions for Claude or any AI)
This Markdown is the whole content of the "Weekend Getaway" app. The HTML only draws it.
Change the trip by editing this text, then either:
  a) paste it into the app's Plan file sheet and tap Apply (only that browser sees it), or
  b) rebuild and republish so everyone sees it, with the intelligent-ui skill:
       python3 scripts/md.py inject out/weekend.html weekend.md
     then republish out/weekend.html to the same artifact URL.

Format rules (the parser is strict; keep to them):
- Frontmatter (between ---): place, dates, travellers, sample (yes = show "sample").
- "# Title" then one short paragraph = the hero line.
- Sections are "## Name". Keep these names: Stops, Stay, Eat, Ideas, Vibe, Packing.
  Any other ## section is kept as-is but not shown.
- A record is "- key: value" followed by indented "  key: value" lines. Keys are lowercase.
  Leave a key out instead of writing an empty value.
- Stops: name, day (Sat | Sun | any short label), type (start | nature | culture | hike | view |
  food | stay | night), time (e.g. 1 h 30 min), at ("lat, lng" exactly as Google Maps copies it),
  approx (yes when the position is a guess), note, idea (title of the idea it came from).
  Order in the file = order of the route.
- Stay and Eat: name, area, price (₹ | ₹₹ | ₹₹₹), tags (comma list, 3 max shown), search (a Google
  Maps search query), pick (yes = chosen; Stay allows one pick), note.
- Ideas: title, vibe (one of the Vibe items), type (as Stops), time, why, search.
- Vibe and Packing are checklists: "- [x] item" / "- [ ] item". Packing uses "### Group" headings.
- Do not invent precise facts (prices, opening hours, phone numbers, ratings). Name a kind of
  place and give a Google Maps "search" query so the person checks the live listing.
- Coordinates are approximate unless verified; keep approx: yes on guesses.
-->

# Weekend Getaway

Two slow days in the Sahyadri hills: a dam, rock-cut caves, one fort climb and plenty of street food.

## Stops

- name: Lonavala station
  day: Sat
  type: start
  at: 18.7546, 73.4062
  approx: yes
  note: Meet point. Cabs and autos wait outside.

- name: Bhushi Dam
  day: Sat
  type: nature
  time: 1 h
  at: 18.7460, 73.3999
  approx: yes
  note: Dam views. In monsoon, keep away from the spillway.

- name: Karla Caves
  day: Sat
  type: culture
  time: 1 h 15 min
  at: 18.7487, 73.4697
  approx: yes
  note: Rock-cut caves up a long flight of steps. Wear grippy shoes.

- name: Lohagad Fort
  day: Sun
  type: hike
  time: 3 h
  at: 18.7290, 73.4870
  approx: yes
  note: Moderate climb. Start early and carry water.

## Stay

- name: Hotel in the town centre
  area: Near the station
  price: ₹₹
  tags: walkable, food nearby, easy cabs
  search: hotels near Lonavala station
  pick: yes

- name: Hilltop resort with a view
  area: Valley edge
  price: ₹₹₹
  tags: views, pool, quiet
  search: resort with valley view Lonavala

- name: Garden homestay
  area: Outskirts
  price: ₹
  tags: home food, parking, quiet
  search: homestay Lonavala garden

- name: Lakeside cottage
  area: Pawna Lake
  price: ₹₹
  tags: lake, bonfire, far from town
  search: Pawna lake cottage

## Eat

- name: Vada pav stalls
  area: Town market
  price: ₹
  tags: quick, local, cheap
  search: vada pav Lonavala
  pick: yes

- name: Maharashtrian thali
  area: Town centre
  price: ₹₹
  tags: filling, veg, lunch
  search: Maharashtrian thali Lonavala

- name: Chikki and fudge shops
  area: Main road
  price: ₹
  tags: sweets, take-home
  search: chikki shop Lonavala
  pick: yes

- name: Cafe with a valley view
  area: Valley edge
  price: ₹₹
  tags: sunset, coffee, slow
  search: cafe with view Lonavala

- name: Highway dhaba
  area: Old Mumbai–Pune road
  price: ₹
  tags: late, hearty, parking
  search: dhaba old Mumbai Pune highway Lonavala

## Ideas

- title: Sunrise at a viewpoint
  vibe: Nature
  type: view
  time: 45 min
  why: Quiet, cool and the best light of the day.
  search: viewpoints near Lonavala

- title: Monsoon waterfall walk
  vibe: Adventure
  type: nature
  time: 2 h
  why: Best in monsoon. Check local safety warnings first.
  search: waterfall trail near Lonavala

- title: Chikki tasting crawl
  vibe: Food
  type: food
  time: 45 min
  why: Try three shops and pick a favourite to take home.
  search: chikki shop Lonavala

- title: Slow cafe lunch
  vibe: Slow
  type: food
  time: 1 h 30 min
  why: Long lunch with a view, then a nap.
  search: cafe Lonavala lunch

- title: Dam at golden hour
  vibe: Slow
  type: view
  time: 1 h
  why: Soft light on the water before dinner.
  search: Bhushi Dam

- title: Bhaja Caves
  vibe: Culture
  type: culture
  time: 1 h
  why: Older, quieter caves across the valley from Karla.
  search: Bhaja Caves

- title: Night walk and stars
  vibe: Night
  type: night
  time: 1 h
  why: Clear nights away from town lights. Bring a torch.
  search: stargazing near Lonavala

## Vibe

- [x] Nature
- [x] Food
- [x] Slow
- [ ] Adventure
- [ ] Culture
- [ ] Night

## Packing

### Clothes

- [ ] Light layers for evenings
- [ ] Rain jacket or poncho
- [ ] Grippy walking shoes
- [ ] Quick-dry towel

### Outdoor

- [ ] Reusable water bottle (1 L+)
- [ ] Cap and sunglasses
- [ ] Sunscreen
- [ ] Small first-aid kit
- [ ] Torch or headlamp
- [ ] Snacks for the trail

### Essentials

- [ ] ID and booking confirmations
- [ ] Cash for stalls and parking
- [ ] Regular medicines

### Tech

- [ ] Phone charger and power bank
- [ ] Offline map of the area saved
