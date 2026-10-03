// ============================================================
//  DEV-ONLY: seed the 46 topics into Firestore.
//  Call seedTopics() from the browser console (signed in as admin).
//  ⚠️ Remove this file from production.
// ============================================================
import { topics } from "/js/db.js";
import { PHYSICS_TOPICS, buildTopicDoc, topicId } from "/js/seed-topics.js";

export async function seedTopics() {
  const docs = PHYSICS_TOPICS.map(t => ({
    id: topicId(t.n),
    ...buildTopicDoc(t)
  }));
  await topics.bulkUpsert(docs);
  console.log(`✅ Seeded ${docs.length} topics.`);
  return docs.length;
}

window.seedTopics = seedTopics;
