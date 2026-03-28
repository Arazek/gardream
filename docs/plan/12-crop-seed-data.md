# 12 — Crop Seed Data

Hand-curated starter dataset of 25 crops. Inserted via an Alembic data migration.
All frequencies are in days. Spacing in cm.

---

## Schema reminder (from `08-backend-models.md`)

```
name, latin_name, category, description,
days_to_germination, days_to_harvest,
watering_frequency_days, fertilise_frequency_days,
prune_frequency_days (null if N/A), prune_start_day (null if N/A),
sun_requirement, spacing_cm,
soil_mix { name, topsoil_pct, compost_pct, perlite_pct, description },
companion_crops[], avoid_crops[]
```

---

## Vegetables (12)

### Tomato
- Latin: *Solanum lycopersicum*
- Days to germinate: 7 | Days to harvest: 75
- Water every: 2 days | Fertilise every: 14 days
- Prune every: 7 days from day 21 (remove suckers)
- Sun: full_sun | Spacing: 60 cm
- Soil: "Tomato Mix" — topsoil 40%, compost 40%, perlite 20%
- Companions: basil, marigold, carrot | Avoid: fennel, brassicas

### Cherry Tomato
- Latin: *Solanum lycopersicum var. cerasiforme*
- Days to germinate: 7 | Days to harvest: 60
- Water every: 2 days | Fertilise every: 14 days
- Prune every: 10 days from day 21
- Sun: full_sun | Spacing: 45 cm
- Soil: same as Tomato
- Companions: basil, parsley | Avoid: fennel

### Courgette (Zucchini)
- Latin: *Cucurbita pepo*
- Days to germinate: 5 | Days to harvest: 55
- Water every: 2 days | Fertilise every: 21 days
- Prune: none
- Sun: full_sun | Spacing: 90 cm
- Soil: "Rich Bed Mix" — topsoil 50%, compost 40%, perlite 10%
- Companions: nasturtium, corn | Avoid: potato, fennel

### Cucumber
- Latin: *Cucumis sativus*
- Days to germinate: 5 | Days to harvest: 60
- Water every: 1 day | Fertilise every: 14 days
- Prune: none
- Sun: full_sun | Spacing: 30 cm
- Soil: "Rich Bed Mix" — topsoil 50%, compost 40%, perlite 10%
- Companions: radish, sunflower | Avoid: aromatic herbs

### Carrot
- Latin: *Daucus carota*
- Days to germinate: 14 | Days to harvest: 75
- Water every: 3 days | Fertilise every: 30 days
- Prune: none
- Sun: full_sun | Spacing: 5 cm
- Soil: "Sandy Loam" — topsoil 60%, compost 20%, perlite 20%
- Companions: onion, lettuce, rosemary | Avoid: dill, fennel

### Lettuce
- Latin: *Lactuca sativa*
- Days to germinate: 5 | Days to harvest: 45
- Water every: 1 day | Fertilise every: 21 days
- Prune: none
- Sun: partial_shade | Spacing: 25 cm
- Soil: "Light Mix" — topsoil 40%, compost 45%, perlite 15%
- Companions: carrot, radish, strawberry | Avoid: celery

### Spinach
- Latin: *Spinacia oleracea*
- Days to germinate: 7 | Days to harvest: 40
- Water every: 2 days | Fertilise every: 21 days
- Prune: none
- Sun: partial_shade | Spacing: 15 cm
- Soil: "Light Mix" — topsoil 40%, compost 45%, perlite 15%
- Companions: strawberry, garlic | Avoid: potato

### Pepper (Bell)
- Latin: *Capsicum annuum*
- Days to germinate: 10 | Days to harvest: 80
- Water every: 2 days | Fertilise every: 14 days
- Prune every: 14 days from day 30 (pinch tips)
- Sun: full_sun | Spacing: 45 cm
- Soil: "Tomato Mix" — topsoil 40%, compost 40%, perlite 20%
- Companions: basil, carrot | Avoid: fennel, brassicas

### Green Bean
- Latin: *Phaseolus vulgaris*
- Days to germinate: 7 | Days to harvest: 60
- Water every: 2 days | Fertilise every: 28 days
- Prune: none
- Sun: full_sun | Spacing: 10 cm
- Soil: "Rich Bed Mix" — topsoil 50%, compost 40%, perlite 10%
- Companions: carrot, cauliflower, squash | Avoid: onion, fennel

### Radish
- Latin: *Raphanus sativus*
- Days to germinate: 3 | Days to harvest: 25
- Water every: 1 day | Fertilise every: 28 days
- Prune: none
- Sun: partial_shade | Spacing: 5 cm
- Soil: "Sandy Loam" — topsoil 60%, compost 20%, perlite 20%
- Companions: carrot, cucumber, lettuce | Avoid: hyssop

### Kale
- Latin: *Brassica oleracea var. sabellica*
- Days to germinate: 7 | Days to harvest: 60
- Water every: 2 days | Fertilise every: 21 days
- Prune: none
- Sun: full_sun | Spacing: 45 cm
- Soil: "Rich Bed Mix" — topsoil 50%, compost 40%, perlite 10%
- Companions: beet, celery | Avoid: tomato, strawberry

### Garlic
- Latin: *Allium sativum*
- Days to germinate: 14 | Days to harvest: 240
- Water every: 7 days | Fertilise every: 30 days
- Prune: none
- Sun: full_sun | Spacing: 15 cm
- Soil: "Sandy Loam" — topsoil 60%, compost 20%, perlite 20%
- Companions: carrot, tomato, rose | Avoid: bean, pea

---

## Herbs (8)

### Basil
- Latin: *Ocimum basilicum*
- Days to germinate: 7 | Days to harvest: 30
- Water every: 1 day | Fertilise every: 21 days
- Prune every: 7 days from day 21 (pinch flowers)
- Sun: full_sun | Spacing: 20 cm
- Soil: "Herb Mix" — topsoil 30%, compost 50%, perlite 20%
- Companions: tomato, pepper | Avoid: sage, thyme

### Mint
- Latin: *Mentha spicata*
- Days to germinate: 10 | Days to harvest: 30
- Water every: 1 day | Fertilise every: 28 days
- Prune every: 14 days (keeps compact)
- Sun: partial_shade | Spacing: 30 cm
- Soil: "Herb Mix" — topsoil 30%, compost 50%, perlite 20%
- Companions: tomato, cabbage | Avoid: parsley, chamomile

### Rosemary
- Latin: *Salvia rosmarinus*
- Days to germinate: 14 | Days to harvest: 90
- Water every: 7 days | Fertilise every: 60 days
- Prune every: 30 days from day 60
- Sun: full_sun | Spacing: 60 cm
- Soil: "Mediterranean Mix" — topsoil 40%, compost 20%, perlite 40%
- Companions: carrot, bean, cabbage | Avoid: cucumber

### Thyme
- Latin: *Thymus vulgaris*
- Days to germinate: 14 | Days to harvest: 75
- Water every: 5 days | Fertilise every: 60 days
- Prune every: 21 days from day 60
- Sun: full_sun | Spacing: 30 cm
- Soil: "Mediterranean Mix" — topsoil 40%, compost 20%, perlite 40%
- Companions: strawberry, tomato | Avoid: basil

### Parsley
- Latin: *Petroselinum crispum*
- Days to germinate: 21 | Days to harvest: 70
- Water every: 2 days | Fertilise every: 28 days
- Prune every: 14 days from day 50
- Sun: partial_shade | Spacing: 15 cm
- Soil: "Herb Mix" — topsoil 30%, compost 50%, perlite 20%
- Companions: asparagus, carrot, tomato | Avoid: mint, onion

### Chives
- Latin: *Allium schoenoprasum*
- Days to germinate: 10 | Days to harvest: 60
- Water every: 2 days | Fertilise every: 28 days
- Prune every: 21 days (snip to 5cm above soil)
- Sun: full_sun | Spacing: 15 cm
- Soil: "Herb Mix" — topsoil 30%, compost 50%, perlite 20%
- Companions: carrot, tomato | Avoid: bean, pea

### Dill
- Latin: *Anethum graveolens*
- Days to germinate: 7 | Days to harvest: 45
- Water every: 2 days | Fertilise every: 28 days
- Prune: none
- Sun: full_sun | Spacing: 30 cm
- Soil: "Light Mix" — topsoil 40%, compost 45%, perlite 15%
- Companions: cucumber, onion | Avoid: tomato, carrot, fennel

### Coriander
- Latin: *Coriandrum sativum*
- Days to germinate: 7 | Days to harvest: 35
- Water every: 1 day | Fertilise every: 28 days
- Prune every: 7 days from day 21 (bolt prevention)
- Sun: partial_shade | Spacing: 20 cm
- Soil: "Light Mix" — topsoil 40%, compost 45%, perlite 15%
- Companions: anise, carrot | Avoid: fennel

---

## Fruit (3)

### Strawberry
- Latin: *Fragaria × ananassa*
- Days to germinate: 14 | Days to harvest: 90
- Water every: 2 days | Fertilise every: 14 days
- Prune every: 30 days (runner removal)
- Sun: full_sun | Spacing: 30 cm
- Soil: "Tomato Mix" — topsoil 40%, compost 40%, perlite 20%
- Companions: lettuce, spinach, thyme | Avoid: brassicas, fennel

### Chilli Pepper
- Latin: *Capsicum frutescens*
- Days to germinate: 10 | Days to harvest: 90
- Water every: 2 days | Fertilise every: 14 days
- Prune every: 14 days from day 30
- Sun: full_sun | Spacing: 45 cm
- Soil: "Tomato Mix" — topsoil 40%, compost 40%, perlite 20%
- Companions: basil, carrot | Avoid: fennel

### Pumpkin
- Latin: *Cucurbita maxima*
- Days to germinate: 7 | Days to harvest: 110
- Water every: 3 days | Fertilise every: 21 days
- Prune: none
- Sun: full_sun | Spacing: 120 cm
- Soil: "Rich Bed Mix" — topsoil 50%, compost 40%, perlite 10%
- Companions: corn, bean | Avoid: potato

---

## Flowers (2)

### Marigold
- Latin: *Tagetes erecta*
- Days to germinate: 5 | Days to harvest: 60 (first bloom)
- Water every: 2 days | Fertilise every: 28 days
- Prune every: 14 days (deadheading)
- Sun: full_sun | Spacing: 25 cm
- Soil: "Light Mix" — topsoil 40%, compost 45%, perlite 15%
- Companions: tomato, pepper, cucumber | Avoid: bean

### Nasturtium
- Latin: *Tropaeolum majus*
- Days to germinate: 7 | Days to harvest: 55 (first bloom)
- Water every: 3 days | Fertilise every: 42 days (low-feed plant)
- Prune: none
- Sun: full_sun | Spacing: 30 cm
- Soil: "Sandy Loam" — topsoil 60%, compost 20%, perlite 20%
- Companions: courgette, cucumber, brassicas | Avoid: none

---

## Alembic data migration

```python
# backend/alembic/versions/XXXX_seed_crops.py

def upgrade():
    crops = [
        {
            "id": str(uuid4()),
            "name": "Tomato",
            "latin_name": "Solanum lycopersicum",
            "category": "vegetable",
            # ... all fields
        },
        # ... all 25 crops
    ]
    op.bulk_insert(crops_table, crops)

def downgrade():
    op.execute("DELETE FROM crops")
```

Full Python dict for each crop derived from the data above.
Thumbnail URLs: use placeholder image service for MVP (e.g. `https://placehold.co/400x300?text=Tomato`). Replace with real botanical photography post-MVP.
