import { useState, useEffect, useCallback } from "react";
import { supabase } from "./firebase.js";

export function useFirestoreCollection(tableName) {
  const [data, setData] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: rows, error } = await supabase.from(tableName).select("*").limit(10000);
    if (error) console.error("Fetch error:", tableName, error.message);
    if (!error && rows) setData(rows);
    setLoaded(true);
  }, [tableName]);

  useEffect(() => {
    fetchData();
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
    setData(prev => {
      const exists = prev.findIndex(d => d.id === id);
      return exists >= 0
        ? prev.map(d => d.id === id ? row : d)
        : [...prev, row];
    });
    const { error } = await supabase.from(tableName).upsert(row);
    if (error) {
      console.error("Upsert error:", tableName, error.message);
      fetchData();
    }
  }, [tableName, toRow, fromRow, fetchData]);

  const remove = useCallback(async (id) => {
    setData(prev => prev.filter(d => d.id !== id));
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (error) {
      console.error("Delete error:", tableName, error.message);
      fetchData();
    }
  }, [tableName, fetchData]);

  const batchSet = useCallback(async (items) => {
    const rows = items.map(toRow);
    setData(prev => [...prev, ...rows]);
    const { error } = await supabase.from(tableName).upsert(rows);
    if (error) {
      console.error("Batch error:", tableName, error.message);
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
