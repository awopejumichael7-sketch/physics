// ============================================================
//  SCHOLAR'S CAMP — Firestore data-access layer.
//  All reads/writes go through here so security rules and
//  offline sync behave consistently.
// ============================================================
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  serverTimestamp, onSnapshot, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "./firebase-init.js";

/* -------------------- GENERIC -------------------- */

export async function getDocById(col, id) {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function listDocs(col, opts = {}) {
  const { filters = [], sortBy, dir = "asc", max = 500 } = opts;
  const clauses = filters.map(([f, op, v]) => where(f, op, v));
  if (sortBy) clauses.push(orderBy(sortBy, dir));
  clauses.push(limit(max));
  const snap = await getDocs(query(collection(db, col), ...clauses));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createDoc(col, id, data) {
  const payload = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  if (id) { await setDoc(doc(db, col, id), payload); return id; }
  const ref = await addDoc(collection(db, col), payload);
  return ref.id;
}

export async function updateDocById(col, id, data) {
  await updateDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocById(col, id) {
  await deleteDoc(doc(db, col, id));
}

export function subscribe(col, cb, opts = {}) {
  const { filters = [], sortBy, dir = "asc", max = 500 } = opts;
  const clauses = filters.map(([f, op, v]) => where(f, op, v));
  if (sortBy) clauses.push(orderBy(sortBy, dir));
  clauses.push(limit(max));
  return onSnapshot(query(collection(db, col), ...clauses), snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

/* -------------------- DOMAIN HELPERS -------------------- */

/* Users ---------------------------------------------------- */
export const users = {
  get:    id => getDocById("users", id),
  create: (uid, data) => createDoc("users", uid, data),
  update: (uid, data) => updateDocById("users", uid, data),
  list:   opts => listDocs("users", opts),
  listStudents: () => listDocs("users", { filters: [["role", "==", "student"]], sortBy: "createdAt", dir: "desc" }),
  listTeachers: () => listDocs("users", { filters: [["role", "==", "teacher"]], sortBy: "createdAt", dir: "desc"] })
};

/* Topics --------------------------------------------------- */
export const topics = {
  get:      id => getDocById("topics", id),
  list:     opts => listDocs("topics", { sortBy: "topicNumber", ...opts }),
  listByClass: (cls) => listDocs("topics", {
    filters: [["class", "==", cls], ["status", "==", "active"]],
    sortBy: "topicNumber"
  }),
  create:   (id, data) => createDoc("topics", id, data),
  update:   (id, data) => updateDocById("topics", id, data),
  remove:   id => deleteDocById("topics", id),
  subscribe: cb => subscribe("topics", cb, { sortBy: "topicNumber" }),
  bulkUpsert: async (docs) => {
    // docs: [{ id, ...fields }]
    const batch = writeBatch(db);
    docs.forEach(d => {
      const { id, ...rest } = d;
      batch.set(doc(db, "topics", id), {
        ...rest,
        createdAt: rest.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    await batch.commit();
  }
};

/* Progress (per-user, per-topic) --------------------------- */
export const progress = {
  docId: (uid, topicId) => `${uid}__${topicId}`,
  get:  (uid, topicId) => getDocById("progress", progress.docId(uid, topicId)),
  listByUser: uid => listDocs("progress", { filters: [["userId", "==", uid]], max: 1000 }),
  subscribeByUser: (uid, cb) => subscribe("progress", cb, {
    filters: [["userId", "==", uid]], max: 1000
  }),
  upsert: (uid, topicId, patch) => createDoc("progress", progress.docId(uid, topicId), {
    userId: uid, topicId, ...patch
  })
};

/* Results -------------------------------------------------- */
export const results = {
  get: id => getDocById("results", id),
  create: data => createDoc("results", null, data),
  listByUser: uid => listDocs("results", {
    filters: [["userId", "==", uid]], sortBy: "submittedAt", dir: "desc"
  }),
  listAll: () => listDocs("results", { sortBy: "submittedAt", dir: "desc", max: 1000 })
};

/* Bookmarks ------------------------------------------------ */
export const bookmarks = {
  listByUser: uid => listDocs("bookmarks", { filters: [["userId", "==", uid]], max: 500 }),
  add: (uid, payload) => createDoc("bookmarks", null, { userId: uid, ...payload }),
  remove: id => deleteDocById("bookmarks", id)
};

/* Announcements -------------------------------------------- */
export const announcements = {
  list: () => listDocs("announcements", { sortBy: "createdAt", dir: "desc", max: 50 }),
  subscribe: cb => subscribe("announcements", cb, { sortBy: "createdAt", dir: "desc", max: 50 }),
  create: data => createDoc("announcements", null, data),
  update: (id, data) => updateDocById("announcements", id, data),
  remove: id => deleteDocById("announcements", id)
};

/* App settings --------------------------------------------- */
export const settings = {
  get: id => getDocById("settings", id),
  save: (id, data) => createDoc("settings", id, data)
};
