import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./firebase.js";

async function fetchAll(tableName) {
  let all = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from(tableName).select("*").range(from, from + step - 1);
    if (error) { console.error("Fetch error:", tableName, error.message); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return all;
}

export function useFirestoreCollection(tableName) {
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const lastLocalUpdate = useRef(0);

  const fetchData = useCallback(async () => {
    if (Date.now() - lastLocalUpdate.current < 2000) return;
    const rows = await fetchAll(tableName);
    setData(rows);
    setLoaded(true);
  }, [tableName]);

  useEffect(() => {
    (async () => {
      const rows = await fetchAll(tableName);
      setData(rows);
      setLoaded(true);
    })();
    const channel = supabase
      .channel(tableName + "_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: tableName }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tableName, fetchData]);

  const toRow = useCallback((item) => {
    const { _docId, ...clean } = item;
    if (tableName === "clients") {
      return { id: clean.id, name: clean.name, created_at: clean.createdAt || clean.created_at };
    }
    if (tableName === "achievements") {
      return { id: clean.id, client_id: clean.clientId || clean.client_id, skill_id: clean.skillId || clean.skill_id, trainer: clean.trainer, date: clean.date };
    }
    if (tableName === "classes") {
      return { id: clean.id, name: clean.name, trainer: clean.trainer, participants: clean.participants, date: clean.date };
    }
    return clean;
  }, [tableName]);

  const fromRow = useCallback((row) => {
    if (tableName === "clients") {
      return { id: row.id, name: row.name, createdAt: row.created_at };
    }
    if (tableName === "achievements") {
      return { id: row.id, clientId: row.client_id, skillId: row.skill_id, trainer: row.trainer, date: row.date };
    }
    return row;
  }, [tableName]);

  const upsert = useCallback(async (id, item) => {
    const row = toRow(item);
    lastLocalUpdate.current = Date.now();
    setData(prev => {
      const exists = prev.findIndex(d => d.id === id);
      return exists >= 0
        ? prev.map(d => d.id === id ? row : d)
        : [...prev, row];
    });
    const { error } = await supabase.from(tableName).upsert(row);
    if (error) {
      console.error("Upsert error:", tableName, error.message);
      lastLocalUpdate.current = 0;
      fetchData();
    }
  }, [tableName, toRow, fetchData]);

  const remove = useCallback(async (id) => {
    lastLocalUpdate.current = Date.now();
    setData(prev => prev.filter(d => d.id !== id));
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (error) {
      console.error("Delete error:", tableName, error.message);
      lastLocalUpdate.current = 0;
      fetchData();
    }
  }, [tableName, fetchData]);

  const batchSet = useCallback(async (items) => {
    const rows = items.map(toRow);
    lastLocalUpdate.current = Date.now();
    setData(prev => [...prev, ...rows]);
    const { error } = await supabase.from(tableName).upsert(rows);
    if (error) {
      console.error("Batch error:", tableName, error.message);
      lastLocalUpdate.current = 0;
      fetchData();
    }
  }, [tableName, toRow, fetchData]);

  const mappedData = data.map(fromRow);

  return { data: mappedData, loaded, upsert, remove, batchSet };
}

export function useFirestoreDoc(collectionName, docId, initialValue) {
  const [data, setData] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: row } = await supabase.from(collectionName).select("value").eq("key", docId).single();
      if (row) setData(row.value);
      setLoaded(true);
    })();

    const channel = supabase
      .channel(collectionName + "_" + docId)
      .on("postgres_changes", { event: "*", schema: "public", table: collectionName, filter: `key=eq.${docId}` }, (payload) => {
        if (payload.new?.value) setData(payload.new.value);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [collectionName, docId]);

  const save = useCallback(async (newValue) => {
    const val = typeof newValue === "function" ? newValue(data) : newValue;
    setData(val);
    await supabase.from(collectionName).upsert({ key: docId, value: val });
    return val;
  }, [collectionName, docId, data]);

  return [data, save, loaded];
}