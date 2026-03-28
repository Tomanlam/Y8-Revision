export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface Vocab {
  term: string;
  definition: string;
}

export interface Unit {
  id: number;
  title: string;
  description: string;
  color: string;
  concepts: string[];
  vocab: Vocab[];
  questions: Question[];
}

export const units: Unit[] = [
  {
    id: 1,
    title: "Respiration",
    description: "Understanding how living things release energy.",
    color: "bg-emerald-500",
    concepts: [
      "Aerobic respiration uses oxygen to break down glucose.",
      "The word equation: Glucose + Oxygen -> Carbon Dioxide + Water (+ Energy).",
      "Respiration happens in the mitochondria of cells.",
      "Anaerobic respiration happens without oxygen and produces lactic acid in humans."
    ],
    vocab: [
      { term: "Mitochondria", definition: "The part of the cell where respiration takes place." },
      { term: "Glucose", definition: "A type of sugar that is used as fuel in respiration." },
      { term: "Aerobic", definition: "A process that requires oxygen." },
      { term: "Anaerobic", definition: "A process that does not require oxygen." }
    ],
    questions: [
      { id: "1-1", text: "What best describes respiration?", options: ["A physical process that moves air in and out of lungs", "A chemical reaction in cells that releases energy", "A process that pumps blood around the body", "A process that breaks food into smaller pieces"], correctAnswer: "A chemical reaction in cells that releases energy" },
      { id: "1-2", text: "Respiration happens in:", options: ["lungs only", "all cells", "the heart only", "blood vessels only"], correctAnswer: "all cells" },
      { id: "1-3", text: "Most aerobic respiration takes place in the:", options: ["nucleus", "mitochondria", "cell wall", "vacuole"], correctAnswer: "mitochondria" },
      { id: "1-4", text: "Mitochondria are called the “powerhouse” because they:", options: ["store DNA", "make proteins", "release energy from respiration", "control the cell"], correctAnswer: "release energy from respiration" },
      { id: "1-5", text: "Which is the correct word equation for aerobic respiration?", options: ["Glucose + oxygen → carbon dioxide + water + energy", "Oxygen + carbon dioxide → glucose + water + energy", "Glucose + carbon dioxide → oxygen + water + energy", "Water + oxygen → glucose + carbon dioxide + energy"], correctAnswer: "Glucose + oxygen → carbon dioxide + water + energy" },
      { id: "1-6", text: "Which is the balanced chemical equation for aerobic respiration?", options: ["C6H12O6 + 6O2 → 6CO2 + 6H2O", "C6H12O6 + O2 → CO2 + H2O", "C6H12O6 + 6CO2 → 6O2 + 6H2O", "6CO2 + 6H2O → C6H12O6 + 6O2 + energy"], correctAnswer: "C6H12O6 + 6O2 → 6CO2 + 6H2O" },
      { id: "1-7", text: "In aerobic respiration, the reactants are:", options: ["carbon dioxide and water", "glucose and oxygen", "oxygen and water", "glucose and carbon dioxide"], correctAnswer: "glucose and oxygen" },
      { id: "1-8", text: "In aerobic respiration, the products are:", options: ["glucose and oxygen", "carbon dioxide and water", "oxygen and energy only", "glucose and water"], correctAnswer: "carbon dioxide and water" },
      { id: "1-9", text: "Which is NOT a product of aerobic respiration?", options: ["Water", "Carbon dioxide", "Oxygen", "Energy"], correctAnswer: "Oxygen" },
      { id: "1-10", text: "Which statement is TRUE?", options: ["Respiration happens only when we breathe in", "Respiration happens only in plants", "Respiration happens in all living cells", "Respiration happens only in the lungs"], correctAnswer: "Respiration happens in all living cells" },
      { id: "1-11", text: "Breathing is best described as:", options: ["a chemical process in mitochondria", "a physical process moving air in and out of lungs", "a process that releases energy from glucose", "a process that produces carbon dioxide in cells"], correctAnswer: "a physical process moving air in and out of lungs" },
      { id: "1-12", text: "Respiration is:", options: ["physical only", "chemical only", "neither physical nor chemical", "the same as breathing"], correctAnswer: "chemical only" },
      { id: "1-13", text: "Which happens in all cells?", options: ["Breathing", "Respiration", "Gas exchange at alveoli", "Pumping by the heart"], correctAnswer: "Respiration" },
      { id: "1-14", text: "Which involves the lungs directly?", options: ["Respiration", "Breathing", "Digestion", "Blood clotting"], correctAnswer: "Breathing" },
      { id: "1-15", text: "Inhalation means air moves:", options: ["into the lungs", "out of the lungs", "into the blood", "out of the heart"], correctAnswer: "into the lungs" },
      { id: "1-16", text: "Exhalation means air moves:", options: ["into the lungs", "out of the lungs", "into the stomach", "out of the blood"], correctAnswer: "out of the lungs" },
      { id: "1-17", text: "During breathing, air is moved:", options: ["into and out of the lungs", "only into the lungs", "only out of the lungs", "into and out of the heart"], correctAnswer: "into and out of the lungs" },
      { id: "1-18", text: "The system used for breathing is the:", options: ["circulatory system", "digestive system", "respiratory system", "excretory system"], correctAnswer: "respiratory system" },
      { id: "1-19", text: "The “voice box” is the:", options: ["trachea", "larynx", "bronchiole", "diaphragm"], correctAnswer: "larynx" },
      { id: "1-20", text: "The trachea is also known as the:", options: ["windpipe", "food pipe", "air sac", "capillary"], correctAnswer: "windpipe" },
      { id: "1-21", text: "Which order shows the correct path of air to the alveoli?", options: ["Nose → trachea → bronchi → bronchioles → alveoli", "Nose → bronchioles → bronchi → trachea → alveoli", "Nose → oesophagus → trachea → bronchi → alveoli", "Nose → trachea → alveoli → bronchi → bronchioles"], correctAnswer: "Nose → trachea → bronchi → bronchioles → alveoli" },
      { id: "1-22", text: "Bronchi are:", options: ["tiny air sacs", "tubes that lead from the trachea into the lungs", "muscles for breathing", "blood vessels"], correctAnswer: "tubes that lead from the trachea into the lungs" },
      { id: "1-23", text: "Bronchioles are:", options: ["the main windpipe", "smaller branches in the lungs leading to alveoli", "the rings of cartilage in the trachea", "blood vessels leaving the heart"], correctAnswer: "smaller branches in the lungs leading to alveoli" },
      { id: "1-24", text: "Alveoli are:", options: ["tiny air sacs where gas exchange happens", "the muscles that move the ribs", "tubes that carry blood", "cells that carry oxygen"], correctAnswer: "tiny air sacs where gas exchange happens" },
      { id: "1-25", text: "Alveoli are well-suited for gas exchange mainly because they have:", options: ["small surface area and thick walls", "large surface area and thin walls", "no blood supply", "hard walls made of cartilage"], correctAnswer: "large surface area and thin walls" },
      { id: "1-26", text: "Gas exchange occurs between alveoli and:", options: ["arteries", "veins", "capillaries", "bronchi"], correctAnswer: "capillaries" },
      { id: "1-27", text: "Concentration is the number of:", options: ["particles in a given volume", "breaths in a given minute", "organs in a body", "cells in a tissue"], correctAnswer: "particles in a given volume" },
      { id: "1-28", text: "Diffusion is the overall movement of particles from:", options: ["low concentration to high concentration", "high concentration to low concentration", "low pressure to high pressure", "high temperature to low temperature"], correctAnswer: "high concentration to low concentration" },
      { id: "1-29", text: "A concentration gradient is:", options: ["the difference in concentration between two regions", "the total number of particles", "the volume of a gas", "the mass of a substance"], correctAnswer: "the difference in concentration between two regions" },
      { id: "1-30", text: "Oxygen moves from alveoli into blood mainly by:", options: ["diffusion", "evaporation", "condensation", "combustion"], correctAnswer: "diffusion" },
      { id: "1-31", text: "Diffusion will continue until:", options: ["all particles stop moving", "concentrations become equal (no net movement)", "pressure becomes higher", "temperature becomes zero"], correctAnswer: "concentrations become equal (no net movement)" },
      { id: "1-32", text: "Oxygen is mainly transported by:", options: ["white blood cells", "platelets", "red blood cells", "plasma only"], correctAnswer: "red blood cells" },
      { id: "1-33", text: "Red blood cells are red because they contain:", options: ["chlorophyll", "haemoglobin", "antibodies", "enzymes for digestion"], correctAnswer: "haemoglobin" },
      { id: "1-34", text: "Haemoglobin’s main function is to:", options: ["fight pathogens", "help blood clot", "transport oxygen", "digest glucose"], correctAnswer: "transport oxygen" },
      { id: "1-35", text: "In the lungs, haemoglobin combines with oxygen to form:", options: ["carbon dioxide", "oxyhaemoglobin", "glucose", "plasma"], correctAnswer: "oxyhaemoglobin" },
      { id: "1-36", text: "When red blood cells reach body cells, oxyhaemoglobin will:", options: ["stay the same", "release oxygen", "produce antibodies", "become platelets"], correctAnswer: "release oxygen" },
      { id: "1-37", text: "Oxygen diffuses from blood into body cells because body cells have:", options: ["higher oxygen concentration than blood", "lower oxygen concentration than blood", "no oxygen concentration", "the same oxygen concentration as blood at all times"], correctAnswer: "lower oxygen concentration than blood" },
      { id: "1-38", text: "Pressure and volume of a gas are usually:", options: ["directly proportional", "inversely proportional", "unrelated", "always equal"], correctAnswer: "inversely proportional" },
      { id: "1-39", text: "If lung volume increases, lung pressure will:", options: ["increase", "decrease", "stay the same", "become zero"], correctAnswer: "decrease" },
      { id: "1-40", text: "Gas moves from high pressure to low pressure down the:", options: ["temperature gradient", "pressure gradient", "concentration gradient", "energy gradient"], correctAnswer: "pressure gradient" },
      { id: "1-41", text: "Two main muscle groups involved in breathing are:", options: ["biceps and triceps", "diaphragm and intercostal muscles", "heart muscle and leg muscles", "tongue and jaw muscles"], correctAnswer: "diaphragm and intercostal muscles" },
      { id: "1-42", text: "During inhalation, the diaphragm:", options: ["contracts and flattens", "relaxes and flattens", "contracts and becomes dome-shaped", "stops working"], correctAnswer: "contracts and flattens" },
      { id: "1-43", text: "During exhalation, the diaphragm:", options: ["contracts and flattens", "relaxes and returns to a dome shape", "contracts and pulls ribs up", "has no effect"], correctAnswer: "relaxes and returns to a dome shape" },
      { id: "1-44", text: "During inhalation, chest (lung) volume:", options: ["increases", "decreases", "stays the same", "becomes zero"], correctAnswer: "increases" },
      { id: "1-45", text: "During exhalation, chest (lung) volume:", options: ["increases", "decreases", "stays the same", "doubles"], correctAnswer: "decreases" },
      { id: "1-46", text: "During inhalation, lung pressure becomes:", options: ["higher than outside air", "lower than outside air", "equal to outside air always", "unrelated to outside air"], correctAnswer: "lower than outside air" },
      { id: "1-47", text: "During exhalation, lung pressure becomes:", options: ["lower than outside air", "higher than outside air", "always zero", "always equal to outside air"], correctAnswer: "higher than outside air" },
      { id: "1-48", text: "The circulatory system is needed mainly to:", options: ["break down food into glucose", "deliver oxygen and nutrients to body cells", "make antibodies", "produce oxygen in the body"], correctAnswer: "deliver oxygen and nutrients to body cells" },
      { id: "1-49", text: "The circulatory system consists of:", options: ["heart, lungs, trachea", "heart, blood, blood vessels", "blood, alveoli, bronchioles", "stomach, intestines, blood"], correctAnswer: "heart, blood, blood vessels" },
      { id: "1-50", text: "Which part of blood is a pale yellowish liquid that carries dissolved substances?", options: ["Plasma", "Platelets", "Red blood cells", "White blood cells"], correctAnswer: "Plasma" }
    ]
  },
  {
    id: 2,
    title: "Properties of Materials",
    description: "Structure and characteristics of materials.",
    color: "bg-blue-500",
    concepts: [
      "Materials can be classified by their physical properties like hardness, density, and conductivity.",
      "The particle model explains how solids, liquids, and gases behave.",
      "Metals are generally good conductors of heat and electricity.",
      "Polymers are long chains of repeating units."
    ],
    vocab: [
      { term: "Density", definition: "How much mass is in a certain volume." },
      { term: "Conductor", definition: "A material that allows heat or electricity to pass through easily." },
      { term: "Insulator", definition: "A material that does not allow heat or electricity to pass through easily." },
      { term: "Malleable", definition: "Able to be hammered or pressed into shape without breaking." }
    ],
    questions: [
      { id: "2-1", text: "When table salt “disappears” in water, the process is called:", options: ["Evaporation", "Dissolving", "Melting", "Condensation"], correctAnswer: "Dissolving" },
      { id: "2-2", text: "A solution is formed by dissolving a ___ into a ___.", options: ["solvent; solute", "solute; solvent", "gas; solid", "solid; gas"], correctAnswer: "solute; solvent" },
      { id: "2-3", text: "The word equation for dissolving is:", options: ["solute + solvent → solution", "solvent + solution → solute", "solute + solution → solvent", "solvent + solute → element"], correctAnswer: "solute + solvent → solution" },
      { id: "2-4", text: "A solute is:", options: ["The liquid used to dissolve something", "The substance that dissolves", "The container used for mixing", "The gas above a liquid"], correctAnswer: "The substance that dissolves" },
      { id: "2-5", text: "A solvent is usually:", options: ["A liquid", "A solid", "A metal", "A gas"], correctAnswer: "A liquid" },
      { id: "2-6", text: "Solutions are:", options: ["Pure substances", "Mixtures", "Elements only", "Compounds only"], correctAnswer: "Mixtures" },
      { id: "2-7", text: "Solutions are always:", options: ["Opaque", "Transparent", "Solid", "Magnetic"], correctAnswer: "Transparent" },
      { id: "2-8", text: "A solution can be colored because:", options: ["It must contain a metal", "It must contain a gas", "It can contain dissolved substances that absorb light", "All solutions are colorless"], correctAnswer: "It can contain dissolved substances that absorb light" },
      { id: "2-9", text: "A substance that can dissolve in water is described as:", options: ["Insoluble", "Soluble", "Saturated", "Immiscible"], correctAnswer: "Soluble" },
      { id: "2-10", text: "A substance that cannot dissolve in water is described as:", options: ["Soluble", "Concentrated", "Insoluble", "Dilute"], correctAnswer: "Insoluble" },
      { id: "2-11", text: "Which is most likely to dissolve in water?", options: ["Sand", "Table salt", "Cooking oil", "Wax"], correctAnswer: "Table salt" },
      { id: "2-12", text: "Oil and water usually form:", options: ["A clear solution", "Two layers (not a solution)", "A pure substance", "A saturated solution"], correctAnswer: "Two layers (not a solution)" },
      { id: "2-13", text: "Before dissolving, table salt is a:", options: ["Gas", "Liquid", "Solid", "Plasma"], correctAnswer: "Solid" },
      { id: "2-14", text: "In a solid, particles are:", options: ["Very close together", "Very far apart", "Not moving at all", "Turning into new particles"], correctAnswer: "Very close together" },
      { id: "2-15", text: "Water at room temperature is a:", options: ["Solid", "Liquid", "Gas", "Crystal"], correctAnswer: "Liquid" },
      { id: "2-16", text: "In a liquid, particles:", options: ["Are fixed in a regular pattern", "Can slide past each other", "Are extremely far apart", "Do not move"], correctAnswer: "Can slide past each other" },
      { id: "2-17", text: "The three states of matter are:", options: ["Hot, warm, cold", "Solid, liquid, gas", "Metal, non-metal, noble gas", "Acid, alkali, neutral"], correctAnswer: "Solid, liquid, gas" },
      { id: "2-18", text: "When salt is added to water, water particles collide with the salt and cause salt particles to:", options: ["Burn", "Break off", "Freeze", "Magnetise"], correctAnswer: "Break off" },
      { id: "2-19", text: "When salt is dissolved, it is no longer visible because salt particles become:", options: ["Larger", "Far apart in the water", "Heavier", "Radioactive"], correctAnswer: "Far apart in the water" },
      { id: "2-20", text: "A liquid that is a solution must be:", options: ["Opaque", "Transparent", "Always white", "Always thick"], correctAnswer: "Transparent" },
      { id: "2-21", text: "Milk is usually classified as:", options: ["A transparent solution", "An opaque liquid, so not a solution", "A pure substance", "A gas"], correctAnswer: "An opaque liquid, so not a solution" },
      { id: "2-22", text: "Gatorade is usually:", options: ["Transparent, so it can be a solution", "Opaque, so it must be a suspension", "Always a pure substance", "Not a liquid"], correctAnswer: "Transparent, so it can be a solution" },
      { id: "2-23", text: "Straight tea (red tea) is usually:", options: ["Opaque, so not a solution", "Transparent, so it can be a solution", "A solid", "A gas"], correctAnswer: "Transparent, so it can be a solution" },
      { id: "2-24", text: "Dissolving is different from melting because dissolving involves:", options: ["Two substances (solute and solvent)", "Only one substance", "Fire", "A chemical reaction"], correctAnswer: "Two substances (solute and solvent)" },
      { id: "2-25", text: "Melting involves:", options: ["Two substances", "Only one substance", "Filtration", "Evaporation"], correctAnswer: "Only one substance" },
      { id: "2-26", text: "Honey mixed into water is an example of:", options: ["Melting", "Dissolving", "Burning", "Freezing"], correctAnswer: "Dissolving" },
      { id: "2-27", text: "Wax melting on a candle is an example of:", options: ["Dissolving", "Melting", "Filtration", "Rusting"], correctAnswer: "Melting" },
      { id: "2-28", text: "Ice turning into water on a hot day is:", options: ["Dissolving", "Melting", "Condensing", "Reacting"], correctAnswer: "Melting" },
      { id: "2-29", text: "Dissolving is a physical change because:", options: ["New substances are formed", "No new substances are formed", "Heat is always produced", "Light is always produced"], correctAnswer: "No new substances are formed" },
      { id: "2-30", text: "Physical changes are often:", options: ["Irreversible", "Reversible", "Explosive", "Always dangerous"], correctAnswer: "Reversible" },
      { id: "2-31", text: "A chemical change usually forms:", options: ["No new substances", "New substances", "Only mixtures", "Only solutions"], correctAnswer: "New substances" },
      { id: "2-32", text: "Crushing a can is:", options: ["Chemical change", "Physical change", "Nuclear change", "Biological change"], correctAnswer: "Physical change" },
      { id: "2-33", text: "An iron nail turning brown (rusting) is:", options: ["Physical change", "Chemical change", "Freezing", "Melting"], correctAnswer: "Chemical change" },
      { id: "2-34", text: "Cooking an egg is:", options: ["Physical change", "Chemical change", "Dissolving", "Filtering"], correctAnswer: "Chemical change" },
      { id: "2-35", text: "When dissolving occurs, mass is conserved. This means the mass before and after dissolving:", options: ["Is always zero", "Remains the same", "Doubles", "Disappears"], correctAnswer: "Remains the same" },
      { id: "2-36", text: "A concentrated solution contains:", options: ["No solute", "Lots of solute dissolved", "Only solvent", "Only solid"], correctAnswer: "Lots of solute dissolved" },
      { id: "2-37", text: "A dilute solution contains:", options: ["Very little solute dissolved", "Lots of solute dissolved", "No solvent", "Only gas"], correctAnswer: "Very little solute dissolved" },
      { id: "2-38", text: "Pure water contains:", options: ["Many different solutes", "No solute added", "Two layers", "Only salt"], correctAnswer: "No solute added" },
      { id: "2-39", text: "In a food dye experiment where total volume is kept at 10 cm³, the most concentrated mixture is the one with:", options: ["The least dye", "The most dye", "The most water", "No water"], correctAnswer: "The most dye" },
      { id: "2-40", text: "In the set A (10 cm³ dye + 0 cm³ water) to E (2 cm³ dye + 8 cm³ water), the most concentrated is:", options: ["A", "B", "C", "D"], correctAnswer: "A" },
      { id: "2-41", text: "Salt solutions are hard to compare by sight because they are usually:", options: ["Colored", "Opaque", "Colorless", "Solid"], correctAnswer: "Colorless" },
      { id: "2-42", text: "Measuring volumes accurately is important because it ensures:", options: ["The total volume and concentration are correct and fair", "The solution becomes opaque", "The solute becomes insoluble", "The solvent freezes"], correctAnswer: "The total volume and concentration are correct and fair" },
      { id: "2-43", text: "Using a 100 cm³ measuring cylinder to measure small volumes (like 2–10 cm³) is usually:", options: ["More accurate", "Less accurate", "The same accuracy", "Impossible"], correctAnswer: "Less accurate" },
      { id: "2-44", text: "Insoluble substances can be separated from water by:", options: ["Filtration", "Evaporation", "Freezing", "Melting"], correctAnswer: "Filtration" },
      { id: "2-45", text: "A soluble substance dissolved in water can be separated by:", options: ["Filtration", "Evaporation", "Magnetism", "Sieving"], correctAnswer: "Evaporation" },
      { id: "2-46", text: "A saturated solution is one that:", options: ["Has no solute", "Cannot dissolve any more solute at that temperature", "Is always colored", "Is always opaque"], correctAnswer: "Cannot dissolve any more solute at that temperature" },
      { id: "2-47", text: "If extra solid is added after a solution becomes saturated, the extra solid can be removed by:", options: ["Filtration", "Condensation", "Burning", "Freezing"], correctAnswer: "Filtration" },
      { id: "2-48", text: "Solubility is defined as the mass of solute that dissolves in:", options: ["10 g of solvent", "100 g of solvent", "1 kg of solvent", "Any mass of solvent"], correctAnswer: "100 g of solvent" },
      { id: "2-49", text: "If copper(II) sulfate has a solubility of 32 g per 100 g water at 20°C, then in 200 g water at 20°C it can dissolve:", options: ["16 g", "32 g", "64 g", "320 g"], correctAnswer: "64 g" },
      { id: "2-50", text: "Water is sometimes called a “universal solvent” because it:", options: ["Dissolves every substance", "Dissolves many (but not all) solutes", "Never dissolves salt", "Only dissolves gases"], correctAnswer: "Dissolves many (but not all) solutes" }
    ]
  },
  {
    id: 3,
    title: "Forces and Energy",
    description: "Understanding motion, energy transfer, and balance.",
    color: "bg-orange-500",
    concepts: [
      "Speed is calculated as distance divided by time.",
      "Forces like friction, gravity, and tension affect how objects move.",
      "Moments are turning effects of forces, calculated as Force x Distance from pivot.",
      "Pressure is force per unit area (P = F/A).",
      "Diffusion is the movement of particles from high to low concentration."
    ],
    vocab: [
      { term: "Speed", definition: "How fast an object travels (Distance ÷ Time)." },
      { term: "Moment", definition: "The turning effect of a force around a pivot." },
      { term: "Pressure", definition: "The amount of force acting on a certain area." },
      { term: "Diffusion", definition: "The random movement of particles from high to low concentration." },
      { term: "Pascal", definition: "The standard unit of pressure (1 N/m²)." }
    ],
    questions: [
      { id: "3-1", text: "What is speed?", options: ["How heavy something is", "How fast something travels", "How loud something is", "How hot something is"], correctAnswer: "How fast something travels" },
      { id: "3-2", text: "The scientific formula for speed is:", options: ["Speed = Time ÷ Distance", "Speed = Distance × Time", "Speed = Distance ÷ Time", "Speed = Distance - Time"], correctAnswer: "Speed = Distance ÷ Time" },
      { id: "3-3", text: "The standard (SI) unit of speed is:", options: ["km/h", "m/s", "m", "s"], correctAnswer: "m/s" },
      { id: "3-4", text: "Weight is a force that pulls objects toward Earth due to:", options: ["friction", "electricity", "gravity", "magnetism"], correctAnswer: "gravity" },
      { id: "3-5", text: "A contact force acts when an object rests on a surface and it acts:", options: ["parallel to the surface", "perpendicular to the surface", "toward the centre of Earth", "in the direction of motion"], correctAnswer: "perpendicular to the surface" },
      { id: "3-6", text: "Friction is a force that:", options: ["increases motion", "opposes motion", "pulls objects upward", "makes objects heavier"], correctAnswer: "opposes motion" },
      { id: "3-7", text: "Which statement about friction is correct (based on the notes)?", options: ["Only stationary objects experience friction", "Only moving objects experience friction", "Only objects in water experience friction", "Only objects in air experience friction"], correctAnswer: "Only moving objects experience friction" },
      { id: "3-8", text: "Friction arises because the boundary between two objects is:", options: ["perfectly smooth", "rough", "made of metal", "very hot"], correctAnswer: "rough" },
      { id: "3-9", text: "Tension is a force that:", options: ["pushes two objects apart", "pulls on two objects connected by a rope/thread/string", "only exists underwater", "only acts on magnets"], correctAnswer: "pulls on two objects connected by a rope/thread/string" },
      { id: "3-10", text: "In a free body diagram, forces are drawn as:", options: ["circles", "arrows", "triangles", "graphs"], correctAnswer: "arrows" },
      { id: "3-11", text: "In a free body diagram, the length of the arrow shows the:", options: ["direction of the force only", "size (magnitude) of the force", "colour of the force", "speed of the object"], correctAnswer: "size (magnitude) of the force" },
      { id: "3-12", text: "Forces are balanced when they are:", options: ["in the same direction and equal in size", "in opposite directions and equal in size", "in opposite directions and different in size", "in the same direction and different in size"], correctAnswer: "in opposite directions and equal in size" },
      { id: "3-13", text: "If forces on an object are balanced, the object:", options: ["must speed up", "must slow down", "has no change in motion", "must change direction"], correctAnswer: "has no change in motion" },
      { id: "3-14", text: "When an unbalanced force acts on an object, one possible change in motion is that:", options: ["the direction may change", "the object must become heavier", "time stops", "distance becomes zero"], correctAnswer: "the direction may change" },
      { id: "3-15", text: "If an object travels 20 m in 4 s, its speed is:", options: ["0.2 m/s", "5 m/s", "16 m/s", "80 m/s"], correctAnswer: "5 m/s" },
      { id: "3-16", text: "A snail travels 24 m in 24 h. Its speed in m/h is:", options: ["0.5 m/h", "1 m/h", "24 m/h", "48 m/h"], correctAnswer: "1 m/h" },
      { id: "3-17", text: "24 m in 24 h is equal to 1 m/h. In cm/s, this is closest to:", options: ["2.8 cm/s", "0.028 cm/s", "28 cm/s", "0.28 cm/s"], correctAnswer: "0.028 cm/s" },
      { id: "3-18", text: "The Concorde travels 5000 km in 2 h. Its speed in km/h is:", options: ["250 km/h", "500 km/h", "2500 km/h", "10,000 km/h"], correctAnswer: "2500 km/h" },
      { id: "3-19", text: "2500 km/h is approximately how many m/s?", options: ["6.94 m/s", "69.4 m/s", "694 m/s", "6940 m/s"], correctAnswer: "694 m/s" },
      { id: "3-20", text: "Which triangle relationship is correct?", options: ["Distance = Speed × Time", "Speed = Distance × Time", "Time = Distance × Speed", "Distance = Speed ÷ Time"], correctAnswer: "Distance = Speed × Time" },
      { id: "3-21", text: "If speed is 8 m/s and time is 5 s, distance is:", options: ["1.6 m", "13 m", "40 m", "400 m"], correctAnswer: "40 m" },
      { id: "3-22", text: "If distance is 120 m and speed is 6 m/s, time is:", options: ["20 s", "60 s", "720 s", "0.05 s"], correctAnswer: "20 s" },
      { id: "3-23", text: "Which of the following is a valid unit of speed?", options: ["m", "s", "m/s", "kg"], correctAnswer: "m/s" },
      { id: "3-24", text: "Sound travels about 300 m/s and light travels about 3 x 10^8 m/s. Light is about how many times faster than sound?", options: ["100 times", "1000 times", "1,000,000 times", "3,000,000 times"], correctAnswer: "1,000,000 times" },
      { id: "3-25", text: "You see lightning and hear thunder at almost the same time. This suggests the lightning is:", options: ["very far away", "very near", "underground", "in the ocean"], correctAnswer: "very near" },
      { id: "3-26", text: "You see lightning and hear thunder much later. This suggests the lightning is:", options: ["very far away", "very near", "inside your house", "moving at 300,000,000 m/s"], correctAnswer: "very far away" },
      { id: "3-27", text: "Student A runs 100 m in 15 s and Student B runs 200 m in 28 s. Who is faster?", options: ["Student A", "Student B", "Same speed", "Cannot tell without their mass"], correctAnswer: "Student B" },
      { id: "3-28", text: "Which comparison correctly decides who is faster (A vs B)?", options: ["Compare their distances only", "Compare their times only", "Compare their speeds (distance ÷ time)", "Compare their shoe size"], correctAnswer: "Compare their speeds (distance ÷ time)" },
      { id: "3-29", text: "We draw graphs to show how two terms/variables are related.", options: ["countries", "terms/variables", "colours", "magnets"], correctAnswer: "terms/variables" },
      { id: "3-30", text: "A distance–time graph can be used to track the motion of an object.", options: ["mass", "motion", "temperature", "electricity"], correctAnswer: "motion" },
      { id: "3-31", text: "On a distance–time graph, the y-axis is usually:", options: ["time", "distance", "speed", "force"], correctAnswer: "distance" },
      { id: "3-32", text: "On a distance–time graph, the x-axis is usually:", options: ["distance", "speed", "time", "weight"], correctAnswer: "time" },
      { id: "3-33", text: "The origin on a distance–time graph represents the:", options: ["final point", "pivot", "point of reference (starting point)", "force of friction"], correctAnswer: "point of reference (starting point)" },
      { id: "3-34", text: "On a distance–time graph, a horizontal line means the object is:", options: ["speeding up", "moving at constant speed", "stationary", "moving backwards at constant speed"], correctAnswer: "stationary" },
      { id: "3-35", text: "On a distance–time graph, a straight tilted (sloping) line means the object is:", options: ["stationary", "moving at constant speed", "changing direction", "changing mass"], correctAnswer: "moving at constant speed" },
      { id: "3-36", text: "The steepness of a line is called the:", options: ["pivot", "slope/gradient", "friction", "tension"], correctAnswer: "slope/gradient" },
      { id: "3-37", text: "The steeper the line, the bigger the slope and the faster the object moves.", options: ["smaller, slower", "bigger, faster", "bigger, slower", "smaller, faster"], correctAnswer: "bigger, faster" },
      { id: "3-38", text: "On a distance–time graph, the speed of the object can be found by calculating the:", options: ["area under the line", "slope (distance ÷ time)", "colour of the axes", "length of the x-axis only"], correctAnswer: "slope (distance ÷ time)" },
      { id: "3-39", text: "If an object travels 100 m in 2 min at constant speed, its speed is:", options: ["2 m/min", "50 m/min", "200 m/min", "0.02 m/min"], correctAnswer: "50 m/min" },
      { id: "3-40", text: "If the line slopes downward (distance decreases as time increases), the object is:", options: ["moving back toward the point of reference", "stationary", "moving faster than light", "changing into a different material"], correctAnswer: "moving back toward the point of reference" },
      { id: "3-41", text: "Any object that turns when a force is applied is called a:", options: ["resistor", "lever", "capacitor", "thermometer"], correctAnswer: "lever" },
      { id: "3-42", text: "The point around which a lever turns is called the:", options: ["slope", "pivot", "distance", "speed"], correctAnswer: "pivot" },
      { id: "3-43", text: "The turning effect produced when a force is applied to a lever is called the:", options: ["weight", "moment", "friction", "energy unit"], correctAnswer: "moment" },
      { id: "3-44", text: "The formula for moment is:", options: ["Moment = Force ÷ Distance", "Moment = Force + Distance", "Moment = Force × Distance", "Moment = Distance ÷ Force"], correctAnswer: "Moment = Force × Distance" },
      { id: "3-45", text: "The moment of a force depends on:", options: ["force size only", "distance from pivot only", "both force size and distance from pivot", "colour of the lever"], correctAnswer: "both force size and distance from pivot" },
      { id: "3-46", text: "To increase the moment, you can:", options: ["decrease the force and decrease the distance", "increase the force or increase the distance from the pivot", "move the pivot closer to the force and reduce force", "make the lever shorter every time"], correctAnswer: "increase the force or increase the distance from the pivot" },
      { id: "3-47", text: "If force is measured in newtons (N) and distance in meters (m), the unit of moment is:", options: ["N/m", "Nm", "m/N", "N²m"], correctAnswer: "Nm" },
      { id: "3-48", text: "A 35 N force is applied 0.8 m from the pivot. The moment is:", options: ["4.375 Nm", "28 Nm", "35.8 Nm", "280 Nm"], correctAnswer: "28 Nm" },
      { id: "3-49", text: "A 20 N force is applied 0.25 m from the pivot. The moment is:", options: ["0.8 Nm", "5 Nm", "20.25 Nm", "80 Nm"], correctAnswer: "5 Nm" },
      { id: "3-50", text: "A seesaw is balanced when the clockwise moment is:", options: ["greater than the anticlockwise moment", "less than the anticlockwise moment", "equal to the anticlockwise moment", "zero regardless of the other side"], correctAnswer: "equal to the anticlockwise moment" },
      { id: "3-51", text: "Pressure is defined as:", options: ["force × area", "force ÷ area", "area ÷ force", "distance ÷ time"], correctAnswer: "force ÷ area" },
      { id: "3-52", text: "The formula for pressure is:", options: ["P = F × A", "P = F ÷ A", "P = A ÷ F", "P = F ÷ t"], correctAnswer: "P = F ÷ A" },
      { id: "3-53", text: "To cut more easily with a knife, you can:", options: ["use a smaller force and a blunter knife", "use a smaller force and a sharper knife", "use a greater force or use a sharper object", "use a greater force and use a blunter object"], correctAnswer: "use a greater force or use a sharper object" },
      { id: "3-54", text: "For the same force, a smaller contact area gives:", options: ["smaller pressure", "larger pressure", "zero pressure", "unchanged pressure"], correctAnswer: "larger pressure" },
      { id: "3-55", text: "We can increase pressure by:", options: ["decreasing force", "increasing area", "increasing force", "decreasing both force and area"], correctAnswer: "increasing force" },
      { id: "3-56", text: "We can increase pressure by:", options: ["increasing surface area", "decreasing surface area", "decreasing force only", "increasing time"], correctAnswer: "decreasing surface area" },
      { id: "3-57", text: "If force is in newtons (N) and area is in square meters (m²), pressure is in:", options: ["N·m", "N/m²", "m²/N", "N/m"], correctAnswer: "N/m²" },
      { id: "3-58", text: "1 N/m² is also known as:", options: ["1 watt", "1 joule", "1 pascal (Pa)", "1 volt"], correctAnswer: "1 pascal (Pa)" },
      { id: "3-59", text: "A force of 600 N acts on an area of 30 m². The pressure is:", options: ["20 N/m²", "200 N/m²", "18 N/m²", "630 N/m²"], correctAnswer: "20 N/m²" },
      { id: "3-60", text: "An object exerts a pressure of 15 N/m² over an area of 3 m². The force is:", options: ["5 N", "12 N", "45 N", "60 N"], correctAnswer: "45 N" },
      { id: "3-61", text: "A box exerts 240 N on a table and the pressure is 80 N/m². The contact area is:", options: ["1 m²", "2 m²", "3 m²", "320 m²"], correctAnswer: "3 m²" },
      { id: "3-62", text: "A force of 72 N acts on an area of 6 m². The pressure is:", options: ["12 N/m²", "66 N/m²", "432 N/m²", "0.083 N/m²"], correctAnswer: "12 N/m²" },
      { id: "3-63", text: "An object exerts 800 N on the floor. The pressure is 160 N/m². The area is:", options: ["0.2 m²", "5 m²", "640 m²", "960 m²"], correctAnswer: "5 m²" },
      { id: "3-64", text: "An object has contact area 1.8 m² and exerts pressure 60 N/m². The force is:", options: ["33.3 N", "61.8 N", "108 N", "180 N"], correctAnswer: "108 N" },
      { id: "3-65", text: "A crate exerts 1200 N on an area of 16 m². The pressure is:", options: ["75 N/m²", "19200 N/m²", "1200 N/m²", "0.013 N/m²"], correctAnswer: "75 N/m²" },
      { id: "3-66", text: "Camels have broad feet mainly to:", options: ["increase pressure so they sink into sand", "decrease pressure so they don’t sink into sand", "increase friction so they slide", "decrease mass"], correctAnswer: "decrease pressure so they don’t sink into sand" },
      { id: "3-67", text: "Push pins have pointy ends mainly to:", options: ["increase the contact area so pressure is lower", "decrease the contact area so pressure is higher", "decrease force so pressure is lower", "increase volume so concentration is higher"], correctAnswer: "decrease the contact area so pressure is higher" },
      { id: "3-68", text: "Sharp scissors cut more easily mainly because they:", options: ["have a smaller contact area at the edge, producing higher pressure", "have a larger contact area at the edge, producing higher pressure", "reduce the force to zero", "reduce friction in air"], correctAnswer: "have a smaller contact area at the edge, producing higher pressure" },
      { id: "3-69", text: "Water pressure changes with:", options: ["colour", "depth", "smell", "mass of the container only"], correctAnswer: "depth" },
      { id: "3-70", text: "The greater the depth in water, the greater the:", options: ["temperature", "pressure", "concentration", "altitude"], correctAnswer: "pressure" },
      { id: "3-71", text: "At shallower depths, there is less water pushing, so pressure is lower.", options: ["more, higher", "less, lower", "less, higher", "more, lower"], correctAnswer: "less, lower" },
      { id: "3-72", text: "At greater depths, there is more water pushing, so pressure is higher.", options: ["more, higher", "less, lower", "less, higher", "more, lower"], correctAnswer: "more, higher" },
      { id: "3-73", text: "When you blow more air into a balloon, it expands because:", options: ["the air particles stop moving", "collisions with the balloon wall happen more often, increasing pressure", "gravity decreases", "the air turns into liquid"], correctAnswer: "collisions with the balloon wall happen more often, increasing pressure" },
      { id: "3-74", text: "Altitude means the:", options: ["distance below sea level only", "height above sea level", "distance from the Sun", "area of a surface"], correctAnswer: "height above sea level" },
      { id: "3-75", text: "At higher altitude, the column of air above you is:", options: ["taller, so air pressure is higher", "shorter, so air pressure is lower", "shorter, so air pressure is higher", "taller, so air pressure is lower"], correctAnswer: "shorter, so air pressure is lower" },
      { id: "3-76", text: "At lower altitude, the column of air above you is:", options: ["taller, so air pressure is higher", "shorter, so air pressure is lower", "shorter, so air pressure is higher", "zero, so air pressure is zero"], correctAnswer: "taller, so air pressure is higher" },
      { id: "3-77", text: "Atmospheric pressure is about:", options: ["100 N/m²", "1000 N/m²", "100,000 N/m²", "50,000 N/m²"], correctAnswer: "100,000 N/m²" },
      { id: "3-78", text: "A vacuum is a state where:", options: ["there are no particles (no air)", "there are more particles", "temperature is always 0°C", "pressure is always 100,000 N/m²"], correctAnswer: "there are no particles (no air)" },
      { id: "3-79", text: "The pressure in a vacuum is zero mainly because:", options: ["particles move faster", "there are no particles to collide with surfaces", "gravity is stronger", "the area is very large"], correctAnswer: "there are no particles to collide with surfaces" },
      { id: "3-80", text: "A metal container can collapse when a vacuum forms inside because:", options: ["there is higher pressure outside than inside", "there is higher pressure inside than outside", "the container becomes heavier", "pressure becomes negative"], correctAnswer: "there is higher pressure outside than inside" },
      { id: "3-81", text: "When temperature increases, gas pressure generally:", options: ["decreases", "stays the same", "increases", "becomes zero"], correctAnswer: "increases" },
      { id: "3-82", text: "When temperature increases, gas particles:", options: ["move slower", "move faster", "stop moving", "become solids"], correctAnswer: "move faster" },
      { id: "3-83", text: "At higher temperature, particles collide with the container wall:", options: ["less frequently, so pressure decreases", "more frequently, so pressure increases", "less frequently, so pressure increases", "more frequently, so pressure decreases"], correctAnswer: "more frequently, so pressure increases" },
      { id: "3-84", text: "A pressure cooker works because the cooker is closed so steam cannot escape and the pressure inside increases.", options: ["open, decreases", "closed, increases", "cold, decreases", "soft, increases"], correctAnswer: "closed, increases" },
      { id: "3-85", text: "The normal boiling point of water is:", options: ["0°C", "50°C", "100°C", "120°C"], correctAnswer: "100°C" },
      { id: "3-86", text: "In a pressure cooker, when pressure increases, the boiling point of water will:", options: ["decrease", "increase", "become 0°C", "become negative"], correctAnswer: "increase" },
      { id: "3-87", text: "In Brownian motion, air particles move in a random manner.", options: ["straight", "random", "circular", "stationary"], correctAnswer: "random" },
      { id: "3-88", text: "Air particles travel in a zig-zag/random path mainly because they:", options: ["bump into other particles many times, changing direction", "are pulled by magnets", "are heavier than liquids", "have no energy"], correctAnswer: "bump into other particles many times, changing direction" },
      { id: "3-89", text: "Diffusion is the overall movement of particles from:", options: ["low to high concentration", "high to low concentration", "high to high concentration", "solid to solid only"], correctAnswer: "high to low concentration" },
      { id: "3-90", text: "Concentration means the number of particles in a particular volume.", options: ["forces, time", "particles, volume", "metres, seconds", "levers, pivots"], correctAnswer: "particles, volume" },
      { id: "3-91", text: "Concentration can be calculated by:", options: ["Concentration = Volume ÷ Number of particles", "Concentration = Number of particles ÷ Volume", "Concentration = Force ÷ Area", "Concentration = Distance ÷ Time"], correctAnswer: "Concentration = Number of particles ÷ Volume" },
      { id: "3-92", text: "Concentration is higher when there are:", options: ["fewer solutes", "more solutes", "more volume", "lower temperature only"], correctAnswer: "more solutes" },
      { id: "3-93", text: "Concentration is higher when the volume is:", options: ["larger", "smaller", "infinite", "unrelated"], correctAnswer: "smaller" },
      { id: "3-94", text: "Diffusion can happen in:", options: ["solids only", "liquids and gases", "liquids only", "gases only"], correctAnswer: "liquids and gases" },
      { id: "3-95", text: "Diffusion cannot occur in solids mainly because particles in solids:", options: ["do not exist", "can only vibrate and cannot move freely past each other", "move faster than in gases", "have no mass"], correctAnswer: "can only vibrate and cannot move freely past each other" },
      { id: "3-96", text: "The speed of diffusion increases when the temperature is:", options: ["lower", "higher", "zero", "unrelated"], correctAnswer: "higher" },
      { id: "3-97", text: "The difference in concentration is also called the:", options: ["pivot", "concentration gradient", "contact force", "slope"], correctAnswer: "concentration gradient" },
      { id: "3-98", text: "Diffusion is faster when the concentration gradient is:", options: ["smaller", "greater (bigger)", "zero", "negative only"], correctAnswer: "greater (bigger)" },
      { id: "3-99", text: "Which of the following will result in diffusion?", options: ["Adding milk to coffee", "Adding sand to water", "Adding salty water to pure water", "Allowing gas from a cylinder to escape into air"], correctAnswer: "Allowing gas from a cylinder to escape into air" },
      { id: "3-100", text: "When the orange colour in a drink has stopped spreading, the particles have:", options: ["stopped moving completely", "stopped diffusing because concentrations are even, but particles still move", "frozen into a solid", "become lighter"], correctAnswer: "stopped diffusing because concentrations are even, but particles still move" }
    ]
  },
  {
    id: 4,
    title: "Ecosystems",
    description: "Interactions of living things in their environments.",
    color: "bg-lime-500",
    concepts: [
      "An ecosystem is the complex interaction between living and non-living things.",
      "Producers (plants) make food via photosynthesis: Carbon Dioxide + Water -> Glucose + Oxygen.",
      "Consumers (animals) must eat other organisms for energy.",
      "Food chains and webs show feeding relationships and energy flow.",
      "Adaptations help organisms survive in specific habitats like deserts or mangroves.",
      "Invasive species can harm natural ecosystems.",
      "Biomagnification is the increase in toxin concentration along a food chain."
    ],
    vocab: [
      { term: "Ecology", definition: "The study of ecosystems and the interaction of organisms." },
      { term: "Nocturnal", definition: "Animals that are active at night." },
      { term: "Diurnal", definition: "Animals that are active during the day." },
      { term: "Chlorophyll", definition: "The green pigment in plants used for photosynthesis." },
      { term: "Habitat", definition: "The natural home or environment of an organism." },
      { term: "Apex Predator", definition: "The highest predator at the top of a food chain." },
      { term: "Invasive Species", definition: "Species from other places that harm a natural ecosystem." },
      { term: "Biomagnification", definition: "The buildup of toxins (like DDT) in a food chain." }
    ],
    questions: [
      { id: "4-1", text: "The Sonoran Desert is considered a hostile environment mainly because it is:", options: ["always rainy and cold", "very dry with extreme temperatures", "full of deep oceans", "covered with thick ice sheets"], correctAnswer: "very dry with extreme temperatures" },
      { id: "4-2", text: "An ecosystem is the ____ between living and non-living things in an environment.", options: ["competition", "complex interaction", "speed", "pressure"], correctAnswer: "complex interaction" },
      { id: "4-3", text: "Living things in an ecosystem are also called living:", options: ["elements", "organisms", "rocks", "gases"], correctAnswer: "organisms" },
      { id: "4-4", text: "Living things may be:", options: ["plants or animals", "soil or light", "water or air", "temperature or sunlight"], correctAnswer: "plants or animals" },
      { id: "4-5", text: "Non-living things may be anything in the:", options: ["stomach", "environment", "nest only", "food chain only"], correctAnswer: "environment" },
      { id: "4-6", text: "In Biology, the study of ecosystems is called:", options: ["geology", "ecology", "chemistry", "astronomy"], correctAnswer: "ecology" },
      { id: "4-7", text: "Scientists who study ecosystems are called:", options: ["ecologists", "engineers", "poets", "athletes"], correctAnswer: "ecologists" },
      { id: "4-8", text: "During hot days, many desert animals rest in the ____ because it is cooler.", options: ["clouds", "caves", "rivers", "trees"], correctAnswer: "caves" },
      { id: "4-9", text: "Animals that are active at night are described as:", options: ["diurnal", "nocturnal", "aquatic", "artificial"], correctAnswer: "nocturnal" },
      { id: "4-10", text: "Predators are living things that:", options: ["make their own food", "eat other living things", "only eat sunlight", "never hunt"], correctAnswer: "eat other living things" },
      { id: "4-11", text: "Plants are producers because they:", options: ["eat other animals", "make food available in the ecosystem", "cannot photosynthesize", "only live in water"], correctAnswer: "make food available in the ecosystem" },
      { id: "4-12", text: "The ultimate source of energy for most ecosystems on Earth is the:", options: ["Moon", "Sun", "soil", "ocean waves"], correctAnswer: "Sun" },
      { id: "4-13", text: "Photosynthesis uses sunlight energy to make glucose and oxygen from:", options: ["nitrogen and water", "carbon dioxide and water", "oxygen and glucose", "salt and water"], correctAnswer: "carbon dioxide and water" },
      { id: "4-14", text: "The word equation for photosynthesis is:", options: ["glucose + oxygen → carbon dioxide + water", "carbon dioxide + water → glucose + oxygen", "oxygen + water → glucose + carbon dioxide", "carbon dioxide + oxygen → glucose + water"], correctAnswer: "carbon dioxide + water → glucose + oxygen" },
      { id: "4-15", text: "The pigment used in photosynthesis is called:", options: ["melanin", "chlorophyll", "hemoglobin", "keratin"], correctAnswer: "chlorophyll" },
      { id: "4-16", text: "Plants usually appear green because they contain:", options: ["chlorophyll", "oxygen gas", "carbon dioxide", "pesticides"], correctAnswer: "chlorophyll" },
      { id: "4-17", text: "Animals are consumers because they:", options: ["can make their own food", "cannot make their own food and must feed on other organisms", "are always producers", "only absorb sunlight"], correctAnswer: "cannot make their own food and must feed on other organisms" },
      { id: "4-18", text: "An animal that feeds on both plants and animals is called an:", options: ["herbivore", "carnivore", "omnivore", "decomposer"], correctAnswer: "omnivore" },
      { id: "4-19", text: "A habitat is where an organism:", options: ["is made in a factory", "naturally lives in an ecosystem", "always migrates to in winter", "is kept only by humans"], correctAnswer: "naturally lives in an ecosystem" },
      { id: "4-20", text: "Daytime light allows plants to:", options: ["respire to make oxygen", "photosynthesize to make food", "increase pressure", "diffuse faster"], correctAnswer: "photosynthesize to make food" },
      { id: "4-21", text: "During daytime, desert temperature is often very:", options: ["low", "high", "constant at 0°C", "impossible to measure"], correctAnswer: "high" },
      { id: "4-22", text: "Organisms active during the day are:", options: ["diurnal", "nocturnal", "extinct", "invasive"], correctAnswer: "diurnal" },
      { id: "4-23", text: "Many organisms avoid the desert heat by being active only at night. This helps avoid:", options: ["overheating", "photosynthesis", "gravity", "diffusion"], correctAnswer: "overheating" },
      { id: "4-24", text: "Adaptations are body features or behaviours that help organisms:", options: ["evaporate more", "survive better in the environment", "become producers", "stop breathing"], correctAnswer: "survive better in the environment" },
      { id: "4-25", text: "All organisms need ____ to survive.", options: ["sand", "water", "pesticides", "ice sheets"], correctAnswer: "water" },
      { id: "4-26", text: "Organisms may lose water when they:", options: ["sweat or urinate", "photosynthesize", "hunt at night", "freeze"], correctAnswer: "sweat or urinate" },
      { id: "4-27", text: "Desert organisms may have adaptations to lose ____ water.", options: ["more", "less", "infinite", "exactly the same"], correctAnswer: "less" },
      { id: "4-28", text: "Air provides ____ for plants to carry out photosynthesis and ____ for animals to carry out respiration.", options: ["oxygen, carbon dioxide", "carbon dioxide, oxygen", "nitrogen, hydrogen", "glucose, water"], correctAnswer: "carbon dioxide, oxygen" },
      { id: "4-29", text: "Gas exchange in ecosystems is helped by:", options: ["plants making oxygen and animals using oxygen", "animals making oxygen and plants using oxygen", "soil producing oxygen", "sunlight producing carbon dioxide"], correctAnswer: "plants making oxygen and animals using oxygen" },
      { id: "4-30", text: "A food chain always begins with a:", options: ["consumer", "producer", "apex predator", "parasite"], correctAnswer: "producer" },
      { id: "4-31", text: "Food chains show the ____ relationship between living things.", options: ["sleeping", "feeding", "colour", "speed"], correctAnswer: "feeding" },
      { id: "4-32", text: "In the arrow A → B in a food chain, it means:", options: ["A eats B", "B eats A", "A and B are the same species", "A is a non-living thing"], correctAnswer: "B eats A" },
      { id: "4-33", text: "In a food chain, an animal that is eaten is called the:", options: ["predator", "prey", "producer", "ecologist"], correctAnswer: "prey" },
      { id: "4-34", text: "The animal that eats another animal is called the:", options: ["prey", "predator", "herbicide", "chlorophyll"], correctAnswer: "predator" },
      { id: "4-35", text: "Food chains are ____ so they are often drawn like a line.", options: ["linear", "circular", "random", "frozen"], correctAnswer: "linear" },
      { id: "4-36", text: "A food web is more useful than a food chain because feeding relationships are more:", options: ["simple", "complex", "slow", "invisible"], correctAnswer: "complex" },
      { id: "4-37", text: "The highest predator at the top of a food chain is called the:", options: ["primary consumer", "apex predator", "producer", "prey"], correctAnswer: "apex predator" },
      { id: "4-38", text: "Which is a correct food chain (from producer upwards)?", options: ["hawk → snake → grass → rabbit", "grass → grasshopper → lizard → hawk", "rabbit → grass → hawk → snake", "lizard → grasshopper → grass → hawk"], correctAnswer: "grass → grasshopper → lizard → hawk" },
      { id: "4-39", text: "In the example: rabbit, grasshopper and mouse eat grass. This means they are:", options: ["producers", "consumers (primary consumers)", "decomposers", "non-living factors"], correctAnswer: "consumers (primary consumers)" },
      { id: "4-40", text: "If a hawk eats rabbit, mouse and snake, the hawk is most likely an:", options: ["producer", "herbivore", "apex predator", "algae"], correctAnswer: "apex predator" },
      { id: "4-41", text: "Mangroves are special trees that can grow in:", options: ["pure ice", "sea water", "molten rock", "vacuum"], correctAnswer: "sea water" },
      { id: "4-42", text: "In the Arctic Ocean, sea water can freeze to form an:", options: ["oasis", "ice sheet", "desert dune", "rice paddy"], correctAnswer: "ice sheet" },
      { id: "4-43", text: "An artificial ecosystem is:", options: ["always underwater", "man-made and not natural", "found only in deserts", "made only by bacteria"], correctAnswer: "man-made and not natural" },
      { id: "4-44", text: "A rice paddy is an example of a(n):", options: ["natural ecosystem", "artificial ecosystem", "desert ecosystem", "arctic ecosystem"], correctAnswer: "artificial ecosystem" },
      { id: "4-45", text: "A pitfall trap is used to trap small:", options: ["flying animals", "crawling animals (e.g., beetles)", "fish", "whales"], correctAnswer: "crawling animals (e.g., beetles)" },
      { id: "4-46", text: "A sweep net is used to trap small:", options: ["crawling animals only", "flying animals (e.g., insects)", "large mammals", "plants"], correctAnswer: "flying animals (e.g., insects)" },
      { id: "4-47", text: "In a “stick and sheet” method, you use a stick to hit branches and a sheet to:", options: ["heat the insects", "collect the insects that fall", "increase pressure", "measure speed"], correctAnswer: "collect the insects that fall" },
      { id: "4-48", text: "Species brought from other places that harm a natural ecosystem are called:", options: ["native species", "invasive species", "producers", "pigments"], correctAnswer: "invasive species" },
      { id: "4-49", text: "DDT is an example of a(n):", options: ["herbicide", "insecticide", "fertilizer", "oxygen"], correctAnswer: "insecticide" },
      { id: "4-50", text: "DDT concentration can increase along a food chain to dangerously high levels. This increase is called:", options: ["diffusion", "biomagnification", "photosynthesis", "evaporation"], correctAnswer: "biomagnification" }
    ]
  },
  {
    id: 5,
    title: "Materials and Cycles",
    description: "Geological cycles and Earth's materials.",
    color: "bg-amber-700",
    concepts: [
      "The rock cycle describes how rocks change over time.",
      "Igneous rocks form from cooled magma or lava.",
      "Sedimentary rocks form from layers of sediment pressed together.",
      "Metamorphic rocks form from heat and pressure."
    ],
    vocab: [
      { term: "Magma", definition: "Molten rock beneath the Earth's surface." },
      { term: "Sediment", definition: "Small pieces of rock or organic material." },
      { term: "Weathering", definition: "The breaking down of rocks by wind, water, or ice." },
      { term: "Erosion", definition: "The movement of weathered rock from one place to another." }
    ],
    questions: [
      { id: "5-1", text: "Which rock type forms from cooled lava?", options: ["Sedimentary", "Metamorphic", "Igneous", "Fossil"], correctAnswer: "Igneous" },
      { id: "5-2", text: "In which rock type are fossils usually found?", options: ["Igneous", "Sedimentary", "Metamorphic", "Basalt"], correctAnswer: "Sedimentary" },
      { id: "5-3", text: "What causes metamorphic rocks to form?", options: ["Cooling", "Melting", "Heat and Pressure", "Evaporation"], correctAnswer: "Heat and Pressure" },
      { id: "5-4", text: "The process of breaking down rocks is...", options: ["Erosion", "Weathering", "Deposition", "Crystallization"], correctAnswer: "Weathering" },
      { id: "5-5", text: "Molten rock on the Earth's surface is called...", options: ["Magma", "Lava", "Sediment", "Crystal"], correctAnswer: "Lava" }
    ]
  },
  {
    id: 6,
    title: "Light",
    description: "Behavior, reflection, and refraction of light.",
    color: "bg-yellow-400",
    concepts: [
      "Light travels in straight lines.",
      "Reflection is when light bounces off a surface.",
      "Refraction is the bending of light as it enters a different medium.",
      "White light is made up of a spectrum of colors (ROYGBIV)."
    ],
    vocab: [
      { term: "Reflection", definition: "The bouncing back of light from a surface." },
      { term: "Refraction", definition: "The bending of light as it passes from one material to another." },
      { term: "Opaque", definition: "A material that does not let any light pass through." },
      { term: "Transparent", definition: "A material that lets light pass through clearly." }
    ],
    questions: [
      { id: "6-1", text: "How does light travel?", options: ["In circles", "In straight lines", "In zig-zags", "It doesn't travel"], correctAnswer: "In straight lines" },
      { id: "6-2", text: "The angle of incidence is equal to the angle of...", options: ["Refraction", "Reflection", "Absorption", "Transmission"], correctAnswer: "Reflection" },
      { id: "6-3", text: "What happens to light when it enters glass from air?", options: ["It speeds up", "It stops", "It slows down and bends", "It turns blue"], correctAnswer: "It slows down and bends" },
      { id: "6-4", text: "Which color of light is refracted the most?", options: ["Red", "Green", "Yellow", "Violet"], correctAnswer: "Violet" },
      { id: "6-5", text: "A lens that bulges outwards is called...", options: ["Concave", "Convex", "Flat", "Opaque"], correctAnswer: "Convex" }
    ]
  },
  {
    id: 7,
    title: "Diet and Growth",
    description: "Nutrition, human anatomy, and development.",
    color: "bg-pink-500",
    concepts: [
      "A balanced diet includes carbohydrates, proteins, fats, vitamins, and minerals.",
      "Proteins are needed for growth and repair.",
      "Carbohydrates provide energy.",
      "Malnutrition happens when you don't have the right balance of nutrients."
    ],
    vocab: [
      { term: "Nutrient", definition: "A substance that provides nourishment essential for life." },
      { term: "Digestion", definition: "The process of breaking down food into smaller molecules." },
      { term: "Enzyme", definition: "A biological catalyst that speeds up digestion." },
      { term: "Villi", definition: "Small finger-like projections in the small intestine that absorb nutrients." }
    ],
    questions: [
      { id: "7-1", text: "Which nutrient is needed for growth and repair?", options: ["Fats", "Carbohydrates", "Proteins", "Fiber"], correctAnswer: "Proteins" },
      { id: "7-2", text: "Where does most nutrient absorption happen?", options: ["Stomach", "Large Intestine", "Small Intestine", "Mouth"], correctAnswer: "Small Intestine" },
      { id: "7-3", text: "Scurvy is caused by a lack of Vitamin...", options: ["A", "B", "C", "D"], correctAnswer: "C" },
      { id: "7-4", text: "What is the main function of carbohydrates?", options: ["Repair", "Energy", "Insulation", "Strong bones"], correctAnswer: "Energy" },
      { id: "7-5", text: "Which organ produces bile?", options: ["Pancreas", "Stomach", "Liver", "Gallbladder"], correctAnswer: "Liver" }
    ]
  },
  {
    id: 8,
    title: "Chemical Reactions",
    description: "Fundamentals of chemical changes.",
    color: "bg-purple-600",
    concepts: [
      "Chemical reactions involve the rearrangement of atoms.",
      "Reactants are the starting substances; products are the new substances formed.",
      "Exothermic reactions release heat; endothermic reactions absorb heat.",
      "Acids have a pH less than 7; bases have a pH greater than 7."
    ],
    vocab: [
      { term: "Reactant", definition: "A substance that takes part in and undergoes change during a reaction." },
      { term: "Product", definition: "A substance that is formed as the result of a chemical reaction." },
      { term: "Catalyst", definition: "A substance that speeds up a reaction without being used up." },
      { term: "Neutralization", definition: "A reaction between an acid and a base to produce salt and water." }
    ],
    questions: [
      { id: "8-1", text: "What is the pH of a neutral substance?", options: ["1", "14", "7", "0"], correctAnswer: "7" },
      { id: "8-2", text: "Which of these is a sign of a chemical reaction?", options: ["Melting", "Color change", "Boiling", "Breaking"], correctAnswer: "Color change" },
      { id: "8-3", text: "A reaction that gives out heat is...", options: ["Endothermic", "Exothermic", "Isothermic", "Hypothermic"], correctAnswer: "Exothermic" },
      { id: "8-4", text: "Acid + Base -> Salt + ...", options: ["Oxygen", "Hydrogen", "Water", "Carbon Dioxide"], correctAnswer: "Water" },
      { id: "8-5", text: "What is the test for Hydrogen gas?", options: ["Limewater turns cloudy", "Relights a glowing splint", "Squeaky pop test", "Bleaches litmus paper"], correctAnswer: "Squeaky pop test" }
    ]
  },
  {
    id: 9,
    title: "Earth and Space",
    description: "The solar system and planetary systems.",
    color: "bg-indigo-900",
    concepts: [
      "The Earth orbits the Sun once every 365.25 days.",
      "The Earth rotates on its axis once every 24 hours.",
      "Seasons are caused by the tilt of the Earth's axis.",
      "The Moon orbits the Earth once every 27.3 days."
    ],
    vocab: [
      { term: "Orbit", definition: "The curved path of a celestial object around a star, planet, or moon." },
      { term: "Axis", definition: "An imaginary line about which a body rotates." },
      { term: "Galaxy", definition: "A system of millions or billions of stars, together with gas and dust." },
      { term: "Satellite", definition: "An object that orbits a planet." }
    ],
    questions: [
      { id: "9-1", text: "How long does it take Earth to rotate once?", options: ["1 year", "1 month", "24 hours", "12 hours"], correctAnswer: "24 hours" },
      { id: "9-2", text: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], correctAnswer: "Mars" },
      { id: "9-3", text: "What causes the seasons?", options: ["Distance from Sun", "Earth's tilt", "Moon's gravity", "Cloud cover"], correctAnswer: "Earth's tilt" },
      { id: "9-4", text: "The path of a planet around the Sun is called an...", options: ["Axis", "Orbit", "Equator", "Atmosphere"], correctAnswer: "Orbit" },
      { id: "9-5", text: "Which is the largest planet in our solar system?", options: ["Earth", "Neptune", "Jupiter", "Saturn"], correctAnswer: "Jupiter" }
    ]
  }
];
