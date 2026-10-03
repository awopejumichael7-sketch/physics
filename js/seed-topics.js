// ============================================================
//  46 PHYSICS TOPICS — Scholar's Camp curriculum seed data.
//  ⚠️ URLs intentionally EMPTY. Admins paste real URLs later.
//  NO invented YouTube links, Drive IDs, or Exam URLs.
// ============================================================

export const PHYSICS_TOPICS = [
  { n: 1,  class: "SS1", title: "Introduction to Physics, Measurement, Physical Quantities, Units, Scalars and Vectors" },
  { n: 2,  class: "SS1", title: "Motion, Speed, Velocity, Acceleration, Motion Graphs, Motion Under Gravity, Forces and Newton's Laws of Motion" },
  { n: 3,  class: "SS1", title: "Friction, Tension and Other Forces" },
  { n: 4,  class: "SS1", title: "Moments, Equilibrium, Centre of Gravity, Centre of Mass and Stability" },
  { n: 5,  class: "SS1", title: "Work, Energy, Power and Simple Machines" },
  { n: 6,  class: "SS1", title: "Density, Relative Density and Pressure" },
  { n: 7,  class: "SS1", title: "Upthrust, Archimedes' Principle and Flotation" },
  { n: 8,  class: "SS1", title: "Elasticity, Hooke's Law and Properties of Materials" },
  { n: 9,  class: "SS1", title: "Surface Tension, Capillarity and Viscosity" },
  { n: 10, class: "SS1", title: "Heat, Temperature and Thermal Expansion" },
  { n: 11, class: "SS1", title: "Heat Transfer, Thermal Conductivity, Specific Heat Capacity and Heat Capacity" },
  { n: 12, class: "SS1", title: "Change of State and Latent Heat" },
  { n: 13, class: "SS1", title: "Gas Laws and Kinetic Theory" },
  { n: 14, class: "SS1", title: "Waves and Wave Motion" },
  { n: 15, class: "SS1", title: "Sound and Musical Acoustics" },
  { n: 16, class: "SS1", title: "Reflection and Refraction of Light" },
  { n: 17, class: "SS1", title: "Lenses and Optical Instruments" },
  { n: 18, class: "SS1", title: "Dispersion, Colour and Electromagnetic Spectrum" },
  { n: 19, class: "SS2", title: "Electrostatics, Electric Fields and Electric Potential" },
  { n: 20, class: "SS2", title: "Capacitance and Capacitors" },
  { n: 21, class: "SS2", title: "Current Electricity, Resistance and Electrical Circuits" },
  { n: 22, class: "SS2", title: "Electrical Energy, Power and Domestic Electricity" },
  { n: 23, class: "SS2", title: "Magnetism and Magnetic Fields" },
  { n: 24, class: "SS2", title: "Electromagnetism and Electromagnetic Effects" },
  { n: 25, class: "SS2", title: "Electromagnetic Induction and Applications" },
  { n: 26, class: "SS2", title: "Electric Motors, Generators and Transformers" },
  { n: 27, class: "SS2", title: "Direct Current and Alternating Current" },
  { n: 28, class: "SS2", title: "Semiconductors and Basic Electronics" },
  { n: 29, class: "SS2", title: "Diodes, Transistors and Logic Gates" },
  { n: 30, class: "SS2", title: "Communication Systems and Fibre Optics" },
  { n: 31, class: "SS3", title: "Gravitation and Gravitational Fields" },
  { n: 32, class: "SS3", title: "Satellites and Space Physics" },
  { n: 33, class: "SS3", title: "Atomic Structure and Electronic Structure of Matter" },
  { n: 34, class: "SS3", title: "Photoelectric Effect and Quantum Physics" },
  { n: 35, class: "SS3", title: "X-Rays and Their Applications" },
  { n: 36, class: "SS3", title: "Radioactivity and Radiation" },
  { n: 37, class: "SS3", title: "Nuclear Physics, Fission, Fusion and Nuclear Energy" },
  { n: 38, class: "SS3", title: "Lasers and Their Applications" },
  { n: 39, class: "SS3", title: "Energy Resources and Renewable Energy" },
  { n: 40, class: "SS3", title: "Medical Physics" },
  { n: 41, class: "SS3", title: "Environmental Physics" },
  { n: 42, class: "SS3", title: "Physics in Technology and Everyday Life" },
  { n: 43, class: "SS3", title: "Experimental and Practical Physics" },
  { n: 44, class: "SS3", title: "Data Analysis, Graphs and Experimental Errors" },
  { n: 45, class: "SS3", title: "General Physics Revision" },
  { n: 46, class: "SS3", title: "WAEC, NECO, JAMB and Other Examination Preparation" },
];

export function topicId(n) {
  return `physics-topic-${String(n).padStart(3, "0")}`;
}

export function buildTopicDoc(t) {
  const now = new Date().toISOString();
  return {
    topicId:          topicId(t.n),
    subjectId:        "physics",
    topicNumber:      t.n,
    title:            t.title,
    class:            t.class,
    description:      "",
    objectives:       [],
    lessonNote:       "",
    definitions:      [],
    formulas:         [],
    examples:         [],
    applications:     [],
    commonMistakes:   [],
    keyPoints:        [],
    youtubeUrl:       "",         // ⚠️ admin pastes later
    studyUrl:         "",         // ⚠️ admin pastes later
    studyLinkTarget:  "sameTab",
    examUrl:          "",         // ⚠️ admin pastes later
    examLinkTarget:   "sameTab",
    textbookIds:      [],
    resourceIds:      [],
    status:           "active",
    createdAt:        now,
    updatedAt:        now
  };
}
