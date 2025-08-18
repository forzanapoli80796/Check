// Task translations mapping from German to English
export const taskTranslations: Record<string, { title: string; description: string }> = {
  // Terminal Tasks
  'Kassensystem hochfahren': { 
    title: 'Start cash register system', 
    description: 'Start the POS system and log in' 
  },
  'Kassenschublade prüfen': { 
    title: 'Check cash drawer', 
    description: 'Count initial cash and verify amount' 
  },
  'Bestellungen vorbereiten': { 
    title: 'Prepare orders', 
    description: 'Prepare the order area' 
  },
  'Tageskasse abrechnen': { 
    title: 'Daily cash reconciliation', 
    description: 'Count and reconcile daily cash' 
  },
  'System herunterfahren': { 
    title: 'Shut down system', 
    description: 'Properly shut down the POS system' 
  },
  'Kasse Schließen': { 
    title: 'Close cash register', 
    description: 'Fill out Google spreadsheet correctly' 
  },
  'Kasse/Google Tabelle öffnen': { 
    title: 'Open cash register/Google spreadsheet', 
    description: 'Fill out Google spreadsheet correctly' 
  },
  'Terminal Theke nass abwischen': { 
    title: 'Wipe terminal counter', 
    description: '' 
  },
  'Terminal Tisch abräumen, nass reinigen': { 
    title: 'Clear and clean terminal table', 
    description: '' 
  },
  'Terminal Tisch reinigen': { 
    title: 'Clean terminal table', 
    description: 'With microfiber cloth and water, NO DETERGENT' 
  },
  'Terminal unterstützen': { 
    title: 'Support terminal', 
    description: 'Clear tables, clean, bring pizzas to customers, give pizzas to Wolt drivers' 
  },
  'Terminal unterstützen ': { 
    title: 'Support terminal', 
    description: 'Clear tables, clean, bring pizzas to customers, give pizzas to Wolt drivers' 
  },
  'Küchen aktiv nach Aufgaben fragen': {
    title: 'Actively ask kitchen for tasks',
    description: 'if items from storage are needed'
  },
  'Küche aktiv nach Aufgaben fragen': {
    title: 'Actively ask kitchen for tasks',
    description: 'if items from storage are needed'
  },


  // Kitchen Tasks
  'Kühlschrank-Temperatur prüfen': { 
    title: 'Check refrigerator temperature', 
    description: 'Record temperature and ensure proper cooling' 
  },
  'Arbeitsflächen reinigen': { 
    title: 'Clean work surfaces', 
    description: 'Clean and disinfect all work surfaces' 
  },
  'Zutaten vorbereiten': { 
    title: 'Prepare ingredients', 
    description: 'Prep ingredients for the shift' 
  },
  'Backofen vorheizen': { 
    title: 'Preheat oven', 
    description: 'Set oven to correct temperature' 
  },
  'Grill reinigen': { 
    title: 'Clean grill', 
    description: 'Clean and maintain the grill' 
  },
  'Küche schließen': { 
    title: 'Close kitchen', 
    description: 'Complete kitchen closing procedures' 
  },
  'Kühlhäuser und Kühltische': { 
    title: 'Walk-in coolers and cooling tables', 
    description: '' 
  },
  'Oberflächen/Kühltische': { 
    title: 'Surfaces/Cooling tables', 
    description: 'Clean with sponge and detergent, finish with clean microfiber cloth' 
  },
  'Getränke & Dessert aufgefühlt?': { 
    title: 'Drinks & desserts restocked?', 
    description: 'Make sure not too many strawberry and pistachio tiramisu are defrosted' 
  },
  'Getränke Kühlschrank auffüllen': { 
    title: 'Restock drinks fridge', 
    description: 'Dust and place in fridge. New in back, old in front' 
  },

  // Driver Tasks
  'Fahrzeug überprüfen': { 
    title: 'Check vehicle', 
    description: 'Check oil, tires, and general condition' 
  },
  'Lieferungen zuordnen': { 
    title: 'Assign deliveries', 
    description: 'Organize delivery routes' 
  },
  'Wechselgeld prüfen': { 
    title: 'Check change', 
    description: 'Ensure sufficient change for deliveries' 
  },
  'Fahrzeug tanken': { 
    title: 'Refuel vehicle', 
    description: 'Fill up the delivery vehicle' 
  },
  'Liefertaschen reinigen': { 
    title: 'Clean delivery bags', 
    description: 'Clean and sanitize delivery bags' 
  },
  'Tagesabrechnung': { 
    title: 'Daily settlement', 
    description: 'Complete delivery reports' 
  },
  'Fahrer Regal Sauber machen und aufräumen': { 
    title: 'Clean and organize driver shelf', 
    description: 'Where the batteries are' 
  },
  'Fahreraufgaben Kontrolieren': { 
    title: 'Check driver tasks', 
    description: 'Drivers have their own Forzacheck, just check' 
  },
  'Fahrrad Box Reinigen': { 
    title: 'Clean bicycle box', 
    description: '' 
  },
  'Fahrräder Kontrollieren': { 
    title: 'Check bicycles', 
    description: 'Cleanliness and roadworthiness, if defective inform Schalau' 
  },
  'Fahrräder Raus stellen': { 
    title: 'Put bicycles outside', 
    description: '' 
  },
  'Fahrräder Rein stellen': { 
    title: 'Bring bicycles inside', 
    description: '' 
  },
  'Fahrräder Rein stellen ': { 
    title: 'Bring bicycles inside', 
    description: '' 
  },
  'Helme Reinigen': { 
    title: 'Clean helmets', 
    description: 'Everyone should clean their own helmet after shift' 
  },
  'Pizza Taschen Reinigen': { 
    title: 'Clean pizza bags', 
    description: 'Throw away receipts' 
  },
  'Akkus Aufladen': { 
    title: 'Charge batteries', 
    description: 'IMPORTANT' 
  },
  'Power Bank': { 
    title: 'Power bank', 
    description: 'Both there? Plug in to charge IMPORTANT' 
  },
  'Power Banks zurück zum Terminal und aufladen': { 
    title: 'Return power banks to terminal and charge', 
    description: '' 
  },

  // Cleaning Tasks
  'Boden gekehrt/gewischt?': { 
    title: 'Floor swept/mopped?', 
    description: 'Mop if necessary' 
  },
  'Eingang Tür und Scheiben': { 
    title: 'Entrance door and windows', 
    description: 'Inside and outside' 
  },
  'Fenster & Schieber Tür': { 
    title: 'Windows & sliding door', 
    description: 'Inside and outside' 
  },
  'Fliesen und Wände': { 
    title: 'Tiles and walls', 
    description: 'Kitchen, customer area' 
  },
  'Geschirr Spülen': { 
    title: 'Wash dishes', 
    description: '' 
  },
  'Geschirr': { 
    title: 'Dishes', 
    description: 'Collect from clearing station and load dishwasher' 
  },
  'Aufstuhlen': { 
    title: 'Put chairs up', 
    description: 'In customer area so cleaning company can clean better' 
  },
  'Tische absperren': { 
    title: 'Block off tables', 
    description: '' 
  },
  'Tische im Erdgeschoss': { 
    title: 'Tables on ground floor', 
    description: 'Clean and not wobbly?' 
  },
  'Spülmaschine': { 
    title: 'Dishwasher', 
    description: 'Remove all filters, wash with sponge and detergent, leave outside' 
  },

  // Store Management
  'Alle Shops offen und auf 30min. Lieferzeit zurückgesetzt?': { 
    title: 'All shops open and reset to 30min delivery time?', 
    description: '' 
  },
  'Lieferando ist Live und hat 30min. Lieferzeit?': { 
    title: 'Lieferando is live with 30min delivery time?', 
    description: '' 
  },
  'Webshop ist Live und hat 30min. Lieferzeit?': { 
    title: 'Webshop is live with 30min delivery time?', 
    description: '' 
  },
  'Wolt Tablet ist an und ist Live?': { 
    title: 'Wolt tablet is on and live?', 
    description: '' 
  },
  'Store aufbau': { 
    title: 'Store setup', 
    description: 'Fan, both screens, banner, benches outside, music (Forza Playlist)' 
  },
  'Licht AN?': { 
    title: 'Lights ON?', 
    description: '' 
  },
  'Licht AUS?': { 
    title: 'Lights OFF?', 
    description: '' 
  },
  'Wärmebrücker AN?': { 
    title: 'Heat bridge ON?', 
    description: '' 
  },
  'Wärmebrücker AUS?': { 
    title: 'Heat bridge OFF?', 
    description: '' 
  },

  // Inventory & Supplies
  'Pizza Kartons': { 
    title: 'Pizza boxes', 
    description: 'Check that enough are folded' 
  },
  'Besteck + Behälter': { 
    title: 'Cutlery + containers', 
    description: 'Enough cutlery and containers clean?' 
  },
  'Team Wasser': { 
    title: 'Team water', 
    description: 'Enough available?' 
  },
  'Team Wasser holen': { 
    title: 'Get team water', 
    description: '' 
  },
  'Tomaten Dosen holen': { 
    title: 'Get tomato cans', 
    description: '8x Pummarole Dolce, 6x San Marzano' 
  },
  'Gemüse Kisten ins Store holen': { 
    title: 'Bring vegetable crates to storage', 
    description: 'Ask kitchen if vegetables are ordered for tomorrow?' 
  },
  'Gemüse Kisten ins Store holen ': { 
    title: 'Bring vegetable crates to storage', 
    description: 'Ask kitchen if vegetables are ordered for tomorrow?!' 
  },
  'Leergut': { 
    title: 'Empty bottles', 
    description: 'Bring to drinks storage and sort' 
  },
  'Leergut für Abholung vorbereiten': { 
    title: 'Prepare empties for pickup', 
    description: 'ALWAYS Sundays' 
  },
  'Rosmarin topf Gießen': { 
    title: 'Water rosemary pot', 
    description: 'One bottle of still water is enough for three plants – distribute evenly' 
  },

  // Maintenance & Checks
  'Außenberich ist sauber?': { 
    title: 'Outside area clean?', 
    description: 'No trash, no cigarette butts?' 
  },
  'Stop Uhr nicht vergessen': { 
    title: "Don't forget stopwatch", 
    description: '' 
  },
  'Kaputte Teig/Pizza?': { 
    title: 'Broken dough/pizza?', 
    description: 'Info to terminal' 
  },

  'Inventur/Non-Foodliste': { 
    title: 'Inventory/Non-food list', 
    description: 'Tuesdays' 
  },

  // Special Cleaning Tasks
  'Lüftung (kontrolle immer freitags)': { 
    title: 'Ventilation (check always Fridays)', 
    description: 'Including hood inside and outside' 
  },
  'Kühlzelle (alles herausnehmen, Boden nass wischen)': { 
    title: 'Walk-in cooler (remove everything, wet mop floor)', 
    description: 'Mondays' 
  },
  'Regale / Montags': { 
    title: 'Shelves (Mondays)', 
    description: 'Clear everything, wipe with damp cloth' 
  },
  'Unter der Spüle (alles herausnehmen und Reinigen )': { 
    title: 'Under the sink (remove everything and clean)', 
    description: 'Mondays' 
  },
  'Boden frei machen (Teigkisten & Caputo Säcke auf den Tisch), immer donnerstags bei Feiertag einen Tag davor': { 
    title: 'Clear floor (dough boxes & Caputo bags on table)', 
    description: 'Always Thursdays, or day before holiday' 
  },

  // Equipment Cleaning
  'Außenflächen der Teigmaschine feucht gereinigt': { 
    title: 'Dough machine exterior cleaned', 
    description: '' 
  },
  'Innenflächen der Teigmaschine feucht gereinigt': { 
    title: 'Dough machine interior cleaned', 
    description: '' 
  },
  'Beide Arbeitstische vollständig von Mehl befreit': { 
    title: 'Both work tables completely flour-free', 
    description: '' 
  },
  'Beide Kühltsche von Ware befreien und feucht wischen': { 
    title: 'Clear both cooling tables and wipe', 
    description: '' 
  },
  'Waage feucht gereinigt und ans Ladekabel angeschlossen': { 
    title: 'Scale cleaned and connected to charger', 
    description: '' 
  },
  'Kugelboxen Reinigen': { 
    title: 'Clean dough ball boxes', 
    description: 'Scrape and wash in dishwasher if necessary' 
  },
  'Semola durch Sieben': { 
    title: 'Sift semola', 
    description: '' 
  },
  'Oberfläche der Spüle feucht gereinigt': { 
    title: 'Sink surface cleaned', 
    description: '' 
  },
  
  // Additional tasks from database
  'Abstauben aller Flaschen, alle Elemente am Terminal': {
    title: 'Dust all bottles, all elements at terminal',
    description: ''
  },
  'Alle Behälter unter Wärmebrücke ausräumen und in die Spülmaschine': {
    title: 'Empty all containers under heat bridge and put in dishwasher',
    description: ''
  },
  'Alle Flaschen abstauben und schwarze Gitterkorb feucht wischen': {
    title: 'Dust all bottles and wipe black wire basket',
    description: ''
  },
  'Alle Flächen unter Terminal Tisch 1 und 2 reinigen & sortieren': {
    title: 'Clean & organize all surfaces under terminal table 1 and 2',
    description: ''
  },
  'Alle Flächen unter dem Terminal und Fahrertisch feucht reinigen (auch die Schubladen ausräumen, feucht wischen)': {
    title: 'Clean all surfaces under terminal and driver table (also empty drawers, wipe)',
    description: ''
  },
  'Alle GN-Behälter bei bedarf austauschen/spülen': {
    title: 'Replace/wash all GN containers as needed',
    description: 'Cheese, fish, ricotta, change GN container EVERY day'
  },
  'Alle Schubladen am Terminal sortieren, inkl. das Regal unter dem Wolt Tablet': {
    title: 'Organize all drawers at terminal, incl. shelf under Wolt tablet',
    description: ''
  },
  'Alle Staubflächen am Whiteboard feucht reinigen': {
    title: 'Clean all dusty surfaces on whiteboard',
    description: ''
  },
  'Auf dem Getränke Kühlschrank feucht reinigen (Kartons entfernen)': {
    title: 'Clean on top of drinks fridge (remove boxes)',
    description: ''
  },
  'Blaue Rolle': {
    title: 'Blue roll',
    description: 'Always specify number of rolls'
  },
  'Bonrollen': {
    title: 'Receipt rolls',
    description: 'Specify quantity'
  },
  'Die Fläche unter der Wärmebrücke sowie die untere Bodenplatte des Tisches feucht reinigen': {
    title: 'Clean surface under heat bridge and lower table plate',
    description: ''
  },
  'Die Gummidichtungen beider Kühlschranke feucht abwischen': {
    title: 'Wipe rubber seals of both refrigerators',
    description: ''
  },
  'Dip Becher/Deckel': {
    title: 'Dip cups/lids',
    description: ''
  },
  'Dip tüten': {
    title: 'Dip bags',
    description: ''
  },
  'Dressing Becker/deckel': {
    title: 'Dressing cups/lids',
    description: ''
  },
  'Edelstahl Behälter Besteck in Spülmaschine': {
    title: 'Stainless steel cutlery containers in dishwasher',
    description: ''
  },
  'Edelstahl Behälter für Besteck in die Spülmaschine': {
    title: 'Stainless steel containers for cutlery in dishwasher',
    description: ''
  },
  'Eingangs Tür + Tische': {
    title: 'Entrance door + tables',
    description: 'Inside and outside'
  },
  'Einweg Besteck': {
    title: 'Disposable cutlery',
    description: 'Specify whole/half package e.g. 1.5 packages'
  },
  'Etiketten Datum GN': {
    title: 'Date labels GN',
    description: 'Always specify number of rolls'
  },
  'Etiketten Warenauszeichner': {
    title: 'Product labels',
    description: 'Always specify number of rolls'
  },
  'Fahreraufgaben Kontrolieren!?': {
    title: 'Check driver tasks!?',
    description: 'Drivers have their own Forzacheck, just check'
  },
  'Fenster der Trennwand mit Glasreiniger innen/außen': {
    title: 'Clean partition windows with glass cleaner inside/outside',
    description: ''
  },
  'Flaschen im Flaschenkühlschrank entstauben': {
    title: 'Dust bottles in bottle fridge',
    description: ''
  },
  'Flaschenkühlschrank Glastür innen/außen mit Glassreiniger': {
    title: 'Bottle fridge glass door inside/outside with glass cleaner',
    description: ''
  },
  'Flaschenkühlschrank oben, abräumen und nass abwischen': {
    title: 'Top of bottle fridge, clear and wipe',
    description: ''
  },
  'Füße von den Tischen nass reinigen': {
    title: 'Clean table legs',
    description: ''
  },
  'Getränke&Dessert Kühlschrank': {
    title: 'Drinks & dessert fridge',
    description: ''
  },
  'Getränkekühlschrank reinigen inkl. Regalböden': {
    title: 'Clean drinks fridge including shelves',
    description: ''
  },
  'Gitterkorb für Öl, Salz usw. in die Spülmaschine': {
    title: 'Wire basket for oil, salt etc. in dishwasher',
    description: ''
  },
  'Glasfläche des Getränke Kühlschranks mit Glasreiniger reinigen': {
    title: 'Clean glass surface of drinks fridge with glass cleaner',
    description: ''
  },
  'Glasflächen der Eingangstür und der Flügeltüren, innen und außen mit Glasreiniger': {
    title: 'Glass surfaces of entrance and wing doors, inside and outside with glass cleaner',
    description: ''
  },
  'Gummis am Getränke Kühlschrank': {
    title: 'Rubber seals on drinks fridge',
    description: 'Clean Tuesdays and Fridays with microfiber cloth and glass cleaner'
  },
  'Handseife': {
    title: 'Hand soap',
    description: 'For new soap dispensers'
  },
  'Handtuch Papier': {
    title: 'Paper towels',
    description: 'For hand drying, always specify package'
  },
  'Helm Regal komplett ausräumen und feucht reinigen': {
    title: 'Completely empty and clean helmet shelf',
    description: ''
  },
  'Hocker Füße nass reinigen': {
    title: 'Clean stool legs',
    description: ''
  },
  'KAV Kl. und Gr.': {
    title: 'Small and large cooling display',
    description: ''
  },
  'Kistenhalterung raus, dahinter nass reinigen, Halterung abwischen': {
    title: 'Remove crate holder, clean behind, wipe holder',
    description: ''
  },
  'Kl. KAV ins Kühlhaus verräumen abtauen und reinigen.': {
    title: 'Small cooling display to cold room, defrost and clean',
    description: 'Garnish station'
  },
  'Kl. Kühltisch ausräumen innen reinigen': {
    title: 'Empty small cooling table and clean inside',
    description: ''
  },
  'Knoblauch Mayo': {
    title: 'Garlic mayo',
    description: 'Only specify whole bottles'
  },
  'Kugelschreiber': {
    title: 'Pens',
    description: 'Specify quantity'
  },
  'Kühlaufsatzvitrine groß, abtauen und reinigen (innen)': {
    title: 'Large cooling display, defrost and clean (inside)',
    description: 'Mondays'
  },
  'Lampen an der Decke': {
    title: 'Ceiling lamps',
    description: ''
  },
  'Leere Teig boxen wegbringen': {
    title: 'Take away empty dough boxes',
    description: 'Place correctly, see notice'
  },
  'Leergut Kisten abstauben': {
    title: 'Dust empty bottle crates',
    description: ''
  },
  'Ordnung und Sauberkeit': {
    title: 'Order and cleanliness',
    description: 'Check storage areas personally'
  },
  'Pflaster': {
    title: 'Band-aids',
    description: 'Specify rolls/units'
  },
  'Pizza Papier': {
    title: 'Pizza paper',
    description: 'Only specify whole package'
  },
  'Salatschale/Deckel': {
    title: 'Salad bowls/lids',
    description: 'Always specify package'
  },
  'Salz Spülmaschine': {
    title: 'Dishwasher salt',
    description: 'Specify quantity'
  },
  'Sauberkeit und Ordnung': {
    title: 'Cleanliness and order',
    description: 'Check storage areas personally (Garage 1, Garage 2)'
  },
  'Sauberkeit&Ordnung': {
    title: 'Cleanliness & order',
    description: 'Storage and shelves downstairs, garages'
  },
  'Schwarzes Gitter (Raumtrenner) abstauben': {
    title: 'Dust black grid (room divider)',
    description: ''
  },
  'Serviette Gast': {
    title: 'Guest napkins',
    description: 'Always specify package quantity'
  },
  'Speisekarte': {
    title: 'Menu',
    description: 'Less than 50 pieces? Enter 0'
  },
  'Spezi': {
    title: 'Spezi',
    description: 'Only specify whole crates'
  },
  'Spinnweben': {
    title: 'Cobwebs',
    description: 'Inside and outside'
  },
  'TK Kühlschränke': {
    title: 'Freezers',
    description: ''
  },
  'Tahin': {
    title: 'Tahini',
    description: 'Only specify whole bottles'
  },
  'Teigraum/Wandregal vollständig abgeräumt und feucht gereinigt': {
    title: 'Dough room/wall shelf completely cleared and cleaned',
    description: ''
  },
  'Tesa Rollen': {
    title: 'Tape rolls',
    description: 'Always specify quantity'
  },
  'Textmarker gelb': {
    title: 'Yellow highlighter',
    description: 'Always specify quantity'
  },
  'Tomatendose Pumarole': {
    title: 'Pummarole tomato cans',
    description: 'Always specify 6-pack'
  },
  'Tomatendose San Marzano DOP': {
    title: 'San Marzano DOP tomato cans',
    description: 'Always specify 6-pack'
  },
  'Trüffel Mayo': {
    title: 'Truffle mayo',
    description: 'Only specify whole bottles'
  },
  'Unter der Spüle': {
    title: 'Under the sink',
    description: ''
  },
  'Untere ablagen in der Küche leer räumen': {
    title: 'Empty lower shelves in kitchen',
    description: 'Cleaning company will clean'
  },
  'Waschmaschine': {
    title: 'Washing machine',
    description: 'Lint filter'
  },
  'Wohnung allgemein': {
    title: 'General apartment areas',
    description: ''
  },
  'Getränke Lager': {
    title: 'Drinks storage',
    description: 'Organize, sweep, sort drink crates'
  },
  
  // Ensure all variations are covered
  'Blaue Rolle ': {
    title: 'Blue roll',
    description: 'Always specify number of rolls'
  },
  'Handseife ': {
    title: 'Hand soap',
    description: 'For new soap dispensers'
  },
  'Serviette Gast ': {
    title: 'Guest napkins',
    description: 'Always specify package quantity'
  },
  'Wohnung allgemein ': {
    title: 'General apartment areas',
    description: ''
  },
  
  // Additional missing translations from database
  'Geschirr ': {
    title: 'Dishes',
    description: 'Collect from clearing station and load dishwasher'
  },
  'Leere Teig boxen wegbringen ': {
    title: 'Take away empty dough boxes',
    description: 'Place correctly, see notice'
  },
  'Überprüfung und Nachfüllung Papier&Seifen': {
    title: 'Check and refill paper & soap',
    description: 'Kitchen, dough room, WC'
  },
  'Ordnung und Sauberkeit ': {
    title: 'Order and cleanliness',
    description: 'Check storage areas personally'
  },
  'Sauberkeit und Ordnung ': {
    title: 'Cleanliness and order',
    description: 'Check storage areas personally'
  },
  'Oberflächen/Kühltische ': {
    title: 'Surfaces and cooling tables',
    description: 'Clean with sponge and detergent, finish with clean microfiber cloth'
  },
  'Regale / Montags ': {
    title: 'Shelves (Mondays)',
    description: 'Clear everything, wipe with damp cloth'
  }
};

// Basic automatic translation for common German words
function autoTranslate(text: string): string {
  // First, handle complete phrases
  const phraseTranslations: { [key: string]: string } = {
    'Abstauben aller Flaschen, alle Elemente am Terminal': 'Dust all bottles and terminal elements',
    'Alle Schubladen am Terminal sortieren, inkl. das Regal unter dem Wolt Tablet': 'Sort all terminal drawers, including shelf under Wolt tablet',
    'Terminal Theke nass abwischen': 'Wipe terminal counter with wet cloth',
    'Terminal Tisch abräumen, nass reinigen': 'Clear and wet-clean terminal table',
    'Alle Flächen unter dem Terminal und Fahrertisch feucht reinigen': 'Clean all surfaces under terminal and driver table with damp cloth',
    'Alle Flächen unter Terminal Tisch 1 und 2 reinigen & sortieren': 'Clean and organize all surfaces under terminal tables 1 and 2',
    'Terminal Tisch reinigen': 'Clean terminal table',
    'Gemüse Kisten ins Store holen': 'Bring vegetable crates into storage',
    'Terminal unterstützen': 'Assist at terminal',
    'Fahrräder Kontrollieren': 'Check bicycles',
    'Fahrräder Raus stellen': 'Put bicycles outside',
    'Fahrräder Rein stellen': 'Bring bicycles inside',
    'Küche aktiv nach Aufgaben fragen': 'Actively ask kitchen staff for tasks'
  };
  
  // Check if complete phrase matches
  for (const [german, english] of Object.entries(phraseTranslations)) {
    if (text.trim().toLowerCase() === german.toLowerCase()) {
      return english;
    }
  }
  
  const commonTranslations: { [key: string]: string } = {
    'abstauben': 'dust',
    'Abstauben': 'Dust',
    'reinigen': 'clean',
    'Reinigen': 'Clean',
    'abräumen': 'clear',
    'Abräumen': 'Clear',
    'abwischen': 'wipe',
    'Abwischen': 'Wipe',
    'sortieren': 'sort',
    'Sortieren': 'Sort',
    'sauber': 'clean',
    'Sauber': 'Clean',
    'Sauberkeit': 'Cleanliness',
    'aufräumen': 'tidy up',
    'Aufräumen': 'Tidy up',
    'kontrollieren': 'check',
    'Kontrollieren': 'Check',
    'kontrolle': 'control',
    'Kontrolle': 'Control',
    'überprüfen': 'verify',
    'Überprüfen': 'Verify',
    'überprüfung': 'verification',
    'Überprüfung': 'Verification',
    'nachfüllen': 'refill',
    'Nachfüllen': 'Refill',
    'nachfüllung': 'refill',
    'Nachfüllung': 'Refill',
    'auffüllen': 'fill up',
    'Auffüllen': 'Fill up',
    'aufgefüllt': 'filled',
    'Aufgefüllt': 'Filled',
    'wischen': 'wipe',
    'Wischen': 'Wipe',
    'feucht': 'damp',
    'Feucht': 'Damp',
    'nass': 'wet',
    'Nass': 'Wet',
    'trocken': 'dry',
    'Trocken': 'Dry',
    'spülen': 'rinse',
    'Spülen': 'Rinse',
    'spülmaschine': 'dishwasher',
    'Spülmaschine': 'Dishwasher',
    'geschirr': 'dishes',
    'Geschirr': 'Dishes',
    'besteck': 'cutlery',
    'Besteck': 'Cutlery',
    'behälter': 'container',
    'Behälter': 'Container',
    'kisten': 'boxes',
    'Kisten': 'Boxes',
    'kartons': 'cartons',
    'Kartons': 'Cartons',
    'flaschen': 'bottles',
    'Flaschen': 'Bottles',
    'getränke': 'drinks',
    'Getränke': 'Drinks',
    'kühlschrank': 'refrigerator',
    'Kühlschrank': 'Refrigerator',
    'kühltisch': 'cooling table',
    'Kühltisch': 'Cooling table',
    'kühlhaus': 'cold storage',
    'Kühlhaus': 'Cold storage',
    'lager': 'storage',
    'Lager': 'Storage',
    'tisch': 'table',
    'Tisch': 'Table',
    'theke': 'counter',
    'Theke': 'Counter',
    'tische': 'tables',
    'Tische': 'Tables',
    'boden': 'floor',
    'Boden': 'Floor',
    'flächen': 'surfaces',
    'Flächen': 'Surfaces',
    'fläche': 'surface',
    'Fläche': 'Surface',
    'wände': 'walls',
    'Wände': 'Walls',
    'fenster': 'window',
    'Fenster': 'Window',
    'tür': 'door',
    'Tür': 'Door',
    'türen': 'doors',
    'Türen': 'Doors',
    'lampen': 'lamps',
    'Lampen': 'Lamps',
    'licht': 'light',
    'Licht': 'Light',
    'schubladen': 'drawers',
    'Schubladen': 'Drawers',
    'regal': 'shelf',
    'Regal': 'Shelf',
    'elemente': 'elements',
    'Elemente': 'Elements',
    'an': 'on',
    'An': 'On',
    'am': 'at',
    'Am': 'At',
    'aus': 'off',
    'Aus': 'Off',
    'alle': 'all',
    'Alle': 'All',
    'aller': 'all',
    'Aller': 'All',
    'und': 'and',
    'oder': 'or',
    'mit': 'with',
    'ohne': 'without',
    'für': 'for',
    'bei': 'at',
    'unter': 'under',
    'Unter': 'Under',
    'dem': 'the',
    'Dem': 'The',
    'das': 'the',
    'Das': 'The',
    'inkl.': 'incl.',
    'Inkl.': 'Incl.',
    'über': 'over',
    'holen': 'fetch',
    'Holen': 'Fetch',
    'bringen': 'bring',
    'Bringen': 'Bring',
    'stellen': 'place/put',
    'Stellen': 'Place/Put',
    'rein': 'in',
    'Rein': 'In',
    'raus': 'out',
    'Raus': 'Out',
    'fahrräder': 'bicycles',
    'Fahrräder': 'Bicycles',
    'fahrrad': 'bicycle',
    'Fahrrad': 'Bicycle',
    'fahrertisch': 'driver table',
    'Fahrertisch': 'Driver table',
    'helm': 'helmet',
    'Helm': 'Helmet',
    'helme': 'helmets',
    'Helme': 'Helmets',
    'küche': 'kitchen',
    'Küche': 'Kitchen',
    'küchen': 'kitchen',
    'Küchen': 'Kitchen',
    'terminal': 'terminal',
    'Terminal': 'Terminal',
    'fahrer': 'driver',
    'Fahrer': 'Driver',
    'aktiv': 'actively',
    'fragen': 'ask',
    'Fragen': 'Ask',
    'aufgaben': 'tasks',
    'Aufgaben': 'Tasks',
    'unterstützen': 'support',
    'Unterstützen': 'Support',
    'gemüse': 'vegetables',
    'Gemüse': 'Vegetables',
    'store': 'store',
    'Store': 'Store',
    'ins': 'into/to',
    'nach': 'for/after'
  };
  
  let translated = text;
  
  // Replace German words with English equivalents
  for (const [german, english] of Object.entries(commonTranslations)) {
    const regex = new RegExp(`\\b${german}\\b`, 'g');
    translated = translated.replace(regex, english);
  }
  
  return translated;
}

// Helper function to get translated task or return original if no translation exists
export function getTranslatedTask(task: { title: string; description?: string }, language: 'de' | 'en') {
  if (language === 'en') {
    // Try exact match first
    let translation = taskTranslations[task.title];
    
    // If no exact match, try with trimmed title
    if (!translation) {
      translation = taskTranslations[task.title.trim()];
    }
    
    // If still no match, try to find a close match (handles trailing spaces, etc.)
    if (!translation) {
      const normalizedTitle = task.title.trim().toLowerCase();
      const matchingKey = Object.keys(taskTranslations).find(
        key => key.trim().toLowerCase() === normalizedTitle
      );
      if (matchingKey) {
        translation = taskTranslations[matchingKey];
      }
    }
    
    // If still no match, try without special characters
    if (!translation) {
      const cleanTitle = task.title.replace(/[!?]/g, '').trim();
      translation = taskTranslations[cleanTitle];
    }
    
    if (translation) {
      return {
        title: translation.title,
        description: translation.description || task.description || ''
      };
    }
    
    // If no translation exists, use automatic translation
    // This ensures ALL tasks get translated, even if not in our dictionary
    const autoTranslatedTitle = autoTranslate(task.title);
    const autoTranslatedDescription = task.description ? autoTranslate(task.description) : '';
    
    return {
      title: autoTranslatedTitle,
      description: autoTranslatedDescription
    };
  }
  
  // Return original German text
  return {
    title: task.title,
    description: task.description || ''
  };
}